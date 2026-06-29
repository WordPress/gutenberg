# UI

`@wordpress/ui` provides React components for the WordPress Design System, built on `@wordpress/theme` tokens. It is the preferred home for new generic design-system primitives when the consumer can accept its experimental status.

## Setup rules

- In standard WordPress editor screens, do not manually load duplicate styles. Gutenberg manages the shared setup.
- Outside WordPress, load `@wordpress/theme/design-tokens.css` for full theming support.
- Add `isolation: isolate` to the app layout root when portaled popovers need predictable stacking.
- Add `body { position: relative; }` when overlay backdrops must cover the viewport while scrolled.
- Avoid bare element selectors in app CSS that fight component cascade layers.
- Use the `wp-ui` cascade layer when ordering UI styles relative to your app layers.

## Component rules

- Support the `render` prop for underlying element control.
- Forward refs.
- Merge consumer `className` with internal styles.
- For component-owned state, support controlled and uncontrolled modes with `defaultX`, `x`, and `onXChange`.
- Do not use native `onChange` as the primary semantic API when the component can provide a value directly through `onXChange`.

## Sources

- [@wordpress/ui README](../../../packages/ui/README.md)
- [ThemeProvider stable API revert PR #79594](../../_sources/github/threads/pr-79594.md)
- [Compat overlay slot PR #78441](../../_sources/github/threads/pr-78441.md)
