# Block navigation

The BlockNavigation component provides an overview of the hierarchical structure of all blocks in the editor. The blocks are presented vertically one below the other.

Blocks that have child blocks (such as group or column blocks) are presented with the parent at the top and the nested children below.

In addition to presenting the structure of the blocks in the editor, the BlockNavigation component lets users navigate to each block by clicking on its line in the hierarchy tree.

![Block navigation](https://make.wordpress.org/core/files/2020/08/block-navigation.png)
![View of a group block navigation](https://make.wordpress.org/core/files/2020/08/view-of-group-block-navigation.png)

## Table of contents

1. [Development guidelines](#development-guidelines)
2. [Related components](#related-components)

## Development guidelines

### Usage

Renders a block navigation with default syles.

```jsx
import { BlockNavigation } from '@wordpress/block-editor';

const MyNavigation = () => <BlockNavigation onSelect={ onClose } />;
```

## Related components

Block Editor components are components that can be used to compose the UI of your block editor. Thus, they can only be used under a [BlockEditorProvider](https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/provider/README.md) in the components tree.
