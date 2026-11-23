# writing-harness

**Summary.** writing-harness combines Spanish-writing skills with a verifier that checks text against rules written as code. [[README](https://github.com/diegnghtmr/writing-harness#readme)]

**Problem and context.** Tone skills used to repeat the base rules, so their copies could contradict each other. The repository now has:

- 16 skills;
- 93 rules written as code;
- a gate that checks the rule data against the prose that declares each rule.

[[README: idea and gate](https://github.com/diegnghtmr/writing-harness#la-idea)]

## Facts

- **Surface:** a CLI and skill files; there is no UI.
- **Runtime:** Node 22.6 or later. The core needs no dependencies, no build step and no network connection.
- **Code:** [`src/rules.ts`](https://github.com/diegnghtmr/writing-harness/blob/main/src/rules.ts) stores the rules, and [`src/cli.ts`](https://github.com/diegnghtmr/writing-harness/blob/main/src/cli.ts) exposes the verifier.
- **Live demo:** TO CONFIRM.

[[README](https://github.com/diegnghtmr/writing-harness#readme)]

## Demonstration

This command and its output are copied from the README; they were not run for this draft. [[README: enrutamiento](https://github.com/diegnghtmr/writing-harness#enrutamiento)]

```bash
node src/cli.ts --enrutar comunidadAfectada
```

```text
schiavenato-writing
  Texto que le explica a una comunidad algo que la afecta, con un autor que firma lo que afirma.
  Paso 11 de 13 de la lista de redactar-espanol.
```

## Decisions

1. **Copy the base rules into every tone or define a precedence**
   - **Choice:** the base rules always win. A pass the user asks for explicitly replaces tone rules only in the area it governs.
   - **Consequence:** humanization can govern sentence rhythm without removing tone constraints that have nothing to do with rhythm.
   - **Evidence:** "La base no cede nunca nada." [[README: precedence](https://github.com/diegnghtmr/writing-harness#regla-de-precedencia)]
2. **Trust prose and code to stay aligned or check them**
   - **Choice:** a gate compares the two representations in both directions.
   - **Consequence:** the test catches a rule that points to missing prose, and prose that declares a rule no code registers.
   - **Evidence:** "falla en las dos direcciones." [[README: gate](https://github.com/diegnghtmr/writing-harness#el-gate)]

## Verifiable result

- The [GitHub Actions workflow](https://github.com/diegnghtmr/writing-harness/blob/main/.github/workflows/gate.yml) runs the test suite on every push and pull request.
- It also checks that the regenerated coverage is committed.

## Limitations and role

- **Known limitation in the README:** counts of multiword expressions can come out low when an expression is split across subtitle line breaks. The source corpus is not included in the repository. [[README: corpus](https://github.com/diegnghtmr/writing-harness#el-corpus-que-ya-no-est%C3%A1)]
- **Role:** TO CONFIRM.
