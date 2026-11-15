/**
 * Vercel serverless entry point.
 *
 * server.ts exports `buildApp()`, which returns the configured Express app.
 * Mounting it here gives Vercel one function that serves /api/*.
 *
 * Note: the /ws/dental-live WebSocket bridge requires a long-lived server and
 * is therefore not available on serverless hosting.
 */
import { buildApp } from '../server.js';

export default async function handler(req: any, res: any) {
  const app = await buildApp();
  return app(req, res);
}
