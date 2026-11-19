# NURI V1 print brief (Taklimat Cetak) for 3D-printing shops

- `nuri-taklimat-cetak-v1.pdf` — A4 landscape, 4 pages, in Bahasa Melayu: what to print, the original K151 breakdown,
  suit parts per look, dock parts, print settings, colours, QC and the quote checklist.
- `nuri-taklimat-cetak-p1..p4.png` — the same pages as images (for WhatsApp).
- `k151-stl-rasmi-m5stack.zip` — M5Stack's official StackChan K151 structure STLs (MIT licence), for fit reference only.
- `brief.html` (layout), `render.html` (3D renders), `measure.html` (part sizes from the NURI model), `export.js`.

Rebuild from the repository root: `python3 -m http.server 8767 &`, render images with `render.html?shot=...`
(`k151`, `signature`, `focus`, `buddy`, `slim`, `nest`; add `&codes=1` for code-only labels), then `node export.js`.
Part shapes are the NURI concept model; production STLs with clips follow after measuring a real K151.
