import type { ShaderMount } from "@paper-design/shaders";

const hero = document.querySelector<HTMLElement>("[data-hero]");
const host = hero?.querySelector<HTMLElement>("[data-hero-shader]");

if (hero && host) {
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const contrast = matchMedia("(prefers-contrast: more), (forced-colors: active)");
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  let failed = false;
  let loading = false;
  let mount: ShaderMount | undefined;

  const sync = () => {
    const show = Boolean(mount) && !contrast.matches;
    hero.toggleAttribute("data-mounted", show);
    mount?.setSpeed(!show || motion.matches ? 0 : .5);
  };
  const fallback = () => {
    failed = true;
    const previous = mount;
    mount = undefined;
    sync();
    previous?.dispose();
    host.replaceChildren();
  };
  const start = async () => {
    if (mount || failed || loading || contrast.matches || connection?.saveData) return;
    loading = true;
    try {
      const { ShaderMount, ditheringFragmentShader, DitheringShapes, DitheringTypes, getShaderColorFromString } = await import("@paper-design/shaders");
      if (contrast.matches) return;
      const colors = () => {
        const css = getComputedStyle(document.documentElement);
        return {
          u_colorBack: getShaderColorFromString(css.getPropertyValue("--surface").trim()),
          u_colorFront: getShaderColorFromString(css.getPropertyValue("--ink").trim()),
        };
      };
      mount = new ShaderMount(host, ditheringFragmentShader, {
        ...colors(),
        u_shape: DitheringShapes.sphere,
        u_type: DitheringTypes["8x8"],
        u_pxSize: 4,
        u_fit: 0, u_scale: 1, u_rotation: 0, u_offsetX: 0, u_offsetY: 0,
        u_originX: .5, u_originY: .5, u_worldWidth: 0, u_worldHeight: 0,
      }, { powerPreference: "low-power", alpha: false }, 0, 0, 1, 450_000);
      mount.canvasElement.addEventListener("webglcontextlost", fallback, { once: true });
      addEventListener("themechange", () => mount?.setUniforms(colors()));
      sync();
    } catch {
      fallback();
    } finally {
      loading = false;
    }
  };
  const idle = () => {
    if (typeof requestIdleCallback === "function") requestIdleCallback(() => void start(), { timeout: 1500 });
    else setTimeout(() => void start(), 120);
  };
  motion.addEventListener("change", sync);
  contrast.addEventListener("change", () => { sync(); if (!contrast.matches) idle(); });
  idle();
}
