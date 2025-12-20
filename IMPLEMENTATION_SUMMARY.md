# Email Verification Implementation Summary

## Changes Made (War Room + Email Verification)

### Backend (`src/`)

**1. Modified: `router/scan.ts`**
- Replaced `requestAccess` to send 6-digit code (not access link)
- Added `verifyCode` - validates code, returns full report + token
- Added `resendCode` - regenerates and resends code
- Codes expire in 5 minutes (Redis TTL: 300s)
- Access tokens valid 30 days (Redis TTL: 2592000s)

**2. Modified: `lib/email.ts`**
- Added `sendVerificationEmail()` - sends 6-digit code
- Code displayed in large font for easy entry
- Dev mode logs code to console

### Frontend (`web/app/`)

**3. Created: `components/email/VerificationGate.tsx`**
- 6-digit code input with auto-focus/paste support
- Real-time validation
- Resend + change email options
- Error handling

**4. Created: `components/scan/WarRoomTerminal.tsx`**
- Live terminal-style log stream
- Attack surface map visualization
- Real-time stats (endpoints, vulnerabilities)
- Progress bar with stage messages

**5. Modified: `components/email/EmailGate.tsx`**
- Returns email to parent instead of showing success message
- Triggers verification flow

**6. Modified: `page.tsx`**
- Added `showVerificationGate` state
- Replaced `ScanStatus` with `WarRoomTerminal` during scan
- Flow: EmailGate → VerificationGate → Full Report

## User Flow

```
1. Landing Page
   ↓ (Enter URL)
2. War Room Terminal (Live scan visualization)
   ↓ (Scan completes)
3. Preview Report (limited info)
   ↓ (Enter email + name/phone/company)
4. Verification Gate (6-digit code input)
   ↓ (Check email, enter code)
5. Full Report Unlocked (in-browser)
```

## Lead Capture Points

1. **Email entered** → Saved to DB immediately
2. **Code verified** → `emailDelivered: true`, `reportAccessed: true`
3. **Data captured**: email, name, phone, company, scan metadata, opt-ins

## API Changes

### New Endpoints
- `POST /api/trpc/scan.verifyCode` - Verify 6-digit code
- `POST /api/trpc/scan.resendCode` - Resend code

### Modified Endpoints
- `POST /api/trpc/scan.requestAccess` - Now sends code instead of token

### Unchanged
- `GET /api/trpc/scan.preview` - Still returns limited preview
- `GET /api/trpc/scan.verifyAccess` - Legacy token verification (email links)

## Testing

```bash
# Backend build
npm run build

# Frontend type check
cd web && npx tsc --noEmit

# Test email (dev mode shows code in response)
NODE_ENV=development npm run dev:api
curl -X POST http://localhost:3001/api/trpc/scan.requestAccess \
  -H "Content-Type: application/json" \
  -d '{"jobId":"...", "email":"test@example.com"}'

# Response includes code in dev mode:
# { "result": { "data": { "success": true, "code": "123456" } } }
```

## Dev Mode Features

- Verification code shown in API response
- Code logged to browser console
- No actual email required for testing

## Production Behavior

- Code sent via Resend email only
- Code expires in 5 minutes
- Verified users get 30-day access token
- Token stored in URL params for return visits

