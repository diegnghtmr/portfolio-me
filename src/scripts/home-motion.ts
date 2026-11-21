const reduced = matchMedia("(prefers-reduced-motion: reduce)");
const main = document.querySelector("#main");

if (main && typeof IntersectionObserver !== "undefined") {
  const items = Array.from(main.querySelectorAll<HTMLElement>("[data-reveal], [data-reveal-line]"));
  const indexes = new Map<Element, number>();
  const show = (item: Element) => {
    item.removeAttribute("data-reveal-pending");
    observer.unobserve(item);
  };
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) if (entry.isIntersecting) show(entry.target);
  }, { rootMargin: "0px 0px -5% 0px" });
  if (!reduced.matches) {
    for (const item of items) {
      const parent = item.parentElement;
      const index = parent ? indexes.get(parent) ?? 0 : 0;
      if (parent) indexes.set(parent, index + 1);
      item.style.setProperty("--stagger", `${Math.min(index, 5) * 70}ms`);
      item.setAttribute("data-reveal-pending", "");
      observer.observe(item);
    }
  }
  reduced.addEventListener("change", () => {
    if (reduced.matches) items.forEach(show);
  });
  main.addEventListener("focusin", (event) => {
    if (event.target instanceof Element) {
      const item = event.target.closest("[data-reveal-pending]");
      if (item) show(item);
    }
  });

  const countObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting || !(entry.target instanceof HTMLElement)) continue;
      const target = entry.target;
      countObserver.unobserve(target);
      const final = Number(target.dataset.count);
      if (reduced.matches || !Number.isFinite(final)) continue;
      const start = performance.now();
      target.textContent = "0";
      function step(now: number) {
        const progress = reduced.matches ? 1 : Math.min(1, (now - start) / 800);
        target.textContent = String(Math.round(final * (1 - (1 - progress) ** 3)));
        if (progress < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }
  });
  main.querySelectorAll("[data-count]").forEach((item) => countObserver.observe(item));
}

const side = main?.querySelector<HTMLElement>("[data-experience-side]");
if (side) {
  const center = () => side.style.setProperty("--side-top", `${Math.max(84, Math.round((innerHeight - side.offsetHeight) / 2))}px`);
  center();
  addEventListener("resize", center);
  if (typeof ResizeObserver !== "undefined") new ResizeObserver(center).observe(side);
}
