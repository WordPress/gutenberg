# BlockVerticalAlignmentControl

`BlockVerticalAlignmentControl` is a simple component designed to provide _vertical_ alignment UI controls for use within the editor `BlockControls` toolbar.

This builds upon similar patterns to the [`BlockAlignmentControl`](https://github.com/WordPress/gutenberg/tree/HEAD/packages/editor/src/components/block-alignment-control) but is focused on vertical alignment only.

## Usage

In a block's `edit` implementation, render a `<BlockControls />` component. Then inside of this add the `<BlockVerticalAlignmentControl />` where required.

```jsx
import { registerBlockType } from '@wordpress/blocks';
import {
	BlockControls,
	BlockVerticalAlignmentControl,
	useBlockProps,
} from '@wordpress/block-editor';

registerBlockType( 'my-plugin/my-block', {
	// ...

	attributes: {
		// other attributes here
		// ...

		verticalAlignment: {
			type: 'string',
		},
	},

	edit( { attributes, setAttributes } ) {
		const blockProps = useBlockProps();

		const { verticalAlignment } = attributes;

		// Change handler to set Block `attributes`
		const onChange = ( alignment ) =>
			setAttributes( { verticalAlignment: alignment } );

		return (
			<>
				<BlockControls group="block">
					<BlockVerticalAlignmentControl
						onChange={ onChange }
						value={ verticalAlignment }
					/>
				</BlockControls>
				<div { ...blockProps }>// your Block here</div>
			</>
		);
	},
} );
```

_Note:_ by default if you do not provide an initial `value` prop for the current alignment value, then no value will be selected (ie: there is no default alignment set).

_Note:_ the user can repeatedly click on the toolbar buttons to toggle the alignment values on/off. This is handled within the component.

## Props

### `value`

-   **Type:** `String`
-   **Default:** `undefined`
-   **Options:**: `top`, `center`, `bottom`

The current value of the alignment setting. You may only choose from the `Options` listed above.

### `onChange`

-   **Type:** `Function`

A callback function invoked when the toolbar's alignment value is changed via an interaction with any of the toolbar's buttons. Called with the new alignment value (ie: `top`, `center`, `bottom`, `undefined`) as the only argument.

Note: the value may be `undefined` if the user has toggled the component "off".

```js
const onChange = ( alignment ) =>
	setAttributes( { verticalAlignment: alignment } );
```

## Examples

The [Core Columns](https://github.com/WordPress/gutenberg/tree/HEAD/packages/block-library/src/columns) Block utilises the `BlockVerticalAlignmentControl`.
