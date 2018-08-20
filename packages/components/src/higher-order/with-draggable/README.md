# withDraggable

`withDraggable` is a Higher-Order Component that provides a way to set up a cross-browser (including IE) customisable drag image, and the transfer data for the drag event. It decouples the drag handle and the element to drag: it wraps the component that will be the drag handle, and it should be provided the DOM ID of the element to drag.

Note that the drag handle needs to declare the `draggable="true"` property. The `withDraggable` component only takes care of the logic to setup the drag image and the transfer data, but is not concerned with creating an actual DOM element that is draggable.

## Props

The component injects the following props into the wrapped component:

### initDragging

A function that initializes the drag event, setting up the transfer data and creating the drag image. It returns a function to be called on the `dragstart` DOM event.

- Type: `Function`
- Required: Yes
- Arguments:
	- `elementId`: DOM id of the element to be dragged
	- `data`: the [data](https://developer.mozilla.org/en-US/docs/Web/API/DragEvent/dataTransfer) to be transfered by the event

## Usage

```jsx
import { Dashicon, Panel, PanelBody, withDraggable } from '@wordpress/components';

const MyDraggable = ( { initDragging } ) => (
	<div id="draggable-panel">
		<Panel header="Draggable panel" >
			<PanelBody>
					<Dashicon
						icon="move"
						draggable="true"
						onDragStart={ initDragging( "draggable-panel", {} ) } />
			</PanelBody>
		</Panel>
	</div>
);

export default withDraggable( MyDraggable );
```

If the wrapped element would want to inject their own logic into the `dragstart` event, it should initialize the `initDragging` prop provided by `withDraggable` in that event handler. For example:

```jsx

import { Dashicon, Panel, PanelBody, withDraggable } from '@wordpress/components';

const class MyDraggable extends Component {

	constructor() {
		super( ...arguments );
		this.myDragStart = this.myDragStart.bind( this );
	}

	myDragStart( event ){
		this.props.initDragging( 'draggable-panel', {} )( event );

		// can do whatever is necessary after the event has been set up
	}

	render( ) {
		return (
			<div id="draggable-panel">
				<Panel header="Draggable panel" >
					<PanelBody>
						<Dashicon
							icon="move"
							draggable="true"
							onDragStart={ myDragStart }
							/>
					</PanelBody>
				</Panel>
			</div>
		);
	}
}

export default withDraggable( MyDraggable );
```