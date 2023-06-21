# AnglePickerControl

`AnglePickerControl` is a React component to render a UI that allows users to pick an angle.
Users can choose an angle in a visual UI with the mouse by dragging an angle indicator inside a circle or by directly inserting the desired angle in a text field.

## Usage

```jsx
import { useState } from '@wordpress/element';
import { AnglePickerControl } from '@wordpress/components';

function Example() {
	const [ angle, setAngle ] = useState( 0 );
	return (
		<AnglePickerControl
			value={ angle }
			onChange={ setAngle }
			__nextHasNoMarginBottom
		/>
	);
};
```

## Props

The component accepts the following props.

### `label`: `string`

Label to use for the angle picker.

-   Required: No
-   Default: `__( 'Angle' )`

### `value`: `number | string`

The current value of the input. The value represents an angle in degrees and should be a value between 0 and 360.

-   Required: Yes

### `onChange`: `( value: number ) => void`

A function that receives the new value of the input.

-   Required: Yes

### `__nextHasNoMarginBottom`: `boolean`

Start opting into the new margin-free styles that will become the default in a future version, currently scheduled to be WordPress 6.4. (The prop can be safely removed once this happens.)

-   Required: No
-   Default: `false`
