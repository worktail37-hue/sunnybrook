# Sunnybrook Family & Kids Dental

A warm, family-focused dental clinic website: gentle care for children, adults and whole families, with online appointment requests, callback requests, an AI dental assistant, and a clinic-owner dashboard.

---

## Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, TypeScript, Vite 8 |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite`) |
| Animation | Motion |
| Charts | D3 |
| Icons | lucide-react |
| Backend | Express 4, Helmet, CORS, express-rate-limit |
| Validation | Zod |
| AI | `@google/genai` — dental assistant chat + speech |
| Auth / DB | Firebase Auth + Firestore + Firebase Admin (server) |
| Notifications | Resend or SendGrid via `EMAIL_API_KEY` (optional) |

---

## Features

**Patient-facing**
- Header/top bar, hero with trust strip, services and a kids' corner
- "Care journey" about section, first-visit guide
- Insurance & cost estimator chart (D3)
- Appointment request form and callback request form, both validated and rate-limited
- AI dental assistant widget — chat plus speech output (falls back to browser speech synthesis)
- Patient portal section, team, testimonials, FAQ, privacy policy
- Appointment-reminder service worker, SEO head component with Schema.org `Dentist` data
- Single source of truth for clinic details in `src/config/clinicConfig.ts`

**Clinic owner (`/admin` dashboard)**
- Firebase Auth sign-in restricted to verified owner emails, enforced **server-side**
- Lead list, CSV export
- Email notification of new leads via Resend/SendGrid
- Bot protection: optional Cloudflare Turnstile, IP hashing with a salt, duplicate and rate limiting

---

## Getting started

**Requirements:** Node.js 20+ (or Bun — a `bun.lock` is included).

```bash
npm install
cp .env.example .env.local     # then fill in the values below
npm run dev                    # http://localhost:3000
```

Other scripts:

```bash
npm run build    # production bundle into dist/
npm run preview  # preview the built bundle
npm run lint     # tsc --noEmit
npm start        # run the Express server
```

---

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `OWNER_EMAIL` | Recommended | Verified Google account allowed into the admin dashboard |
| `EMAIL_API_KEY` | Optional | Resend (`re_…`) or SendGrid (`SG.…`) key for lead notification emails |
| `EMAIL_FROM` | Optional | Verified sender address |
| `FIREBASE_SERVICE_ACCOUNT` | Optional | Service-account JSON when not running on Google Cloud / AI Studio |
| `IP_HASH_SALT` | Recommended | Long random salt for hashing visitor IPs in rate limiting |
| `TURNSTILE_SECRET`, `VITE_TURNSTILE_SITE_KEY` | Optional | Cloudflare Turnstile bot protection |
| `APP_URL` | Recommended | Public URL of the deployment |
| `GEMINI_API_KEY` | For the assistant | Server-side Gemini calls |

> Only `VITE_TURNSTILE_SITE_KEY` is public. Everything else is server-side and must never be committed.

---

## Configuration before launch

All clinic details — name, address, hours, phone, doctors, services, FAQs — live in **`src/config/clinicConfig.ts`**. Values marked `[PLACEHOLDER]` (address, phone, doctor names and photos, sample testimonials) must be replaced with the clinic's real information before going live. Testimonials are flagged `isSamplePlaceholder` so placeholder content is never presented as real.

---

## Project structure

```
api/index.ts            Vercel serverless entry — mounts the Express app
server.ts               Express API: appointments, callbacks, assistant, admin, WS bridge
src/
  components/           Header, hero, services, contact forms, assistant widget,
                        estimator chart, admin dashboard, privacy policy, SEO head
  config/               clinicConfig.ts (all site content) + assistant knowledge base
  firebase.ts           Firebase client init
  utils/                Shared helpers
public/                 Images, assets, appointment-reminder service worker
firestore.rules         Firestore security rules
firestore.rules.test.ts Security-rules tests
firebase-blueprint.json Firestore schema description
security_spec.md        Threat model and hardening notes
```

---

## Deployment (Vercel)

The repo ships with `vercel.json` and `api/index.ts`:

- `npm run build` produces the static bundle in `dist/`
- `api/index.ts` builds the Express app per invocation and serves every `/api/*` route as a serverless function
- All other routes rewrite to `index.html`

Add the environment variables above under **Project → Settings → Environment Variables**, then deploy.

**Limitations on serverless hosting:** the `/ws/dental-live` WebSocket bridge needs a long-lived server and will not run on Vercel. Use a Node host (Railway, Render, Fly.io, Cloud Run) if you need the live voice assistant stream.

---

## Security notes

- No secrets are committed. `firebase-applet-config.json` holds the Firebase **web** config, which is public by design; access is controlled by `firestore.rules` and Firebase Auth.
- Admin access requires a verified Firebase ID token whose email is on the owner allowlist, checked on the server with `firebase-admin`.
- Helmet security headers, CORS allowlist, Zod validation on every input, rate limiting, salted IP hashing for duplicate protection, optional Turnstile.
- Error responses are sanitised; `.env*` is git-ignored (`!.env.example` is kept).

---

## License

Private project. All rights reserved.
