---
name: design-system-contribution
description: >
  Use when proposing or implementing a new component in @wordpress/ui, modifying existing components with breaking changes, proposing new design tokens in @wordpress/theme, or making architectural decisions about the design system. Covers file structure, Pattern A/B selection, Base UI integration, CSS layer/token rules, and testing standards. Works standalone; enhanced by design-system-mcp for context gathering.
---

# Contributing to the WordPress Design System

## Requirements

Targets Gutenberg `trunk`. Assumes TypeScript, React, and CSS Modules. Intended for contributors opening PRs against the Gutenberg repo (a fork is fine — no special permissions are required to author the work).

## When to use

Use this skill when:

- proposing or implementing a new component in `@wordpress/ui`
- modifying existing components with breaking changes
- proposing new design tokens in `@wordpress/theme`
- making architectural decisions about the design system

**Audience:** Gutenberg contributors with write access.

## Inputs required

- What component or token is being added/changed.
- Whether a Base UI primitive exists for the behavior (check [base-ui.com](https://base-ui.com/)).
- Whether a GitHub issue or Slack discussion has been started.

## Procedure

### 1) Check if it already exists

- Browse `packages/ui/src/` or use `get_components` MCP tool.
- Check if Base UI has a primitive you can wrap.
- Check if composition of existing components works.
- If proposing something new, discuss in #design-system Slack or open a GitHub issue.

### 2) Set up the file structure

Create the component directory following the standard layout.

Read:
- `references/file-structure-and-patterns.md` (Directory Layout section)

### 3) Implement the component

Choose the correct pattern:
- **Pattern A** (`useRender` + `mergeProps`): custom component not wrapping Base UI
- **Pattern B** (wrapping `_Component`): adding styling/defaults to a Base UI primitive

Always alias Base UI imports with underscore prefix (`_Button`, `_Dialog`).

Read:
- `references/file-structure-and-patterns.md` (Pattern A, Pattern B, Exports, Types sections)

### 4) Write CSS styles

- All styles inside `@layer wp-ui-components { ... }`
- Variants: `.is-{value}` CSS Module classes via `clsx` (not data attributes)
- All values from `--wpds-*` tokens
- Compose three utility CSS modules for interactive components
- Handle `forced-colors` and `prefers-reduced-motion`

Read:
- `references/css-and-tokens.md`

### 5) Write tests and stories

Read:
- `references/testing-and-stories.md`

### 6) Export the component

Add the component export to `packages/ui/src/index.ts`. Compound components use namespace exports or Object.assign.

Read:
- `references/file-structure-and-patterns.md` (Exports section)

## Verification

- [ ] Component follows Pattern A or B correctly
- [ ] Types extend `ComponentProps<E>` with JSDoc on every prop
- [ ] CSS uses `@layer wp-ui-components`, design tokens, no hardcoded values
- [ ] Utility CSS modules composed (defense, resets, focus)
- [ ] `forced-colors` and `prefers-reduced-motion` handled in CSS
- [ ] Tests use role-based queries and `userEvent.setup()`
- [ ] Stories follow `Design System/Components/{Name}` title format
- [ ] Component exported from `packages/ui/src/index.ts`
- [ ] Global exports test passes (`packages/ui/src/test/index.test.ts`)
- [ ] `npm run test:unit -- packages/ui` passes
- [ ] `npm run lint:js` and Stylelint pass

## Failure modes / debugging

- **Styles not applying**: check CSS layer order and that styles are inside `@layer wp-ui-components`.
- **wp-admin styles bleeding in**: ensure `global-css-defense.module.css` is composed.
- **Token not found by Stylelint**: verify token name against `packages/theme/tokens/` source JSON.
- **Global exports test failing**: add the new component to `packages/ui/src/index.ts`.
- **Focus ring missing**: compose `focus.module.css` utility and check the correct focus ring variant.

## Escalation

- For Base UI gaps, check [base-ui.com](https://base-ui.com/) or open an upstream issue.
- For token naming conventions, consult `packages/theme/docs/tokens.md`.
- For architectural questions, post in #design-system on WordPress Slack.
