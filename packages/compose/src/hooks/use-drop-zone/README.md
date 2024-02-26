# useDropZone (experimental)

A hook to facilitate drag and drop handling within a designated drop zone area. An optional `dropZoneElement` can be provided, however by default the drop zone is bound by the area where the returned `ref` is assigned.

When using a `dropZoneElement`, it is expected that the `ref` will be attached to a node that is a descendent of the `dropZoneElement`. Additionally, the element passed to `dropZoneElement` should be stored in state rather than a plain ref to ensure reactive updating when it changes.

## Usage

```js
import { useState } from 'react';
import { useDropZone } from '@wordpress/compose';

const WithWrapperDropZoneElement = () => {
	const [ dropZoneElement, setDropZoneElement ] = useState( null );

	const dropZoneRef = useDropZone(
		{
			dropZoneElement,
			onDrop() => {
				console.log( 'Dropped within the drop zone.' );
			},
			onDragEnter() => {
				console.log( 'Dragging within the drop zone' );
			}
		}
	)

	return (
		<div className="outer-wrapper" ref={ setDropZoneElement }>
			<div ref={ dropZoneRef }>
				<p>Drop Zone</p>
			</div>
		</div>
	);
};

const WithoutWrapperDropZoneElement = () => {
	const dropZoneRef = useDropZone(
		{
			onDrop() => {
				console.log( 'Dropped within the drop zone.' );
			},
			onDragEnter() => {
				console.log( 'Dragging within the drop zone' );
			}
		}
	)

	return (
		<div ref={ dropZoneRef }>
			<p>Drop Zone</p>
		</div>
	);
};
```

## Parameters

-   _props_ `Object`: Named parameters.
-   _props.dropZoneElement_ `HTMLElement`: Optional element to be used as the drop zone.
-   _props.isDisabled_ `boolean`: Whether or not to disable the drop zone.
-   _props.onDragStart_ `( e: DragEvent ) => void`: Called when dragging has started.
-   _props.onDragEnter_ `( e: DragEvent ) => void`: Called when the zone is entered.
-   _props.onDragOver_ `( e: DragEvent ) => void`: Called when the zone is moved within.
-   _props.onDragLeave_ `( e: DragEvent ) => void`: Called when the zone is left.
-   _props.onDragEnd_ `( e: MouseEvent ) => void`: Called when dragging has ended.
-   _props.onDrop_ `( e: DragEvent ) => void`: Called when dropping in the zone.

_Returns_

-   `RefCallback< HTMLElement >`: Ref callback to be passed to the drop zone element.
