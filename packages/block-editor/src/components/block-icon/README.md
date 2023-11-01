# Block Icon

The BlockIcon component provides an icon for blocks in different places in the editor: the toolbar of a selected block, the placeholders of certain blocks (gallery, image), the block insertion panel of the editor or the secondary sidebar.

The rendered an [Icon](https://github.com/WordPress/gutenberg/tree/HEAD/packages/components/src/icon) component with default styles.

![Image block icons in various places](https://make.wordpress.org/core/files/2020/08/image-block-icons-in-various-places.png)

## Table of contents

1. [Development guidelines](#development-guidelines)
2. [Related components](#related-components)

## Development guidelines

### Usage

Renders a block icon with default style.

```jsx
import { BlockIcon } from '@wordpress/block-editor';

const MyBlockIcon = () => <BlockIcon icon={ icon } />;
```

## Related components

Block Editor components are components that can be used to compose the UI of your block editor. Thus, they can only be used under a [`BlockEditorProvider`](https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/provider/README.md) in the components tree.
