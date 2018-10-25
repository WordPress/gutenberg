/**
 * External dependencies
 */
import { isEqual, find, some, filter, noop, throttle, includes } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component, createContext, findDOMNode } from '@wordpress/element';
import isShallowEqual from '@wordpress/is-shallow-equal';

const Context = createContext( {
	addDropZone: () => {},
	removeDropZone: () => {},
	isDraggingOverDocument: false,
	isDraggingOverElement: false,
	position: null,
	type: null,
} );

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
		this.isWithinZoneBounds = this.isWithinZoneBounds.bind( this );

		this.dropZones = [];
		this.state = {
			addDropZone: this.addDropZone,
			removeDropZone: this.removeDropZone,
			isDraggingOverDocument: false,
			hoveredDropZone: -1,
			position: null,
		};
	}

	getChildContext() {
		return {
			dropzones: {
				add: ( { element, updateState, onDrop, onFilesDrop, onHTMLDrop } ) => {
					this.dropZones.push( { element, updateState, onDrop, onFilesDrop, onHTMLDrop } );
				},
				remove: ( element ) => {
					this.dropZones = filter( this.dropZones, ( dropzone ) => dropzone.element !== element );
				},
			},
		};
	}

	componentDidMount() {
		window.addEventListener( 'dragover', this.onDragOver );
		window.addEventListener( 'drop', this.onDrop );
		window.addEventListener( 'mouseup', this.resetDragState );

		// Disable reason: Can't use a ref since this component just renders its children
		// eslint-disable-next-line react/no-find-dom-node
		this.container = findDOMNode( this );
	}

	componentWillUnmount() {
		window.removeEventListener( 'dragover', this.onDragOver );
		window.removeEventListener( 'drop', this.onDrop );
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
			isDraggingOverDocument: false,
			hoveredDropZone: -1,
			position: null,
		} );

		this.dropZones.forEach( ( { updateState } ) => {
			updateState( {
				isDraggingOverDocument: false,
				isDraggingOverElement: false,
				position: null,
				type: null,
			} );
		} );
	}

	getDragEventType( event ) {
		if ( event.dataTransfer ) {
			// Use lodash `includes` here as in the Edge browser `types` is implemented
			// as a DomStringList, whereas in other browsers it's an array. `includes`
			// happily works with both types.
			if ( includes( event.dataTransfer.types, 'Files' ) ) {
				return 'file';
			}

			if ( includes( event.dataTransfer.types, 'text/html' ) ) {
				return 'html';
			}
		}

		return 'default';
	}

	doesDropzoneSupportType( dropzone, type ) {
		return (
			( type === 'file' && dropzone.onFilesDrop ) ||
			( type === 'html' && dropzone.onHTMLDrop ) ||
			( type === 'default' && dropzone.onDrop )
		);
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

		const hoveredDropZones = filter( this.dropZones, ( dropzone ) =>
			this.doesDropzoneSupportType( dropzone, dragEventType ) &&
			this.isWithinZoneBounds( dropzone.element, detail.clientX, detail.clientY )
		);

		// Find the leaf dropzone not containing another dropzone
		const hoveredDropZone = find( hoveredDropZones, ( zone ) => (
			! some( hoveredDropZones, ( subZone ) => subZone !== zone && zone.element.parentElement.contains( subZone.element ) )
		) );

		const hoveredDropZoneIndex = this.dropZones.indexOf( hoveredDropZone );

		let position = null;

		if ( hoveredDropZone ) {
			const rect = hoveredDropZone.element.getBoundingClientRect();

			position = {
				x: detail.clientX - rect.left < rect.right - detail.clientX ? 'left' : 'right',
				y: detail.clientY - rect.top < rect.bottom - detail.clientY ? 'top' : 'bottom',
			};
		}

		// Optimisation: Only update the changed dropzones
		let dropzonesToUpdate = [];

		if ( ! this.state.isDraggingOverDocument ) {
			dropzonesToUpdate = this.dropZones;
		} else if ( hoveredDropZoneIndex !== this.state.hoveredDropZone ) {
			if ( this.state.hoveredDropZone !== -1 ) {
				dropzonesToUpdate.push( this.dropZones[ this.state.hoveredDropZone ] );
			}
			if ( hoveredDropZone ) {
				dropzonesToUpdate.push( hoveredDropZone );
			}
		} else if (
			hoveredDropZone &&
			hoveredDropZoneIndex === this.state.hoveredDropZone &&
			! isEqual( position, this.state.position )
		) {
			dropzonesToUpdate.push( hoveredDropZone );
		}

		// Notifying the dropzones
		dropzonesToUpdate.map( ( dropzone ) => {
			const index = this.dropZones.indexOf( dropzone );
			const isDraggingOverDropZone = index === hoveredDropZoneIndex;
			dropzone.updateState( {
				isDraggingOverElement: isDraggingOverDropZone,
				position: isDraggingOverDropZone ? position : null,
				isDraggingOverDocument: this.doesDropzoneSupportType( dropzone, dragEventType ),
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

	isWithinZoneBounds( dropzone, x, y ) {
		const isWithinElement = ( element ) => {
			const rect = element.getBoundingClientRect();
			/// make sure the rect is a valid rect
			if ( rect.bottom === rect.top || rect.left === rect.right ) {
				return false;
			}

			return (
				x >= rect.left && x <= rect.right &&
				y >= rect.top && y <= rect.bottom
			);
		};

		return isWithinElement( dropzone );
	}

	onDragOver( event ) {
		this.toggleDraggingOverDocument( event, this.getDragEventType( event ) );
		event.preventDefault();
	}

	onDrop( event ) {
		// This seemingly useless line has been shown to resolve a Safari issue
		// where files dragged directly from the dock are not recognized
		event.dataTransfer && event.dataTransfer.files.length; // eslint-disable-line no-unused-expressions

		const { position, hoveredDropZone } = this.state;
		const dragEventType = this.getDragEventType( event );
		const dropzone = this.dropZones[ hoveredDropZone ];
		const isValidDropzone = !! dropzone && this.container.contains( event.target );
		this.resetDragState();

		if ( isValidDropzone ) {
			switch ( dragEventType ) {
				case 'file':
					dropzone.onFilesDrop( [ ...event.dataTransfer.files ], position );
					break;
				case 'html':
					dropzone.onHTMLDrop( event.dataTransfer.getData( 'text/html' ), position );
					break;
				case 'default':
					dropzone.onDrop( event, position );
			}
		}

		event.stopPropagation();
		event.preventDefault();
	}

	render() {
		const { children } = this.props;
		return children;
	}
}

DropZoneProvider.childContextTypes = {
	dropzones: noop,
};

export default DropZoneProvider;
