# ControlLabel

<div class="callout callout-alert">
This feature is still experimental. “Experimental” means this is an early implementation subject to drastic and breaking changes.
</div>

`ControlLabel` is a form component that works with `FormGroup` to provide a label for form elements (e.g. `Switch` or `TextInput`).

## Usage

```jsx
import { ControlLabel, FormGroup, TextInput } from '@wordpress/components/ui';

function Example() {
	return (
		<FormGroup>
			<ControlLabel>First Name</ControlLabel>
			<TextInput />
		</FormGroup>
	);
}
```
