# Spacing Sizes Control

The SpacingSizesControl component provides a flexible user interface for controlling spacing values in blocks, allowing users to modify values for different sides. It supports three viewing modes:

1. Single: Control one side at a time.
2. Axial: Control horizontal and vertical sides together.
3. Custom: Control each side separately.

## Usage

```jsx
import { __experimentalSpacingSizesControl as SpacingSizesControl } from '@wordpress/block-editor';
import { useState } from '@wordpress/element';

function Example() {
	const [ sides, setSides ] = useState( {
		top: '0px',
		right: '0px',
		bottom: '0px',
		left: '0px',
	} );

	return (
		<SpacingSizesControl
			values={ sides }
			onChange={ setSides }
			label="Sides"
		/>
	);
}
```

## Props

### `inputProps`

-   Type: `Object`
-   Required: No
-   Description: Additional props to pass to the input controls.

### `label`

-   Type: `String`
-   Required: Yes
-   Description: Label for the control.

### `minimumCustomValue`

-   Type: `Number`
-   Default: 0
-   Description: Minimum value allowed for custom input.

### `onChange`

-   Type: `Function`
-   Required: Yes
-   Description: Callback function called when spacing values change. Receives an object containing the updated values.

### `onMouseOut`

-   Type: `Function`
-   Required: No
-   Description: Callback function called when mouse leaves the control.

### `onMouseOver`

-   Type: `Function`
-   Required: No
-   Description: Callback function called when mouse enters the control.

### `showSideInLabel`

-   Type: `Boolean`
-   Default: true
-   Description: Whether to show the side (top, right, etc.) in the control label.

### `sides`

-   Type: `Array`
-   Default: ALL_SIDES (top, right, bottom, left)
-   Description: Array of sides that can be controlled.

### `useSelect`

-   Type: `Boolean`
-   Required: No
-   Description: Whether to use a select control for predefined values.

### `values`

-   Type: `Object`
-   Required: No
-   Description: Object containing the current spacing values for each side.
