# Disallow usage of Design System tokens (no-ds-tokens)

Disallows any usage of Design System token CSS custom properties (beginning with `--wpds-`) in string literals and template literals.

This is useful in contexts where Design System tokens should not be referenced directly. It is not included in any preset and must be explicitly enabled.

## Rule details

Examples of **incorrect** code for this rule:

```js
const style = 'color: var(--wpds-color-fg-content-neutral)';
```

```js
const style = `border: 1px solid var(--wpds-border-color)`;
```

```jsx
<div style={ { color: 'var(--wpds-color-fg-content-neutral)' } } />
```

Examples of **correct** code for this rule:

```js
const style = 'color: var(--my-custom-prop)';
```

```js
const style = `border: 1px solid var(--other-prefix-token)`;
```

```jsx
<div style={ { color: 'blue' } } />
```
