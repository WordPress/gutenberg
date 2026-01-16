# Disallow setting Design System token CSS custom properties (no-setting-ds-tokens)

Design System tokens (CSS custom properties beginning with `--wpds-`) are meant to be consumed, not set. Setting these properties in inline styles can lead to unexpected behavior and breaks the Design System's theming capabilities.

This rule lints JSX inline styles. For CSS files, use the [corresponding Stylelint rule](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-theme/#stylelint-plugins) from the `@wordpress/theme` package.

## Rule details

Examples of **incorrect** code for this rule:

```jsx
<div style={ { '--wpds-color-fg-content-neutral': 'red' } } />
```

```jsx
<div style={ { '--wpds-font-size-md': '10px', color: 'blue' } } />
```

Examples of **correct** code for this rule:

```jsx
<div style={ { color: 'var(--wpds-color-fg-content-neutral)' } } />
```

```jsx
<div style={ { '--my-custom-prop': 'value' } } />
```

```jsx
<div style={ { margin: '10px' } } />
```

