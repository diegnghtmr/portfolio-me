const root = document.documentElement;
const themeToggle = document.querySelector<HTMLButtonElement>("[data-theme-toggle]");
if (themeToggle) {
  const sync = () => themeToggle.setAttribute("aria-pressed", String(root.dataset.theme === "light"));
  themeToggle.addEventListener("click", () => {
    const next = root.dataset.theme === "light" ? "dark" : "light";
    root.dataset.theme = next;
    const key = root.dataset.themeStorageKey;
    if (key) {
      try { localStorage.setItem(key, next); }
      catch { /* Theme changes still work when storage is unavailable. */ }
    }
    sync();
    window.dispatchEvent(new Event("themechange"));
  });
  sync();
  themeToggle.hidden = false;
}

const header = document.querySelector<HTMLElement>("[data-site-nav]");
const menuToggle = header?.querySelector<HTMLButtonElement>("[data-menu-toggle]");
const menu = header?.querySelector<HTMLElement>("#primary-nav");
const indicator = menu?.querySelector<HTMLElement>("[data-nav-indicator]");

if (header && menuToggle && menu && indicator) {
  const mobile = matchMedia("(max-width: 860px)");
  const links = Array.from(menu.querySelectorAll<HTMLAnchorElement>("[data-section-link]"));
  const targets = [document.getElementById("intro"), ...links.map((link) => document.getElementById(link.hash.slice(1)))];
  let current: HTMLAnchorElement | null = null;
  let frame = 0;

  const setOpen = (open: boolean) => {
    header.toggleAttribute("data-menu-open", open);
    menuToggle.setAttribute("aria-expanded", String(open));
  };
  menuToggle.addEventListener("click", () => {
    const open = !header.hasAttribute("data-menu-open");
    setOpen(open);
    if (open) links[0]?.focus();
  });
  header.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || !header.hasAttribute("data-menu-open")) return;
    setOpen(false);
    menuToggle.focus();
  });

  const moveIndicator = (link: HTMLAnchorElement | null) => {
    const label = link?.querySelector("span");
    if (mobile.matches || !label) {
      indicator.removeAttribute("data-visible");
      return;
    }
    const range = document.createRange();
    range.selectNodeContents(label);
    const { left, width } = range.getBoundingClientRect();
    indicator.style.width = `${width}px`;
    indicator.style.transform = `translateX(${left - menu.getBoundingClientRect().left}px)`;
    if (!indicator.hasAttribute("data-visible")) {
      // Position the initially hidden rule before letting it slide between labels.
      void indicator.offsetWidth;
      indicator.setAttribute("data-visible", "");
    }
  };
  const syncIndicator = () => moveIndicator(
    menu.querySelector<HTMLAnchorElement>("[data-section-link]:hover, [data-section-link]:focus-visible") ?? current,
  );
  const update = () => {
    frame = 0;
    const line = Math.max(84, innerHeight * .48);
    let id = "intro";
    for (const section of targets) {
      if (section && section.getBoundingClientRect().top <= line) id = section.id;
    }
    const next = links.find((link) => link.hash === `#${id}`) ?? null;
    if (next !== current) {
      current?.removeAttribute("aria-current");
      current = next;
      current?.setAttribute("aria-current", "location");
    }
    syncIndicator();
  };
  const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
  links.forEach((link) => {
    link.addEventListener("click", () => {
      if (!mobile.matches) return;
      setOpen(false);
      menuToggle.focus({ preventScroll: true });
    });
    link.addEventListener("pointerenter", () => moveIndicator(link));
    link.addEventListener("focus", () => moveIndicator(link));
  });
  menu.addEventListener("pointerleave", () => moveIndicator(menu.querySelector("[data-section-link]:focus-visible") ?? current));
  menu.addEventListener("focusout", (event) => {
    if (event.relatedTarget instanceof Node && menu.contains(event.relatedTarget)) return;
    moveIndicator(menu.querySelector("[data-section-link]:hover") ?? current);
  });
  mobile.addEventListener("change", () => { setOpen(false); schedule(); });
  addEventListener("scroll", schedule, { passive: true });
  addEventListener("resize", schedule);
  addEventListener("themechange", schedule);
  void document.fonts?.ready.then(schedule);
  header.setAttribute("data-menu-ready", "");
  update();
}
