/**
 * External dependencies
 */
import { isEqual, without, some, filter, findIndex, noop, throttle } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

class DropZoneProvider extends Component {
	constructor() {
		super( ...arguments );

		this.resetDragState = this.resetDragState.bind( this );
		this.toggleDraggingOverDocument = throttle( this.toggleDraggingOverDocument.bind( this ), 200 );
		this.dragOverListener = this.dragOverListener.bind( this );
		this.isWithinZoneBounds = this.isWithinZoneBounds.bind( this );
		this.onDrop = this.onDrop.bind( this );

		this.state = {
			isDraggingOverDocument: false,
			hoveredDropZone: -1,
			position: null,
		};
		this.dropzones = [];
	}

	dragOverListener( event ) {
		this.toggleDraggingOverDocument( event );
		event.preventDefault();
	}

	getChildContext() {
		return {
			dropzones: {
				add: ( { element, updateState, onDrop, onFilesDrop, onHTMLDrop } ) => {
					this.dropzones.push( { element, updateState, onDrop, onFilesDrop, onHTMLDrop } );
				},
				remove: ( element ) => {
					this.dropzones = filter( this.dropzones, ( dropzone ) => dropzone.element !== element );
				},
			},
		};
	}

	componentDidMount() {
		window.addEventListener( 'dragover', this.dragOverListener );
		window.addEventListener( 'drop', this.onDrop );
		window.addEventListener( 'mouseup', this.resetDragState );
	}

	componentWillUnmount() {
		window.removeEventListener( 'dragover', this.dragOverListener );
		window.removeEventListener( 'drop', this.onDrop );
		window.removeEventListener( 'mouseup', this.resetDragState );
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

		this.dropzones.forEach( ( { updateState } ) => {
			updateState( {
				isDraggingOverDocument: false,
				isDraggingOverElement: false,
				position: null,
			} );
		} );
	}

	toggleDraggingOverDocument( event ) {
		// In some contexts, it may be necessary to capture and redirect the
		// drag event (e.g. atop an `iframe`). To accommodate this, you can
		// create an instance of CustomEvent with the original event specified
		// as the `detail` property.
		//
		// See: https://developer.mozilla.org/en-US/docs/Web/Guide/Events/Creating_and_triggering_events
		const detail = window.CustomEvent && event instanceof window.CustomEvent ? event.detail : event;

		// Index of hovered dropzone.
		const hoveredDropZone = findIndex( this.dropzones, ( { element } ) =>
			this.isWithinZoneBounds( element, detail.clientX, detail.clientY )
		);

		let position = null;

		if ( hoveredDropZone !== -1 ) {
			const rect = this.dropzones[ hoveredDropZone ].element.getBoundingClientRect();

			position = {
				x: detail.clientX - rect.left < rect.right - detail.clientX ? 'left' : 'right',
				y: detail.clientY - rect.top < rect.bottom - detail.clientY ? 'top' : 'bottom',
			};
		}

		// Optimisation: Only update the changed dropzones
		let dropzonesToUpdate = [];

		if ( ! this.state.isDraggingOverDocument ) {
			dropzonesToUpdate = this.dropzones;
		} else if ( hoveredDropZone !== this.state.hoveredDropZone ) {
			if ( this.state.hoveredDropZone !== -1 ) {
				dropzonesToUpdate.push( this.dropzones[ this.state.hoveredDropZone ] );
			}
			if ( hoveredDropZone !== -1 ) {
				dropzonesToUpdate.push( this.dropzones[ hoveredDropZone ] );
			}
		} else if (
			hoveredDropZone !== -1 &&
			hoveredDropZone === this.state.hoveredDropZone &&
			! isEqual( position, this.state.position )
		) {
			dropzonesToUpdate.push( this.dropzones[ hoveredDropZone ] );
		}

		// Notifying the dropzones
		dropzonesToUpdate.map( ( dropzone ) => {
			const index = this.dropzones.indexOf( dropzone );
			dropzone.updateState( {
				isDraggingOverElement: index === hoveredDropZone,
				position: index === hoveredDropZone ? position : null,
				isDraggingOverDocument: true,
			} );
		} );

		this.setState( {
			isDraggingOverDocument: true,
			hoveredDropZone,
			position,
		} );

		event.preventDefault();
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

		const childZones = without( dropzone.parentElement.querySelectorAll( '.components-drop-zone' ), dropzone );
		return ! some( childZones, isWithinElement ) && isWithinElement( dropzone );
	}

	onDrop( event ) {
		// This seemingly useless line has been shown to resolve a Safari issue
		// where files dragged directly from the dock are not recognized
		event.dataTransfer && event.dataTransfer.files.length; // eslint-disable-line no-unused-expressions

		const { position, hoveredDropZone } = this.state;
		const dropzone = hoveredDropZone !== -1 ? this.dropzones[ hoveredDropZone ] : null;

		this.resetDragState();

		if ( !! dropzone && !! dropzone.onDrop ) {
			dropzone.onDrop( event, position );
		}

		if ( event.dataTransfer && !! dropzone ) {
			const files = event.dataTransfer.files;
			const HTML = event.dataTransfer.getData( 'text/html' );

			if ( files.length && dropzone.onFilesDrop ) {
				dropzone.onFilesDrop( [ ...event.dataTransfer.files ], position );
			} else if ( HTML && dropzone.onHTMLDrop ) {
				dropzone.onHTMLDrop( HTML, position );
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
