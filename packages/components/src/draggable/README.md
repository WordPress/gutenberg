# Draggable

`Draggable` is a Component that provides a way to set up a cross-browser (including IE) customizable drag image and the transfer data for the drag event. It decouples the drag handle and the element to drag: use it by wrapping the component that will become the drag handle and providing the DOM ID of the element to drag.

Note that the drag handle needs to declare the `draggable="true"` property and bind the `Draggable`s `onDraggableStart` and `onDraggableEnd` event handlers to its own `onDragStart` and `onDragEnd` respectively. `Draggable` takes care of the logic to setup the drag image and the transfer data, but is not concerned with creating an actual DOM element that is draggable.

## Props

The component accepts the following props:

### `appendToOwnerDocument`: `boolean`

Whether to append the cloned element to the `ownerDocument` body. By default, elements sourced by id are appended to the element's wrapper.

-   Required: No
-   Default: `false`

### `elementId`: `string`

The HTML id of the element to clone on drag.

-   Required: Yes

### `onDragEnd`: `( event: DragEvent ) => void`

A function called when dragging ends. This callback receives the `event` object from the `dragend` event as its first parameter.

-   Required: No
-   Default: `noop`

### `onDragOver`: `( event: DragEvent ) => void`

A function called when the element being dragged is dragged over a valid drop target. This callback receives the `event` object from the `dragover` event as its first parameter.

-   Required: No
-   Default: `noop`

### `onDragStart`: `( event: DragEvent ) => void`

A function called when dragging starts. This callback receives the `event` object from the `dragstart` event as its first parameter.

-   Required: No
-   Default: `noop`

### `transferData`: `unknown`

Arbitrary data object attached to the drag and drop event.

-   Required: Yes

## Usage

```jsx
import { Draggable, Panel, PanelBody } from '@wordpress/components';
import { Icon, more } from '@wordpress/icons';

const MyDraggable = () => (
	<div id="draggable-panel">
		<Panel header="Draggable panel">
			<PanelBody>
				<Draggable elementId="draggable-panel" transferData={ {} }>
					{ ( { onDraggableStart, onDraggableEnd } ) => (
						<div
							className="example-drag-handle"
							draggable
							onDragStart={ onDraggableStart }
							onDragEnd={ onDraggableEnd }
						>
							<Icon icon={ more } />
						</div>
					) }
				</Draggable>
			</PanelBody>
		</Panel>
	</div>
);
```

In case you want to call your own `dragstart` / `dragend` event handlers as well, you can pass them to `Draggable` and it'll take care of calling them after their own:

```jsx
import { Draggable, Panel, PanelBody } from '@wordpress/components';
import { Icon, more } from '@wordpress/icons';

const MyDraggable = ( { onDragStart, onDragEnd } ) => (
	<div id="draggable-panel">
		<Panel header="Draggable panel">
			<PanelBody>
				<Draggable
					elementId="draggable-panel"
					transferData={ {} }
					onDragStart={ onDragStart }
					onDragEnd={ onDragEnd }
				>
					{ ( { onDraggableStart, onDraggableEnd } ) => (
						<div
							className="example-drag-handle"
							draggable
							onDragStart={ onDraggableStart }
							onDragEnd={ onDraggableEnd }
						>
							<Icon icon={ more } />
						</div>
					) }
				</Draggable>
			</PanelBody>
		</Panel>
	</div>
);
```
