<!-- Research brief generated 2026-11-21 by a read-only explorer subagent. Sources inline; verify before relying on versions/licenses. -->

# Dithering on the web: research brief

**Bottom line:** For an ambient portfolio hero, start with a single WebGL dither shader—not a 3D engine. For project images, generate dithered assets at build time and transition to the original. This separates the visual identity from runtime rendering cost.

## 1. Sites and live references

The evidence is strongest for **two production sites** below; the remaining references are tools, articles or distinct live lab demos. That is not enough evidence to claim eight independently verified portfolio/product sites. “Live” here means the page was retrievable, not that every interactive effect was tested in a browser.

1. **[Low←tech Magazine](https://solar.lowtechmagazine.com/about/the-solar-website/)** — editorial site serving **pre-rendered grayscale dithered PNGs**, tinted by the browser. It offers original/dithered views; its authors report roughly 10× less image resource use than their old site. Algorithm not specified there.
2. **[Ashutosh Singh’s portfolio](https://www.ashutoshishere.com/blog/painting-with-math)** — 2026 portfolio hero uses a fullscreen **WebGL fragment shader**; two animated grain layers act as dithering to reduce gradient banding. This is subtle noise dithering, not a coarse Bayer look.
3. **[Paper Shaders: Dithering](https://shaders.paper.design/dithering)** — product/library demo; a **WebGL shader** generates shapes and thresholds them. [The documented lab implementation](https://lab.mindsproutstudios.com/) uses 2×2–8×8 Bayer matrices or random noise.
4. **[The Night Wire](https://lab.mindsproutstudios.com/demos/dither-a/dithercn-globe/)** — demo hero with a **canvas dithered globe**, a **WebGL Bayer-8 aurora**, and selectable text. The [lab describes](https://lab.mindsproutstudios.com/) its `dithercn` engine as supporting Bayer and blue-noise matrices.
5. **[Press 04](https://lab.mindsproutstudios.com/demos/dither-a/dithercn-dashboard/)** — demo dashboard using dither-cell density for charts and gauges rather than decorative full-screen noise. [Implementation notes](https://lab.mindsproutstudios.com/) identify `dithercn`.
6. **[Proof Nº 07](https://lab.mindsproutstudios.com/demos/dither-a/paper-dithering/)** — interactive riso-style sheet using Paper’s **React/WebGL shader**, with live matrix, ink and shape controls. [Implementation notes](https://lab.mindsproutstudios.com/).
7. **[Mesa, dusk](https://lab.mindsproutstudios.com/demos/dither-b/error-diffusion/)** — **canvas ImageData**, recomputed per frame, compares real Floyd–Steinberg, Atkinson and Bayer kernels. Useful for judging their different textures; not a production-performance endorsement. [Implementation notes](https://lab.mindsproutstudios.com/).
8. **[Surma’s Ditherpunk](https://surma.dev/things/ditherpunk/)** — explanatory interactive article comparing monochrome algorithms; a technique reference rather than a portfolio. Do not infer that its examples use a production WebGL shader.

**Additional lead:** [Mael Ruffini’s 2025 portfolio](https://www.linkedin.com/posts/greensock_site-of-the-day-mael-ruffini-portfolio-activity-7299816712546275330-Kmim) was described by GSAP as having a dithered image fade; I could not independently verify its current implementation or live site.

## 2. Libraries and tools

| Choice | Use, cost and status evidence |
|---|---|
| [Paper Shaders](https://github.com/paper-design/shaders) | `@paper-design/shaders-react` for a procedural WebGL hero; **Apache-2.0**. No Three.js required. Repository has a changelog; verify the current release before adoption. |
| [R3F Bayer example](https://github.com/niccolofanton/dithering-shader) | **MIT** ordered-dither postprocessing for an existing React Three Fiber/Three.js scene. A full scene plus postprocessing is unnecessary overhead for a simple 2D hero. |
| [OGL](https://github.com/oframe/ogl), [regl](https://github.com/regl-project/regl), [three.js](https://github.com/mrdoob/three.js) | WebGL foundations for custom GLSL; choose OGL/regl for a small bespoke renderer, Three.js when already using 3D. Verify the renderer **and shader** licenses independently. |
| [canvas-dither / image-q examples](https://lab.mindsproutstudios.com/) | CPU-side ImageData and palette/error-diffusion options. Convenient for experiments or build work; avoid processing large images every animation frame without profiling. |
| [didder](https://github.com/makew0rld/didder) | Build-time CLI with custom palettes and multiple algorithms; **GPL-3.0**. Pin a version. |
| [Sharp](https://sharp.pixelplumbing.com/api-output/) | Build-time indexed PNG: `png({ palette: true, colours: 4, dither: 1 })`; `dither` controls **Floyd–Steinberg**, not Bayer. Indexed output is documented as slower to generate. |
| [ImageMagick](https://imagemagick.org/script/command-line-options.php#ordered-dither) | Build-time ordered dithering; the linked page could not be extracted in this research, so verify syntax and version locally. |
| [Dither It](https://github.com/alexharris/ditherit) | Client-side interactive image tool for art direction. Check its current license and maintenance before integrating code. |

**Size/maintenance caveat:** I did not obtain reliable version-specific bundle sizes or last-release dates. Measure the *actual production route chunk*, including dependencies, rather than comparing package install sizes; confirm licenses and recent releases at selection time.

## 3. Animation performance

- Render at **cell-scale resolution**, then enlarge with nearest-neighbor sampling; cap DPR and profile mobile GPU time. A larger visual cell alone does not guarantee fewer shaded fragments. [WebGL best practices](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices).
- Pause the animation loop when offscreen with [IntersectionObserver](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API), and when the document is hidden with [Page Visibility](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API).
- Consider [OffscreenCanvas in a worker](https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas) for CPU-heavy canvas work; it can reduce main-thread contention, **not** eliminate rendering cost.
- Respect [`prefers-reduced-motion`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion): show a static poster or first frame. Also provide a non-WebGL fallback.

## 4. Recommended portfolio implementation

**Hero:** Paper’s `Dithering` for Next.js React, or its vanilla shader mount in an Astro client island. Lazy-load it after the static hero/poster; keep heading and navigation as real HTML. If the portfolio already has a 3D scene, use an R3F postprocess instead. [Paper](https://github.com/paper-design/shaders) · [R3F example](https://github.com/niccolofanton/dithering-shader)

**Project images:** At build time generate a resized, palette-limited **Sharp Floyd–Steinberg PNG** per image; use didder or ImageMagick instead if the art direction requires a controlled Bayer or Atkinson pattern. Layer the optimized original underneath and fade out the dithered layer **after the original has loaded**. Keep identical crop/dimensions, one accessible alt description, and resolve immediately under reduced motion. Compare actual transfer sizes: dithering can increase entropy, so a dithered asset is not automatically smaller. [Sharp options](https://sharp.pixelplumbing.com/api-output/) · [didder](https://github.com/makew0rld/didder)
