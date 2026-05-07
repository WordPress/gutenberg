---
name: design-system-figma-to-code
description: >
  Use when translating a Figma/Sketch/XD design or screenshot into @wordpress/ui code: mapping design colors/spacing/typography to --wpds-* tokens, picking the right @wordpress/ui component for each element, and filling in missing states (focus, hover, disabled) and responsive behavior. Works standalone; enhanced by design-system-mcp's get_design_tokens and get_components tools.
---

# Adapting Designs to @wordpress/ui

## Requirements

Targets Gutenberg `trunk`. Assumes TypeScript, React, and CSS Modules. The `design-system-mcp` server is optional but useful for live token/component lookups.

## When to use

Use this skill when:

- translating Figma/Sketch/XD designs into code
- mapping design values (colors, spacing, typography) to `--wpds-*` tokens
- identifying which @wordpress/ui components match a design element
- handling design variants, states, and responsive behavior

## Inputs required

- The design mockup or spec (Figma link, screenshot, or description).
- Target WordPress version and context (Gutenberg core, plugin, standalone).
- Whether the WPDS MCP server is available.

## Procedure

### 1) Audit the design

Before writing code, extract these from the design:

- **Layout**: Grid vs. flex? Breakpoints? Alignment?
- **Colors**: For each color, determine semantic purpose:
  - Interactive element background → `--wpds-color-bg-interactive-*`
  - Static content background → `--wpds-color-bg-content-*`
  - Text/icon → `--wpds-color-fg-*`
  - Border/divider → `--wpds-color-stroke-*`
- **Spacing**: Gaps, padding, margins.
- **Typography**: Font size, weight, line-height.
- **States**: Default, hover, active, focus, disabled, loading. Add focus and disabled even if design omits them.
- **Responsive**: What stacks, collapses, or hides at breakpoints?

### 2) Map design values to tokens

Translate every design value to a `--wpds-*` token. Never hardcode.

Read:
- `references/token-mapping.md`

### 3) Select components

Match design elements to existing @wordpress/ui components before building custom.

Read:
- `references/component-selection.md`

### 4) Handle missing pieces

- **Color not in tokens**: Propose a token addition to `packages/theme/tokens/color.json`.
- **Component not in library**: Compose from existing components first. If insufficient, build custom following the [Component Implementation skill](../design-system-component-implementation/SKILL.md).
- **State not in design**: Always implement focus (accessibility) and disabled states. Use `utils/css/focus.module.css`.
- **Responsive not specified**: Use mobile-first CSS. `Stack` component's `direction` and `wrap` props help.

### 5) Implement

Follow the [Component Implementation skill](../design-system-component-implementation/SKILL.md) for patterns, CSS, and testing.

## Verification

- Every design value maps to a `--wpds-*` token (no hardcoded colors/spacing).
- All interactive elements have hover, focus, and disabled states.
- Component renders correctly at all breakpoints in the design.
- Accessibility: contrast ratios ≥ 4.5:1 for text, keyboard navigation works.

## Failure modes / debugging

- **Design color not matching any token**: check if it's close to an existing token variant. If genuinely new, propose a token.
- **Component looks wrong in wp-admin**: ensure `global-css-defense.module.css` is composed.
- **Spacing inconsistent with design**: verify you're using the correct dimension token category (`padding` vs. `gap` vs. `spacing`).

## Escalation

- If the design is ambiguous, ask the designer:
  - "What happens with long text — truncate, wrap, or overflow?"
  - "What are the hover, focus, and disabled states?"
  - "Is this color semantic (brand, danger, neutral) or decorative?"
  - "Should this be a new component or a variant of an existing one?"
- For token naming questions, consult `packages/theme/docs/tokens.md`.
