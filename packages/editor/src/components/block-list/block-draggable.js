/**
 * External dependencies
 */
import classnames from 'classnames';
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { withSafeTimeout } from '@wordpress/compose';

const dragImageClass = 'components-draggable__invisible-drag-image';
const cloneWrapperClass = 'components-draggable__clone';
const cloneHeightTransformationBreakpoint = 700;
const clonePadding = 20;

class BlockDraggable extends Component {
	constructor( ) {
		super( ...arguments );

		// bind class methods to this instance
		this.onDragStart = this.onDragStart.bind( this );
		this.onDragOver = this.onDragOver.bind( this );
		this.onDragEnd = this.onDragEnd.bind( this );
		this.resetDragState = this.resetDragState.bind( this );
	}

	componentWillUnmount() {
		this.resetDragState();
	}

	onDragStart( event ) {
		const { rootClientId, elementId, index, clientId, layout, onDragStart = noop } = this.props;
		const element = document.getElementById( elementId );
		if ( ! element ) {
			event.preventDefault();
			return;
		}

		// Set a fake drag image to avoid browser defaults. Remove from DOM
		// right after. event.dataTransfer.setDragImage is not supported yet in
		// IE, we need to check for its existence first.
		if ( 'function' === typeof event.dataTransfer.setDragImage ) {
			const dragImage = document.createElement( 'div' );
			dragImage.id = `drag-image-${ elementId }`;
			dragImage.classList.add( dragImageClass );
			document.body.appendChild( dragImage );
			event.dataTransfer.setDragImage( dragImage, 0, 0 );
			this.props.setTimeout( () => {
				document.body.removeChild( dragImage );
			} );
		}

		const transferData = {
			type: 'block',
			fromIndex: index,
			rootClientId,
			clientId,
			layout,
		};
		event.dataTransfer.setData( 'text', JSON.stringify( transferData ) );

		// Prepare element clone and append to element wrapper.
		const elementRect = element.getBoundingClientRect();
		const elementWrapper = element.parentNode;
		const elementTopOffset = parseInt( elementRect.top, 10 );
		const elementLeftOffset = parseInt( elementRect.left, 10 );
		const clone = element.cloneNode( true );
		clone.id = `clone-${ elementId }`;
		this.cloneWrapper = document.createElement( 'div' );
		this.cloneWrapper.classList.add( cloneWrapperClass );
		this.cloneWrapper.style.width = `${ elementRect.width + ( clonePadding * 2 ) }px`;

		if ( elementRect.height > cloneHeightTransformationBreakpoint ) {
			// Scale down clone if original element is larger than 700px.
			this.cloneWrapper.style.transform = 'scale(0.5)';
			this.cloneWrapper.style.transformOrigin = 'top left';
			// Position clone near the cursor.
			this.cloneWrapper.style.top = `${ event.clientY - 100 }px`;
			this.cloneWrapper.style.left = `${ event.clientX }px`;
		} else {
			// Position clone right over the original element (20px padding).
			this.cloneWrapper.style.top = `${ elementTopOffset - clonePadding }px`;
			this.cloneWrapper.style.left = `${ elementLeftOffset - clonePadding }px`;
		}

		// Hack: Remove iFrames as it's causing the embeds drag clone to freeze
		[ ...clone.querySelectorAll( 'iframe' ) ].forEach( ( child ) => child.parentNode.removeChild( child ) );

		this.cloneWrapper.appendChild( clone );
		elementWrapper.appendChild( this.cloneWrapper );

		// Mark the current cursor coordinates.
		this.cursorLeft = event.clientX;
		this.cursorTop = event.clientY;
		// Update cursor to 'grabbing', document wide.
		document.body.classList.add( 'is-dragging-components-draggable' );
		document.addEventListener( 'dragover', this.onDragOver );

		this.props.setTimeout( onDragStart );
	}

	onDragOver( event ) {
		this.cloneWrapper.style.top =
			`${ parseInt( this.cloneWrapper.style.top, 10 ) + event.clientY - this.cursorTop }px`;
		this.cloneWrapper.style.left =
			`${ parseInt( this.cloneWrapper.style.left, 10 ) + event.clientX - this.cursorLeft }px`;

		// Update cursor coordinates.
		this.cursorLeft = event.clientX;
		this.cursorTop = event.clientY;
	}

	onDragEnd( event ) {
		const { onDragEnd = noop } = this.props;
		event.preventDefault();

		this.resetDragState();

		this.props.setTimeout( onDragEnd );
	}

	resetDragState( ) {
		// Remove drag clone
		document.removeEventListener( 'dragover', this.onDragOver );
		if ( this.cloneWrapper && this.cloneWrapper.parentNode ) {
			this.cloneWrapper.parentNode.removeChild( this.cloneWrapper );
			this.cloneWrapper = null;
		}

		// Reset cursor.
		document.body.classList.remove( 'is-dragging-components-draggable' );
	}

	render() {
		const { isDragging } = this.props;
		const className = classnames( 'editor-block-list__block-draggable', {
			'is-visible': isDragging,
		} );

		return (
			<div
				className={ className }
				onDragStart={ this.onDragStart }
				onDragEnd={ this.onDragEnd }
				draggable
			>
				<div className="editor-block-list__block-draggable-inner"></div>
			</div>
		);
	}
}

export default withSafeTimeout( BlockDraggable );
