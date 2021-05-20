# useInstanceId

Some components need to generate a unique id for each instance. This could serve as suffixes to element ID's for example. `useInstanceId` provides a unique `instanceId` to serve this purpose.

## Usage

```jsx
/**
 * WordPress dependencies
 */
import { useInstanceId } from '@wordpress/compose';

function MyCustomElement() {
	const instanceId = useInstanceId( MyCustomElement );
	return <div id={ `my-custom-element-${ instanceId }` }>content</div>;
}
```
