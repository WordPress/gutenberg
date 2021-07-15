# Block Variation Picker

The `BlockVariationPicker` component allows to display for certain types of blocks their different variations, and to choose one of them.

This component is currently used by the "Columns" block to display and choose the number and structure of columns. It is also used by the "Post Hierarchical Terms Block" block.

![Columns block variations](https://make.wordpress.org/core/files/2020/09/colums-block-variations.png)

## Table of contents

1. [Development guidelines](#development-guidelines)
2. [Related components](#related-components)

## Development guidelines

### Usage

Renders the variations of a block.

```jsx
import { BlockVariationPicker } from '@wordpress/block-editor';

const MyBlockVariationPicker = () => (
	<BlockVariationPicker variations={ variations } />
);
```

### Props

#### label

The label of each variation of the block.

-   Type: `String`

#### instructions

The instructions to choose a block variation.

-   Type: `String`

#### variations

-   Type: `Array`

The different variations of the block.

## Related components

Block Editor components are components that can be used to compose the UI of your block editor. Thus, they can only be used under a [BlockEditorProvider](https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/provider/README.md) in the components tree.
