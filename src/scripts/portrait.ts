const portrait = document.querySelector<HTMLElement>("[data-portrait]");
if (portrait?.dataset.portrait) {
  const frames = JSON.parse(portrait.dataset.portrait) as Record<"dark" | "light", (string | null)[]>;
  const images = {
    dark: portrait.querySelector<HTMLImageElement>("img.dark"),
    light: portrait.querySelector<HTMLImageElement>("img.light"),
  };
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const decoded = new Map<string, boolean>();
  const preload = () => {
    for (const url of [...frames.dark, ...frames.light]) {
      if (!url || decoded.has(url)) continue;
      decoded.set(url, false);
      const image = new Image();
      image.onload = () => { decoded.set(url, true); show(); };
      image.src = url;
    }
  };
  let index = 0;
  let target = 0;
  let timer = 0;
  function show() {
    const theme = document.documentElement.dataset.theme === "light" ? "light" : "dark";
    const image = images[theme];
    const url = frames[theme][index];
    if (image && url && (index === 0 || decoded.get(url)) && image.getAttribute("src") !== url) image.src = url;
  }
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
  }
  portrait.addEventListener("pointerenter", () => { preload(); go(5); });
  portrait.addEventListener("pointerleave", () => go(0));
  addEventListener("themechange", show);
  reduced.addEventListener("change", () => go(target));
}
