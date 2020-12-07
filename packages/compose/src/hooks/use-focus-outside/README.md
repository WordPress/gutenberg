`useFocusOutsidde`
======================

A react hook that can be used to be notified when the focus moves out of a given container.

## Arguments

### `onFocusOtuside`

- Type: `Function`

A function to be called when the focus moves outside of the container.

## Return Object Properties

### `ref`

- Type: `Function`

A React ref to be used on the element to monitor.

## Usage

```jsx
import { useFocusOutside } from '@wordpress/compose';

const WithFocusOutside = () => {
	const ref = useFocusOutside( () => {
		console.log( 'The focus moved out of the ref container' );
	} );

	return (
		<div ref={ref}>
			Something
		</div> 
	);
};
```