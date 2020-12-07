`useConstrainedTabbing`
======================

In Dialogs/modals, the tabbing must be constrained to the content of the wrapper element. To achieve this behavior you can use the `useConstrainedTabbing` hook.

## Input Object Properties

## Return Object Properties

### `ref`

- Type: `Function`

A function reference that must be passed to the DOM element where constrained tabbing should be enabled.

## Usage
The following example allows us to drag & drop a red square around the entire viewport.

```jsx
/**
 * WordPress dependencies
 */
import { useConstrainedTabbing } from '@wordpress/compose';


const ConstrainedTabbingExample = () => {
	const constrainedTabbingRef = useConstrainedTabbing()
	return (
		// eslint-disable-next-line jsx-a11y/no-static-element-interactions
		<div
			ref={constrainedTabbingRef}
        >
            <Button />
            <Button />
        </div> 
	);
};
```
