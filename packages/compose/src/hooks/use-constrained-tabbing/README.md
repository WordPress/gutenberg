# `useConstrainedTabbing`

In Dialogs/modals, the tabbing must be constrained to the content of the wrapper element. To achieve this behavior you can use the `useConstrainedTabbing` hook.

## Return Object Properties

### `ref`

-   Type: `Object|Function`

A function reference that must be passed to the DOM element where constrained tabbing should be enabled.

## Usage

```jsx
import { useConstrainedTabbing } from '@wordpress/compose';

const ConstrainedTabbingExample = () => {
	const ref = useConstrainedTabbing();
	return (
		<div ref={ ref }>
			<Button />
			<Button />
		</div>
	);
};
```
