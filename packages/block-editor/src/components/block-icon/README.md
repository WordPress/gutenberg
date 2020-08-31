# Block Icon

The BlockIcon component provides an icon for blocks in different places in the editor: the toolbar of a selected block, the placeholders of certain blocks (gallery, image), the block insertion panel of the editor or the left sidebar.

The rendered an [Icon](https://github.com/WordPress/gutenberg/tree/master/packages/components/src/icon) component with default styles.

![Image block icons in various places](https://make.wordpress.org/core/files/2020/08/image-block-icons-in-various-places.png)

## Table of contents

1. [Development guidelines](#development-guidelines)
2. [Related components](#related-components)


## Development guidelines

### Usage

Renders a block icon with default style.

```jsx
import { BlockIcon } from '@wordpress/block-editor';

const MyIcon = () => <BlockIcon />;
```
