# Icon buttons

Icon buttons are compact controls. Their accessibility and tooltip behavior are part of the control, not decoration around it.

## Rules

- Always provide a label for an icon-only button.
- Use `IconButton` when it covers the interaction. It has built-in tooltip support through its `label` prop.
- Keep the tooltip text aligned with the accessible label. If a keyboard shortcut is shown, expose it with `aria-keyshortcuts` on the trigger.
- Do not put essential instructions only in the tooltip. Use visible text, helper text, a popover, or a notice instead.
- Test hover, keyboard focus, touch behavior, disabled states, and overlay stacking.

## Delay and consistency

IconButton tooltip timing should follow the system tooltip behavior. If a product needs different timing, confirm the reason at the system level instead of hardcoding a local exception.

## Sources

- [IconButton tooltip delay PR #79505](../_sources/github/threads/pr-79505.md)
- [IconButton tooltip delay issue #79461](../_sources/github/threads/issue-79461.md)
- [Tooltip usage guidelines](../../packages/ui/src/tooltip/stories/usage-guidelines.mdx)
