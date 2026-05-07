---
name: design-system-component-implementation
description: >
  Use when building UI with @wordpress/ui, picking the right component pattern (Pattern A useRender vs. Pattern B Base UI wrapper), wiring --wpds-* design tokens, composing the required utility CSS modules (defense, resets, focus), or writing tests/stories for @wordpress/ui components. Works standalone; enhanced by design-system-mcp's get_components, get_component_details, and get_design_tokens tools when available.
---

# Implementing Components with @wordpress/ui

## Requirements

Targets Gutenberg `trunk`. Assumes TypeScript, React, and CSS Modules. The `design-system-mcp` server is optional but enhances research steps.

## When to use

Use this skill when:

- building UI with `@wordpress/ui` components
- learning the component API, design tokens, or CSS patterns
- creating custom components that integrate with the design system
- writing tests or stories for @wordpress/ui components

## Inputs required

- What UI you are building (component name, behavior, variants).
- Where it will be used (Gutenberg core, external plugin, standalone app).
- Whether the WPDS MCP server is available (for live component/token docs).

## Procedure

### 1) Research available components

Check what already exists before building custom:

- **With MCP**: Use `get_components` and `get_component_details` tools.
- **Without MCP**: Browse `packages/ui/src/` for component directories.

Read:
- `references/patterns-and-types.md` (Available Components section)

### 2) Choose a component pattern

Two patterns exist:
- **Pattern A** (`useRender` + `mergeProps`): for custom components not wrapping Base UI
- **Pattern B** (wrapping `_Component`): for adding styling/defaults to a Base UI primitive

Read:
- `references/patterns-and-types.md` (Pattern A and Pattern B sections)

### 3) Define types

Prop types extend `ComponentProps<E>` from `utils/types.ts`. Use JSDoc with `@default` on every prop.

Read:
- `references/patterns-and-types.md` (Types section)

### 4) Style with CSS and design tokens

- All styles inside `@layer wp-ui-components { ... }`
- Variants use `.is-{value}` CSS Module classes via `clsx` (not data attributes)
- All values from `--wpds-*` tokens (never hardcode)
- Compose three utility CSS modules for interactive components

Read:
- `references/css-and-tokens.md`

### 5) Write tests and stories

- Tests: `@testing-library/react`, role-based queries, `userEvent.setup()`
- Stories: `@storybook/react-vite`, title `'Design System/Components/{Name}'`

Read:
- `references/testing-and-stories.md`

### 6) Handle theming and customization

External consumers customize via token stylesheets or CSS property overrides. `ThemeProvider` is a private API (internal to Gutenberg only).

Read:
- `references/patterns-and-types.md` (Theming section)

## Verification

- Component renders correctly with all variant combinations.
- Keyboard navigation and focus management work.
- `forced-colors` and `prefers-reduced-motion` handled in CSS.
- Tests pass: `npm run test:unit -- packages/ui`
- Stories render in Storybook: `npm run storybook`
- No hardcoded values — all colors, spacing, typography use `--wpds-*` tokens.

## Failure modes / debugging

- **Styles not applying**: check CSS layer order — component styles must be in `@layer wp-ui-components`.
- **Token not found**: verify token name against `packages/theme/tokens/` source files or `get_design_tokens` MCP tool.
- **Focus ring missing**: ensure the component composes `focus.module.css` utility.
- **wp-admin global styles bleeding in**: compose `global-css-defense.module.css`.
- **Disabled button still clickable**: use `data-disabled` attribute (Base UI convention), not `:disabled`.

## Escalation

- If a needed token doesn't exist, propose it in `packages/theme/tokens/`.
- If a Base UI primitive is missing behavior, check [base-ui.com](https://base-ui.com/) for alternatives or open an upstream issue.
- For architectural questions, consult the [Contribution skill](../design-system-contribution/SKILL.md).
