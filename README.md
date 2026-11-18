# Cipta Robo · NURI concept website

Static website for **NURI**, a customizable AI desktop companion concept by Cipta Robo, planned around the original M5Stack StackChan K151 with a snap-on NURI Signature Suit and wardrobe. Live at https://ciptarobo.com (GitHub Pages, see `CNAME`).

> **Concept only.** NURI is not for sale. RM899 is a planned target price. Supplier/rights-holder terms, trademark status, hardware fit and timeline are not finalized. No payments or deposits are collected.

## Pages

| Page | What it is |
|---|---|
| `index.html` | Homepage: appearance-first positioning, NURI Identity Studio teaser, three-layer technology, future R&D, roadmap (Phase A/B/C) and FAQ. |
| `nuri-studio.html` | **NURI Identity Studio**: interactive 3D configurator. Five wardrobe zones × 10 styles, 10 colorways, 7 preset looks, optional nameplate (+RM25 indicative), copy-to-clipboard design summary. |
| `ai-companion.html` | AI Companion Project R&D page with the 2.5D appearance study. |

## 3D studio notes

- Built with [Three.js](https://threejs.org) r160, **vendored** in `vendor/three/` (MIT, see `vendor/three/LICENSE`), so the studio works without a third-party CDN.
- The model is procedural concept geometry, **not** the official K151 CAD. Each of the 50 styles has its own shape, but none is production-validated. Replace with STL-derived geometry once the K151 sample and CAD are measured.
- Respects `prefers-reduced-motion` (no auto-rotate, idle head motion or blinking).

## Local preview

The studio uses ES modules, so serve the folder over HTTP rather than opening the file directly:

```bash
python3 -m http.server 8000
```

Then visit http://localhost:8000.

## Publishing

GitHub Pages deploys from branch `main`, folder `/` (root). The `CNAME` file points the site at `ciptarobo.com`.

## Notes

- No checkout, backend, payment handling or waitlist. Configurators run locally in the browser and send no data anywhere.
- Drone, rover, dock and other hardware modules are separate long-term R&D, not part of NURI Base.
- This future robotics venture is **independent of BinaLab**, which focuses on SME digitalization.
