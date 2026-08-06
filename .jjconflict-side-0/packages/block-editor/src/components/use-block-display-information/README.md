# useBlockDisplayInformation

A React Hook that tries to find a matching block variation and returns the appropriate information for display reasons. In order to try to find a match we need two things:

1. Block's client id to extract its current attributes.
2. A block variation has `isActive` prop defined with a matcher function.

If for any reason a block variaton match cannot be found, the returned information come from the Block Type.

### Usage

The hook returns an object which contains the block's title, icon, and description. If no block type is found for the provided `clientId`, it returns `null`.

```jsx
import { BlockIcon, useBlockDisplayInformation } from '@wordpress/block-editor';

function DemoBlockCard( { clientId } ) {
	const blockInformation = useBlockDisplayInformation( clientId );
	const { title, icon, description } = blockInformation;
	return (
		<div>
			<BlockIcon icon={ icon } showColors />
			<h1>{ title }</h1>
			<p>{ description }</p>
		</div>
	);
}
```

## Props

The hook accepts the following props.

### clientId

A block's clientId

-   Type: `String`
-   Required: Yes
