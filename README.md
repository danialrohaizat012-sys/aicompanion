# Cipta Robo · NURI website

Website for **NURI**, a desktop AI companion in development by Cipta Robo, built on the M5Stack StackChan K151. Live at https://ciptarobo.com (GitHub Pages, see `CNAME`).

> **In development.** NURI is not for sale yet. RM999 is the target price and includes the Slim charging dock and a free engraving (`NURI` + the companion's name). The Nest Dock is +RM50. Rover and Board prices are to be announced.

## Pages

| Page | What it is |
|---|---|
| `index.html` | Homepage: the four uses (Learn, Reception, Assist, Companion) and "the list goes on", personalising NURI with your favourite AI, the 3 looks / 3 colours / 2 docks (Slim included, Nest +RM50), what RM999 includes, the animated Rover and Board add-ons, hardware facts and FAQ. |
| `configure.html` | Configurator: starts with NURI on its own; pick look, colour and dock, type a name for the engraving, preview the Rover and Board, test the K151's movement and see the live clearance check. The choice is kept in the URL so it can be shared, and the WhatsApp button (+60 19-940 0004) sends it as a register-interest message. |
| `nuri-studio.html`, `ai-companion.html` | Redirects from the old pages. |

## Code

- `assets/nuri3d.js` – shared 3D: the K151 proportioned from M5Stack's structure files, the suits, docks, Rover, Board, the clearance check and the stage (renderer, lights, auto-fit camera).
- `assets/scenes.js` – "NURI in action": short animated concept scenes (Learn, Reception, Assist, Companion) with subtitles.
- `assets/home.js`, `assets/configure.js` – page scripts.
- `assets/fonts/` – self-hosted Inter (SIL Open Font License).
- `404.html`, `robots.txt`, `sitemap.xml`, `apple-touch-icon.png` – site essentials.
- `assets/site.css` – site styles.
- `assets/img/` – pre-rendered product images (WebP) used in the page and as fallbacks; `assets/img/sheets/` holds the concept sheets.
- `assets/logo/` – Cipta Robo logo (light, dark) and icon as SVG.
- `vendor/three/` – Three.js r160 (MIT), vendored so nothing depends on a CDN.
- `docs/k151-design-rules.md` – measurements and design rules for suits, docks and add-ons.

## Local preview

The pages use ES modules, so serve the folder over HTTP:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Publishing

GitHub Pages deploys from `main`, folder `/` (root).

## Notes

- No checkout, backend or data collection. The configurator runs in the browser.
- The four uses are positioning for one NURI, not separate products. Features are marked Concept until built and tested.
- Cipta Robo is not affiliated with M5Stack. NURI is built in collaboration with BinaLab (https://binalab.my).
