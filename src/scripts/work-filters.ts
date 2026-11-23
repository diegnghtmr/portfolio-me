import type { Locale } from "../i18n";
import { workMessages } from "../i18n/work";
import type { AtlasFacet } from "../lib/work";

const index = document.querySelector<HTMLElement>("[data-work-index]");
if (index) enhanceFilters(index);

function enhanceFilters(index: HTMLElement) {
  const get = <T extends HTMLElement = HTMLElement>(selector: string) => index.querySelector<T>(selector)!;
  const all = <T extends HTMLElement = HTMLElement>(selector: string) => Array.from(index.querySelectorAll<T>(selector));
  const m = workMessages[document.documentElement.lang as Locale];
  const filters = get("[data-work-filters]");
  const active = get("[data-active-filters]");
  const chips = get("[data-filter-chips]");
  const status = get("[data-result-count]");
  const empty = get("[data-work-empty]");
  const panel = get("#atlas-facets");
  const toggle = get<HTMLButtonElement>("[data-filter-toggle]");
  const toggleLabel = get("[data-filter-label]");
  const clear = get<HTMLButtonElement>("[data-filter-clear]");
  const rows = all("[data-project]").map((element) => ({ element, group: element.closest<HTMLElement>("[data-group]")!, values: {
    surface: element.dataset.surface!.split(" "),
    repos: [element.dataset.repos!],
    stack: element.dataset.stack!.split(" "),
  } }));
  const groups = all("[data-group]").map((element) => ({
    element,
    count: element.querySelector<HTMLElement>("[data-group-count]")!,
    breakdown: get(`[data-breakdown="${element.dataset.group}"]`),
  }));
  const options = all<HTMLButtonElement>("[data-facet]").map((button) => ({
    button,
    facet: button.dataset.facet as AtlasFacet,
    value: button.value,
    label: button.querySelector<HTMLElement>("[data-facet-label]")!.textContent,
    count: button.querySelector<HTMLElement>("[data-facet-count]")!,
  }));
  const keys = [...new Set(options.map(({ facet }) => facet))];
  const selected = new Set<(typeof options)[number]>();
  const setText = (element: HTMLElement, text: string) => { if (element.textContent !== text) element.textContent = text; };

  function restore() {
    const params = new URLSearchParams(location.search);
    selected.clear();
    for (const option of options) {
      if (params.getAll(option.facet).includes(option.value)) selected.add(option);
    }
    render();
  }

  function syncUrl() {
    const url = new URL(location.href);
    for (const key of keys) url.searchParams.delete(key);
    for (const option of options) {
      if (selected.has(option)) url.searchParams.append(option.facet, option.value);
    }
    if (url.href !== location.href) history.replaceState(history.state, "", url);
  }

  function render() {
    const selections = keys.map((key) => [key, options.filter((option) => option.facet === key && selected.has(option))] as const);
    const matches = (row: (typeof rows)[number], except?: AtlasFacet) => selections.every(([facet, chosen]) =>
      facet === except || chosen.length === 0 || chosen.some(({ value }) => row.values[facet].includes(value)),
    );
    let visible = 0;
    const groupCounts = new Map<HTMLElement, number>();
    for (const row of rows) {
      const show = matches(row);
      row.element.hidden = !show;
      if (!show) continue;
      visible++;
      groupCounts.set(row.group, (groupCounts.get(row.group) ?? 0) + 1);
    }
    for (const option of options) {
      const { facet, value, button, count } = option;
      button.setAttribute("aria-pressed", String(selected.has(option)));
      // Respect other facets, but count every choice independently within this facet.
      setText(count, String(rows.filter((row) => row.values[facet].includes(value) && matches(row, facet)).length));
    }
    for (const { element, count, breakdown } of groups) {
      const size = groupCounts.get(element) ?? 0;
      element.hidden = size === 0;
      setText(count, m.projects(size));
      setText(breakdown, String(size));
    }
    setText(status, visible === rows.length ? m.projects(visible) : m.results(visible, rows.length));
    setText(toggleLabel, m.filterToggle(selected.size));
    empty.hidden = visible !== 0;
    active.hidden = selected.size === 0;
    chips.replaceChildren(...options.filter((option) => selected.has(option)).map((option, i) => {
      const chip = document.createElement("button");
      const cross = document.createElement("span");
      chip.type = "button";
      chip.className = "atlas-chip";
      chip.textContent = option.label;
      chip.setAttribute("aria-label", `${m.remove} ${option.label}`);
      cross.textContent = "×";
      cross.setAttribute("aria-hidden", "true");
      chip.append(cross);
      chip.addEventListener("click", () => {
        selected.delete(option);
        render();
        syncUrl();
        (chips.querySelectorAll("button")[i] ?? chips.querySelector("button:last-child") ?? status).focus();
      });
      return chip;
    }));
  }

  for (const option of options) {
    option.button.addEventListener("click", () => {
      if (!selected.delete(option)) selected.add(option);
      render();
      syncUrl();
    });
  }
  clear.addEventListener("click", () => {
    selected.clear();
    render();
    syncUrl();
    status.focus();
  });
  toggle.addEventListener("click", () => {
    toggle.setAttribute("aria-expanded", String(panel.toggleAttribute("data-open")));
  });
  addEventListener("popstate", restore);
  restore();
  filters.dataset.ready = "";
}
