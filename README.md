# IDSW Stream

The streaming website for [Indonesia Software Developer Conference](https://www.idsw.dev/). It shares the conference website's header, navigation, branding, and footer, with an empty main area ready for streaming content.

## Getting started

Clone this repository and serve its root with any static web server. For example, with Python 3:

```bash
python3 -m http.server 3000 --bind 127.0.0.1
```

Open <http://localhost:3000>. Stop the server with Ctrl+C.

No package installation or build is required. You can also open `index.html` directly in a browser.

## Project structure

```text
.
├── index.html       Page structure and navigation
├── styles.css       Layout, typography, and responsive styles
├── site.js          Mobile menu and header behavior
└── assets/          Conference branding, icons, and local fonts
```

## Development

Edit `index.html` to change page content and links, `styles.css` for presentation, and `site.js` for navigation behavior. All page assets are served locally.

When making changes:

- Check desktop and mobile layouts.
- Verify keyboard navigation and visible focus states.
- Test the mobile menu and header while scrolling.
- Keep the shared header and footer consistent with the conference website.

## Contributing

Issues and pull requests are welcome. Describe the change and include desktop and mobile screenshots for visual updates. Keep contributions focused and include the checks you performed.

## Credits

Shared layout and branding come from the [IDSW conference website](https://github.com/idsw-dev/conference/tree/d9604a23065a3a33dd9bbd1b1b0682ccfa5a5806). The HTML and CSS are static exports of its shared components; the original font files, logo, and icons are included locally.

Plus Jakarta Sans is distributed under the [SIL Open Font License](assets/fonts/OFL.txt). Other third-party notices are included in [assets/licenses/](assets/licenses/).
