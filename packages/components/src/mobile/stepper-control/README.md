# StepperControl

`StepperControl` shows a stepper control to change a value wrapped in a `StepperCell` component.

## Usage

Usage example

```jsx
import { StepperControl } from '@wordpress/components';
import { more } from '@wordpress/icons';

function Stepper( { onChangeValue, value } ) {
	return (
		<StepperControl
			icon={ more }
			label="Columns"
			maxValue={ 8 }
			minValue={ 1 }
			onChangeValue={ onChangeValue }
			value={ value }
		/>
	);
}
```

## Props

### maxValue

Maximum value of the stepper.

-   Type: `Number`
-   Required: Yes
-   Platform: Mobile

### minValue

Minimum value of the stepper.

-   Type: `Number`
-   Required: Yes
-   Platform: Mobile

### step

Step increment value.

-   Type: `Number`
-   Required: No
-   Platform: Mobile

### value

Current value of the stepper.

-   Type: `Number`
-   Required: Yes
-   Platform: Mobile

### onChangeValue

Callback called when the value has changed

-   Type: `Function`
-   Required: Yes
-   Platform: Mobile

The argument of the callback is the updated value as a `Number`.
