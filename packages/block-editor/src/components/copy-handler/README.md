# Copy Handler

The `CopyHandler` component handles the copy/cut and paste events of its children blocks. It handles multiple selection of blocks as well.

Concretely, it handles the display of success messages and takes care of copying the block to the clipboard. It uses for that the [serialize function](https://github.com/WordPress/gutenberg/blob/HEAD/packages/blocks/src/api/serializer.js), which outputs HTML augmented with the HTML-comment demarcations to denote blocks.

![Copy/cut behaviours](https://user-images.githubusercontent.com/150562/81698101-6e341d80-945d-11ea-9bfb-b20781f55033.gif)

## Table of contents

- [Copy Handler](#copy-handler)
	- [Table of contents](#table-of-contents)
	- [Development guidelines](#development-guidelines)
		- [Usage](#usage)
		- [Props](#props)
		- [`children`](#children)
	- [Related components](#related-components)

## Development guidelines

### Usage

Adds block-level copy-and-paste support to the editor.

```jsx
import { BlockList, CopyHandler } from '@wordpress/block-editor';

const MyCopyHandler = () => (
	<CopyHandler>
		<BlockList />
	</CopyHandler>
);
```

_Note:_ The `CopyHandler` only catches copy/cut and paste events coming from its props.children. In this example, the child is the `BlockList` component. These events are intercepted only when there is a block-editing context and at least one block is currently selected.

### Props

### `children`

-   Type: `Element`

The elements to be rendered and whose `cut`, `copy` and `paste` events we'd like to intercept.

## Related components

Block Editor components are components that can be used to compose the UI of your block editor. Thus, they can only be used under a [`BlockEditorProvider`](https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/provider/README.md) in the components tree.
