# usePrevious

Sometimes you need to get the value something had on the previous render. `usePrevious` tracks the value you pass to it using a ref, and returns the previous render's value.

## Usage

```jsx
/**
 * WordPress dependencies
 */
import { useEffect, useState } from 'react';
import { usePrevious } from '@wordpress/compose';

function MyCustomElement() {
	const [ myNumber, setMyNumber ] = useState( 5 );
	const [ lastChange, setLastChange ] = useState( 'none' );
	const prevNumber = usePrevious( myNumber );

	useEffect( () => {
		// On the first render, prevNumber will be undefined.
		if ( prevNumber !== undefined ) {
			if ( myNumber > prevNumber ) {
				setLastChange( 'up' );
			} else if ( myNumber < prevNumber ) {
				setLastChange( 'down' );
			}
		}
	}, [ myNumber ] );

	return (
		<p>
			My number is { myNumber }. Last change: { lastChange }
		</p>
	);
}
```
