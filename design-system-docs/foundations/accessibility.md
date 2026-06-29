# Accessibility

Accessibility rules belong at the foundation level when they apply across components. Component pages should add local details only when behavior differs.

## Rules

- Every interactive icon-only control needs an accessible name.
- Tooltip popups are visual-only labels. The trigger's accessible name is the source of truth for assistive technologies.
- Dialogs, drawers, and alert dialogs need titles. If the title is visually hidden, it must still label the dialog.
- Form validation errors must be attached to the control the user actually focuses, not only to a hidden validation delegate.
- Announce action feedback with an accessible mechanism such as `speak()` or a notice pattern when screen reader users need to know it happened.
- Keyboard testing instructions are required for UI changes that affect focus, dismissing, selection, validation, or overlays.
- Do not hide critical information behind hover-only UI.

## Review checklist

- Can the user reach the control with the keyboard?
- Does focus land somewhere predictable after opening and closing an overlay?
- Does the accessible name match the visible or tooltip label?
- Are validation errors described by the actual interactive target?
- Is feedback announced once, in the right politeness queue, and without stale messages?

## Sources

- [Tooltip usage guidelines](../../packages/ui/src/tooltip/stories/usage-guidelines.mdx)
- [Validated controls error issue #76741](../_sources/github/threads/issue-76741.md)
- [A11y speak queue PR #79562](../_sources/github/threads/pr-79562.md)
- [Replace local aria-live with speak PR #79600](../_sources/github/threads/pr-79600.md)
