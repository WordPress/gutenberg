# BlockMover

BlockMover component allows moving blocks inside the editor using up and down buttons.

![Block mover screenshot](https://make.wordpress.org/core/files/2020/08/block-mover-screenshot.png)

## Usage

Shows the block mover buttons in the block toolbar.

```jsx
import { BlockMover } from '@wordpress/block-editor';
const MyMover = () => <BlockMover clientIds={ [ clientId ] } />;
```

## Props

### clientIds

The IDs of the blocks to move.

-   Type: `Array`
-   Required: Yes

### hideDragHandle

If this property is true, the drag handle is hidden.

-   Type: `boolean`
-   Required: No
-   Default: `false`

## Related components

Block Editor components are components that can be used to compose the UI of your block editor. Thus, they can only be used under a [BlockEditorProvider](https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/provider/README.md) in the components tree.
