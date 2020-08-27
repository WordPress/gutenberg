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
<BlockMover clientIds={ [ clientId ] } />
```

### Props

#### isFirst

Whether the block is the first block in the editor. If `true` the block can not be moved up; and then the mover button rendered by `<BlockMoverUpButton`/> is disabled.

-   Type: `Boolean`
-   Required: `No`

#### isLast

Whether the block is the last block in the editor. If `false` the block can not be moved down; ; and then the mover button rendered by `<BlockMoverDownButton`/> is disabled.

-   Type: `Boolean`
-   Required: `No`

If both **isFirst** and **isLast** are set to `true`, that means that the block is the only block in the editor; and can not be moved.

#### clientIds

Blocks IDs

-   Type: `Array`

#### isLocked

Whether the block is locked. If set to `true` the block can not be moved.

-   Type: `Boolean`
-   Required: `No`
-   Default: `False`


#### isHidden

#### rootClientId

#### orientation

The orientation of the block movers, vertical or horizontal.

-   Type: `String`
-   Required: `No`


## Related components
Block Editor components are components that can be used to compose the UI of your block editor. Thus, they can only be used under a [BlockEditorProvider](https://github.com/WordPress/gutenberg/blob/master/packages/block-editor/src/components/provider/README.md) in the components tree.