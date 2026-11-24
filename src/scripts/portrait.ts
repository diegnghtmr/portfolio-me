const portrait = document.querySelector<HTMLElement>("[data-portrait]");
const images = { dark: portrait?.querySelector<HTMLImageElement>("img.dark"), light: portrait?.querySelector<HTMLImageElement>("img.light") };
if (portrait?.dataset.portrait && images.dark && images.light) {
  const frames = JSON.parse(portrait.dataset.portrait) as Record<"dark" | "light", (string | null)[]>;
  const activeTheme = () => document.documentElement.dataset.theme === "light" ? "light" : "dark";
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const loaded = new Map<string, boolean>();
  let started = false;
  let index = 0;
  let target = 0;
  let timer = 0;
  const show = (fallback = false) => {
    const theme = activeTheme();
    const active = frames[theme];
    const image = images[theme]!;
    const frame = active[index];
    const url = frame && (index === 0 || loaded.get(frame)) ? frame : fallback ? active[0] : null;
    if (url && image.getAttribute("src") !== url) image.src = url;
  };
  const preload = () => {
    started = true;
    show(true);
    for (const url of frames[activeTheme()].slice(1)) {
      if (!url || loaded.has(url)) continue;
      loaded.set(url, false);
      const frame = new Image();
      frame.onload = () => { loaded.set(url, true); show(); };
      frame.src = url;
    }
  };
  const go = (to: number) => {
    target = to;
    clearTimeout(timer);
    if (reduced.matches) { index = target; show(); return; }
    const step = () => {
      if (index === target) return;
      index += Math.sign(target - index);
      show();
      if (index !== target) timer = window.setTimeout(step, 70);
    };
    step();
  };
  if (typeof IntersectionObserver !== "undefined") {
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      preload();
    }, { rootMargin: "320px" });
    observer.observe(portrait);
  } else preload();
  portrait.addEventListener("pointerenter", () => { preload(); go(5); });
  portrait.addEventListener("pointerleave", () => go(0));
  addEventListener("themechange", () => { if (started) preload(); });
  reduced.addEventListener("change", () => go(target));
}
