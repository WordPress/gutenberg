# Disallow setting Design System token CSS custom properties (no-setting-ds-tokens)

Design System tokens (CSS custom properties beginning with `--wpds-`) are meant to be consumed, not set. Setting these properties can lead to unexpected behavior and breaks the Design System's theming capabilities. To customize parts of the Design System, use the `ThemeProvider` component from the [`@wordpress/theme`](https://wordpress.github.io/gutenberg/?path=/docs/design-system-theme-introduction--docs) package.

This rule lints object property keys as well as CSS declaration strings and template literals when the declaration is clearly assigning into the `--wpds-*` namespace in JavaScript/TypeScript files. For CSS files, use the [corresponding Stylelint rule](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-theme/#stylelint-plugins) from the `@wordpress/theme` package.

## Rule details

Examples of **incorrect** code for this rule:

```jsx
<div style={ { '--wpds-color-foreground-content-neutral': 'red' } } />
```

```js
const styles = { '--wpds-color-foreground-content-neutral': 'red' };
```

```js
const css = '--wpds-color-foreground-content-neutral: red;';
```

```js
const css = `--wpds-color-foreground-content-neutral: ${ value };`;
```

```js
const css = `--wpds-color-${ suffix }: red;`;
```

```jsx
<style>{ `--wpds-color-${ suffix }: red;` }</style>
```

Examples of **correct** code for this rule:

```jsx
<div style={ { color: 'var(--wpds-color-foreground-content-neutral)' } } />
```

```js
const css = '--my-custom-prop: red;';
```

```js
const css = `--my-custom-prop-${ suffix }: red;`;
```

```jsx
<style>{ `--my-custom-prop-${ suffix }: red;` }</style>
```

```jsx
<div style={ { '--my-custom-prop': 'value' } } />
```

```jsx
<div style={ { margin: '10px' } } />
```
