const section = document.querySelector<HTMLElement>("[data-stack]");
const marquee = section?.querySelector<HTMLElement>("[data-marquee]");
const control = section?.querySelector<HTMLButtonElement>("[data-stack-pause]");
const caption = section?.querySelector<HTMLElement>("[data-stack-caption]");
if (marquee && control && caption) {
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const tracks = marquee.querySelectorAll<HTMLElement>("[data-stack-track]");
  let paused = false;
  let focused: HTMLButtonElement | null = null;
  let hovered: HTMLButtonElement | null = null;
  let active: HTMLButtonElement | null = null;

  const updateCaption = () => {
    const chip = focused ?? hovered;
    if (chip === active) return;
    active?.removeAttribute("data-active");
    active = chip;
    if (!chip) { caption.textContent = caption.dataset.hint ?? ""; return; }
    chip.setAttribute("data-active", "");
    const name = document.createElement("b");
    name.textContent = chip.textContent?.trim() ?? "";
    caption.replaceChildren(name, ` ${caption.dataset.usedIn ?? ""} ${chip.dataset.used ?? ""}`);
  };
  marquee.querySelectorAll<HTMLButtonElement>("[data-used]").forEach((chip) => {
    chip.addEventListener("pointerenter", () => { hovered = chip; updateCaption(); });
    chip.addEventListener("pointerleave", () => { hovered = null; updateCaption(); });
    chip.addEventListener("focus", () => { focused = chip; updateCaption(); });
    chip.addEventListener("blur", () => { focused = null; updateCaption(); });
    chip.addEventListener("click", () => { chip.focus(); });
  });
  for (const track of tracks) {
    const row = track.parentElement;
    if (!row) continue;
    // Inert copies must not be focusable or clickable, but their visible chips
    // still describe the same tools when the pointer crosses them during a loop.
    row.addEventListener("pointermove", (event) => {
      if (focused || motion.matches || event.pointerType !== "mouse") return;
      if (event.target instanceof Element && event.target.closest("[data-used]")) return;
      const copies = track.querySelectorAll<HTMLButtonElement>("[inert] [data-used]");
      hovered = Array.from(copies).find((chip) => {
        const { left, right, top, bottom } = chip.getBoundingClientRect();
        return event.clientX >= left && event.clientX <= right && event.clientY >= top && event.clientY <= bottom;
      }) ?? null;
      updateCaption();
    });
    row.addEventListener("pointerleave", () => { hovered = null; updateCaption(); });
  }
  // Read every size first, then write: interleaving them would force one layout per row.
  let measured = false;
  const duration = () => {
    const sizes = Array.from(tracks, (track) => [track.parentElement?.clientWidth, track.firstElementChild?.getBoundingClientRect().width] as const);
    tracks.forEach((track, index) => {
      const [width, copy] = sizes[index]!;
      if (width) track.style.setProperty("--row-width", `${width}px`);
      if (copy) track.style.setProperty("--duration", `${Math.max(1, copy / 32).toFixed(1)}s`);
    });
  };
  const setup = () => {
    const moving = !motion.matches;
    if (hovered?.closest("[inert]")) { hovered = null; updateCaption(); }
    for (const track of tracks) {
      track.querySelector("[inert]")?.remove();
      const copy = track.querySelector("[data-stack-copy]")?.cloneNode(true);
      if (moving && copy instanceof HTMLElement) {
        copy.setAttribute("aria-hidden", "true");
        copy.inert = true;
        copy.querySelectorAll("[data-active]").forEach((item) => item.removeAttribute("data-active"));
        track.append(copy);
      }
    }
    marquee.toggleAttribute("data-moving", moving);
    control.hidden = !moving;
    if (moving && measured) duration();
  };
  control.addEventListener("click", () => {
    paused = !paused;
    marquee.toggleAttribute("data-paused", paused);
    control.setAttribute("aria-pressed", String(paused));
    control.textContent = (paused ? control.dataset.play : control.dataset.pause) ?? "";
  });
  motion.addEventListener("change", setup);
  const resize = () => { measured = true; if (!motion.matches) duration(); };
  // ResizeObserver callbacks run after layout, so the first measurement never forces one.
  if (typeof ResizeObserver !== "undefined") new ResizeObserver(resize).observe(marquee);
  else { addEventListener("resize", resize); requestAnimationFrame(() => setTimeout(resize, 0)); }
  void document.fonts?.ready.then(() => { if (measured) resize(); });
  setup();
}
