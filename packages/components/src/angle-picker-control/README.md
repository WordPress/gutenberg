# AnglePickerControl

`AnglePickerControl` is a React component to render a UI that allows users to pick an angle.
Users can choose an angle in a visual UI with the mouse by dragging an angle indicator inside a circle or by directly inserting the desired angle in a text field.

## Usage

```jsx
import { useState } from 'react';
import { AnglePickerControl } from '@wordpress/components';

function Example() {
	const [ angle, setAngle ] = useState( 0 );
	return (
		<AnglePickerControl
			value={ angle }
			onChange={ setAngle }
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
