StepperCell
===================

`StepperCell` shows a stepper control to change a value wrapped in a `Cell` component.

## Usage

Usage example

```jsx
import StepperCell from './bottom-sheet/stepper-cell';

function Stepper( { onChangeValue, value } ) {
	return (
        <StepperControl
            icon="screenoptions"
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

### icon

Dashicon key name of the icon.

- Type: `String`
- Required: No
- Platform: Mobile

### label

Label of the component.

- Type: `String`
- Required: No
- Platform: Mobile

### maxValue 

Maximum value of the stepper.

- Type: `Number`
- Required: Yes
- Platform: Mobile

### minValue 

Minimum value of the stepper.

- Type: `Number`
- Required: Yes
- Platform: Mobile

### step 

Step increment value.

- Type: `Number`
- Required: No
- Platform: Mobile

### separatorType 

Separator type for the `Cell` style.

- Type: `String`
- Required: No
- Platform: Mobile

### value 

Current value of the stepper.

- Type: `Number`
- Required: Yes
- Platform: Mobile

### onChangeValue

Callback called when the value has changed

- Type: `Function`
- Required: Yes
- Platform: Mobile

The argument of the callback is the updated value as a `Number`.