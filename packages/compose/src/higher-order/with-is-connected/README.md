# withIsConnected

`withIsConnected` provides a true/false mobile connectivity status based on the `useIsConnected` hook found in the [bridge](https://github.com/WordPress/gutenberg/blob/trunk/packages/react-native-bridge/index.js).

## Usage
```jsx
/**
 * WordPress dependencies
 */
import { withIsConnected } from '@wordpress/compose';

export class MyComponent extends Component {
	if ( this.props.isConnected !== true ) {
		console.log( 'You are currently offline.' )
	}
}

export default withIsConnected( MyComponent )
```