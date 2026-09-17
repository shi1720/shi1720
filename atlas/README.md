# The Working Atlas

A navigable city of Shivam Gupta's public software projects. Each building links to a real repository; districts organize projects by theme. The city is a visual index, not a dependency graph or a live activity monitor.

[Explore the atlas](https://shi1720.github.io/shi1720/).

## How it works

The browser projects 3D coordinates onto a 2D canvas, depth-sorts the buildings, and draws their faces, floors, paths, and selection markers. Repository names seed the geometry, so the same catalog produces the same city. Building height is expressive and does not imply project quality, usage, or code size.

`projects.js` contains a curated, public-only catalog. No GitHub token, runtime API, remote font, image library, or 3D framework is needed. The HTML directory provides the same source links and selection controls as the canvas. If JavaScript is unavailable, the page links to the Markdown index.

Drag to orbit, choose a district, search the directory, or select a building. The controls and directory work with the keyboard. Reduced-motion preferences stop the automatic orbit; the pause control also stops the tracers. The catalog snapshot is September 2026.

## Run and verify

From the repository root:

```sh
python3 -m http.server 8765 --bind 127.0.0.1
# Open http://127.0.0.1:8765/atlas/
```

```sh
npm ci
npx playwright install chromium
npm test
npm run test:browser
python3 scripts/render-profile.py
```

The cover is deterministic SVG rendered from the same catalog by `scripts/render-profile.py`. Browser tests cover navigation, district filters, search, empty results, motion preferences, narrow screens, and accessibility. The publishing workflow only deploys successful builds from `main`.

## Update the catalog

Edit `projects.js` after checking that a repository is public and that its description matches its README. Keep private projects and credentials out of this file. Update the project index and cover count if the catalog changes, regenerate the SVG, and run the checks. Preserve the distinction between experiments, reference implementations, and validated services.
