# Disallow unknown Design System tokens (no-unknown-ds-tokens)

When using Design System tokens (CSS custom properties beginning with `--wpds-`), only valid public tokens should be used. Using non-existent tokens will result in broken styles since the CSS variable won't resolve to any value.

Additionally, token names must not be dynamically constructed (e.g. via template literal expressions), as they cannot be statically verified for correctness or processed automatically to inject fallbacks.

This rule lints all string literals and template literals in JavaScript/TypeScript files. For CSS files, use the [corresponding Stylelint rule](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-theme/#stylelint-plugins) from the `@wordpress/theme` package.

## Rule details

Examples of **incorrect** code for this rule:

```jsx
<div style={ { color: 'var(--wpds-nonexistent-token)' } } />
```

```js
const token = 'var(--wpds-nonexistent-token)';
```

```jsx
<div style={ { color: 'var(--wpds-fake-color, var(--wpds-also-fake))' } } />
```

```js
// Dynamically constructed token names are not allowed.
const token = `var(--wpds-dimension-gap-${ size })`;
```

Examples of **correct** code for this rule:

```jsx
<div style={ { color: 'var(--wpds-color-fg-content-neutral)' } } />
```

```js
const token = 'var(--wpds-color-fg-content-neutral)';
```

```jsx
<div style={ { color: 'var(--my-custom-prop)' } } />
```

```jsx
<div style={ { color: 'blue' } } />
```

