# Block Parent Selector

Block parent selector component displays the hierarchy of the current block selection as a single icon to "go up" a level. The parent selector icon appears when hovering over the icon of the selected block. In addition, it appears only if the selected block in question has a parent.

A click on the selector triggers the selection of the parent block.

In practice the BlockParentSelector component renders a <ToolbarButton /> component that contains the parent selector icon.

![Block parent selector test](https://make.wordpress.org/core/files/2020/09/block-parent-selector-test.gif)

## Table of contents

1. [Development guidelines](#development-guidelines)
2. [Related components](#related-components)

## Development guidelines

### Usage

Renders block parent selector icon in a <ToolbarButton /> component.

```jsx
import { BlockParentSelector } from '@wordpress/block-editor';

const MyBlockParentSelector = () => (
	<BlockParentSelector clientIds={ blockClientIds } />
);
```

### Props

#### clientIds

Blocks IDs

-   Type: `Array`

## Related components

Block Editor components are components that can be used to compose the UI of your block editor. Thus, they can only be used under a [BlockEditorProvider](https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/provider/README.md) in the components tree.
