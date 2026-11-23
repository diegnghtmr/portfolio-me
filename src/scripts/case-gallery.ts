export {};

const gallery = document.querySelector<HTMLDialogElement>("[data-case-gallery]");
const close = gallery?.querySelector("button");
const enlarged = gallery?.querySelector("img");
const caption = gallery?.querySelector("figcaption");

if (gallery && close && enlarged && caption && typeof gallery.showModal === "function") {
  let opener: HTMLAnchorElement | undefined;
  for (const link of document.querySelectorAll<HTMLAnchorElement>("[data-case-image]")) {
    link.setAttribute("aria-haspopup", "dialog");
    link.addEventListener("click", (event) => {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const image = link.querySelector("img");
      if (!image || gallery.open) return;
      event.preventDefault();
      opener = link;
      enlarged.alt = image.alt;
      enlarged.src = link.href;
      caption.textContent = link.closest("figure")?.querySelector("figcaption")?.textContent ?? "";
      gallery.showModal();
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
