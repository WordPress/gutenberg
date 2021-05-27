# Divider

<div class="callout callout-alert">
This feature is still experimental. “Experimental” means this is an early implementation subject to drastic and breaking changes.
</div>

`Divider` is a layout component that separates groups of related content.

## Usage

```jsx
import { Divider, FormGroup, ListGroup } from '@wordpress/components/ui';

function Example() {
	return (
		<ListGroup>
			<FormGroup>...</FormGroup>
			<Divider />
			<FormGroup>...</FormGroup>
		</ListGroup>
	);
}
```
