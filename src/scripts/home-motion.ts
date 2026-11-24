const reduced = matchMedia("(prefers-reduced-motion: reduce)");
const main = document.querySelector("#main");

if (main && typeof IntersectionObserver !== "undefined") {
  const items = main.querySelectorAll<HTMLElement>("[data-reveal], [data-reveal-line], [data-count]");
  const stagger = new Map<Element, number>();
  const indexes = new Map<Element, number>();
  const pending = new Set<Element>();
  let initial = true;

  const show = (item: Element) => {
    if (!pending.delete(item)) return;
    item.removeAttribute("data-reveal-pending");
    observer.unobserve(item);
  };
  const count = (target: HTMLElement) => {
    const final = Number(target.dataset.count);
    if (reduced.matches || !Number.isFinite(final)) return;
    const start = performance.now();
    target.textContent = "0";
    function step(now: number) {
      const progress = reduced.matches ? 1 : Math.min(1, (now - start) / 800);
      target.textContent = String(Math.round(final * (1 - (1 - progress) ** 3)));
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  };
  const observer = new IntersectionObserver((entries) => {
    for (const { target, isIntersecting, boundingClientRect: rect, rootBounds } of entries) {
      if (!(target instanceof HTMLElement)) continue;
      if (initial) {
        // Keep everything in or above the starting viewport as painted. A skipped
        // content-visibility subtree can report a zero rect; it has not been painted.
        if (isIntersecting || (rect.height > 0 && rect.top < (rootBounds?.bottom ?? innerHeight))) {
          observer.unobserve(target);
          continue;
        }
        pending.add(target);
        const delay = stagger.get(target);
        if (delay !== undefined) {
          target.style.setProperty("--stagger", `${delay}ms`);
          target.setAttribute("data-reveal-pending", "");
        }
      } else if (isIntersecting && pending.has(target)) {
        show(target);
        if (target.hasAttribute("data-count")) count(target);
      }
    }
    initial = false;
  });
  const start = () => {
    // A #hash load scrolls after this runs (smooth fragment scroll), so the starting
    // viewport is unknown: keep the whole page as painted instead of arming reveals.
    if (reduced.matches || location.hash.length > 1) return;
    for (const item of items) {
      if (!item.hasAttribute("data-count")) {
        const parent = item.parentElement;
        const index = parent ? indexes.get(parent) ?? 0 : 0;
        if (parent) indexes.set(parent, index + 1);
        stagger.set(item, Math.min(index, 5) * 70);
      }
      observer.observe(item);
    }
  };
  // Observe after native hash navigation / history scroll restoration has run.
  if (document.readyState === "complete") start();
  else addEventListener("pageshow", start, { once: true });
  reduced.addEventListener("change", () => {
    if (!reduced.matches) return;
    pending.forEach(show);
    observer.disconnect();
  });
  main.addEventListener("focusin", (event) => {
    if (event.target instanceof Element) {
      const item = event.target.closest("[data-reveal-pending]");
      if (item) show(item);
    }
  });
}

const side = main?.querySelector<HTMLElement>("[data-experience-side]");
if (side && typeof ResizeObserver !== "undefined") {
  let height = 0;
  const center = () => {
    if (height) side.style.setProperty("--side-top", `${Math.max(84, Math.round((innerHeight - height) / 2))}px`);
  };
  new ResizeObserver(([entry]) => {
    if (!entry) return;
    height = entry.borderBoxSize?.[0]?.blockSize ?? entry.contentRect.height;
    center();
  }).observe(side);
  addEventListener("resize", center);
}
