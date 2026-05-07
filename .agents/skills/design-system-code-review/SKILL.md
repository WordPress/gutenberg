---
name: design-system-code-review
description: >
  Use when reviewing a @wordpress/ui component PR, a @wordpress/theme token addition, or any design system change — to check architecture (Pattern A/B), types, CSS layers, --wpds-* token usage, accessibility (forced-colors, prefers-reduced-motion, focus), tests, stories, and exports. Works on PRs in forks or upstream. Enhanced by design-system-mcp's get_component_details for comparing against established patterns.
---

# Reviewing Design System Contributions

## Requirements

Targets Gutenberg `trunk`. Works against any PR diff — no repo write/review permission is required to apply this checklist; it's also useful when reviewing forks or downstream contributions.

## When to use

Use this skill when:

- reviewing a new component PR for `@wordpress/ui`
- reviewing design token additions/changes in `@wordpress/theme`
- checking accessibility, testing, or CSS compliance of design system code
- providing structured feedback on design system architecture

## Inputs required

- The PR diff or files being reviewed.
- Whether the WPDS MCP server is available (for comparing against existing patterns via `get_component_details`).

## Procedure

### 1) Identify what's being changed

- New component → full checklist applies
- Existing component modification → focus on changed areas
- Token addition → focus on token naming and DTCG format
- Bug fix → focus on regression testing

### 2) Run the checklist

Work through the full review checklist section by section: architecture, types, CSS, accessibility, testing, stories, exports.

Read:
- `references/review-checklist.md`

### 3) Compare against existing patterns

If MCP is available, use `get_component_details` to compare the PR against an established component (e.g., Button, Dialog) for consistency.

Without MCP, browse `packages/ui/src/button/` or `packages/ui/src/dialog/` as reference implementations.

### 4) Leave feedback

- Be specific — reference the exact pattern or convention being violated.
- Show the fix — include a corrected code snippet.
- Distinguish blocking vs. non-blocking — prefix with "nit:" or "suggestion:" for non-blocking.
- Link to precedent — point to an existing component that follows the pattern correctly.

## Verification

- All checklist items relevant to the PR have been addressed.
- Blocking issues are clearly distinguished from suggestions.
- Feedback includes corrected code snippets where applicable.

## Failure modes / debugging

- **Unsure if a pattern is correct**: compare against `packages/ui/src/button/` (Pattern B) or `packages/ui/src/stack/` (Pattern A) as canonical examples.
- **Token name validity unclear**: check against `packages/theme/tokens/` source JSON files.
- **CSS convention unclear**: reference the [Contribution skill's CSS reference](../design-system-contribution/references/css-and-tokens.md).

## Escalation

- For ambiguous architectural decisions, consult the [Contribution skill](../design-system-contribution/SKILL.md).
- For Base UI integration questions, check [base-ui.com](https://base-ui.com/).
- For design system direction, post in #design-system on WordPress Slack.
