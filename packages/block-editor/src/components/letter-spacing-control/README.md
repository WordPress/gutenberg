# Letter spacing control

The `LetterSpacingControl` component renders a [`UnitControl`](https://github.com/WordPress/gutenberg/blob/trunk/packages/block-editor/src/components/unit-control/README.md) that lets the user enter a numeric value and select a unit, for example px or rem.

This component is used for blocks that display text, commonly inside a 
[`ToolsPanelItem`](https://github.com/WordPress/gutenberg/blob/trunk/packages/components/src/tools-panel/tools-panel-item/README.md).

## Table of contents

1. [Development guidelines](#development-guidelines)
2. [Related components](#related-components)

## Development guidelines

### Usage

Renders a letter spacing control.

```jsx
import { LetterSpacingControl } from '@wordpress/block-editor';

const MyLetterSpacingControl = () => (
	<LetterSpacingControl
		value={ value }
		onChange={ onChange }
		__unstableInputWidth="auto"
	/>
);
```

### Props

### `value`

-   **Type:** `String`
-   **Default:** `undefined`

The current value of the letter spacing setting.

### `onChange`

-   **Type:** `Function`

A callback function invoked when the value is changed.

### `_unstableInputWidth`

-   **Type:** `string|number|undefined`
-   **Default:** `undefined`

Input width to pass through to inner UnitControl. Should be a valid CSS value.

## Related components

Block Editor components are components that can be used to compose the UI of your block editor. Thus, they can only be used under a [`BlockEditorProvider`](https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/provider/README.md) in the components tree.
