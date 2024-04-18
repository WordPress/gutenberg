# BoxControl

BoxControl components let users set values for Top, Right, Bottom, and Left. This can be used as an input control for values like `padding` or `margin`.

## Usage

```jsx
import { useState } from 'react';
import { BoxControl } from '@wordpress/components';

const Example = () => {
	const [ values, setValues ] = useState( {
		top: '50px',
		left: '10%',
		right: '10%',
		bottom: '50px',
	} );

	return (
		<BoxControl
			values={ values }
			onChange={ ( nextValues ) => setValues( nextValues ) }
		/>
	);
};
```

## Props
### `allowReset`: `boolean`

If this property is true, a button to reset the box control is rendered.

- Required: No
- Default: `true`

### `splitOnAxis`: `boolean`

If this property is true, when the box control is unlinked, vertical and horizontal controls can be used instead of updating individual sides.

- Required: No
- Default: `false`

### `inputProps`: `object`

Props for the internal [UnitControl](../unit-control) components.

-   Required: No
-   Default: `{ min: 0 }`

### `label`: `string`

Heading label for the control.

-   Required: No
-   Default: `__( 'Box Control' )`

### `onChange`: `(next: BoxControlValue) => void`

A callback function when an input value changes.

-   Required: Yes

### `resetValues`: `object`

The `top`, `right`, `bottom`, and `left` box dimension values to use when the control is reset.

-   Required: No
-   Default: `{ top: undefined, right: undefined, bottom: undefined, left: undefined }`

### `sides`: `string[]`

Collection of sides to allow control of. If omitted or empty, all sides will be available. Allowed values are "top", "right", "bottom", "left", "vertical", and "horizontal".

-   Required: No

### `units`: `WPUnitControlUnit[]`

Collection of available units which are compatible with [UnitControl](../unit-control).

-   Required: No

### `values`: `object`

The `top`, `right`, `bottom`, and `left` box dimension values.

-   Required: No

### `onMouseOver`: `function`

A handler for onMouseOver events.

-   Required: No

### `onMouseOut`: `function`

A handler for onMouseOut events.

-   Required: No
