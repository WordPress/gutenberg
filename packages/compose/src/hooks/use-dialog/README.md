# `useDialog`

React hook to be used on a dialog wrapper to enable the following behaviors:

-   constrained tabbing.
-   focus on mount.
-   return focus on unmount.
-   focus outside.

## Returned value

The hooks returns an array composed of the two following values:

### `ref`

-   Type: `Object|Function`

A React ref that must be passed to the DOM element where the behavior should be attached.

### `props`

-   Type: `Object`

Extra props to apply to the wrapper.

## Usage

```jsx
import { __experimentalUseDialog as useDialog } from '@wordpress/compose';

const MyDialog = () => {
	const [ ref, extraProps ] = useDialog( {
		onClose: () => console.log( 'do something to close the dialog' ),
	} );

	return (
		<div ref={ ref } { ...extraProps }>
			<Button />
			<Button />
		</div>
	);
};
```
