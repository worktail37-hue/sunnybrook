import 'dotenv/config';
import crypto from 'crypto';
import fs from 'fs';
import http from 'http';
import path from 'path';
import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI, Modality } from '@google/genai';
import { initializeApp as initAdminApp, cert, getApps as getAdminApps, App as AdminApp } from 'firebase-admin/app';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import { initializeApp as initClientApp, getApps as getClientApps } from 'firebase/app';
import { getFirestore as getClientFirestore, doc as clientDoc, setDoc as clientSetDoc } from 'firebase/firestore';
import {
  DENTAL_SYSTEM_INSTRUCTION,
  OUT_OF_DOMAIN_DATABASE_MESSAGE,
  buildDeterministicDentalAnswer,
  checkIsDentalOrClinicQuery,
} from './src/config/dentalAssistantKnowledge.ts';

// Load Firebase Applet Configuration for Project ID & Database ID
const firebaseConfigPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf-8'));

// Initialize Firebase Admin Auth for server-side ID Token Verification
let adminApp: AdminApp;
if (getAdminApps().length === 0) {
  const serviceAccountRaw = process.env.FIREBASE_SERVICE_ACCOUNT?.trim();
  if (serviceAccountRaw && serviceAccountRaw.startsWith('{')) {
    try {
      const parsedCredentials = JSON.parse(serviceAccountRaw);
      adminApp = initAdminApp({
        credential: cert(parsedCredentials),
        projectId: firebaseConfig.projectId,
      });
    } catch {
      adminApp = initAdminApp({ projectId: firebaseConfig.projectId });
    }
  } else {
    adminApp = initAdminApp({ projectId: firebaseConfig.projectId });
  }
} else {
  adminApp = getAdminApps()[0];
}

const adminAuth = getAdminAuth(adminApp);

// Initialize Firebase Client SDK on Server for Validated Firestore Writes
const clientApp =
  getClientApps().length === 0 ? initClientApp(firebaseConfig) : getClientApps()[0];
const serverFirestore = getClientFirestore(clientApp, firebaseConfig.firestoreDatabaseId);

// Firestore REST API base URL for owner-authenticated admin operations
const FIRESTORE_REST_BASE = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/${firebaseConfig.firestoreDatabaseId}/documents`;

// In-memory 10-minute duplicate submission guard (keyed by normalizedPhone:type)
interface RecentLeadEntry {
  leadId: string;
  createdAtMs: number;
  createdAtIso: string;
}
const recentLeadsCache = new Map<string, RecentLeadEntry>();

// Helper: Salted SHA-256 IP Hash (never store or log raw IP addresses)
function hashClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  const rawIp =
    typeof forwarded === 'string'
      ? forwarded.split(',')[0].trim()
      : req.socket.remoteAddress || '0.0.0.0';
  const salt = process.env.IP_HASH_SALT || 'default-clinic-ip-salt-change-in-secrets';
  return crypto.createHash('sha256').update(`${rawIp}:${salt}`).digest('hex');
}

// Helper: Normalize Indian phone numbers to +91XXXXXXXXXX
function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  return phone.trim();
}

// Helper: Escape plain text for safe email body rendering
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Strict Allow-Lists
const ALLOWED_SERVICES = [
  'Teeth whitening',
  'Smile makeovers',
  'Bite correction',
  'Child dental check-ups',
  'Root canal treatment',
  'Toothache relief',
  'Dental sealants',
  'General family check-up',
] as const;

const ALLOWED_PATIENT_TYPES = ['adult', 'child', 'family'] as const;
const ALLOWED_TIME_SLOTS = ['morning', 'afternoon', 'evening'] as const;
const ALLOWED_CALL_TIMES = ['morning', 'afternoon', 'evening', 'anytime'] as const;
const ALLOWED_STATUSES = ['new', 'contacted', 'booked', 'closed'] as const;

const NO_HTML_REGEX = /^[^<>]*$/;
const PHONE_REGEX = /^(?:\+91[\s-]?)?[6-9]\d{9}$/;

function isTodayOrFutureDate(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate()
  ).padStart(2, '0')}`;
  return dateStr >= todayStr;
}

// Zod Schemas for Server-Side Validation & Sanitization
const appointmentSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters.')
    .max(80, 'Name must be 80 characters or fewer.')
    .regex(NO_HTML_REGEX, 'HTML tags are not permitted.'),
  phone: z
    .string()
    .trim()
    .transform((v) => v.replace(/[\s-]+/g, ''))
    .refine((v) => PHONE_REGEX.test(v), 'Please provide a valid 10-digit Indian phone number.'),
  email: z
    .string()
    .trim()
    .max(120)
    .email('Invalid email address.')
    .optional()
    .or(z.literal('')),
  patientType: z.enum(ALLOWED_PATIENT_TYPES),
  service: z.enum(ALLOWED_SERVICES),
  preferredDate: z
    .string()
    .trim()
    .refine(isTodayOrFutureDate, 'Preferred date must be today or in the future.'),
  preferredTimeSlot: z.enum(ALLOWED_TIME_SLOTS),
  message: z
    .string()
    .trim()
    .max(500, 'Message must be 500 characters or fewer.')
    .regex(NO_HTML_REGEX, 'HTML tags are not permitted.')
    .optional()
    .or(z.literal('')),
  consentGiven: z.literal(true, {
    message: 'Consent to the Privacy Policy is required.',
  }),
  patientUid: z
    .string()
    .trim()
    .max(128)
    .regex(/^[a-zA-Z0-9_-]*$/)
    .optional(),
  honeypot: z.string().max(0).optional().default(''),
  formLoadedAt: z.number().optional(),
  turnstileToken: z.string().optional(),
});

const callbackSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters.')
    .max(80, 'Name must be 80 characters or fewer.')
    .regex(NO_HTML_REGEX, 'HTML tags are not permitted.'),
  phone: z
    .string()
    .trim()
    .transform((v) => v.replace(/[\s-]+/g, ''))
    .refine((v) => PHONE_REGEX.test(v), 'Please provide a valid 10-digit Indian phone number.'),
  bestTimeToCall: z.enum(ALLOWED_CALL_TIMES),
  message: z
    .string()
    .trim()
    .max(500, 'Note must be 500 characters or fewer.')
    .regex(NO_HTML_REGEX, 'HTML tags are not permitted.')
    .optional()
    .or(z.literal('')),
  consentGiven: z.literal(true, {
    message: 'Consent to the Privacy Policy is required.',
  }),
  patientUid: z
    .string()
    .trim()
    .max(128)
    .regex(/^[a-zA-Z0-9_-]*$/)
    .optional(),
  honeypot: z.string().max(0).optional().default(''),
  formLoadedAt: z.number().optional(),
  turnstileToken: z.string().optional(),
});

const patchLeadSchema = z.object({
  status: z.enum(ALLOWED_STATUSES),
  ownerNotes: z
    .string()
    .trim()
    .max(500, 'Notes must be 500 characters or fewer.')
    .regex(NO_HTML_REGEX, 'HTML tags are not permitted.'),
});

// Optional Cloudflare Turnstile Server Verification
// Verifies token when provided; falls back to honeypot + 3s timer + rate limit when widget is not active
async function verifyTurnstileIfConfigured(token?: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET?.trim();
  if (!secret || secret === 'TURNSTILE_SECRET' || !token) {
    return true;
  }

  try {
    const resp = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret, response: token }),
    });
    const data = (await resp.json()) as { success?: boolean };
    return Boolean(data.success);
  } catch {
    return true;
  }
}

// Server-Side Owner Email Notification (Resend or SendGrid)
// NEVER sends emails to addresses typed by visitors — sends strictly to OWNER_EMAIL.
async function notifyOwnerByEmail(lead: {
  type: 'appointment' | 'callback';
  name: string;
  phone: string;
  preferredDate?: string;
  preferredTimeSlot?: string;
  bestTimeToCall?: string;
  service?: string;
  message?: string;
}): Promise<boolean> {
  const configuredOwner = process.env.OWNER_EMAIL?.trim();
  const ownerEmail =
    configuredOwner && configuredOwner !== 'owner@example.com'
      ? configuredOwner
      : 'worktail37@gmail.com';
  const apiKey = process.env.EMAIL_API_KEY?.trim();

  if (!ownerEmail || !apiKey || apiKey === 'YOUR_RESEND_OR_SENDGRID_API_KEY') {
    return false;
  }

  const fromAddress = process.env.EMAIL_FROM?.trim() || 'onboarding@resend.dev';
  const appUrl = (process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');
  const adminUrl = `${appUrl}/admin`;

  const safeName = escapeHtml(lead.name);
  const safePhone = escapeHtml(lead.phone);
  const safeService = escapeHtml(lead.service || 'Callback enquiry');
  const safeSlot =
    lead.type === 'appointment'
      ? escapeHtml(`${lead.preferredDate || ''} (${lead.preferredTimeSlot || ''})`)
      : escapeHtml(`Best time to call: ${lead.bestTimeToCall || 'anytime'}`);
  const safeMessage = escapeHtml(lead.message || 'None provided');

  const subject =
    lead.type === 'appointment'
      ? `New appointment request: ${lead.name}`
      : `New callback request: ${lead.name}`;

  const textBody = [
    `Request type: ${lead.type}`,
    `Patient name: ${lead.name}`,
    `Phone (tap to call): tel:${lead.phone}`,
    `Service: ${lead.service || 'Callback enquiry'}`,
    `Preferred schedule: ${
      lead.type === 'appointment'
        ? `${lead.preferredDate} (${lead.preferredTimeSlot})`
        : `Best time to call: ${lead.bestTimeToCall}`
    }`,
    `Message: ${lead.message || 'None provided'}`,
    `Manage in Admin Dashboard: ${adminUrl}`,
  ].join('\n');

  const htmlBody = `
    <div style="font-family: sans-serif; color: #0B2B3A; line-height: 1.6;">
      <h2 style="color: #0E7C86;">${escapeHtml(subject)}</h2>
      <p><strong>Type:</strong> ${escapeHtml(lead.type)}</p>
      <p><strong>Name:</strong> ${safeName}</p>
      <p><strong>Phone:</strong> <a href="tel:${safePhone}" style="color: #0E7C86; font-weight: bold;">${safePhone}</a></p>
      <p><strong>Service:</strong> ${safeService}</p>
      <p><strong>Schedule:</strong> ${safeSlot}</p>
      <p><strong>Visitor Note:</strong> ${safeMessage}</p>
      <p style="margin-top: 20px;">
        <a href="${escapeHtml(adminUrl)}" style="background: #FF7A59; color: #0B2B3A; font-weight: bold; padding: 10px 18px; border-radius: 8px; text-decoration: none;">
          Open Admin Dashboard (/admin)
        </a>
      </p>
    </div>
  `;

  try {
    if (apiKey.startsWith('SG.')) {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: ownerEmail }] }],
          from: { email: fromAddress },
          subject,
          content: [
            { type: 'text/plain', value: textBody },
            { type: 'text/html', value: htmlBody },
          ],
        }),
      });
      return response.ok;
    } else {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromAddress,
          to: [ownerEmail],
          subject,
          text: textBody,
          html: htmlBody,
        }),
      });
      return response.ok;
    }
  } catch {
    console.error('Owner email notification failed to send.');
    return false;
  }
}

// Helper: Parse Firestore REST API Document into LeadRecord
interface FirestoreRestField {
  stringValue?: string;
  booleanValue?: boolean;
  timestampValue?: string;
}
interface FirestoreRestDoc {
  name: string;
  fields?: Record<string, FirestoreRestField>;
  createTime?: string;
}

function parseFirestoreRestDoc(docObj: FirestoreRestDoc) {
  const id = docObj.name.split('/').pop() || '';
  const f = docObj.fields || {};
  const str = (key: string, fallback = '') => f[key]?.stringValue ?? fallback;
  const bool = (key: string, fallback = false) => f[key]?.booleanValue ?? fallback;

  return {
    id,
    type: (str('type', 'appointment') as 'appointment' | 'callback'),
    name: str('name'),
    phone: str('phone'),
    email: str('email'),
    patientType: str('patientType', 'family'),
    service: str('service', 'General family check-up'),
    preferredDate: str('preferredDate'),
    preferredTimeSlot: str('preferredTimeSlot', 'morning'),
    bestTimeToCall: str('bestTimeToCall', 'morning'),
    message: str('message'),
    consentGiven: bool('consentGiven', true),
    consentTimestamp: str('consentTimestamp'),
    status: str('status', 'new'),
    ownerNotes: str('ownerNotes'),
    emailNotified: bool('emailNotified', false),
    createdAt: str('createdAt') || docObj.createTime || new Date().toISOString(),
    ipHash: str('ipHash'),
  };
}

// Owner Authentication Middleware for /api/admin/*
async function requireOwnerAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication token required.' });
    return;
  }

  const idToken = authHeader.slice('Bearer '.length).trim();
  const envOwner = process.env.OWNER_EMAIL?.trim().toLowerCase();
  const allowedOwnerEmails = new Set<string>(['worktail37@gmail.com']);
  if (envOwner && envOwner !== 'owner@example.com') {
    allowedOwnerEmails.add(envOwner);
  }

  try {
    const decoded = await adminAuth.verifyIdToken(idToken);
    const tokenEmail = (decoded.email || '').trim().toLowerCase();

    if (!decoded.email_verified || !allowedOwnerEmails.has(tokenEmail)) {
      res.status(403).json({
        error: 'Access denied (403). Only the verified clinic owner email may access this dashboard.',
      });
      return;
    }

    (req as Request & { ownerIdToken?: string }).ownerIdToken = idToken;
    next();
  } catch {
    res.status(403).json({ error: 'Invalid or expired authentication session.' });
  }
}

async function buildApp() {
  const app = express();
  app.set('trust proxy', 1);

  // Security Headers with Helmet (configured so AI Studio Preview iframe & Google Sign-In popup work seamlessly)
  app.use(
    helmet({
      frameguard: false, // Disabled in favor of CSP frame-ancestors so AI Studio Preview iframe is not blocked
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: [
            "'self'",
            "'unsafe-inline'",
            "'unsafe-eval'",
            'https://apis.google.com',
            'https://accounts.google.com',
            'https://www.gstatic.com',
            'https://challenges.cloudflare.com',
          ],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
          imgSrc: ["'self'", 'data:', 'blob:', 'https://*.googleusercontent.com', 'https://*.gstatic.com'],
          mediaSrc: ["'self'", 'data:', 'blob:'],
          connectSrc: [
            "'self'",
            'ws:',
            'wss:',
            'https://*.googleapis.com',
            'https://*.firebaseio.com',
            'https://*.firebaseapp.com',
            'https://identitytoolkit.googleapis.com',
            'https://securetoken.googleapis.com',
            'https://www.gstatic.com',
          ],
          frameSrc: [
            "'self'",
            'https://*.firebaseapp.com',
            'https://accounts.google.com',
            'https://challenges.cloudflare.com',
            'https://www.google.com',
          ],
          frameAncestors: [
            "'self'",
            'https://aistudio.google.com',
            'https://*.google.com',
            'https://*.corp.google.com',
            'https://*.run.app',
          ],
          objectSrc: ["'none'"],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    })
  );

  // Permissions-Policy header (microphone allowed for self to support the Dental Voice Assistant)
  app.use((_req, res, next) => {
    res.setHeader(
      'Permissions-Policy',
      'camera=(), microphone=(self), geolocation=(), payment=(), usb=()'
    );
    next();
  });

  // Lock CORS to the site's own origin & Cloud Run preview URLs
  const allowedOrigin = process.env.APP_URL ? new URL(process.env.APP_URL).origin : undefined;
  app.use(
    cors({
      origin: (requestOrigin, callback) => {
        if (!requestOrigin) return callback(null, true);
        if (allowedOrigin && requestOrigin === allowedOrigin) {
          return callback(null, true);
        }
        if (
          requestOrigin.endsWith('.run.app') ||
          requestOrigin.endsWith('.google.com') ||
          requestOrigin.startsWith('http://localhost:')
        ) {
          return callback(null, true);
        }
        return callback(new Error('Origin not allowed by CORS'));
      },
      methods: ['GET', 'POST', 'PATCH', 'DELETE'],
      credentials: true,
    })
  );

  // Limit JSON body size to 10kb
  app.use(express.json({ limit: '10kb' }));

  // Overall API Rate Limiter: 100 requests per IP per 15 minutes
  const overallLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => hashClientIp(req),
    message: {
      error: 'Too many requests from your network. Please wait a few minutes or call our clinic directly.',
    },
  });

  // Form Submission Rate Limiter: Maximum 5 form submissions per IP per 15 minutes
  const formSubmissionLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => hashClientIp(req),
    message: {
      error:
        'You have sent several requests recently. Please wait 15 minutes or call our clinic phone number directly.',
    },
  });

  app.use('/api', overallLimiter);

  // GET /api/health
  app.get('/api/health', (_req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Shared Lead Creation & 10-Minute Duplicate Handling
  async function saveOrMergeLead(
    req: Request,
    res: Response,
    leadInput: {
      type: 'appointment' | 'callback';
      name: string;
      phone: string;
      email?: string;
      patientUid?: string;
      patientType: 'adult' | 'child' | 'family';
      service: string;
      preferredDate: string;
      preferredTimeSlot: 'morning' | 'afternoon' | 'evening';
      bestTimeToCall: 'morning' | 'afternoon' | 'evening' | 'anytime';
      message: string;
      honeypot?: string;
      formLoadedAt?: number;
      turnstileToken?: string;
    }
  ) {
    // 1. Honeypot check
    if (leadInput.honeypot && leadInput.honeypot.length > 0) {
      res.status(200).json({ ok: true });
      return;
    }

    // 2. Minimum 3 seconds before submit check
    if (
      typeof leadInput.formLoadedAt === 'number' &&
      Date.now() - leadInput.formLoadedAt < 3000
    ) {
      res.status(400).json({
        error: 'Please take a moment to review your details before submitting.',
      });
      return;
    }

    // 3. Optional Turnstile check
    const turnstileOk = await verifyTurnstileIfConfigured(leadInput.turnstileToken);
    if (!turnstileOk) {
      res.status(400).json({
        error: 'Security verification failed. Please refresh or call our clinic directly.',
      });
      return;
    }

    const normalizedPhone = normalizePhone(leadInput.phone);
    const ipHash = hashClientIp(req);
    const nowIso = new Date().toISOString();
    const nowMs = Date.now();
    const dedupeKey = `${normalizedPhone}:${leadInput.type}`;

    // Clean expired entries older than 10 minutes
    for (const [k, v] of recentLeadsCache.entries()) {
      if (nowMs - v.createdAtMs > 10 * 60 * 1000) {
        recentLeadsCache.delete(k);
      }
    }

    // 4. Send owner notification email immediately
    const emailSent = await notifyOwnerByEmail({
      type: leadInput.type,
      name: leadInput.name,
      phone: normalizedPhone,
      preferredDate: leadInput.preferredDate,
      preferredTimeSlot: leadInput.preferredTimeSlot,
      bestTimeToCall: leadInput.bestTimeToCall,
      service: leadInput.service,
      message: leadInput.message,
    });

    const existingRecent = recentLeadsCache.get(dedupeKey);
    if (existingRecent && nowMs - existingRecent.createdAtMs <= 10 * 60 * 1000) {
      res.status(200).json({ ok: true, merged: true });
      return;
    }

    const leadId = `lead_${nowMs}_${crypto.randomBytes(4).toString('hex')}`;

    try {
      const leadDocPayload: Record<string, unknown> = {
        type: leadInput.type,
        name: leadInput.name,
        phone: normalizedPhone,
        email: leadInput.email || '',
        patientType: leadInput.patientType,
        service: leadInput.service,
        preferredDate: leadInput.preferredDate,
        preferredTimeSlot: leadInput.preferredTimeSlot,
        bestTimeToCall: leadInput.bestTimeToCall,
        message: leadInput.message || '',
        consentGiven: true,
        consentTimestamp: nowIso,
        status: 'new',
        ownerNotes: '',
        emailNotified: emailSent,
        createdAt: nowIso,
        ipHash,
      };
      if (leadInput.patientUid) {
        leadDocPayload.patientUid = leadInput.patientUid;
      }

      await clientSetDoc(clientDoc(serverFirestore, 'leads', leadId), leadDocPayload);

      recentLeadsCache.set(dedupeKey, {
        leadId,
        createdAtMs: nowMs,
        createdAtIso: nowIso,
      });

      res.status(201).json({ ok: true, merged: false });
    } catch {
      console.error('Failed to write lead record to Firestore.');
      res.status(500).json({
        error:
          'We could not save your request right now. Please call our clinic phone number directly.',
      });
    }
  }

  // POST /api/appointments
  app.post('/api/appointments', formSubmissionLimiter, async (req, res) => {
    const parsed = appointmentSchema.safeParse(req.body);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0]?.message || 'Please check your form details.';
      res.status(400).json({ error: firstIssue });
      return;
    }

    const d = parsed.data;
    await saveOrMergeLead(req, res, {
      type: 'appointment',
      name: d.name,
      phone: d.phone,
      email: d.email || '',
      patientUid: d.patientUid,
      patientType: d.patientType,
      service: d.service,
      preferredDate: d.preferredDate,
      preferredTimeSlot: d.preferredTimeSlot,
      bestTimeToCall: d.preferredTimeSlot,
      message: d.message || '',
      honeypot: d.honeypot,
      formLoadedAt: d.formLoadedAt,
      turnstileToken: d.turnstileToken,
    });
  });

  // POST /api/callbacks
  app.post('/api/callbacks', formSubmissionLimiter, async (req, res) => {
    const parsed = callbackSchema.safeParse(req.body);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0]?.message || 'Please check your form details.';
      res.status(400).json({ error: firstIssue });
      return;
    }

    const d = parsed.data;
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate()
    ).padStart(2, '0')}`;

    await saveOrMergeLead(req, res, {
      type: 'callback',
      name: d.name,
      phone: d.phone,
      email: '',
      patientUid: d.patientUid,
      patientType: 'family',
      service: 'General family check-up',
      preferredDate: todayStr,
      preferredTimeSlot:
        d.bestTimeToCall === 'anytime' ? 'morning' : d.bestTimeToCall,
      bestTimeToCall: d.bestTimeToCall,
      message: d.message || '',
      honeypot: d.honeypot,
      formLoadedAt: d.formLoadedAt,
      turnstileToken: d.turnstileToken,
    });
  });

  // GET /api/admin/leads (Owner only)
  app.get('/api/admin/leads', requireOwnerAuth, async (req, res) => {
    const idToken = (req as Request & { ownerIdToken?: string }).ownerIdToken;
    try {
      const response = await fetch(`${FIRESTORE_REST_BASE}/leads?pageSize=250`, {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (!response.ok) {
        res.status(500).json({ error: 'Unable to fetch leads from database.' });
        return;
      }

      const data = (await response.json()) as { documents?: FirestoreRestDoc[] };
      const leads = (data.documents || [])
        .map(parseFirestoreRestDoc)
        .sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));

      res.status(200).json({ leads });
    } catch {
      res.status(500).json({ error: 'Unable to fetch leads from database.' });
    }
  });

  // PATCH /api/admin/leads/:id (Owner only: update status and ownerNotes)
  app.patch('/api/admin/leads/:id', requireOwnerAuth, async (req, res) => {
    const idToken = (req as Request & { ownerIdToken?: string }).ownerIdToken;
    const leadId = String(req.params.id || '').trim();
    if (!/^[a-zA-Z0-9_-]{1,128}$/.test(leadId)) {
      res.status(400).json({ error: 'Invalid lead ID.' });
      return;
    }

    const parsed = patchLeadSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: parsed.error.issues[0]?.message || 'Invalid status or notes format.',
      });
      return;
    }

    try {
      const patchUrl = `${FIRESTORE_REST_BASE}/leads/${encodeURIComponent(
        leadId
      )}?updateMask.fieldPaths=status&updateMask.fieldPaths=ownerNotes`;

      const response = await fetch(patchUrl, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fields: {
            status: { stringValue: parsed.data.status },
            ownerNotes: { stringValue: parsed.data.ownerNotes },
          },
        }),
      });

      if (!response.ok) {
        res.status(500).json({ error: 'Failed to update lead record.' });
        return;
      }

      res.status(200).json({ ok: true });
    } catch {
      res.status(500).json({ error: 'Failed to update lead record.' });
    }
  });

  // DELETE /api/admin/leads/:id (Owner only: for DPDP Act privacy deletion requests)
  app.delete('/api/admin/leads/:id', requireOwnerAuth, async (req, res) => {
    const idToken = (req as Request & { ownerIdToken?: string }).ownerIdToken;
    const leadId = String(req.params.id || '').trim();
    if (!/^[a-zA-Z0-9_-]{1,128}$/.test(leadId)) {
      res.status(400).json({ error: 'Invalid lead ID.' });
      return;
    }

    try {
      const deleteUrl = `${FIRESTORE_REST_BASE}/leads/${encodeURIComponent(leadId)}`;
      const response = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (!response.ok) {
        res.status(500).json({ error: 'Failed to delete lead record.' });
        return;
      }

      res.status(200).json({ ok: true });
    } catch {
      res.status(500).json({ error: 'Failed to delete lead record.' });
    }
  });

  // GET /api/admin/export (CSV export, Owner only)
  app.get('/api/admin/export', requireOwnerAuth, async (req, res) => {
    const idToken = (req as Request & { ownerIdToken?: string }).ownerIdToken;
    try {
      const response = await fetch(`${FIRESTORE_REST_BASE}/leads?pageSize=1000`, {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (!response.ok) {
        res.status(500).json({ error: 'Failed to generate CSV export.' });
        return;
      }

      const data = (await response.json()) as { documents?: FirestoreRestDoc[] };
      const leads = (data.documents || [])
        .map(parseFirestoreRestDoc)
        .sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));

      const headers = [
        'ID',
        'Type',
        'Status',
        'Name',
        'Phone',
        'Email',
        'PatientType',
        'Service',
        'PreferredDate',
        'PreferredTimeSlot',
        'BestTimeToCall',
        'Message',
        'OwnerNotes',
        'EmailNotified',
        'ConsentTimestamp',
      ];

      const escapeCsvCell = (val: unknown): string => {
        const str = String(val ?? '').replace(/"/g, '""');
        const sanitized = /^[=+\-@]/.test(str) ? `'${str}` : str;
        return `"${sanitized}"`;
      };

      const rows = leads.map((d) =>
        [
          d.id,
          d.type,
          d.status,
          d.name,
          d.phone,
          d.email || '',
          d.patientType || '',
          d.service || '',
          d.preferredDate || '',
          d.preferredTimeSlot || '',
          d.bestTimeToCall || '',
          d.message || '',
          d.ownerNotes || '',
          d.emailNotified ? 'Yes' : 'No',
          d.consentTimestamp || '',
        ]
          .map(escapeCsvCell)
          .join(',')
      );

      const csvContent = [headers.join(','), ...rows].join('\n');
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="clinic-leads.csv"');
      res.status(200).send(csvContent);
    } catch {
      res.status(500).json({ error: 'Failed to generate CSV export.' });
    }
  });

  // ============================================================================
  // DENTAL CARE CHATBOT & VOICE ASSISTANT (Gemini 3.8 Flash, TTS & Live API)
  // ============================================================================

  const dentalChatSchema = z.object({
    message: z
      .string()
      .trim()
      .min(1, 'Please enter a question.')
      .max(600, 'Question must be 600 characters or fewer.')
      .regex(NO_HTML_REGEX, 'HTML tags are not permitted.'),
    history: z
      .array(
        z.object({
          role: z.enum(['user', 'model']),
          text: z.string().trim().max(1500),
        })
      )
      .max(20)
      .optional()
      .default([]),
  });

  const dentalTtsSchema = z.object({
    text: z
      .string()
      .trim()
      .min(1, 'Text is required for speech generation.')
      .max(1500, 'Speech text must be 1500 characters or fewer.'),
    voiceName: z
      .enum(['Kore', 'Puck', 'Charon', 'Fenrir', 'Zephyr'])
      .optional()
      .default('Kore'),
  });

  function getServerGeminiClient(): GoogleGenAI | null {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      return null;
    }
    return new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
    });
  }

  function pcmToWavBuffer(
    pcmBuffer: Buffer,
    sampleRate = 24000,
    numChannels = 1,
    bitsPerSample = 16
  ): Buffer {
    const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
    const blockAlign = (numChannels * bitsPerSample) / 8;
    const dataSize = pcmBuffer.length;
    const header = Buffer.alloc(44);

    header.write('RIFF', 0);
    header.writeUInt32LE(36 + dataSize, 4);
    header.write('WAVE', 8);
    header.write('fmt ', 12);
    header.writeUInt32LE(16, 16);
    header.writeUInt16LE(1, 20);
    header.writeUInt16LE(numChannels, 22);
    header.writeUInt32LE(sampleRate, 24);
    header.writeUInt32LE(byteRate, 28);
    header.writeUInt16LE(blockAlign, 32);
    header.writeUInt16LE(bitsPerSample, 34);
    header.write('data', 36);
    header.writeUInt32LE(dataSize, 40);

    return Buffer.concat([header, pcmBuffer]);
  }

  // POST /api/dental-assistant/chat
  app.post('/api/dental-assistant/chat', async (req, res) => {
    const parsed = dentalChatSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: parsed.error.issues[0]?.message || 'Please enter a valid question.',
      });
      return;
    }

    const { message, history } = parsed.data;

    // 1. Strict Domain Guardrail: Immediately refuse non-dental / non-clinic questions
    if (!checkIsDentalOrClinicQuery(message)) {
      res.status(200).json({
        reply: OUT_OF_DOMAIN_DATABASE_MESSAGE,
        outOfDomain: true,
      });
      return;
    }

    // 2. Try Gemini 3.8 Flash with verified system instruction + multi-turn history
    const ai = getServerGeminiClient();
    if (ai) {
      try {
        const formattedHistory = history.map((turn) => ({
          role: turn.role,
          parts: [{ text: turn.text }],
        }));

        const chat = ai.chats.create({
          model: 'gemini-3.8-flash',
          history: formattedHistory,
          config: {
            systemInstruction: DENTAL_SYSTEM_INSTRUCTION,
            temperature: 0.2,
          },
        });

        const response = await chat.sendMessage({ message });
        const modelReply = (response.text || '').trim();

        if (modelReply) {
          const isRefusal = modelReply
            .toLowerCase()
            .includes('not stored in the database');
          res.status(200).json({
            reply: modelReply,
            outOfDomain: isRefusal,
          });
          return;
        }
      } catch {
        // Fall through to deterministic verified clinic responder so visitors never experience errors
      }
    }

    // 3. Deterministic 100% accurate fallback from CLINIC_CONFIG
    const fallbackResult = buildDeterministicDentalAnswer(message);
    res.status(200).json(fallbackResult);
  });

  // POST /api/dental-assistant/tts
  app.post('/api/dental-assistant/tts', async (req, res) => {
    const parsed = dentalTtsSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: parsed.error.issues[0]?.message || 'Invalid speech request.',
      });
      return;
    }

    const { text, voiceName } = parsed.data;
    const ai = getServerGeminiClient();

    if (!ai) {
      res.status(200).json({ fallbackToBrowserSpeech: true });
      return;
    }

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash-lite-tts',
        contents: [{ parts: [{ text }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName },
            },
          },
        },
      });

      const base64Pcm =
        response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!base64Pcm) {
        res.status(200).json({ fallbackToBrowserSpeech: true });
        return;
      }

      const pcmBuffer = Buffer.from(base64Pcm, 'base64');
      const wavBuffer = pcmToWavBuffer(pcmBuffer, 24000, 1, 16);
      const audioDataUrl = `data:audio/wav;base64,${wavBuffer.toString('base64')}`;

      res.status(200).json({ audioDataUrl, fallbackToBrowserSpeech: false });
    } catch {
      res.status(200).json({ fallbackToBrowserSpeech: true });
    }
  });

  // Vite Dev Server or Production Static Assets
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  return app;
}

async function startServer() {
  const app = await buildApp();

  // Create HTTP server and attach Live API WebSocket bridge on /ws/dental-live
  const server = http.createServer(app);
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    const pathname = request.url ? request.url.split('?')[0] : '';
    if (pathname === '/ws/dental-live') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
  });

  wss.on('connection', async (clientWs: WebSocket) => {
    const ai = getServerGeminiClient();
    if (!ai) {
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(
          JSON.stringify({
            type: 'fallback_mode',
            message:
              'Using built-in verified clinic voice assistant mode.',
          })
        );
      }
      clientWs.close();
      return;
    }

    let session: Awaited<ReturnType<typeof ai.live.connect>> | null = null;
    try {
      session = await ai.live.connect({
        model: 'gemini-3.8-live',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Zephyr' },
            },
          },
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          systemInstruction: DENTAL_SYSTEM_INSTRUCTION,
        },
        callbacks: {
          onopen: () => {
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ type: 'connected' }));
            }
          },
          onmessage: (msg) => {
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(
                JSON.stringify({
                  type: 'server_content',
                  data: msg.serverContent,
                })
              );
            }
          },
          onerror: (err) => {
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(
                JSON.stringify({
                  type: 'error',
                  message: err?.message || 'Live voice session encountered an issue.',
                })
              );
            }
          },
          onclose: () => {
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.close();
            }
          },
        },
      });
    } catch {
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(
          JSON.stringify({
            type: 'fallback_mode',
            message: 'Switched to verified clinic voice assistant mode.',
          })
        );
        clientWs.close();
      }
      return;
    }

    clientWs.on('message', (raw) => {
      if (!session) return;
      try {
        const parsed = JSON.parse(raw.toString()) as {
          type?: string;
          data?: string;
          text?: string;
        };
        if (parsed.type === 'audio' && parsed.data) {
          session.sendRealtimeInput({
            audio: { data: parsed.data, mimeType: 'audio/pcm;rate=16000' },
          });
        } else if (parsed.type === 'text' && parsed.text) {
          if (!checkIsDentalOrClinicQuery(parsed.text)) {
            session.sendClientContent({
              turns: [
                {
                  role: 'user',
                  parts: [
                    {
                      text: `The visitor asked an out-of-domain question: "${parsed.text}". Politely say verbatim: "${OUT_OF_DOMAIN_DATABASE_MESSAGE}"`,
                    },
                  ],
                },
              ],
              turnComplete: true,
            });
          } else {
            session.sendClientContent({
              turns: [{ role: 'user', parts: [{ text: parsed.text }] }],
              turnComplete: true,
            });
          }
        }
      } catch {
        // Ignore malformed websocket frames
      }
    });

    clientWs.on('close', () => {
      try {
        session?.close();
      } catch {
        // Ignore close errors
      }
    });
  });

  const port = Number(process.env.PORT) || 3000;
  server.listen(port, '0.0.0.0', () => {
    console.log(`Dental clinic server listening on http://0.0.0.0:${port}`);
  });
}

// Only bind a port when this file is run directly (local dev or a Node host).
// On Vercel the module is imported by api/index.ts, which exports `app` and lets
// the platform own the HTTP listener. The /ws/dental-live WebSocket bridge needs
// a long-lived server, so it is unavailable on serverless hosting.
const isDirectRun = Boolean(process.argv[1]) && /server\.(ts|js|mjs)$/.test(process.argv[1]);
if (isDirectRun) {
  startServer();
}

export { buildApp };
export default buildApp;
