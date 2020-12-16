# useBlockDisplayInformation

A React Hook that tries to find a matching block variation and returns the appropriate information for display reasons. In order to try to find a match we need to things:

1. Block's client id to extract it's current attributes.
2. A block variation should have set `isActive` prop to a proper function.

If for any reason a block variaton match cannot be found, the returned information come from the Block Type.

Note that this is currently experimental, and is available as `__experimentalUseBlockDisplayInformation`.

### Usage

The hook returns an object which contains block's title, icon and description. If no blockType is found with the provided `clientId`, returns `null`.

```jsx
import {
	BlockIcon,
	__experimentalUseBlockDisplayInformation as useBlockDisplayInformation,
} from '@wordpress/block-editor';

function DemoBlockCard( { clientId } ) {
	const blockInformation = useBlockDisplayInformation( clientId );
	const { title, icon, description } = blockInformation;
	return (
		<div style={ resizeStyles }>
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
