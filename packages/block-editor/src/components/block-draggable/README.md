# Block Draggable

Block Draggable is a block-specific implementation of a `<Draggable>` which defines behaviour for dragged elements in a block editor context, including (but not limited to):

-   determining whether the given block(s) can be moved.
-   setting information on the [`transferData` object](https://developer.mozilla.org/en-US/docs/Web/API/DataTransfer).
-   (optionally) setting the `target` dropzones with which this draggable is compatible.
-   displaying a suitable "chip" during the drag operation.
-   managing scrolling during the drag.

Note that the majority of the behaviour is delegated to `Draggable` from `@wordpress/components`.

## Usage

```js
import { BlockDraggable } from '@wordpress/block-editor';

function MyComponent() {
	return <BlockDraggable clientIds={ clientIds } />;
}
```

## Props

### clientIds

-   Type: `Array`
-   Required: Yes

Blocks IDs of candidates to be dragged.

### targets

-   Type: `Array[string]`
-   Required: No

A list of dropzone names that this draggable considers valid drop targets. If provided then it will only be possible to drop the draggable in a _named_ dropzone that is included in the list.

### `children`

-   Type: Function
-   Required: No

Component children as a function. The function receives the following arguments:

-   `draggable` - whether or not the block(s) are deemed to be draggable.
-   `onDragStart` (optional) - an event handler to be passed as the `onDragStart` event prop of any child node.
-   `onDragEnd` - an event handler to be passed as the `onDragEnd` event prop of any child node.

See [`Draggable`](./packages/components/src/draggable/README.md) for more information.

### cloneClassname

-   Type: `string`
-   Required: No

A className to be passed to the clone of the draggable.

### `onDragStart`

-   Type: Function
-   Required: No

A function to be called on the `ondragstart` event.

### `onDragEnd`

-   Type: Function
-   Required: No

A function to be called on the `ondragend` event.
