/**
 * Firestore Security Rules Test Specification (Dirty Dozen Verification)
 * Verifies that all 12 adversarial client-side operations against /leads/{leadId}
 * and arbitrary paths return PERMISSION_DENIED because all database operations
 * are strictly server-side via firebase-admin.
 */

export interface DirtyDozenTestCase {
  id: number;
  name: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  path: string;
  auth: { uid: string; email?: string; email_verified?: boolean } | null;
  payload?: Record<string, unknown>;
  expectedResult: 'PERMISSION_DENIED';
}

export const DIRTY_DOZEN_TESTS: DirtyDozenTestCase[] = [
  {
    id: 1,
    name: 'Anonymous Lead Read',
    operation: 'get',
    path: '/leads/lead_123',
    auth: null,
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 2,
    name: 'Anonymous Lead List Scraping',
    operation: 'list',
    path: '/leads',
    auth: null,
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 3,
    name: 'Authenticated Non-Owner Lead Read',
    operation: 'get',
    path: '/leads/lead_123',
    auth: { uid: 'user_1', email: 'visitor@example.com', email_verified: true },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 4,
    name: 'Direct Client Lead Creation Bypassing Rate Limit',
    operation: 'create',
    path: '/leads/lead_123',
    auth: null,
    payload: {
      type: 'appointment',
      name: 'Aarav Sharma',
      phone: '+919876543210',
      consentGiven: true,
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 5,
    name: 'Shadow Field Injection',
    operation: 'create',
    path: '/leads/lead_shadow',
    auth: { uid: 'user_1', email: 'visitor@example.com', email_verified: true },
    payload: {
      type: 'callback',
      name: 'Shadow User',
      phone: '+919876543210',
      isVerifiedAdmin: true,
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 6,
    name: 'Unverified Email Spoof',
    operation: 'get',
    path: '/leads/lead_123',
    auth: { uid: 'spoof_1', email: 'worktail37@gmail.com', email_verified: false },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 7,
    name: 'Direct Client Status Tampering',
    operation: 'update',
    path: '/leads/lead_123',
    auth: { uid: 'user_1', email: 'visitor@example.com', email_verified: true },
    payload: { status: 'booked' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 8,
    name: 'Resource / Oversized Payload Poisoning',
    operation: 'create',
    path: '/leads/lead_oversized',
    auth: null,
    payload: { message: 'A'.repeat(10000) },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 9,
    name: 'HTML / Script Injection via Client SDK',
    operation: 'create',
    path: '/leads/lead_xss',
    auth: null,
    payload: { name: '<script>alert(1)</script>' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 10,
    name: 'Unauthorized Client Lead Deletion',
    operation: 'delete',
    path: '/leads/lead_123',
    auth: { uid: 'user_1', email: 'visitor@example.com', email_verified: true },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 11,
    name: 'Timestamp Forgery via Client SDK',
    operation: 'create',
    path: '/leads/lead_time',
    auth: null,
    payload: { createdAt: '1999-01-01T00:00:00Z' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 12,
    name: 'Arbitrary Collection Privilege Escalation',
    operation: 'create',
    path: '/admins/user_1',
    auth: { uid: 'user_1', email: 'visitor@example.com', email_verified: true },
    payload: { role: 'owner' },
    expectedResult: 'PERMISSION_DENIED',
  },
];
