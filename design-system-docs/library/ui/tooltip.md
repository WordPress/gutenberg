# Tooltip

Use Tooltip as a visual label for sighted mouse and keyboard users. Do not use it as the source of accessible information.

## Rules

- The trigger must have an accessible name independent of the tooltip popup.
- The tooltip text should match, or be a concise equivalent of, the trigger's accessible name.
- If the tooltip displays a keyboard shortcut, expose the shortcut with `aria-keyshortcuts` on the trigger.
- Do not put essential instructions, validation, or feedback only in a tooltip.
- Tooltips are disabled or unreliable on touch devices, so touch users must not need them.
- Use `IconButton` for icon-only buttons when possible because it wires the label and tooltip pattern together.

## Use Popover instead when

- The trigger's purpose is to open the popup itself.
- The content is more than a short label.
- The content must be available to touch users and assistive technologies.
- The popup contains interactive content.

## Sources

- [Tooltip usage guidelines](../../../packages/ui/src/tooltip/stories/usage-guidelines.mdx)
- [Tooltip color customization PR #79612](../../_sources/github/threads/pr-79612.md)
- [Tooltip border radius PR #78983](../../_sources/github/threads/pr-78983.md)
- [Compat overlay slot PR #78441](../../_sources/github/threads/pr-78441.md)
