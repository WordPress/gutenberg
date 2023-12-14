# withIsConnected

`withIsConnected` provides a true/false mobile connectivity status based on the `useNetworkConnectivity` hook.

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
