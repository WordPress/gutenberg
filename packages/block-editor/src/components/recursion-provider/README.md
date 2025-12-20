# RecursionProvider

According to Gutenberg's block rendering architecture, any block type capable of recursion should be responsible for handling its own infinite loops. 

To help with detecting infinite loops on the client, the `RecursionProvider` component and the `useHasRecursion()` hook are used to identify if a block has already been rendered. 

## Usage

```jsx
/**
 * WordPress dependencies
 */
import {
	RecursionProvider,
	useHasRecursion,
	useBlockProps,
	Warning,
} from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

export default function MyRecursiveBlockEdit( { attributes: { ref } } ) {
	const hasAlreadyRendered = useHasRecursion( ref );
	const blockProps = useBlockProps( {
		className: 'my-block__custom-class',
	} );

	if ( hasAlreadyRendered ) {
		return (
			<div { ...blockProps }>
				<Warning>
					{ __( 'Block cannot be rendered inside itself.' ) }
				</Warning>
			</div>
		);
	}

	return (
		<RecursionProvider uniqueId={ ref }>
			Block editing code here....
		</RecursionProvider>
	);
}

/// ...

<MyRecursiveBlockEdit />;
```

## Props

The component accepts the following props:

### uniqueId

Any value that acts as a unique identifier for a block instance.

- Type: `any`
- Required: Yes

### children

Components to be rendered as content.

- Type: `Element`
- Required: Yes.

### blockName

Optional block name.

- Type: `String`
- Required: No
- Default: ''

# `useHasRecursion()`

Used in conjunction with `RecursionProvider`, this hook is used to identify if a block has already been rendered.

## Usage

For example usage, refer to the example above.

## Props

The component accepts the following props:

### uniqueId

Any value that acts as a unique identifier for a block instance.

- Type: `any`
- Required: Yes

### blockName

Optional block name.

- Type: `String`
- Required: No
- Default: ''

