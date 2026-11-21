<!-- Research brief generated 2026-11-21 by a read-only explorer subagent. Sources inline; verify before relying on versions/licenses. -->

# Research brief: software-engineering portfolios

**Bottom line:** Design for two passes: a fast scan that establishes role, relevant work and credibility, followed by an optional technical deep dive. Show evidence of decisions and outcomes—not just a list of technologies. The behavioral evidence below is older and limited; recent advice is useful but should not be mistaken for controlled research.

## 1. Recruiter and hiring-manager behavior

- **Resume timing is not portfolio timing.** Ladders’ 2012 eye-tracking study observed **30 recruiters over 10 weeks** and reported roughly **six seconds for an initial resume fit/no-fit decision**. Participants concentrated heavily on name, titles, employers, dates and education. This was a small, commercially interested study—not a universal hiring benchmark or a measurement of portfolio visits. ([Study PDF](https://www.bu.edu/com/files/2018/10/TheLadders-EyeTracking-StudyC2.pdf))
- For projects, GitHub’s hiring guidance advises expecting **only a couple of minutes** of attention. That is practical guidance, not a measured industry-wide average. It recommends a demo, setup and test instructions, understandable code, and tests. ([GitHub](https://docs.github.com/en/account-and-profile/tutorials/using-your-github-profile-to-enhance-your-resume))
- **Implication:** Put your target role, strongest relevant work and contact link near the top. Each project should quickly answer *what problem, for whom, what I owned, and what happened*; then offer demo, code and technical detail for a deeper review. Case-study guidance emphasizes decisions and trade-offs over code dumps. ([GitHub](https://docs.github.com/en/account-and-profile/tutorials/using-your-github-profile-to-enhance-your-resume); [case-study guidance](https://josealencar.dev/blog/developer-portfolio-projects-case-studies))

## 2. A project case-study template

Use a concise summary first, with expandable or linked depth:

1. **Problem and audience:** What needed to change? What was your role versus the team’s?
2. **Constraints:** Scale, latency, accessibility, budget, deadlines or privacy—whichever actually shaped the work.
3. **Decisions:** Explain one or two meaningful alternatives, the choice and its consequences. Link an ADR when useful; ADRs capture context, decision and trade-offs. ([AWS ADR guidance](https://docs.aws.amazon.com/pdfs/prescriptive-guidance/latest/architectural-decision-records/architectural-decision-records.pdf))
4. **Architecture and validation:** A small labeled diagram, important data flows, tests, and links to relevant code.
5. **Results:** Real before/after measurements and how they were obtained; otherwise say *unmeasured* and show observable functionality.
6. **Reflection:** Limitations, lessons and what you would change next.

This is a **recommended synthesis**, not a proven universal formula. ([Case-study guidance](https://josealencar.dev/blog/developer-portfolio-projects-case-studies); [GitHub](https://docs.github.com/en/account-and-profile/tutorials/using-your-github-profile-to-enhance-your-resume))

## 3. Presentation patterns and examples

- **UI/product work:** Lead with a representative screenshot or short interaction loop; link the live experience and explain the interaction’s purpose. Provide a static fallback and avoid making animation necessary to understand the project. [Brittany Chiang](https://brittanychiang.com/) pairs concise project descriptions and technology labels with screenshots; [Paco Coursey](https://paco.me/) presents succinct descriptions of focused interface tools. [Emil Kowalski](https://emilkowal.ski/) is another reference for interface and motion work.
- **Writing and teaching as proof:** [Lee Robinson](https://leerob.com/) foregrounds a concise bio and substantive notes and articles rather than a conventional project grid. [Josh Comeau’s portfolio advice](https://www.joshwcomeau.com/effective-portfolio/) is a useful companion for selecting and presenting work.
- **Backend/CLI/infra:** Make the invisible visible: show a labeled architecture/data-flow diagram, a sample request and response, a short code excerpt, test or benchmark results, and—where appropriate—a safe API playground. For a CLI, use a terminal recording: [asciinema](https://docs.asciinema.org/manual/cli/) records replayable sessions; [VHS](https://github.com/charmbracelet/vhs) can script GIF, MP4 or WebM demos. These are presentation recommendations, not comparative hiring-study findings.
- **Multi-repo systems:** Use one system map with arrows for requests, events and deployment boundaries; label each component with its repository link and your contribution. Give each repo a backlink to the overview. This is a practical application of the architecture and ownership principles above, not an established recruiter preference.

## 4. GitHub repository presentation

A useful **README order** is: one-sentence purpose and audience → screenshot/GIF or demo → features → prerequisites and copyable quickstart → architecture and key decisions → tests and results → limitations → license/contributing. GitHub specifically recommends explaining purpose, usefulness and getting started; its hiring guide adds demos and testing. ([README guidance](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes); [hiring guide](https://docs.github.com/en/account-and-profile/tutorials/using-your-github-profile-to-enhance-your-resume))

Add a clear repository description, website and topics; set a recognizable **social preview**. Use badges only when they communicate something useful and current, such as CI status. Pin **3–5 relevant, varied projects**, potentially mixing original work and meaningful contributions; GitHub permits up to six pinned repositories/gists. ([Repository customization](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository); [pinning](https://docs.github.com/en/account-and-profile/how-tos/profile-customization/pinning-items-to-your-profile); [hiring guide](https://docs.github.com/en/account-and-profile/tutorials/using-your-github-profile-to-enhance-your-resume))

## 5. Avoid

- **Uncalibrated skill bars** such as “React 90%”: demonstrate the skill in context instead. ([Portfolio guide](https://soychristian.com/contents/developer-portfolio-guide/))
- **Generic template or AI-flavored copy without specifics:** a template is fine as infrastructure; replace boilerplate with your actual decisions, contributions and voice. ([Mayank Kushwaha](https://mayank-kushwaha.in/blog/portfolios-that-dont-look-ai-generated))
- **Visual spectacle that obscures the work, broken demos, and unsupported impact claims:** prioritize readable hierarchy and verifiable evidence; label prototypes and unmeasured results honestly. ([Ladders study](https://www.bu.edu/com/files/2018/10/TheLadders-EyeTracking-StudyC2.pdf); [GitHub](https://docs.github.com/en/account-and-profile/tutorials/using-your-github-profile-to-enhance-your-resume))

**Evidence gap:** I found no robust 2025–2026 measurement establishing a universal portfolio viewing time or proving that a specific layout increases hiring. Rauno Freiberg’s site could not be directly extracted because it is JavaScript-rendered, so its presentation is not characterized here.
