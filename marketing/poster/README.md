# Cipta Robo × NURI — launch poster (A4)

- `cipta-robo-nuri-poster-a4.pdf` — print PDF, A4 portrait (210 × 297 mm), one page, vector text.
- `cipta-robo-nuri-poster-a4.png` — 2481 × 3509 px (300 dpi).
- `poster.html` — editable source. Layout in millimetres; text, colours and positions are plain HTML/CSS.
- `img/` — renders from the website's own 3D model (`assets/nuri3d.js`) and a QR code to ciptarobo.com.

Rebuild (from the repository root, with Playwright installed):

```bash
python3 -m http.server 8766 &
node marketing/poster/render.js   # re-render NURI images (optional)
node marketing/poster/export.js   # write the PNG and PDF
```

Facts on the poster follow the website: RM999 is a target price, orders are not open, NURI is in development,
and the four uses are concepts of the same NURI.
