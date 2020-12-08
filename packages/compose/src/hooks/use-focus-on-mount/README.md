`useFocusOnMount`
=================

Hook used to focus the first tabbable element on mount.

## Return Object Properties

### `ref`

- Type: `Function`

A function reference that must be passed to the DOM element where constrained tabbing should be enabled.

## Usage

```jsx
import { useFocusOnMount } from '@wordpress/compose';

const WithFocusOnMount = () => {
	const ref = useFocusOnMount()
	return (
		<div ref={ ref }>
			<Button />
			<Button />
		</div> 
	);
};
```
