# `useDragging`

In some situations, we want to have simple drag & drop behaviors.
Typically drag & drop behaviors follow a common pattern: We have an element that we want to drag or where we want dragging to start; the dragging starts when the `onMouseDown` event happens on the target element. When the dragging starts, global event listeners for mouse movement (`mousemove`) and the mouse up event (`mouseup`) are added. When the global mouse movement event triggers, the dragging behavior happens (e.g., a position is updated), when the mouse up event triggers, dragging stops, and both global event listeners are removed.
`useDragging` makes the implementation of the described common pattern simpler because it handles the addition and removal of global events.

## Input Object Properties

### `onDragStart`

-   Type: `Function`

The hook calls `onDragStart` when the dragging starts. The function receives as parameters the same parameters passed to `startDrag` whose documentation is available below.
If `startDrag` is passed directly as an `onMouseDown` event handler, `onDragStart` will receive the `onMouseDown` event.

### `onDragMove`

-   Type: `Function`

The hook calls `onDragMove ` after the dragging starts and when a mouse movement happens.
It receives the `mousemove` event.

### `onDragEnd`

-   Type: `Function`

The hook calls `onDragEnd` when the dragging ends. When dragging is explicitly stopped, the function receives as parameters, the same parameters passed to `endDrag` whose documentation is available below.
When dragging stops because the user releases the mouse, the function receives the `mouseup` event.

## Return Object Properties

### `startDrag`

-   Type: `Function`

A function that, when called, starts the dragging behavior. Parameters passed to this function will be passed to `onDragStart` when the dragging starts.
It is possible to directly pass `startDrag` as the `onMouseDown` event handler of some element.

### `endDrag`

-   Type: `Function`

A function that, when called, stops the dragging behavior. Parameters passed to this function will be passed to `onDragEnd` when the dragging ends.
In most cases, there is no need to call this function directly. Dragging behavior automatically stops when the mouse is released.

### `isDragging`

-   Type: `Boolean`

A boolean value, when true it means dragging is currently taking place; when false, it means dragging is not taking place.

## Usage

The following example allows us to drag & drop a red square around the entire viewport.

```jsx
/**
 * WordPress dependencies
 */
import { useState, useCallback } from 'react';
import { __experimentalUseDragging as useDragging } from '@wordpress/compose';

const UseDraggingExample = () => {
	const [ position, setPosition ] = useState( null );
	const changePosition = useCallback( ( event ) => {
		setPosition( { x: event.clientX, y: event.clientY } );
	} );
	const { startDrag } = useDragging( {
		onDragMove: changePosition,
	} );
	return (
		// eslint-disable-next-line jsx-a11y/no-static-element-interactions
		<div
			onMouseDown={ startDrag }
			style={ {
				position: 'fixed',
				width: 10,
				height: 10,
				backgroundColor: 'red',
				...( position ? { top: position.y, left: position.x } : {} ),
			} }
		/>
	);
};
```
