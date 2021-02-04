# ControlLabel

`ControlLabel` is a form component that works with `FormGroup` to provide a label for form elements (e.g. `Switch` or `TextInput`).

## Usage

```jsx
import {
	__experimentalControlLabel as ControlLabel,
	__experimentalFormGroup as FormGroup,
	__experimentalTextInput as TextInput,
} from '@wordpress/components';

function Example() {
	return (
		<FormGroup>
			<ControlLabel>First Name</ControlLabel>
			<TextInput />
		</FormGroup>
	);
}
```
