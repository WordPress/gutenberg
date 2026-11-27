# Agents and Skills

The Gutenberg repository ships instructions for AI coding agents: `AGENTS.md` files and an `.agents/skills/` directory. This document explains how they are organized and what to consider before adding more.

## Guiding principle: improve the documentation first

Before adding anything to an agent file, ask whether the information would help human contributors too. If it would, it belongs in the public documentation, and the agent files should point to it.

Agent-only files are easy to let rot: missed details and stale information linger because nobody audits them, while public docs are continuously read and corrected by contributors. Duplicating documentation into agent files also means the two copies silently diverge. Agent files should route to canonical docs, never fork their content.

## How agent instructions are organized

Agent instructions follow **progressive discovery** — an agent reads only what its current task needs:

-   **Root [`AGENTS.md`](https://github.com/WordPress/gutenberg/blob/trunk/AGENTS.md)** is loaded in every agent session. It stays lean and routes to public contributor documentation.
-   **Directory `AGENTS.md`** files (for example [`packages/components/AGENTS.md`](https://github.com/WordPress/gutenberg/blob/trunk/packages/components/AGENTS.md)) are loaded when an agent works with files in that directory. They hold rules scoped to that directory only.
-   **Skills** ([`.agents/skills/<domain>/SKILL.md`](https://github.com/WordPress/gutenberg/tree/trunk/.agents/skills)) are thin, task-scoped guidance — procedures, checklists, or decision trees. Native skill discovery uses each skill's frontmatter description to choose one when its task matches.
-   **Linked docs and references** are read only when a procedure step points to them — they carry no cost until then, so depth belongs there.
-   **Compatibility instruction files** (for example, `CLAUDE.md`) are one-line `@AGENTS.md` redirects; the content always lives in `AGENTS.md`.

This structure controls context bloat. The root `AGENTS.md` is a fixed cost in every session, so keep it lean. Skill bodies are read when relevant, so keep them thin and procedural. Everything linked one hop away is effectively free.

## Supported agents

Codex discovers the repository skill catalog natively. Claude Code uses a generated compatibility view. Installing dependencies updates that view when it contains only catalog entries; it leaves the view unchanged when it finds unmatched local entries. No other agent-specific view is currently configured.

## Creating skills

Create repository skills in [`.agents/skills/<domain>/SKILL.md`](https://github.com/WordPress/gutenberg/tree/trunk/.agents/skills), following the shared Agent Skills format described below. After adding, removing, or changing a skill, run `npm run agents:setup` to apply the catalog to all supported agents. It asks before replacing unmatched generated skill entries; then start a new agent session so it discovers the updated catalog.

## Where does new guidance belong?

Work down this list and stop at the first match:

1. **Public documentation** — if the information helps humans too (it usually does), improve the docs and have agent files point there.
2. **Root `AGENTS.md`** — only for facts nearly every task needs: environment setup and universal pitfalls.
3. **A directory `AGENTS.md`** — for rules an agent must know when working in one specific directory.
4. **A skill** — for guidance scoped to a kind of task rather than a location: a procedure, checklist, or decision tree an agent should follow when doing that work (running tests, releasing a package, scaffolding a block).

## Skill conventions

These conventions use the shared Agent Skills format:

-   One directory per domain: `.agents/skills/<domain>/`, lowercase kebab-case.
-   `SKILL.md` starts with YAML frontmatter containing only `name` (matching the directory) and `description`. Phrase the description as a trigger: "Use when …".
-   Keep the body short and procedural. Link to depth rather than inlining it, and keep every linked file one hop from `SKILL.md`.
-   Link a doc the agent **must** read as part of the procedure step that needs it ("read the [guide] before writing your first body"). In testing, if an agent finds a skill that matches its task, it will focus on that task rather than re-considering generalized "read the relevant docs" files from AGENTS.md.
-   An optional `.agents/skills/<domain>/references/` directory holds agent-specific depth that has no home in the public docs.

The [testing skill](https://github.com/WordPress/gutenberg/blob/trunk/.agents/skills/testing/SKILL.md) and its [`references/` directory](https://github.com/WordPress/gutenberg/tree/trunk/.agents/skills/testing/references) are the live example of these conventions. In skeleton form, a skill looks like:

```md
---
name: <domain>
description: Use when <the tasks that should trigger reading this skill>.
---

# <Domain>

<What the root AGENTS.md already covers is not repeated here.>

## <Procedure step shared by every sub-area>

…

## By sub-area

-   **<Sub-area>**: read [references/<sub-area>.md](references/<sub-area>.md).
```

Walking through how the live testing skill applies these conventions:

-   The `description` is what an agent matches against when deciding whether to read the skill, so it names the tasks that should trigger it ("writing, running, or debugging tests…").
-   The body routes rather than explains: one line per kind of work, each pointing at a `references/` file one hop away.
-   A procedure step that applies to every sub-area (planning the test list with the author) lives once in the skill body, not repeated in each reference — each fact has one home, at the highest level where it applies everywhere below.
-   Each reference file holds only the agent-specific rules for its area and links to the canonical docs for depth. For example, [`references/e2e.md`](https://github.com/WordPress/gutenberg/blob/trunk/.agents/skills/testing/references/e2e.md) says "stay headless; never use `--headed` or `--ui`" — modes the e2e guide rightly recommends to humans but which would hang an agent's session — and then links to that guide for authoring practices.
-   Nothing restates the root `AGENTS.md` — every agent already has it loaded.
-   This is progressive disclosure end to end: the description is always visible, the body is read when a testing task starts, and each reference is read only when the work is actually of that kind.

## Checklist for adding a skill

1. Confirm the public docs can't cover it — improve them first if they can.
2. Create `.agents/skills/<domain>/SKILL.md` following the conventions above.
3. Run `npm run lint:md:docs`.
