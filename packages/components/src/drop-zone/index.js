/**
 * External dependencies
 */
import classnames from 'classnames';
import { includes, throttle } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useState, useRef } from '@wordpress/element';
import { upload, Icon } from '@wordpress/icons';
import { getFilesFromDataTransfer } from '@wordpress/dom';

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

function useFreshRef( value ) {
	const ref = useRef();
	ref.current = value;
	return ref;
}

export function useDropZone( {
	element,
	onFilesDrop,
	onHTMLDrop,
	onDrop: _onDrop,
	onDragStart,
	onDragEnter: _onDragEnter,
	onDragLeave: _onDragLeave,
	onDragEnd,
	isDisabled,
	onDragOver: _onDragOver,
} ) {
	const onFilesDropRef = useFreshRef( onFilesDrop );
	const onHTMLDropRef = useFreshRef( onHTMLDrop );
	const onDropRef = useFreshRef( _onDrop );
	const onDragStartRef = useFreshRef( onDragStart );
	const onDragEnterRef = useFreshRef( _onDragEnter );
	const onDragLeaveRef = useFreshRef( _onDragLeave );
	const onDragEndRef = useFreshRef( onDragEnd );
	const onDragOverRef = useFreshRef( _onDragOver );

	useEffect( () => {
		if ( isDisabled ) {
			return;
		}

		let isDraggingGlobally = false;

		function isTypeSupported( type ) {
			return Boolean(
				( type === 'file' && !! onFilesDropRef.current ) ||
					( type === 'html' && !! onHTMLDropRef.current ) ||
					( type === 'default' && !! onDropRef.current )
			);
		}

		element.current.setAttribute( 'data-is-drop-target', 'true' );

		const { ownerDocument } = element.current;
		const { defaultView } = ownerDocument;

		function onDragEnter( event ) {
			element.current.setAttribute( 'data-is-dragging', 'true' );

			if ( onDragEnterRef.current ) {
				onDragEnterRef.current( event );
			}
		}

		function updateDragZones( event ) {
			if ( onDragOverRef.current ) {
				onDragOverRef.current( getPosition( event ) );
			}
		}

		const throttledUpdateDragZones = throttle( updateDragZones, 200 );

		function onDragOver( event ) {
			if ( event.target !== element.current ) {
				event.preventDefault();
			} else {
				throttledUpdateDragZones( event );
				event.preventDefault();
			}
		}

		function onDragLeave( event ) {
			if ( onDragLeaveRef.current ) {
				onDragLeaveRef.current( event );
			}
		}

		function resetDragState( event ) {
			throttledUpdateDragZones.cancel();
			element.current.removeAttribute( 'data-is-dragging' );

			if ( onDragEndRef.current && isDraggingGlobally ) {
				onDragEndRef.current( event );
			}
		}

		function onDrop( event ) {
			// This seemingly useless line has been shown to resolve a Safari issue
			// where files dragged directly from the dock are not recognized
			event.dataTransfer && event.dataTransfer.files.length; // eslint-disable-line no-unused-expressions

			const dragEventType = getDragEventType( event );

			if ( ! isTypeSupported( dragEventType ) ) {
				return;
			}

			const position = getPosition( event );

			resetDragState( event );

			switch ( dragEventType ) {
				case 'file':
					onFilesDropRef.current(
						getFilesFromDataTransfer( event.dataTransfer ),
						position
					);
					break;
				case 'html':
					onHTMLDropRef.current(
						event.dataTransfer.getData( 'text/html' ),
						position
					);
					break;
				case 'default':
					onDropRef.current( event, position );
			}

			event.stopPropagation();
			event.preventDefault();
		}

		function onGlobalDragOver( event ) {
			isDraggingGlobally = true;
			if ( onDragStartRef.current ) {
				onDragStartRef.current( event );
			}
			defaultView.removeEventListener( 'dragover', onGlobalDragOver );
		}

		element.current.addEventListener( 'drop', onDrop );
		element.current.addEventListener( 'dragenter', onDragEnter );
		element.current.addEventListener( 'dragover', onDragOver );
		element.current.addEventListener( 'dragleave', onDragLeave );
		defaultView.addEventListener( 'mouseup', resetDragState );
		// Note that `dragend` doesn't fire consistently for file and HTML drag
		// events where the drag origin is outside the browser window.
		// In Firefox it may also not fire if the originating node is removed.
		defaultView.addEventListener( 'dragend', resetDragState );
		defaultView.addEventListener( 'dragover', onGlobalDragOver );

		return () => {
			element.current.removeAttribute( 'data-is-drop-target' );
			element.current.removeEventListener( 'drop', onDrop );
			element.current.removeEventListener( 'dragenter', onDragEnter );
			element.current.removeEventListener( 'dragover', onDragOver );
			element.current.removeEventListener( 'dragleave', onDragLeave );
			defaultView.removeEventListener( 'mouseup', resetDragState );
			defaultView.removeEventListener( 'dragend', resetDragState );
			defaultView.addEventListener( 'dragover', onGlobalDragOver );
			throttledUpdateDragZones.cancel();
		};
	}, [ isDisabled ] );
}

export default function DropZoneComponent( {
	className,
	label,
	onFilesDrop,
	onHTMLDrop,
	onDrop,
} ) {
	const element = useRef();
	const [ isDraggingOverDocument, setIsDraggingOverDocument ] = useState();
	const [ isDraggingOverElement, setIsDraggingOverElement ] = useState();
	const [ type, setType ] = useState();
	useDropZone( {
		element,
		onFilesDrop,
		onHTMLDrop,
		onDrop,
		onDragStart( event ) {
			setIsDraggingOverDocument( true );
			setType( getDragEventType( event ) );
		},
		onDragEnd() {
			setIsDraggingOverDocument( false );
			setType();
		},
		onDragEnter() {
			setIsDraggingOverElement( true );
		},
		onDragLeave() {
			setIsDraggingOverElement( false );
		},
	} );

	let children;

	if ( isDraggingOverElement ) {
		children = (
			<div className="components-drop-zone__content">
				<Icon
					icon={ upload }
					className="components-drop-zone__content-icon"
				/>
				<span className="components-drop-zone__content-text">
					{ label ? label : __( 'Drop files to upload' ) }
				</span>
			</div>
		);
	}

	const classes = classnames( 'components-drop-zone', className, {
		'is-active':
			( isDraggingOverDocument || isDraggingOverElement ) &&
			( ( type === 'file' && onFilesDrop ) ||
				( type === 'html' && onHTMLDrop ) ||
				( type === 'default' && onDrop ) ),
		'is-dragging-over-document': isDraggingOverDocument,
		'is-dragging-over-element': isDraggingOverElement,
		[ `is-dragging-${ type }` ]: !! type,
	} );

	return (
		<div ref={ element } className={ classes }>
			{ children }
		</div>
	);
}
