# The Possibility Engine

[Enter the exhibit](https://shi1720.github.io/shi1720/) · [Read the public index](../docs/universe.md) · [Earlier city](https://shi1720.github.io/shi1720/city/)

An interactive index of Shivam Gupta's 43 original public source repositories, organized into agent infrastructure, applied systems, human experiences, learning tools and research. The particle sculpture is expressive geometry. It does not encode traffic, dependencies, test status, popularity or code quality.

## A small renderer, an explorable collection

`engine.js` generates 48,000 deterministic seeds and sends them to a WebGL vertex shader. Each seed maps into three parametric surfaces: a torus knot, a woven helix and a lobed sphere. Interpolating their coordinates lets one sculpture become another. A fragment shader draws the soft particles; additive blending supplies the light. No framework, remote font, runtime API or external asset is required.

`observatory.js` projects the selectable repository signals into the same camera space and renders an ordinary HTML index. Search and theme filters apply to both. Source links, keyboard selection, deep links and the previous/next controls make the collection usable without dragging or selecting a tiny point. If WebGL is unavailable, the HTML collection remains available. A no-JavaScript link opens the Markdown index.

Reduced-motion preferences start the renderer paused. A pause control stops motion, a paused form change is immediate, and animation work stops while the document is hidden. Drawing is capped at 30 frames per second and pixel density at 2. The save-frame button exports the local canvas; no image, query or usage data is sent to a server.

## Run and verify

From the repository root:

```sh
python3 -m http.server 8765 --bind 127.0.0.1
# http://127.0.0.1:8765/atlas/
```

```sh
npm ci
npx playwright install chromium webkit
npm test
npm run test:browser
python3 scripts/render-engine.py
```

Browser checks cover rendering, shape changes, filtering, selection, keyboard focus, deep-link reloads, reduced motion, image export, a 320px viewport, WebGL fallback, graphics context recovery and accessibility on desktop Chromium, mobile Chromium and mobile WebKit. The original city has its own retained regression suite.

## Update the public collection

`universe.js` is a curated public-only catalog verified on September 22, 2026. Verify public visibility and the project's README before adding an entry. Private repositories, forks, account metadata repositories and the binary-only Unpause preview distribution are intentionally excluded.

`scripts/render-engine.py` generates the profile's SVG cover and `docs/universe.md`. Update the visible collection counts when adding projects, regenerate the files, and run the checks. The earlier city's 29-project snapshot stays in `projects.js` so its geometry and old project links remain reproducible.
