withSafeInterval
===============

`withSafeInterval` is a React [higher-order component](https://facebook.github.io/react/docs/higher-order-components.html) which provides a special version of `window.setInterval` which respects the original component's lifecycle. Simply put, a function set to be called in the future via `setInterval` will never be called if the original component instance ceases to exist in the meantime.

## Usage

```jsx
/**
 * WordPress dependencies
 */
import { withSafeInterval } from '@wordpress/compose';

function MyEffectfulComponent( { setInterval } ) {
	return (
		<Button
			onClick={ () => {
				setInterval( intervalAction, 1000 );
			} }
		/>
	);
}

export default withSafeInterval( MyEffectfulComponent );
```
