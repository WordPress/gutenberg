# Disallow unknown Design System tokens (no-unknown-ds-tokens)

When using Design System tokens (CSS custom properties beginning with `--wpds-`), only valid public tokens should be used. Using non-existent tokens will result in broken styles since the CSS variable won't resolve to any value.

This rule lints JSX inline styles. For CSS files, use the [corresponding Stylelint rule](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-theme/#stylelint-plugins) from the `@wordpress/theme` package.

## Rule details

Examples of **incorrect** code for this rule:

```jsx
<div style={ { color: 'var(--wpds-nonexistent-token)' } } />
```

```jsx
<div style={ { color: 'var(--wpds-fake-color, var(--wpds-also-fake))' } } />
```

Examples of **correct** code for this rule:

```jsx
<div style={ { color: 'var(--wpds-color-fg-content-neutral)' } } />
```

```jsx
<div style={ { color: 'var(--my-custom-prop)' } } />
```

```jsx
<div style={ { color: 'blue' } } />
```

