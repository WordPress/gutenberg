# TextAlignmentControl

The `TextAlignmentControl` component is responsible for rendering a control element that allows users to select and apply text alignment options to blocks or elements in the Gutenberg editor. It provides an intuitive interface for aligning text with options such as `left`, `center` and `right`.

## Usage

Renders the Text Alignment Component with `left`, `center` and `right` alignment options.

```jsx
import { TextAlignmentControl } from '@wordpress/block-editor';

const MyTextAlignmentControlComponent = () => (
	<TextAlignmentControl
		value={ textAlign }
		onChange={ ( value ) => {
			setAttributes( { textAlign: value } );
		} }
	/>
);
```

## Props

### `value`

-   **Type:** `String`
-   **Default:** `undefined`
-   **Options:** `left`, `center`, `right`, `justify`

The current value of the text alignment setting. You may only choose from the `Options` listed above.

### `onChange`

-   **Type:** `Function`

A callback function invoked when the text alignment value is changed via an interaction with any of the options. The function is called with the new alignment value (`left`, `center`, `right`) as the only argument.

### `className`

-   **Type:** `String`

Class name to add to the control for custom styling.

### `options`

-   **Type:** `Array`
-   **Default:** [`left`, `center`, `right`]

An array that determines which alignment options will be available in the control. You can pass an array of alignment values to customize the options.
