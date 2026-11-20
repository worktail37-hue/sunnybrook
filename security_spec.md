# Firestore Security Specification (`security_spec.md`)

## 1. Data Invariants
1. **Create-Only Validated Lead Creation (`/leads/{leadId}`)**:
   - Public/server creation is allowed ONLY when `isValidId(leadId)` and `isValidLead(incoming())` pass, `status == 'new'`, `ownerNotes == ''`, and `consentGiven == true`.
   - Every string field has an explicit `.size()` bound and regex/enum validation matching `firebase-blueprint.json`.
2. **Zero Public Reads, Updates, or Deletes**:
   - `get`, `list`, `update`, and `delete` on `/leads/{leadId}` are strictly restricted to `isAdmin()` (requiring a verified signed-in user who exists in the `admins/{uid}` collection - no owner email is hardcoded in rules).
3. **Immutable Identity & Audit Fields**:
   - `createdAt`, `phone`, and `type` cannot be altered during updates (`incoming().createdAt == existing().createdAt`).

## 2. The "Dirty Dozen" Payloads (All Return `PERMISSION_DENIED`)
1. **Payload 1 (Anonymous Lead Read)**: Unauthenticated client attempts `get(/leads/lead_123)`.
2. **Payload 2 (Anonymous Lead List Scraping)**: Unauthenticated client attempts `list(/leads)`.
3. **Payload 3 (Authenticated Non-Owner Lead Read)**: Signed-in visitor (`visitor@example.com`) attempts `get(/leads/lead_123)`.
4. **Payload 4 (Shadow Field Injection)**: Client attempts `create(/leads/lead_123)` with extra key `{ isAdmin: true }`.
5. **Payload 5 (Status Pre-Booking Bypass)**: Client attempts `create(/leads/lead_123)` with `status: 'booked'` instead of `'new'`.
6. **Payload 6 (Unverified Owner Email Spoof)**: Client with the owner email and `email_verified: false` attempts `get(/leads/lead_123)`.
7. **Payload 7 (Non-Owner Lead Update)**: Visitor attempts `update(/leads/lead_123)` to modify `status` or `ownerNotes`.
8. **Payload 8 (Resource / ID Poisoning)**: Client attempts `create` with a 500-char document ID or 5,000-char `message`.
9. **Payload 9 (HTML / Script XSS Injection)**: Client attempts `create(/leads/lead_xss)` with `<script>alert(1)</script>` in `name` or `message`.
10. **Payload 10 (Invalid Service Allow-List Bypass)**: Client attempts `create(/leads/lead_bad_srv)` with `service: 'Unlisted Surgery'`.
11. **Payload 11 (Consent Bypass)**: Client attempts `create(/leads/lead_no_consent)` with `consentGiven: false`.
12. **Payload 12 (Unauthorized Lead Deletion)**: Non-owner attempts `delete(/leads/lead_123)`.
