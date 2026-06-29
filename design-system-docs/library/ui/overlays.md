# Overlays

Overlays include popovers, dialogs, alert dialogs, drawers, menus, selects, autocomplete popups, and tooltips. They share stacking, portal, motion, focus, and dismissal concerns.

## Rules

- Use modal overlays only when the rest of the UI should be unavailable.
- Every dialog-like overlay needs a title that labels the dialog, visible or visually hidden.
- Keep focus management explicit. Test opening, closing, Escape, click outside, nested overlays, and final focus.
- Use a real viewport-sized portal container for compatibility slots.
- Keep overlay fade and transform patterns consistent across related components.
- Use Popover for hoverable info content that must be available to touch and assistive technology users.
- Use Tooltip only as a visual label for a control that already has an accessible name.

## Portal compatibility

When mixing `@wordpress/ui` overlays with `@wordpress/components` overlays outside the standard WordPress environment, call `useEnableWpCompatOverlaySlot()` once from a long-lived root component. The slot exists so UI overlays stack predictably with legacy component overlays.

## Sources

- [@wordpress/ui README overlay setup](../../../packages/ui/README.md)
- [Compat overlay slot PR #78441](../../_sources/github/threads/pr-78441.md)
- [Overlay transition issue #79089](../../_sources/github/threads/issue-79089.md)
- [Dialog/Drawer/AlertDialog tokenized borders PR #77746](../../_sources/github/threads/pr-77746.md)
