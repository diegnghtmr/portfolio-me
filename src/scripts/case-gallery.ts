export {};

const gallery = document.querySelector<HTMLDialogElement>("[data-case-gallery]");
const close = gallery?.querySelector("button");
const enlarged = gallery?.querySelector("img");
const caption = gallery?.querySelector("figcaption");

if (gallery && close && enlarged && caption && typeof gallery.showModal === "function") {
  let opener: HTMLAnchorElement | undefined;
  // Show the thumbnail the page already decoded, then swap in the full-size file once it has
  // decoded too, so the dialog never paints an empty frame or the alt text while it downloads.
  const enlarge = (link: HTMLAnchorElement, thumbnail: HTMLImageElement) => {
    enlarged.src = thumbnail.currentSrc || thumbnail.src;
    const full = new Image();
    full.src = link.href;
    full.decode().then(
      () => { if (opener === link && gallery.open) enlarged.src = full.src; },
      () => {}, // Keep the thumbnail if the full file fails; the link still opens it.
    );
  };
  for (const link of document.querySelectorAll<HTMLAnchorElement>("[data-case-image]")) {
    link.setAttribute("aria-haspopup", "dialog");
    link.addEventListener("click", (event) => {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const image = link.querySelector("img");
      if (!image || gallery.open) return;
      event.preventDefault();
      opener = link;
      enlarged.alt = image.alt;
      caption.textContent = link.closest("figure")?.querySelector("figcaption")?.textContent ?? "";
      gallery.showModal();
      enlarge(link, image);
    });
  }
  gallery.addEventListener("keydown", (event) => {
    if (event.key !== "Tab") return;
    // The close button is the only focusable control in the modal.
    event.preventDefault();
    close.focus();
  });
  gallery.addEventListener("click", (event) => { if (event.target === gallery) gallery.close(); });
  gallery.addEventListener("close", () => {
    opener?.focus({ preventScroll: true });
    opener = undefined;
    enlarged.removeAttribute("src");
  });
}
