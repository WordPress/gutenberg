# Block Variation Picker

<div class="callout callout-alert">
This feature is still experimental. “Experimental” means this is an early implementation subject to drastic and breaking changes.
</div>

The `BlockVariationPicker` component allows certain types of blocks to display their different variations, and to choose one of them. Variations provided are usually filtered by their inclusion of the `block` value in their `scope` attribute.

This component is currently used by "Columns" and "Query Loop" blocks.

![Columns block variations](https://make.wordpress.org/core/files/2020/09/colums-block-variations.png)

## Development guidelines

### Usage

Renders the variations of a block.

```jsx
import { useSelect } from '@wordpress/data';
import {
	__experimentalBlockVariationPicker as BlockVariationPicker
} from '@wordpress/block-editor';
import { store as blocksStore } from '@wordpress/blocks';

const MyBlockVariationPicker = ( { blockName } ) => {
	const variations = useSelect(
		( select ) => {
			const { getBlockVariations } = select( blocksStore );
			return getBlockVariations( blockName, 'block' );
		},
		[ blockName ]
	);
	return <BlockVariationPicker variations={ variations } />;
};
```

### Props

#### `label`

-   Type: `String`
-   Required: No
-   Default: `Choose variation`

The label of each variation of the block.

#### `instructions`

-   Type: `String`
-   Required: No
-   Default: `Select a variation to start with.`

The instructions to choose a block variation.

#### `variations`

-   Type: `Array<WPBlockVariation>`

The different variations of the block.

#### `onSelect`

-   Type: `Function`

Callback called when a block variation is selected. It receives the selected variation as a parameter.

#### `icon`

-   Type: `Icon component`
-   Required: No
-   Default: `layout`

Icon to be displayed at the top of the component before the `label`.

## Related components

Block Editor components are components that can be used to compose the UI of your block editor. Thus, they can only be used under a [BlockEditorProvider](https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/provider/README.md) in the components tree.
