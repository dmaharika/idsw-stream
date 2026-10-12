# IDSW Stream

The streaming website for [Indonesia Software Developer Conference](https://www.idsw.dev/). It shares the conference website's header, navigation, branding, and footer, with an empty main area ready for streaming content.

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
├── public/assets/      Conference branding, icons, and local fonts
├── tests/              Browser checks
└── .github/workflows/  Continuous integration
```

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

The browser suite starts its own server on port 3100. It checks rendering, asset loading, keyboard navigation, menu behavior, and rendering without JavaScript. CI installs the required Linux browser dependencies and runs the same checks.

When making changes:

- Check desktop and mobile layouts.
- Verify keyboard navigation and visible focus states.
- Test the mobile menu and header while scrolling.
- Keep the shared header and footer consistent with the conference website.

## Contributing

Issues and pull requests are welcome. Describe the change and include desktop and mobile screenshots for visual updates. Keep contributions focused and include the checks you performed.

## Credits

Shared layout and branding come from the [IDSW conference website](https://github.com/idsw-dev/conference/tree/d9604a23065a3a33dd9bbd1b1b0682ccfa5a5806). Its shared markup is preserved in React components with the original CSS, font files, logo, and icons.

Plus Jakarta Sans is distributed under the [SIL Open Font License](public/assets/fonts/OFL.txt). Other third-party notices are included in [public/assets/licenses/](public/assets/licenses/).
