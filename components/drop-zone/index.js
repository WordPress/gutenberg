/**
 * External dependencies
 */
import classnames from 'classnames';
import { includes, without, some } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import './style.scss';
import Dashicon from '../dashicon';

class DropZone extends Component {
	constructor() {
		super( ...arguments );

		this.resetDragState = this.resetDragState.bind( this );
		this.toggleMutationObserver = this.toggleMutationObserver.bind( this );
		this.disconnectMutationObserver = this.disconnectMutationObserver.bind( this );
		this.detectNodeRemoval = this.detectNodeRemoval.bind( this );
		this.toggleDraggingOverDocument = this.toggleDraggingOverDocument.bind( this );
		this.isWithinZoneBounds = this.isWithinZoneBounds.bind( this );
		this.setZoneNode = this.setZoneNode.bind( this );
		this.onDrop = this.onDrop.bind( this );
		this.resetDragState = this.resetDragState.bind( this );

		this.state = {
			isDraggingOverDocument: false,
			isDraggingOverElement: false,
			position: null,
		};
	}

	componentDidMount() {
		this.dragEnterNodes = [];

		window.addEventListener( 'dragover', this.toggleDraggingOverDocument );
		window.addEventListener( 'drop', this.onDrop );
		window.addEventListener( 'dragenter', this.toggleDraggingOverDocument );
		window.addEventListener( 'dragleave', this.toggleDraggingOverDocument );
		window.addEventListener( 'mouseup', this.resetDragState );
	}

	componentDidUpdate( prevProps, prevState ) {
		if ( prevState.isDraggingOverDocument !== this.state.isDraggingOverDocument ) {
			this.toggleMutationObserver();
		}
	}

	componentWillUnmount() {
		window.removeEventListener( 'dragover', this.toggleDraggingOverDocument );
		window.removeEventListener( 'drop', this.onDrop );
		window.removeEventListener( 'dragenter', this.toggleDraggingOverDocument );
		window.removeEventListener( 'dragleave', this.toggleDraggingOverDocument );
		window.removeEventListener( 'mouseup', this.resetDragState );

		this.disconnectMutationObserver();
	}

	resetDragState() {
		const { isDraggingOverDocument, isDraggingOverElement } = this.state;
		if ( ! ( isDraggingOverDocument || isDraggingOverElement ) ) {
			return;
		}

		this.setState( {
			isDraggingOverDocument: false,
			isDraggingOverElement: false,
			position: null,
		} );
	}

	toggleMutationObserver() {
		this.disconnectMutationObserver();

		if ( this.state.isDraggingOverDocument ) {
			this.observer = new window.MutationObserver( this.detectNodeRemoval );
			this.observer.observe( document.body, {
				childList: true,
				subtree: true,
			} );
		}
	}

	disconnectMutationObserver() {
		if ( ! this.observer ) {
			return;
		}

		this.observer.disconnect();
		delete this.observer;
	}

	detectNodeRemoval( mutations ) {
		mutations.forEach( ( mutation ) => {
			if ( ! mutation.removedNodes.length ) {
				return;
			}

			this.dragEnterNodes = without( this.dragEnterNodes, Array.from( mutation.removedNodes ) );
		} );
	}

	toggleDraggingOverDocument( event ) {
		event.preventDefault();

		// Track nodes that have received a drag event. So long as nodes exist
		// in the set, we can assume that an item is being dragged on the page.
		if ( 'dragenter' === event.type && ! includes( this.dragEnterNodes, event.target ) ) {
			this.dragEnterNodes.push( event.target );
		} else if ( 'dragleave' === event.type ) {
			this.dragEnterNodes = without( this.dragEnterNodes, event.target );
		}

		// In some contexts, it may be necessary to capture and redirect the
		// drag event (e.g. atop an `iframe`). To accommodate this, you can
		// create an instance of CustomEvent with the original event specified
		// as the `detail` property.
		//
		// See: https://developer.mozilla.org/en-US/docs/Web/Guide/Events/Creating_and_triggering_events
		const detail = window.CustomEvent && event instanceof window.CustomEvent ? event.detail : event;

		const { onVerifyValidTransfer } = this.props;
		const isValidDrag = ! onVerifyValidTransfer || onVerifyValidTransfer( detail.dataTransfer );
		const isDraggingOverDocument = isValidDrag && this.dragEnterNodes.length;
		const isDraggingOverElement = isDraggingOverDocument && this.isWithinZoneBounds( detail.clientX, detail.clientY );
		let position = null;
		if ( isDraggingOverElement ) {
			const rect = this.zone.getBoundingClientRect();
			position = {
				x: detail.clientX - rect.left < rect.right - detail.clientX ? 'left' : 'right',
				y: detail.clientY - rect.top < rect.bottom - detail.clientY ? 'top' : 'bottom',
			};
		}

		this.setState( {
			isDraggingOverDocument,
			isDraggingOverElement,
			position,
		} );

		if ( window.CustomEvent && event instanceof window.CustomEvent ) {
			// For redirected CustomEvent instances, immediately remove window
			// from tracked nodes since another "real" event will be triggered.
			this.dragEnterNodes = without( this.dragEnterNodes, window );
		}
	}

	isWithinZoneBounds( x, y ) {
		if ( ! this.zone ) {
			return false;
		}

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

		const childZones = without( this.zone.parentElement.querySelectorAll( '.components-drop-zone' ), this.zone );
		return ! some( childZones, isWithinElement ) && isWithinElement( this.zone );
	}

	setZoneNode( node ) {
		this.zone = node;
	}

	onDrop( event ) {
		// This seemingly useless line has been shown to resolve a Safari issue
		// where files dragged directly from the dock are not recognized
		event.dataTransfer && event.dataTransfer.files.length; // eslint-disable-line no-unused-expressions
		const { position, isDraggingOverElement } = this.state;

		this.resetDragState();

		if ( ! this.zone.contains( event.target ) || ! isDraggingOverElement ) {
			return;
		}

		if ( this.props.onDrop ) {
			this.props.onDrop( event, position );
		}

		const { onVerifyValidTransfer } = this.props;
		if ( onVerifyValidTransfer && ! onVerifyValidTransfer( event.dataTransfer ) ) {
			return;
		}

		if ( event.dataTransfer ) {
			this.props.onFilesDrop( Array.prototype.slice.call( event.dataTransfer.files ), position );
		}

		event.stopPropagation();
		event.preventDefault();
	}

	render() {
		const { className, children, label } = this.props;
		const { isDraggingOverDocument, isDraggingOverElement, position } = this.state;
		const classes = classnames( 'components-drop-zone', className, {
			'is-active': isDraggingOverDocument || isDraggingOverElement,
			'is-dragging-over-document': isDraggingOverDocument,
			'is-dragging-over-element': isDraggingOverElement,
			'is-close-to-top': position && position.y === 'top',
			'is-close-to-bottom': position && position.y === 'bottom',
			'is-close-to-left': position && position.x === 'left',
			'is-close-to-right': position && position.x === 'right',
		} );

		return (
			<div ref={ this.setZoneNode } className={ classes }>
				<div className="components-drop-zone__content">
					{ children ? children : [
						<Dashicon
							key="icon"
							icon="upload"
							size="40"
							className="components-drop-zone__content-icon"
						/>,
						<span
							key="text"
							className="components-drop-zone__content-text"
						>
							{ label ? label : __( 'Drop files to upload' ) }
						</span>,
					] }
				</div>
			</div>
		);
	}
}

export default DropZone;
