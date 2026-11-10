# IDSW Stream

Private conference recordings for [Indonesia Software Developer Conference](https://idsw.dev/). The app shares the conference site's branding and provides accessible Day 1 and Day 2 playback through Mux.

Viewers enter an allowlisted email address, receive a six-digit code through Resend, and sign in with that code. Google Sheets is the attendee source of truth. Upstash Redis holds short-lived codes, rate limits, and sessions. Mux playback tokens are issued only after the server verifies an active session and current allowlist membership.

## Getting started

Use Node.js 22 and npm:

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Open <http://localhost:3000>. Fill `.env.local` with the values below before requesting a code. The file is ignored by Git. Restart the local server after changing it.

## Configuration

| Variable | Purpose |
| --- | --- |
| `DAY_1_ID`, `DAY_2_ID` | Signed Mux playback IDs, not asset IDs |
| `MUX_SIGNING_KEY_ID` | Mux signing key ID |
| `MUX_SIGNING_PRIVATE_KEY` | Base64-encoded signing private key |
| `MUX_PLAYBACK_RESTRICTION_ID` | Mux referrer restriction for the app hostnames |
| `DEFAULT_DAY` | Initially selected day, `1` or `2` |
| `HIDE_DAY_2` | Set to `true` to show only Day 1 and block Day 2 playback; set to `false` to show both tabs and honor `DEFAULT_DAY` |
| `APP_URL` | Exact app origin, such as `http://localhost:3000` locally or the HTTPS production URL |
| `GOOGLE_SHEET_ID` | Private spreadsheet ID |
| `GOOGLE_SHEET_RANGE` | Header-inclusive range, such as `'Allowlist'!A:D` |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Service account email shared on the sheet as Viewer |
| `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` | PEM, base64 PEM, or base64 PKCS#8 key body; literal `\\n` is accepted |
| `RESEND_API_KEY` | Resend sending API key |
| `RESEND_FROM_EMAIL` | Sender address on a verified Resend domain |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST endpoint and read/write token |
| `SESSION_SECRET` | Random secret of at least 32 characters |

The Sheet must have `email`, `name`, and `enabled` or `status` headers. Values `TRUE`, `enabled`, `active`, `1`, and `yes` grant access; conflicting duplicate rows deny access. The service account needs the Sheets read-only scope and Viewer access to the spreadsheet. Keep all credentials server-only and out of Git. Do not prefix them with `NEXT_PUBLIC_`.

The app limits code requests and verification attempts, expires codes after five minutes, enforces a one-minute resend cooldown, and permits one active session per email. Sessions use an HTTP-only cookie and expire after 24 hours of inactivity. A removed attendee cannot receive new playback tokens after the short Sheet cache expires. Mux tokens are renewed while the recording is open so long recordings can continue playing. With `HIDE_DAY_2=true`, Day 2 is removed from the page and its token endpoint returns 404, even if `DEFAULT_DAY=2`. Set `HIDE_DAY_2=false` and `DEFAULT_DAY=2` to open Day 2 first once it is available.

## Development

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the local server |
| `npm run check` | Lint, type-check, unit-test, and build |
| `npm run test:e2e` | Run desktop and mobile browser checks after a build |

The `tests/` suite covers authentication, provider contracts, token security, and the locked viewer. A real end-to-end test also needs an enabled test mailbox and valid Mux host restrictions.

## Deploy to Vercel

Import this repository as a Next.js project using Node.js 22. Add all required variables in the Vercel project settings, set `APP_URL` to the exact deployed HTTPS origin, and allow that hostname in the Mux playback restriction. Deploy after adding or changing environment variables. Do not add the Mux management API token to this app; it only needs the signing key. Use a separate Upstash database for testing if live attendee sessions must remain untouched.

The app sends `Content-Security-Policy: frame-ancestors 'self'` to prevent other sites from embedding the viewer. Referrer restrictions are a second playback control; the server checks the session and Sheet before issuing each token.

## Project structure

```text
app/                 Next.js page and authenticated API routes
components/          Conference shell, access form, and player
config/video.ts      Public day configuration
lib/                 Auth, Google Sheets, Redis, Resend, and Mux server code
public/assets/       Conference branding, icons, and local fonts
tests/               Unit and browser checks
```

## Contributing

Issues and pull requests are welcome. Describe the behavior changed and checks performed; include desktop and mobile screenshots for visual updates. Never commit credentials or `.env.local`.

## Credits

Shared layout and branding come from the [IDSW conference website](https://github.com/idsw-dev/conference/tree/13a9c92b23599d559a944331c091dab3e84ed884). Plus Jakarta Sans is distributed under the [SIL Open Font License](public/assets/fonts/OFL.txt). Other third-party notices are in [public/assets/licenses/](public/assets/licenses/).
