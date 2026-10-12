# IDSW Stream

The streaming website for [Indonesia Software Developer Conference](https://www.idsw.dev/). Switch between Day 1 and Day 2 recordings through an embedded Google Drive player, with the conference website's header, navigation, branding, and footer.

## Getting started

Use Node.js 22 and npm. After cloning the repository:

```bash
nvm use
npm ci
cp .env.example .env.local
npm run dev
```

Open <http://localhost:3000>. Stop the server with Ctrl+C. The example environment includes the conference recording IDs; no Google API credentials are required. Edit `.env.local` to change the recordings or initially selected day.

To run a production build locally:

```bash
npm run build
npm start
```

## Project structure

```text
.
├── app/
│   ├── layout.tsx       Shared shell and page metadata
│   ├── page.tsx         Main page content
│   └── globals.css      Conference typography and styles
├── components/
│   ├── SiteHeader.tsx   Shared navigation
│   ├── HeaderBehavior.tsx  Mobile menu and scroll behavior
│   ├── SiteFooter.tsx   Event information and social links
│   └── VideoTabs.tsx    Day selection and embedded player
├── config/video.ts     Runtime video configuration and validation
├── .env.example        Recording IDs and default day
├── public/assets/      Conference branding, icons, and local fonts
├── tests/              Browser checks
└── .github/workflows/  Continuous integration
```

## Video configuration

Set these variables in `.env.local`, or in your hosting environment:

| Variable | Value |
| --- | --- |
| `DAY_1_ID` | Google Drive file ID for Day 1 |
| `DAY_2_ID` | Google Drive file ID for Day 2 |
| `DEFAULT_DAY` | Initially selected day: `1` or `2` (defaults to `1`) |

Use only the ID between `/d/` and `/view` in the share link, not the full URL. The server derives each video's preview and direct viewing URLs. Missing or malformed IDs display a recording-unavailable message for that day. A missing or invalid `DEFAULT_DAY` falls back to Day 1.

The home page reads these settings on the server at request time, so the same production build can run with different values. Restart the server after editing `.env.local`; for hosted deployments, set the variables in the hosting dashboard and redeploy. Keep `.env.local` out of Git.

The centered tabs switch recordings without reloading the page. Selecting a different day removes the previous player and stops its playback; returning to a day starts a new player. Reloading restores the configured default. Left/Right Arrow and Home/End move tab focus; Enter or Space selects the focused day. Without JavaScript, the default recording and direct links for both configured days are available.

In Google Drive, allow the intended viewers to view the file. For playback without a Google account, use **Share → General access → Anyone with the link → Viewer** ([Google's sharing guide](https://support.google.com/drive/answer/2494822?hl=en)). Check the preview in a signed-out browser after uploading and processing the video. This app does not authenticate viewers; access to the recording follows the file's Google Drive sharing settings.

The player uses a responsive 16:9 frame with a minimum height of 280px so Google's controls and error messages fit on narrow screens. It allows fullscreen and does not request autoplay. Google Drive needs an internet connection and JavaScript for playback. Its own preview displays any access, processing, or playback error. Each configured recording includes **Open in Google Drive** so viewers can try the original file; that link does not bypass sharing restrictions. The app cannot inspect errors inside the cross-origin player.

## Development

The app uses Next.js App Router, React, and TypeScript. The server reads the video environment settings and passes the configured recordings to a small client component for tab interaction. The shared header and footer render on the server; a separate client component enhances the header with menu and scroll behavior, cleaning up listeners on unmount.

Edit `app/page.tsx` for main content, `components/` for the shared shell, and `app/globals.css` for presentation. Static assets in `public/assets/` are served at `/assets/`. Fonts are hosted locally. The preserved conference stylesheet contains the CSS used by the shared markup and can be edited directly.

| Command             | Purpose                                                            |
| ------------------- | ------------------------------------------------------------------ |
| `npm run dev`       | Start the development server                                       |
| `npm run build`     | Create the production build                                        |
| `npm start`         | Serve the production build                                         |
| `npm run lint`      | Check code with ESLint                                             |
| `npm run typecheck` | Generate route types and check TypeScript                          |
| `npm run check`     | Run lint, type checking, and production build                      |
| `npm run test:e2e`  | Run desktop and mobile browser checks against the production build |

Before submitting changes:

```bash
npm run check
npx playwright install chromium
npm run test:e2e
```

The browser suite starts production servers on ports 3100 and 3101 with separate test environment settings. It checks both configured defaults from the same build, day switching and removal of the old player, keyboard tabs, missing/invalid configuration, responsive sizing, the fallback link, asset loading, menu behavior, and content without JavaScript. It supplies its own file IDs and stubs Google Drive requests to keep app checks independent of the provider; it does not verify real video playback. CI installs the required Linux browser dependencies and runs the same checks.

When making changes:

- Check desktop and mobile layouts.
- Verify keyboard navigation and visible focus states.
- Test the mobile menu and header while scrolling.
- With both real Google Drive recordings, check play/pause, day switching, seeking, fullscreen, and signed-out access on desktop and mobile.
- Keep the shared header and footer consistent with the conference website.

## Contributing

Issues and pull requests are welcome. Describe the change and include desktop and mobile screenshots for visual updates. Keep contributions focused and include the checks you performed.

## Credits

Shared layout and branding come from the [IDSW conference website](https://github.com/idsw-dev/conference/tree/d9604a23065a3a33dd9bbd1b1b0682ccfa5a5806). Its shared markup is preserved in React components with the original CSS, font files, logo, and icons.

Plus Jakarta Sans is distributed under the [SIL Open Font License](public/assets/fonts/OFL.txt). Other third-party notices are included in [public/assets/licenses/](public/assets/licenses/).
