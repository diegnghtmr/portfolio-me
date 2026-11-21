<!-- Research brief 2026-11-21 by a read-only explorer subagent; npm versions re-verified locally (@paper-design/shaders 0.0.82 Apache-2.0, image-q 4.0.0 MIT, sharp 0.35.5 Apache-2.0, @thi.ng/pixel-dither 1.1.206 Apache-2.0). -->

## Dithering brief

**Best fit:** use Paper’s vanilla shader for a restrained animated hero, and **Sharp + `image-q`** at build time for covers and OG artwork. Keep text and navigation as crisp HTML; ship a static fallback for reduced motion and WebGL failure.

### 1. Threshold assets

- **Blue noise:** Christoph Peters’ tileable textures and generator are **CC0**. Download the [original texture ZIP](https://momentsingraphics.de/Media/BlueNoise/FreeBlueNoiseTextures.zip) or individual grayscale-channel PNGs: [64×64](https://raw.githubusercontent.com/Calinou/free-blue-noise-textures/master/64_64/LDR_LLL1_0.png), [128×128](https://raw.githubusercontent.com/Calinou/free-blue-noise-textures/master/128_128/LDR_LLL1_0.png). The [void-and-cluster generator](https://momentsingraphics.de/Media/BlueNoise/BlueNoiseCode.zip) is also CC0. Start at 64²; use 128² if repetition is visible. [Source and license](https://momentsingraphics.de/BlueNoise.html).
- Sample in **screen-pixel coordinates**, with repeat wrapping and nearest filtering; compare luminance against the threshold. A Bayer matrix gives a deliberately geometric print pattern instead; see [GLSL ordered dithering](https://alex-charlton.com/posts/Dithering_on_the_GPU/) and [ImageMagick’s threshold maps](https://github.com/ImageMagick/ImageMagick/blob/main/config/thresholds.xml).
- For animation, `fract(noise + frame * 0.61803398875)` decorrelates successive thresholds ([shader example](https://github.com/NatronGitHub/natron-plugins/blob/master/Shadertoy/Crok_blue_noise/crok_blue_noise.02.frag.glsl)). **It does not guarantee no shimmer**: prefer a stationary mask for a calm hero; evaluate [spatiotemporal blue noise](https://arxiv.org/abs/2112.09629) if temporal sampling is needed.

### 2. Live WebGL options

| Library | Verified snapshot and fit |
|---|---|
| [Paper Shaders](https://github.com/paper-design/shaders) | **3,995 stars**, Apache-2.0; vanilla and React npm packages both **0.0.82**; vanilla published **2026-10-21**. [Registry](https://registry.npmjs.org/@paper-design%2fshaders), [React registry](https://registry.npmjs.org/@paper-design%2fshaders-react/latest), [GitHub metadata](https://api.github.com/repos/paper-design/shaders). Full vanilla package: **64.3 kB gzip**, before application-specific tree-shaking ([Bundlephobia](https://bundlephobia.com/api/size?package=%40paper-design%2Fshaders)). Pin the version: the project warns 0.0.x releases can break. |
| [OGL](https://api.github.com/repos/oframe/ogl) | **4,760 stars**; lightweight custom WebGL. npm **1.0.11**, 2025-01-27; npm identifies **Unlicense**, while GitHub’s metadata does not detect a license—check the distributed terms ([registry](https://registry.npmjs.org/ogl)). |
| [regl](https://api.github.com/repos/regl-project/regl) | **5,601 stars**, MIT; functional lower-level WebGL, **2.1.1**, 2024-11-12 ([registry](https://registry.npmjs.org/regl)). |
| [postprocessing](https://api.github.com/repos/pmndrs/postprocessing) | **2,988 stars**, Zlib; use when already rendering a Three.js scene. Latest GitHub release **6.39.6**, 2026-11-01 ([release](https://github.com/pmndrs/postprocessing/releases/tag/v6.39.6)). |

Paper’s [Dithering](https://shaders.paper.design/dithering) provides sphere, wave, simplex and other shapes; `random`, `2x2`, `4x4`, `8x8`; `colorBack`, `colorFront`, and **`size`**, not `pxSize`. [ImageDithering](https://shaders.paper.design/image-dithering) adds image, highlight, inversion and color steps. For Astro, mount the vanilla [`ShaderMount`](https://raw.githubusercontent.com/paper-design/shaders/main/packages/shaders/src/shader-mount.ts) in a client-side script; React is optional. For a genuinely custom 2–6-color palette, use a custom quantization shader rather than assuming the two-color hero shader supports it.

### 3. Build-time images

- **Recommended: [Sharp](https://sharp.pixelplumbing.com/api-output/) + [image-q](https://github.com/ibezkrovnyi/image-quantization), MIT.** Sharp decodes, resizes and encodes; TypeScript `image-q` maps pixels to a **specified brand palette** and supports Atkinson, Stucki, Sierra and other error-diffusion kernels. Encode the resulting pixels as PNG or lossless WebP. Sharp alone can make palette PNGs with Floyd–Steinberg, but its generated palette does not guarantee your exact ink colors. Do not assume chaining `.png()` then `.webp()` applies two encoders: materialize the quantized pixels or intermediate first.
- [RgbQuant.js](https://github.com/leeoniya/RgbQuant.js/) is MIT and supports quantization/diffusion. [ditherJS](https://github.com/danielepiccone/ditherjs) accepts fixed palettes, but its README labels it **CC BY-SA 4.0** and its Node path needs canvas: assess licensing before adoption.
- [@thi.ng/pixel-dither](https://raw.githubusercontent.com/thi-ng/umbrella/develop/packages/pixel-dither/README.md), Apache-2.0: Atkinson, ordered “Bayes” in its docs, Burkes, row/column and 2D diffusion, Floyd–Steinberg, Jarvis–Judice–Ninke, Sierra 2-row, Stucki and threshold; custom kernels supported.
- [didder](https://github.com/makew0rld/didder) is a GPL-3.0 Go CLI; [ImageMagick](https://imagemagick.org/command-line-options/#ordered-dither) offers `-ordered-dither`. Both are useful offline alternatives.

### 4. Inputs and art direction

Choose a **portrait you own**, high-contrast photography, or a dramatically lit 3D render; sphere/torus SDFs, waves and fBm fields make effective procedural sources. [Unsplash](https://unsplash.com/license) permits commercial use with restrictions; [Poly Haven](https://polyhaven.com/license) HDRIs/textures/models are CC0; [NASA](https://www.nasa.gov/nasa-brand-center/images-and-media/) imagery is generally usable but check individual credits and endorsement rules.

**Practical starting point:** adjust levels and gamma so important contours survive; resize and lightly sharpen *before* dithering. Test linear-light versus perceptual-space processing rather than assuming one looks best. Keep cells small relative to faces and screenshot labels; reserve pink/gold as sparse accents.

### 5. Verifiable reference

[Théo Marini’s Dither wave field](https://theom.fr/labs/dither-waves) documents its **R3F plane, GLSL fBm waves and Bayer post-effect**, adaptive DPR, deferred rendering and poster fallback. It is now a lab experiment, **not** the current homepage hero; its page does not establish a 2025–26 publication date. I could not directly retrieve a sufficiently documented, dated 2025–26 portfolio case study to verify another example.

### Recommended stack

| Surface | Choice |
|---|---|
| **Hero** | Paper vanilla, sphere or wave, `#06080F` / `#7FB4CA`, slow or static; Apache-2.0. |
| **Project covers** | Sharp → fixed-palette `image-q` Atkinson/Stucki → lossless PNG/WebP; MIT. |
| **Reveal** | Animate a **stationary** Bayer or blue-noise threshold against a reveal value; keep content readable. |
| **OG** | Build a static 1200×630 PNG with the same image pipeline; add crisp, undithered title and URL. |
| **Ship** | One CC0 64² blue-noise PNG, static hero fallback, and required library license notices. |

Star counts and releases are snapshots observed on **2026-11-21**, not permanent rankings.

## Local verification (parent session)

- `@paper-design/shaders@0.0.82` exports `ShaderMount`, `ditheringFragmentShader` (shapes simplex, warp, dots, wave, ripple, swirl, sphere; types random, 2x2, 4x4, 8x8; `u_pxSize`), `imageDitheringFragmentShader` (`u_colorFront`, `u_colorBack`, `u_colorHighlight`, `u_colorSteps` 1-7, `u_originalColors`, `u_inverted`), `getShaderColorFromString`, `defaultPatternSizing`. Full jsDelivr ESM bundle: 212,819 B raw, 64,894 B gzip.
- Live demo screenshots taken 2026-11-21: legajo-frontend shows loading skeletons, neguentropia-frontend shows "No se pudo cargar" (backend unreachable), academic-triage-frontend shows only a login screen, vale shows real UI. Current screenshots are not usable as covers; curated captures with real data are an M1 content task.
