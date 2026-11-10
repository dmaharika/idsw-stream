# IDSW Stream

The video site for [Indonesia Software Developer Conference](https://www.idsw.dev/). It uses the conference site's header, branding, navigation, and footer, with a responsive Mux Player and accessible Day 1 / Day 2 tabs.

## Getting started

Use Node.js 22 and npm:

```bash
nvm use
npm ci
test -e .env.local || cp .env.example .env.local
npm run dev
```

Open <http://localhost:3000>. The page shows an unavailable message until you configure signed Mux playback. To run a production build locally, use `npm run build` followed by `npm start`.

## Video configuration

Set the following values in `.env.local` or your hosting environment:

| Variable | Meaning |
| --- | --- |
| `DAY_1_ID` | Signed Mux **playback ID** for Day 1, not its asset ID |
| `DAY_2_ID` | Signed Mux **playback ID** for Day 2 |
| `MUX_SIGNING_KEY_ID` | Mux signing key ID |
| `MUX_SIGNING_PRIVATE_KEY` | Base64-encoded private key returned when that key was created |
| `MUX_PLAYBACK_RESTRICTION_ID` | Referrer restriction ID for allowed app hostnames |
| `DEFAULT_DAY` | Initially selected day: `1` or `2` (defaults to `1`) |

Create the playback IDs, signing key, and referrer restriction through the [Mux API](https://www.mux.com/docs/guides/secure-video-playback). The API access token used for setup is **not** needed by this viewer. Keep the private signing key server-only; never use `NEXT_PUBLIC_` for it or commit `.env.local`. The app signs playback, thumbnail, and storyboard tokens on the server and includes the restriction ID. It does not expose a direct Mux viewing link.

A referrer restriction limits ordinary browser playback to configured hostnames, but this version does not authenticate viewers. Anyone able to open an allowed site can receive a signed token, which can be reused until it expires. The current recordings are about eight hours long, so tokens remain valid for ten hours to avoid interrupting playback. Attendee authorization requires a separate login system.

The app also sends `Content-Security-Policy: frame-ancestors 'self'` to prevent other sites from embedding its page in an iframe.

If an ID, signing key, or restriction is missing or invalid, the corresponding day shows an unavailable message. Switching days removes the previous player and stops its playback. Reloading selects `DEFAULT_DAY`. JavaScript is required for the Mux player. The page reads configuration at request time; restart the local server after editing `.env.local`, or redeploy after changing hosted environment variables.

## Deploy to Vercel

Import this repository as a Vercel project with the Next.js framework preset and Node.js `22.x`. Use the repository root as the project root, `npm ci` to install, and `npm run build` to build. Leave the output directory at the framework default.

Add the six viewer variables above to the desired project environments. `.env.local` is ignored by Git and is not uploaded. Make sure the Vercel hostname and any custom stream domain are in the Mux referrer restriction, then redeploy. Do not add the Mux management API token ID or secret to Vercel. The player fetches video directly from Mux; this app does not proxy media.

After deployment, test both recordings in a signed-out browser, including playback, seeking, day switching, fullscreen, and mobile layout. Also verify that a hostname outside the restriction cannot play the videos. Mux asset readiness and restriction rules can fail independently of a successful Vercel build.

## Project structure

```text
app/                 Next.js page, layout, and styles
components/          Conference shell and day tabs
config/video.ts      Server-side signing and runtime video configuration
public/assets/       Conference branding, icons, and local fonts
tests/               Browser and signing checks
.env.example         Example playback settings
```

## Development

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run check` | Run lint, type checking, and production build |
| `npm run test:e2e` | Run browser checks against the production build |

For a full check, run `npm run check`, `npx playwright install chromium`, then `npm run test:e2e`. The browser suite verifies token creation, tabs, layout, navigation, and missing configuration. It does not replace testing real Mux playback on the final hostnames and devices.

Edit `app/page.tsx` for page content, `components/` for the shell and tabs, and `app/globals.css` for styling. Static assets are served from `public/assets/`. Keep the shared header, footer, logo, and typography consistent with the [conference website](https://github.com/idsw-dev/conference).

## Contributing

Issues and pull requests are welcome. Describe the change and checks performed; include desktop and mobile screenshots for visual updates. Keep credentials and `.env.local` out of Git.

## Credits

Shared layout and branding come from the [IDSW conference website](https://github.com/idsw-dev/conference/tree/d9604a23065a3a33dd9bbd1b1b0682ccfa5a5806). Plus Jakarta Sans is distributed under the [SIL Open Font License](public/assets/fonts/OFL.txt). Other third-party notices are in [public/assets/licenses/](public/assets/licenses/).
