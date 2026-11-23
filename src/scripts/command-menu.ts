const dialog = document.querySelector<HTMLDialogElement>("#command-menu");
const trigger = document.querySelector<HTMLButtonElement>("[data-search-trigger]");
const query = dialog?.querySelector<HTMLInputElement>("#command-query");
const list = dialog?.querySelector<HTMLElement>("#command-results");
const empty = dialog?.querySelector<HTMLElement>("[data-command-empty]");
const copy = document.querySelector<HTMLButtonElement>("[data-copy-email]");
const copyLabel = copy?.querySelector<HTMLElement>("[data-copy-label]");
const copyStatus = document.querySelector<HTMLElement>("[data-copy-status]");

if (copy && copyLabel && copyStatus) {
  let reset = 0;
  const label = copyLabel.textContent;
  copy.addEventListener("click", async () => {
    const address = copy.dataset.address;
    if (!address) return;
    clearTimeout(reset);
    try {
      await navigator.clipboard.writeText(address);
      copyLabel.textContent = copy.dataset.copied ?? "";
      copyStatus.textContent = copy.dataset.success ?? "";
    } catch {
      copyLabel.textContent = label;
      copyStatus.textContent = `${copy.dataset.failed ?? ""} ${address}`;
    }
    reset = window.setTimeout(() => { copyLabel.textContent = label; }, 1800);
  });
  copy.hidden = false;
  document.querySelector<HTMLElement>("[data-copy-fallback]")?.setAttribute("hidden", "");
}

if (dialog && trigger && query && list && empty && typeof dialog.showModal === "function") {
  const groups = Array.from(list.querySelectorAll<HTMLElement>("[data-command-group]"));
  const options = Array.from(list.querySelectorAll<HTMLElement>("[data-command-target]"));
  const normalize = (text: string) => text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
  let visible = options;
  let selected: HTMLElement | undefined;
  const select = (option?: HTMLElement, scroll = false) => {
    selected?.setAttribute("aria-selected", "false");
    selected = option;
    if (option) {
      option.setAttribute("aria-selected", "true");
      query.setAttribute("aria-activedescendant", option.id);
      if (scroll) option.scrollIntoView({ block: "nearest", behavior: "instant" });
    } else query.removeAttribute("aria-activedescendant");
  };
  const filter = () => {
    const terms = normalize(query.value).trim().split(/\s+/);
    visible = options.filter((option) => {
      const group = option.closest("[data-command-group]")?.firstElementChild?.textContent ?? "";
      const label = normalize(`${option.dataset.commandLabel ?? ""} ${option.dataset.commandStack ?? ""} ${group}`);
      option.hidden = !terms.every((term) => label.includes(term));
      return !option.hidden;
    });
    groups.forEach((group) => { group.hidden = !group.querySelector("[data-command-target]:not([hidden])"); });
    empty.hidden = visible.length > 0;
    empty.textContent = empty.hidden ? "" : `${empty.dataset.prefix ?? ""} “${query.value}”. ${empty.dataset.hint ?? ""}`;
    list.scrollTop = 0;
    select(visible[0]);
  };
  const place = () => {
    const anchor = trigger.getBoundingClientRect();
    const width = Math.min(600, innerWidth - 32);
    const top = Math.round(Math.min(anchor.bottom + 16, innerHeight * .5));
    const left = Math.round(Math.max(16, Math.min(anchor.left, innerWidth - width - 16)));
    dialog.style.setProperty("--dialog-top", `${top}px`);
    dialog.style.setProperty("--dialog-left", `${left}px`);
  };
  const open = () => {
    if (dialog.open) return;
    query.value = "";
    place();
    dialog.showModal();
    filter();
    query.focus({ preventScroll: true });
  };
  const activate = (option?: HTMLElement) => {
    const target = option?.dataset.commandTarget;
    if (!target) return;
    dialog.close();
    if (target === "copy") copy?.click();
    else if (target === "theme") document.querySelector<HTMLButtonElement>("[data-theme-toggle]")?.click();
    else if (target.startsWith("#")) {
      const destination = document.getElementById(target.slice(1));
      if (!destination) return;
      const filteredOut = destination.matches("[data-project][hidden]");
      if (location.hash !== target || filteredOut) history.pushState(null, "", target);
      // Let the index reveal the row in this history entry; Back restores the previous filters.
      if (filteredOut) destination.dispatchEvent(new Event("work:reveal-project", { bubbles: true }));
      if (!destination.hasAttribute("tabindex")) destination.tabIndex = -1;
      destination.focus({ preventScroll: true });
      destination.scrollIntoView({ block: "start" });
    } else location.assign(target);
  };
  options.forEach((option) => {
    option.addEventListener("pointermove", () => { if (selected !== option) select(option); });
    option.addEventListener("click", () => activate(option));
  });
  trigger.addEventListener("click", open);
  trigger.hidden = false;
  addEventListener("resize", () => { if (dialog.open) place(); });
  addEventListener("keydown", (event) => {
    if ((!event.ctrlKey && !event.metaKey) || event.key.toLowerCase() !== "k") return;
    event.preventDefault();
    if (dialog.open) dialog.close();
    else open();
  });
  query.addEventListener("input", filter);
  query.addEventListener("keydown", (event) => {
    if (event.key === "Escape") { event.preventDefault(); dialog.close(); }
    if (event.isComposing) return;
    if (event.key === "Enter" && selected) { event.preventDefault(); activate(selected); }
    if ((event.key === "ArrowDown" || event.key === "ArrowUp") && visible.length) {
      event.preventDefault();
      const step = event.key === "ArrowDown" ? 1 : -1;
      const index = selected ? visible.indexOf(selected) : 0;
      select(visible[(index + step + visible.length) % visible.length], true);
    }
  });
  dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); });
}
