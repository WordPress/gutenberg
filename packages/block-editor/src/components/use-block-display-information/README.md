# useBlockDisplayInformation

Hook used to return appropriate information for display reasons.
It takes variations and custom `label` function into account.

In order to try to find a variation match we need two things:
1\. Block's client id to extract its current attributes.
2\. A block variation should have set `isActive` prop to a proper function.

Value from custom `label` function is prioritized, if that's not found
then the block variation' information is returned. If both are missing
then the information is returned from the Block Type.

If no `blockType` is found with the provided `clientId`, returns `null`.

### Usage

The hook returns an object which contains the block's title, icon, and description. If no block type is found for the provided `clientId`, it returns `null`.

```jsx
import {
	BlockIcon,
	useBlockDisplayInformation,
} from '@wordpress/block-editor';

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
