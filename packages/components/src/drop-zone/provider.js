/**
 * External dependencies
 */
import { find, some, filter, includes, throttle } from 'lodash';

/**
 * WordPress dependencies
 */
import { createContext, useRef, useContext } from '@wordpress/element';
import { getFilesFromDataTransfer } from '@wordpress/dom';
import isShallowEqual from '@wordpress/is-shallow-equal';
import { useRefEffect } from '@wordpress/compose';

export const Context = createContext();

const { Provider } = Context;

function getDragEventType( { dataTransfer } ) {
	if ( dataTransfer ) {
		// Use lodash `includes` here as in the Edge browser `types` is implemented
		// as a DomStringList, whereas in other browsers it's an array. `includes`
		// happily works with both types.
		if (
			includes( dataTransfer.types, 'Files' ) ||
			getFilesFromDataTransfer( dataTransfer ).length > 0
		) {
			return 'file';
		}

		if ( includes( dataTransfer.types, 'text/html' ) ) {
			return 'html';
		}
	}

	return 'default';
}

function isTypeSupportedByDropZone( type, dropZone ) {
	return Boolean(
		( type === 'file' && dropZone.onFilesDrop ) ||
			( type === 'html' && dropZone.onHTMLDrop ) ||
			( type === 'default' && dropZone.onDrop )
	);
}

function isWithinElementBounds( element, x, y ) {
	const rect = element.getBoundingClientRect();
	/// make sure the rect is a valid rect
	if ( rect.bottom === rect.top || rect.left === rect.right ) {
		return false;
	}

	return (
		x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom
	);
}

function getPosition( event ) {
	// In some contexts, it may be necessary to capture and redirect the
	// drag event (e.g. atop an `iframe`). To accommodate this, you can
	// create an instance of CustomEvent with the original event specified
	// as the `detail` property.
	//
	// See: https://developer.mozilla.org/en-US/docs/Web/Guide/Events/Creating_and_triggering_events
	const detail =
		window.CustomEvent && event instanceof window.CustomEvent
			? event.detail
			: event;

	return { x: detail.clientX, y: detail.clientY };
}

function getHoveredDropZone( dropZones, position, dragEventType ) {
	const hoveredDropZones = filter(
		Array.from( dropZones ),
		( dropZone ) =>
			isTypeSupportedByDropZone( dragEventType, dropZone ) &&
			isWithinElementBounds(
				dropZone.element.current,
				position.x,
				position.y
			)
	);

	// Find the leaf dropzone not containing another dropzone
	return find( hoveredDropZones, ( zone ) => {
		const container = zone.isRelative
			? zone.element.current.parentElement
			: zone.element.current;

		return ! some(
			hoveredDropZones,
			( subZone ) =>
				subZone !== zone &&
				container.contains( subZone.element.current )
		);
	} );
}

export const INITIAL_DROP_ZONE_STATE = {
	isDraggingOverDocument: false,
	isDraggingOverElement: false,
	x: null,
	y: null,
	type: null,
};

export function useDrop() {
	const dropZones = useContext( Context );

	return useRefEffect(
		( node ) => {
			const { ownerDocument } = node;
			const { defaultView } = ownerDocument;

			let lastRelative;

			function updateDragZones( event ) {
				if ( lastRelative && lastRelative.contains( event.target ) ) {
					return;
				}

				const dragEventType = getDragEventType( event );
				const position = getPosition( event );
				const hoveredDropZone = getHoveredDropZone(
					dropZones,
					position,
					dragEventType
				);

				if ( hoveredDropZone && hoveredDropZone.isRelative ) {
					lastRelative = hoveredDropZone.element.current.offsetParent;
				} else {
					lastRelative = null;
				}

				// Notifying the dropzones
				dropZones.forEach( ( dropZone ) => {
					const isDraggingOverDropZone = dropZone === hoveredDropZone;
					const newState = {
						isDraggingOverDocument: isTypeSupportedByDropZone(
							dragEventType,
							dropZone
						),
						isDraggingOverElement: isDraggingOverDropZone,
						x:
							isDraggingOverDropZone && dropZone.withPosition
								? position.x
								: null,
						y:
							isDraggingOverDropZone && dropZone.withPosition
								? position.y
								: null,
						type: isDraggingOverDropZone ? dragEventType : null,
					};

					dropZone.setState( ( state ) => {
						if ( isShallowEqual( state, newState ) ) {
							return state;
						}

						return newState;
					} );
				} );

				event.preventDefault();
			}

			const throttledUpdateDragZones = throttle( updateDragZones, 200 );

			function onDragOver( event ) {
				throttledUpdateDragZones( event );
				event.preventDefault();
			}

			function resetDragState() {
				// Avoid throttled drag over handler calls
				throttledUpdateDragZones.cancel();

				dropZones.forEach( ( dropZone ) =>
					dropZone.setState( INITIAL_DROP_ZONE_STATE )
				);
			}

			function onDrop( event ) {
				// This seemingly useless line has been shown to resolve a Safari issue
				// where files dragged directly from the dock are not recognized
				event.dataTransfer && event.dataTransfer.files.length; // eslint-disable-line no-unused-expressions

				const dragEventType = getDragEventType( event );
				const position = getPosition( event );
				const hoveredDropZone = getHoveredDropZone(
					dropZones,
					position,
					dragEventType
				);

				resetDragState();

				if ( hoveredDropZone ) {
					switch ( dragEventType ) {
						case 'file':
							hoveredDropZone.onFilesDrop(
								getFilesFromDataTransfer( event.dataTransfer ),
								position
							);
							break;
						case 'html':
							hoveredDropZone.onHTMLDrop(
								event.dataTransfer.getData( 'text/html' ),
								position
							);
							break;
						case 'default':
							hoveredDropZone.onDrop( event, position );
					}
				}

				event.stopPropagation();
				event.preventDefault();
			}

			node.addEventListener( 'drop', onDrop );
			defaultView.addEventListener( 'dragover', onDragOver );
			defaultView.addEventListener( 'mouseup', resetDragState );
			// Note that `dragend` doesn't fire consistently for file and HTML drag
			// events where the drag origin is outside the browser window.
			// In Firefox it may also not fire if the originating node is removed.
			defaultView.addEventListener( 'dragend', resetDragState );

			return () => {
				node.removeEventListener( 'drop', onDrop );
				defaultView.removeEventListener( 'dragover', onDragOver );
				defaultView.removeEventListener( 'mouseup', resetDragState );
				defaultView.removeEventListener( 'dragend', resetDragState );
			};
		},
		[ dropZones ]
	);
}

export function DropZoneContextProvider( props ) {
	const ref = useRef( new Set( [] ) );
	return <Provider { ...props } value={ ref.current } />;
}

function DropContainer( { children } ) {
	const ref = useDrop();
	return (
		<div ref={ ref } className="components-drop-zone__provider">
			{ children }
		</div>
	);
}

export default function DropZoneProvider( { children } ) {
	return (
		<DropZoneContextProvider>
			<DropContainer>{ children }</DropContainer>
		</DropZoneContextProvider>
	);
}
