# Block Variation Transforms

This component allows to display the selected block's variations which have the `transform` option set in `scope` property and to choose one of them.

By selecting such a variation an update to the selected block's attributes happen, based on the variation's attributes.

## Table of contents

1. [Development guidelines](#development-guidelines)
2. [Related components](#related-components)

## Development guidelines

### Usage

Renders the selected block's variations which have the `transform` option set in `scope` property.

```jsx
import { useSelect } from '@wordpress/data';
import {
	__experimentalBlockVariationTransforms as BlockVariationTransforms,
} from '@wordpress/block-editor';

const MyBlockVariationTransforms = () => {
	const { selectedBlockName, selectedBlockClientId } = useSelect(
		( select ) => {
			const { getSelectedBlockClientId, getBlockName } = select(
				'core/block-editor'
			);
			const _selectedBlockClientId = getSelectedBlockClientId();
			const _selectedBlockName =
				_selectedBlockClientId &&
				getBlockName( _selectedBlockClientId );
			return {
				selectedBlockName: _selectedBlockName,
				selectedBlockClientId: _selectedBlockClientId,
			};
		}
	);

	return (
		<BlockVariationTransforms
			blockName={ selectedBlockName }
			selectedBlockClientId={ selectedBlockClientId }
		/>
	);
};
```

### Props

#### blockName

The selected block's name.

- Type: `string`


#### selectedBlockClientId

The selected block's client id.

- Type: `string`

## Related components

Block Editor components are components that can be used to compose the UI of your block editor. Thus, they can only be used under a [BlockEditorProvider](https://github.com/WordPress/gutenberg/blob/master/packages/block-editor/src/components/provider/README.md) in the components tree.
