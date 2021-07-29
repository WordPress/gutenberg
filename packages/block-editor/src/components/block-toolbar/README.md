# Block Toolbar

The `BlockToolbar` component is used to render a toolbar that serves as a wrapper for number of options for each block.

![Paragraph block toolbar](https://make.wordpress.org/core/files/2020/09/paragraph-block-toolbar.png)

![Image block toolbar](https://make.wordpress.org/core/files/2020/09/image-block-toolbar.png)

## Table of contents

1. [Development guidelines](#development-guidelines)
2. [Related components](#related-components)

## Development guidelines

### Usage

Displays a block toolbar for a selected block.

```jsx
import { BlockToolbar } from '@wordpress/block-editor';

const MyBlockToolbar = () => <BlockToolbar />;
```

## Related components

Block Editor components are components that can be used to compose the UI of your block editor. Thus, they can only be used under a [`BlockEditorProvider`](https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/provider/README.md) in the components tree.
