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
- The K151 is proportioned from M5Stack's published structure files: head 54 × 54 × 46.7 mm, base 48 × 56 × 11.1 mm, ~5 mm gap, side holes and the rear servo chamfer. The tilt pivot is estimated.
- **Motion & clearance check:** every design is tested in the browser against the K151 pan (±130°) and tilt (6° down to 74° up) range, the top touch zones and LED bars, the display and the rear servo space. *Test K151 movement* animates the real range; *Show keep-out zones* overlays the protected areas.
- Design rules and measurements: [`docs/k151-design-rules.md`](docs/k151-design-rules.md).
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
