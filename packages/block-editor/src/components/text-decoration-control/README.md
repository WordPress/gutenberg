# TextDecorationControl

<div class="callout callout-alert">
This feature is still experimental. “Experimental” means this is an early implementation subject to drastic and breaking changes.
</div>
<br />

![TextDecorationControl Element in Inspector Control](https://raw.githubusercontent.com/WordPress/gutenberg/HEAD/docs/assets/text-decoration-component.png?raw=true)


## Usage

```jsx
import { __experimentalTextDecorationControl as TextDecorationControl } from '@wordpress/block-editor';
```

Then, you can use the component in your block editor UI:

```jsx
<TextDecorationControl
  value={textDecorationValue}
  onChange={(newValue) => setAttributes({ textDecoration: newValue })}
/>
```

### Props

### `value`

-   **Type:** `String`
-   **Options:** `none`, `underline`, `line-through`

The current value of the Text Decoration setting. You may only choose from the `Options` listed above.

### `onChange`

-   **Type:** `Function`

A callback function invoked when the Text Decoration value is changed via an interaction with any of the buttons. Called with the Text Decoration value (`none`, `underline`, `line-through`) as the only argument.