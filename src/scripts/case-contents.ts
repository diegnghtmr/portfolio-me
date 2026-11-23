export {};

const links = [...document.querySelectorAll<HTMLAnchorElement>("[data-case-contents] a")];
const sections = links.map((link) => document.getElementById(link.hash.slice(1)));

if (links.length) {
  let active: HTMLAnchorElement | undefined;
  const setActive = (index: number) => {
    const link = links[index];
    if (link === active) return;
    active?.removeAttribute("aria-current");
    active = link;
    active?.setAttribute("aria-current", "location");
  };
  const syncHash = () => {
    const index = links.findIndex((link) => link.hash === location.hash);
    if (index >= 0) setActive(index);
  };
  // The current chapter is the last one whose top has passed the reading line. An observer on a
  // thin reading band misses jumps that land between chapters, so recompute once per frame after
  // any scroll instead; the read happens in a frame callback, after layout is already clean.
  let frame = 0;
  const update = () => {
    frame = 0;
    const index = sections.findLastIndex((section) => section && section.getBoundingClientRect().top <= 105);
    setActive(Math.max(0, index));
  };
  const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
  setActive(0);
  syncHash();
  schedule();
  addEventListener("scroll", schedule, { passive: true });
  addEventListener("resize", schedule);
  addEventListener("hashchange", syncHash);
}
