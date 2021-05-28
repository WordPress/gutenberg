# Block mover

Block movers allow moving blocks inside the editor using up and down buttons.

![Block mover screenshot](https://make.wordpress.org/core/files/2020/08/block-mover-screenshot.png)

## Table of contents

1. [Development guidelines](#development-guidelines)
2. [Related components](#related-components)

## Development guidelines

### Usage

Shows the block mover buttons in the block toolbar.

```jsx
import { BlockMover } from '@wordpress/block-editor';
const MyMover = () => <BlockMover clientIds={ [ clientId ] } />;
```

### Props

#### clientIds

Blocks IDs

-   Type: `Array`

## Related components

Block Editor components are components that can be used to compose the UI of your block editor. Thus, they can only be used under a [BlockEditorProvider](https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/provider/README.md) in the components tree.
