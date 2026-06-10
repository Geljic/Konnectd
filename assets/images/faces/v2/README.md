# Face Assets v2

This folder contains a second-generation face set for the tile face strip.

- `face-v2-expression-sheet.png` is the image-gen concept sheet saved into the project.
- `face-v2-*.svg` files are animation-friendly vector versions using the same `80x40` viewBox as the original face assets.
- `face-v2-manifest.json` lists state ids, filenames, tags, and suggested animation sequences.

Each SVG keeps its important pieces in predictable `data-part` groups:

- `eyes`
- `mouth`
- `cheeks`
- `brows`
- `strip`

That makes it easier to replace whole states for sprite animation, or later inline the SVGs and animate individual parts.
