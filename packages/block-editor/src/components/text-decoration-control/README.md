# TextDecorationControl

The Text Decoration Control component accepts the following props:

- `value` (string, required): The current value of the text decoration. Possible values are `none`, `underline`, `line-through`.
- `onChange` (function, required): A callback function called when the text decoration value changes. It receives the new value as an argument.

![TextDecorationControl Element in Inspector Control](https://raw.githubusercontent.com/WordPress/gutenberg/HEAD/docs/assets/text-decoration-component.png?raw=true)

## Table of Contents

1. [Usage](#usage)
3. [Properties](#props)

## Usage

```jsx
import { TextDecorationControl } from '@wordpress/block-editor';
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
-   **Default:** `none`
-   **Options:** `none`, `underline`, `line-through`

The current value of the Text Decoration setting. You may only choose from the `Options` listed above.

### `onChange`

-   **Type:** `Function`

A callback function invoked when the Text Decoration value is changed via an interaction with any of the buttons. Called with the Text Decoration value (`none`, `underline`, `line-through`) as the only argument.