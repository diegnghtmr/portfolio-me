export const caseStudyMessages = {
  en: {
    eyebrow: "Case study", facts: "Project facts", role: "Role", timeframe: "Timeframe", team: "Team", people: (count: number) => `Team of ${count}`,
    surfaces: "Surfaces", stack: "Stack", repositories: "Repositories", demo: "Live demo", openDemo: "Open live demo",
    all: "All projects", contents: "On this page", breadcrumb: "Breadcrumb",
    problem: "Problem", demonstration: "Demonstration", architecture: "How it works", decisions: "Decisions",
    results: "Results", limitations: "Limitations", next: "Next project", map: "Repository map",
    chosen: "Chosen", notChosen: "Not chosen", consequence: "Consequence", evidence: "Evidence",
    terminal: "Terminal", run: "Captured from a real run", readme: "From the README",
    enlarge: "Enlarge image", close: "Close", gallery: "Screenshot viewer",
  },
  es: {
    eyebrow: "Caso de estudio", facts: "Datos del proyecto", role: "Rol", timeframe: "Periodo", team: "Equipo", people: (count: number) => `Equipo de ${count}`,
    surfaces: "Interfaces", stack: "Tecnologías", repositories: "Repositorios", demo: "Demo en vivo", openDemo: "Abrir demo en vivo",
    all: "Todos los proyectos", contents: "En esta página", breadcrumb: "Ruta de navegación",
    problem: "Problema", demonstration: "Demostración", architecture: "Cómo funciona", decisions: "Decisiones",
    results: "Resultados", limitations: "Limitaciones", next: "Siguiente proyecto", map: "Mapa de repositorios",
    chosen: "Elegida", notChosen: "No elegida", consequence: "Consecuencia", evidence: "Evidencia",
    terminal: "Terminal", run: "Capturado en una ejecución real", readme: "Del README",
    enlarge: "Ampliar imagen", close: "Cerrar", gallery: "Visor de capturas",
  },
} as const;
