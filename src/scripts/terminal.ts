const terminal = document.querySelector<HTMLElement>("[data-terminal]");
const card = terminal?.closest("a");
if (terminal && card) {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const lines = Array.from(terminal.querySelectorAll<HTMLElement>("[data-line]"));
  const command = lines[0];
  const caret = terminal.querySelector(".caret");
  if (command && caret) {
    const text = command.textContent ?? "";
    let timer = 0;
    let running = false;
    const ready = () => terminal.toggleAttribute("data-ready", !reduced.matches);
    const finish = () => {
      clearTimeout(timer);
      command.textContent = text;
      lines.forEach((line) => line.style.removeProperty("visibility"));
      lines.at(-1)?.after(caret);
      terminal.removeAttribute("data-typing");
      running = false;
    };
    const play = () => {
      if (running || reduced.matches) return;
      running = true;
      terminal.setAttribute("data-typing", "");
      command.textContent = "";
      lines.slice(1).forEach((line) => { line.style.visibility = "hidden"; });
      command.after(caret);
      let letters = 0;
      let line = 1;
      const output = () => {
        const next = lines[line++];
        if (!next) return finish();
        next.style.removeProperty("visibility");
        next.after(caret);
        timer = window.setTimeout(output, 140);
      };
      const type = () => {
        command.textContent = text.slice(0, ++letters);
        timer = window.setTimeout(letters < text.length ? type : output, letters < text.length ? 50 : 380);
      };
      timer = window.setTimeout(type, 200);
    };
    ready();
    reduced.addEventListener("change", () => { ready(); if (reduced.matches) finish(); });
    card.addEventListener("pointerenter", play);
    card.addEventListener("focus", play);
    if (typeof IntersectionObserver !== "undefined") {
      const observer = new IntersectionObserver((entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        play();
      }, { threshold: .6 });
      observer.observe(terminal);
    }
  }
}
