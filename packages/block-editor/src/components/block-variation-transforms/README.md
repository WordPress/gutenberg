# Block Variation Transforms

This component allows to display the selected block's variations which have the `transform` option set in `scope` property and to choose one of them.

By selecting such a variation an update to the selected block's attributes happen, based on the variation's attributes.

## Development guidelines

### Usage

Renders the block's variations which have the `transform` option set in `scope` property.

```jsx
import { useSelect } from '@wordpress/data';
import { __experimentalBlockVariationTransforms as BlockVariationTransforms } from '@wordpress/block-editor';

const MyBlockVariationTransforms = () => {
	const { selectedBlockClientId } = useSelect( ( select ) => {
		const { getSelectedBlockClientId } = select( 'core/block-editor' );
		return {
			selectedBlockClientId: getSelectedBlockClientId(),
		};
	} );

	return <BlockVariationTransforms blockClientId={ selectedBlockClientId } />;
};
```

### Props

#### blockClientId

The block's client id.

-   Type: `string`

## Related components

Block Editor components are components that can be used to compose the UI of your block editor. Thus, they can only be used under a [BlockEditorProvider](https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/provider/README.md) in the components tree.
