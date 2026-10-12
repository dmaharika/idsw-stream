# IDSW Stream

The streaming website for [Indonesia Software Developer Conference](https://www.idsw.dev/). Watch the conference recording through an embedded Google Drive player, with the conference website's header, navigation, branding, and footer.

## Getting started

Use Node.js 22 and npm. After cloning the repository:

```bash
nvm use
npm ci
npm run dev
```

Open <http://localhost:3000>. Stop the server with Ctrl+C. No environment variables or external service credentials are required.

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
│   └── SiteFooter.tsx   Event information and social links
├── config/video.ts     Video source and accessible player title
├── public/assets/      Conference branding, icons, and local fonts
├── tests/              Browser checks
└── .github/workflows/  Continuous integration
```

## Video configuration

Edit `config/video.ts` to replace the recording. Set `fileId` to the ID between `/d/` and `/view` in the Google Drive share URL, and update `title` to describe the video. The app derives the embedded `/preview` URL and the direct viewing link from that ID. Rebuild and redeploy after changing it.

In Google Drive, allow the intended viewers to view the file. For playback without a Google account, use **Share → General access → Anyone with the link → Viewer** ([Google's sharing guide](https://support.google.com/drive/answer/2494822?hl=en)). Check the preview in a signed-out browser after uploading and processing the video. This app does not authenticate viewers; access to the recording follows the file's Google Drive sharing settings.

The player uses a responsive 16:9 frame with a minimum height of 280px so Google's controls and error messages fit on narrow screens. It allows fullscreen and does not request autoplay. Google Drive needs an internet connection and JavaScript for playback. Its own preview displays any access, processing, or playback error. The page always offers **Open in Google Drive** so viewers can try the original file; that link does not bypass sharing restrictions. The app cannot inspect errors inside the cross-origin player.

## Development

The app uses Next.js App Router, React, and TypeScript. The page, header, and footer render on the server. A small client component enhances the header with menu and scroll behavior, cleaning up listeners on unmount.

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

The browser suite starts its own server on port 3100. It checks responsive player sizing, the fallback link when the embed fails, asset loading, keyboard navigation, menu behavior, and server-rendered content without JavaScript. It stubs Google Drive requests to keep app checks independent of the provider; it does not verify real video playback. CI installs the required Linux browser dependencies and runs the same checks.

When making changes:

- Check desktop and mobile layouts.
- Verify keyboard navigation and visible focus states.
- Test the mobile menu and header while scrolling.
- With the real Google Drive source, check play/pause, seeking, fullscreen, and signed-out access on desktop and mobile.
- Keep the shared header and footer consistent with the conference website.

## Contributing

Issues and pull requests are welcome. Describe the change and include desktop and mobile screenshots for visual updates. Keep contributions focused and include the checks you performed.

## Credits

Shared layout and branding come from the [IDSW conference website](https://github.com/idsw-dev/conference/tree/d9604a23065a3a33dd9bbd1b1b0682ccfa5a5806). Its shared markup is preserved in React components with the original CSS, font files, logo, and icons.

Plus Jakarta Sans is distributed under the [SIL Open Font License](public/assets/fonts/OFL.txt). Other third-party notices are included in [public/assets/licenses/](public/assets/licenses/).
