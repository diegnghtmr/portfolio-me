export {};

const links = [...document.querySelectorAll<HTMLAnchorElement>("[data-case-contents] a")];
const sections = links.map((link) => document.getElementById(link.hash.slice(1)));

if (links.length && typeof IntersectionObserver !== "undefined") {
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
  // Observe the reading line instead of measuring on every scroll frame.
  let reading: IntersectionObserver | undefined;
  const follow = () => {
    reading?.disconnect();
    reading = new IntersectionObserver(() => {
      const index = sections.findLastIndex((section) => section && section.getBoundingClientRect().top <= 105);
      setActive(Math.max(0, index));
    }, { rootMargin: `-104px 0px -${Math.max(0, innerHeight - 105)}px 0px` });
    for (const section of sections) if (section) reading.observe(section);
  };
  setActive(0);
  syncHash();
  follow();
  addEventListener("resize", follow);
  addEventListener("hashchange", syncHash);
}
