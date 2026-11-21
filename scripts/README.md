# Dither assets

```sh
node scripts/dither-assets.mjs
node --test scripts/
```

Generation reads the checked-in `assets-src/` inputs and writes lossless PNGs to `public/dither/` and their manifest to `src/data/dither-manifest.json`. It needs no browser or network. An invalid asset fails generation before existing outputs are written.

To re-extract the inputs from the portrait artboard when its embedded image sources change, run `node scripts/extract-sources.mjs`. See `assets-src/LICENSES.md` for provenance.

Manifest `file` values are public URL paths; `width` and `height` count cells (one cell per PNG pixel), and `cell` is the intended CSS pixels per cell. `inks` lists the brand palette for dithered assets and the dither portion of the transition frames. The full grayscale original and the blue-noise threshold tile are not dithered and have no brand inks.
