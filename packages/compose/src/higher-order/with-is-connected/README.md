# withIsConnected

`withIsConnected` provides a true/false mobile connectivity status based on the [useIsConnected hook](https://github.com/WordPress/gutenberg/blob/aadf8c66ff345b176041ad82e3793191ade5d271/packages/react-native-bridge/index.js#L193-L212).

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