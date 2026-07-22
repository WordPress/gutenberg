---
name: design-system-code-review
description: Review a Gutenberg contribution that changes a WordPress Design System package or its public contract.
---

# Review a WordPress Design System contribution

Use this skill to review a diff changing `packages/components`, `packages/ui`,
or `packages/theme`. It requires the target Gutenberg checkout or a complete
diff; it is not a consumer-code-review checklist.

## Gather evidence

Inspect the diff, package source, tests, stories, generated outputs, and public
exports. Read [Working with WordPress Design System packages](../../docs/contributors/design/design-system-packages.md)
and the relevant package contribution guide. Use an available MCP server only
as supplementary current-design context, not as proof of a target branch's
contract.

## Assess the change

Check the concrete behaviour and contract rather than applying a static source
checklist. Cover, as applicable:

- existing consumers and external package consumers separately;
- public API, type, token, and theming compatibility;
- semantics, keyboard/focus behaviour, visible states, motion, and styling
  behaviour in a real browser when source-order or geometry matters;
- package conventions, tests, stories, documentation, generated output, and
  release impact.

## Report findings

For each finding, state the affected contract or behaviour, evidence from the
target source or consumer, and the concrete impact. Keep severity proportional
to the demonstrated risk. Distinguish a required change from an optional
precedent or follow-up.
