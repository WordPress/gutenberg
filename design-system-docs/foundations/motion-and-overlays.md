# Motion and overlays

Overlay behavior should be consistent because small differences in mounting, opacity, focus, and portal containers create visible glitches and accessibility risk.

## Rules

- Use one canonical transition pattern for related overlays. Do not copy a similar fade pattern and invert the state logic in a different component.
- Treat `[data-starting-style]` and `[data-ending-style]` guards consistently across overlay components.
- Keep overlay portals inside a containing block that has real viewport dimensions. A 0-by-0 portal container can force floating content to shrink to min-content width.
- If an overlay compatibility slot covers the viewport, keep the slot itself non-interactive and restore pointer events only on portaled children.
- Avoid instant overlay transitions unless the interaction specifically requires it and the system has agreed on that behavior.
- Test overlays inside other overlays, including WordPress components mixed with `@wordpress/ui` overlays.

## Cross-links

See [UI overlays](../library/ui/overlays.md) for component-level guidance and [Tooltip](../library/ui/tooltip.md) for the special case of visual-only labels.

## Sources

- [Overlay transition consistency issue #79089](../_sources/github/threads/issue-79089.md)
- [Compat overlay slot fix PR #78441](../_sources/github/threads/pr-78441.md)
- [Disable instant overlay transitions PR #79432](../_sources/github/threads/pr-79432.md)
