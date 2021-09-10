# `useFocusReturn`

When opening modals/sidebars/dialogs, the focus must move to the opened area and return to the previously focused element when closed. The current hook implements the returning behavior.

## Return Object Properties

### `ref`

-   Type: `Function`

A function reference that must be passed to the DOM element being mounted and which needs to return the focus to its original position when unmounted.

## Usage

```jsx
import { useFocusReturn } from '@wordpress/compose';

const WithFocusReturn = () => {
	const ref = useFocusReturn();
	return (
		<div ref={ ref }>
			<Button />
			<Button />
		</div>
	);
};
```
