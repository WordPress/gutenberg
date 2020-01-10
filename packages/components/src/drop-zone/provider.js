/**
 * External dependencies
 */
import { isEqual, find, some, filter, throttle, includes } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component, createContext } from '@wordpress/element';
import isShallowEqual from '@wordpress/is-shallow-equal';

export const Context = createContext( {
	addDropZone: () => {},
	removeDropZone: () => {},
} );

const { Provider, Consumer } = Context;

const getDragEventType = ( { dataTransfer } ) => {
	if ( dataTransfer ) {
		// Use lodash `includes` here as in the Edge browser `types` is implemented
		// as a DomStringList, whereas in other browsers it's an array. `includes`
		// happily works with both types.
		if ( includes( dataTransfer.types, 'Files' ) ) {
			return 'file';
		}

		if ( includes( dataTransfer.types, 'text/html' ) ) {
			return 'html';
		}
	}

	return 'default';
};

const isTypeSupportedByDropZone = ( type, dropZone ) => {
	return ( type === 'file' && dropZone.onFilesDrop ) ||
		( type === 'html' && dropZone.onHTMLDrop ) ||
		( type === 'default' && dropZone.onDrop );
};

const isWithinElementBounds = ( element, x, y ) => {
	const rect = element.getBoundingClientRect();
	/// make sure the rect is a valid rect
	if ( rect.bottom === rect.top || rect.left === rect.right ) {
		return false;
	}

	return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
};

class DropZoneProvider extends Component {
	constructor() {
		super( ...arguments );

		// Event listeners
		this.onDragOver = this.onDragOver.bind( this );
		this.onDrop = this.onDrop.bind( this );
		// Context methods so this component can receive data from consumers
		this.addDropZone = this.addDropZone.bind( this );
		this.removeDropZone = this.removeDropZone.bind( this );
		// Utility methods
		this.resetDragState = this.resetDragState.bind( this );
		this.toggleDraggingOverDocument = throttle( this.toggleDraggingOverDocument.bind( this ), 200 );

		this.dropZones = [];
		this.dropZoneCallbacks = {
			addDropZone: this.addDropZone,
			removeDropZone: this.removeDropZone,
		};
		this.state = {
			hoveredDropZone: -1,
			isDraggingOverDocument: false,
			position: null,
		};
	}

	componentDidMount() {
		window.addEventListener( 'dragover', this.onDragOver );
		window.addEventListener( 'mouseup', this.resetDragState );
	}

	componentWillUnmount() {
		window.removeEventListener( 'dragover', this.onDragOver );
		window.removeEventListener( 'mouseup', this.resetDragState );
	}

	addDropZone( dropZone ) {
		this.dropZones.push( dropZone );
	}

	removeDropZone( dropZone ) {
		this.dropZones = filter( this.dropZones, ( dz ) => dz !== dropZone );
	}

	resetDragState() {
		// Avoid throttled drag over handler calls
		this.toggleDraggingOverDocument.cancel();

		const { isDraggingOverDocument, hoveredDropZone } = this.state;
		if ( ! isDraggingOverDocument && hoveredDropZone === -1 ) {
			return;
		}

		this.setState( {
			hoveredDropZone: -1,
			isDraggingOverDocument: false,
			position: null,
		} );

		this.dropZones.forEach( ( dropZone ) => dropZone.setState( {
			isDraggingOverDocument: false,
			isDraggingOverElement: false,
			position: null,
			type: null,
		} ) );
	}

	toggleDraggingOverDocument( event, dragEventType ) {
		// In some contexts, it may be necessary to capture and redirect the
		// drag event (e.g. atop an `iframe`). To accommodate this, you can
		// create an instance of CustomEvent with the original event specified
		// as the `detail` property.
		//
		// See: https://developer.mozilla.org/en-US/docs/Web/Guide/Events/Creating_and_triggering_events
		const detail = window.CustomEvent && event instanceof window.CustomEvent ? event.detail : event;

		// Index of hovered dropzone.
		const hoveredDropZones = filter( this.dropZones, ( dropZone ) =>
			isTypeSupportedByDropZone( dragEventType, dropZone ) &&
			isWithinElementBounds( dropZone.element.current, detail.clientX, detail.clientY )
		);

		// Find the leaf dropzone not containing another dropzone
		const hoveredDropZone = find( hoveredDropZones, ( zone ) => (
			! some( hoveredDropZones, ( subZone ) => subZone !== zone && zone.element.current.parentElement.contains( subZone.element.current ) )
		) );

		const hoveredDropZoneIndex = this.dropZones.indexOf( hoveredDropZone );

		let position = null;

		if ( hoveredDropZone && hoveredDropZone.withPosition ) {
			position = { x: detail.clientX, y: detail.clientY };
		}

		// Optimisation: Only update the changed dropzones
		let toUpdate = [];

		if ( ! this.state.isDraggingOverDocument ) {
			toUpdate = this.dropZones;
		} else if ( hoveredDropZoneIndex !== this.state.hoveredDropZone ) {
			if ( this.state.hoveredDropZone !== -1 ) {
				toUpdate.push( this.dropZones[ this.state.hoveredDropZone ] );
			}
			if ( hoveredDropZone ) {
				toUpdate.push( hoveredDropZone );
			}
		} else if (
			hoveredDropZone &&
			hoveredDropZoneIndex === this.state.hoveredDropZone &&
			! isEqual( position, this.state.position )
		) {
			toUpdate.push( hoveredDropZone );
		}

		// Notifying the dropzones
		toUpdate.forEach( ( dropZone ) => {
			const index = this.dropZones.indexOf( dropZone );
			const isDraggingOverDropZone = index === hoveredDropZoneIndex;
			dropZone.setState( {
				isDraggingOverDocument: isTypeSupportedByDropZone( dragEventType, dropZone ),
				isDraggingOverElement: isDraggingOverDropZone,
				position: isDraggingOverDropZone ? position : null,
				type: isDraggingOverDropZone ? dragEventType : null,
			} );
		} );

		const newState = {
			isDraggingOverDocument: true,
			hoveredDropZone: hoveredDropZoneIndex,
			position,
		};
		if ( ! isShallowEqual( newState, this.state ) ) {
			this.setState( newState );
		}
	}

	onDragOver( event ) {
		this.toggleDraggingOverDocument( event, getDragEventType( event ) );
		event.preventDefault();
	}

	onDrop( event ) {
		// This seemingly useless line has been shown to resolve a Safari issue
		// where files dragged directly from the dock are not recognized
		event.dataTransfer && event.dataTransfer.files.length; // eslint-disable-line no-unused-expressions

		const { position, hoveredDropZone } = this.state;
		const dragEventType = getDragEventType( event );
		const dropZone = this.dropZones[ hoveredDropZone ];
		this.resetDragState();

		if ( dropZone ) {
			switch ( dragEventType ) {
				case 'file':
					dropZone.onFilesDrop( [ ...event.dataTransfer.files ], position );
					break;
				case 'html':
					dropZone.onHTMLDrop( event.dataTransfer.getData( 'text/html' ), position );
					break;
				case 'default':
					dropZone.onDrop( event, position );
			}
		}

		event.stopPropagation();
		event.preventDefault();
	}

	render() {
		return (
			<div onDrop={ this.onDrop } className="components-drop-zone__provider">
				<Provider value={ this.dropZoneCallbacks }>
					{ this.props.children }
				</Provider>
			</div>
		);
	}
}

export default DropZoneProvider;
export { Consumer as DropZoneConsumer };
