# Skills

Task-scoped guidance ("skills") for AI coding agents working in this repository — procedures, checklists, or decision trees for a kind of task. Agents discover them through the root `AGENTS.md`, which routes to the skill matching the task at hand.

## Layout

```text
skills/<domain>/SKILL.md      # Thin procedure with name/description frontmatter.
skills/<domain>/references/   # Optional depth, read only when a step needs it.
```

## Before adding anything here

**Prefer improving the public documentation and pointing to it over adding agent-only content.** Agent files are easy to let rot: missed details and stale information linger because nobody audits them, while public docs are continuously read and corrected by contributors. A skill should route to canonical docs, never fork their content. Add a `references/` file only for genuinely agent-specific depth that has no home in the docs.

See [Agents and Skills](../docs/contributors/code/agents-and-skills.md) for the full guidance, conventions, and checklist.
