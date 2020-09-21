# Copy Handler

The `CopyHandler` component handles the copy, cut and paste events of its children blocks. It handles multiple selection of blocks as well.

Concretely, it handles the display of success messages and takes care of copying the block to the clipboard using the [raw handling API](https://github.com/WordPress/gutenberg/tree/master/packages/blocks/src/api/raw-handling).

![Copy cut behaviours](https://make.wordpress.org/core/files/2020/09/copy-cut-behaviour.gif)

## Table of contents

1. [Development guidelines](#development-guidelines)
2. [Related components](#related-components)

## Development guidelines

### Usage

Adds the copy handler functionnalities to the editor.

```jsx
import { BlockList, CopyHandler } from '@wordpress/block-editor';

const MyCopyHandler = () => (
	<CopyHandler>
		<BlockList />
	</CopyHandler>
);
```

_Note:_ The `CopyHandler` only catch cut, copy and paste events coming from its props.children. In this example, the child is the `BlockList` component.

### Props

### `children`

-  Type: `Element`

Children are passed as children of `CopyHandler`.

## Related components

Block Editor components are components that can be used to compose the UI of your block editor. Thus, they can only be used under a [`BlockEditorProvider`](https://github.com/WordPress/gutenberg/blob/master/packages/block-editor/src/components/provider/README.md) in the components tree.
