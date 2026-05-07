# Token Mapping

Use `get_design_tokens` MCP tool if available. Otherwise reference `packages/theme/docs/tokens.md`.

## Colors

Token pattern: `--wpds-color-{bg|fg|stroke}-{target}-{variant}[-{state}]`

| Design intent | Token pattern | Example |
|--------------|---------------|---------|
| Primary button background | `bg-interactive-brand-strong` | `--wpds-color-bg-interactive-brand-strong` |
| Primary button text | `fg-interactive-brand-strong` | `--wpds-color-fg-interactive-brand-strong` |
| Page background | `bg-content-neutral` | `--wpds-color-bg-content-neutral` |
| Body text | `fg-content-neutral` | `--wpds-color-fg-content-neutral` |
| Secondary/muted text | `fg-content-neutral-weak` | `--wpds-color-fg-content-neutral-weak` |
| Border/divider | `stroke-content-neutral` | `--wpds-color-stroke-content-neutral` |
| Focus ring | `stroke-focus-brand` | `--wpds-color-stroke-focus-brand` |
| Error/danger | `*-danger-*` | `--wpds-color-bg-interactive-danger-strong` |
| Hover state | append `-hover` | `--wpds-color-bg-interactive-brand-strong-hover` |

If a design color doesn't map to an existing token, don't hardcode it. Propose a new token.

## Spacing

Token pattern: `--wpds-dimension-{padding|gap|spacing}-{size}`

Sizes: `xs`, `sm`, `md`, `lg`, `xl`, `2xl`, `3xl`

The `Stack` component accepts gap sizes directly: `<Stack gap="md">`.

For custom layouts, use tokens in CSS:
```css
.container {
  padding: var(--wpds-dimension-padding-lg);
  gap: var(--wpds-dimension-gap-md);
}
```

## Typography

Token pattern: `--wpds-typography-{font-size|font-family|line-height}-{size}`

The `Text` component accepts variant props: `<Text variant="heading-xl">`, `<Text variant="body-sm">`.

## Borders & Elevation

```
--wpds-border-radius-{xs|sm|md|lg|xl|pill}
--wpds-border-width-{1|2|focus}
--wpds-elevation-shadow-{sm|md|lg}
```
