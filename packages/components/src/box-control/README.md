# BoxControl

<div class="callout callout-alert">
This feature is still experimental. “Experimental” means this is an early implementation subject to drastic and breaking changes.
</div>

BoxControl components let users set values for Top, Right, Bottom, and Left. This can be used as an input control for values like `padding` or `margin`.

## Usage

```jsx
import { __experimentalBoxControl as BoxControl } from '@wordpress/components';
import { useState } from '@wordpress/element';

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
### allowReset

If this property is true, a button to reset the box control is rendered.

- Type: `Boolean`
- Required: No
- Default: `true`

### splitOnAxis

If this property is true, when the box control is unlinked, vertical and horizontal controls can be used instead of updating individual sides.

- Type: `Boolean`
- Required: No
- Default: `false`

### inputProps

Props for the internal [InputControl](../input-control) components.

-   Type: `Object`
-   Required: No

### label

Heading label for BoxControl.

-   Type: `String`
-   Required: No
-   Default: `Box Control`

### onChange

A callback function when an input value changes.

-   Type: `Function`
-   Required: Yes

### resetValues

The `top`, `right`, `bottom`, and `left` box dimension values to use when the control is reset.

-   Type: `Object`
-   Required: No

### sides

Collection of sides to allow control of. If omitted or empty, all sides will be available.

-   Type: `Array<Object>`
-   Required: No

### units

Collection of available units which are compatible with [UnitControl](../unit-control).

-   Type: `Array<Object>`
-   Required: No

### values

The `top`, `right`, `bottom`, and `left` box dimension values.

-   Type: `Object`
-   Required: No

### onMouseOver

A handler for onMouseOver events.

-   Type: `Function`
-   Required: No

### onMouseOut

A handler for onMouseOut events.

-   Type: `Function`
-   Required: No
