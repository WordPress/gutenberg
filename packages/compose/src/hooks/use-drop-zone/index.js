/**
 * WordPress dependencies
 */
import { useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import useRefEffect from '../use-ref-effect';

/** @typedef {import('@wordpress/element').RefCallback} RefCallback */

function useFreshRef( value ) {
	const ref = useRef();
	ref.current = value;
	return ref;
}

/**
 * A hook to facilitate drag and drop handling.
 *
 * @param {Object}     $1             Named parameters.
 * @param {boolean}    $1.isDisabled  Whether or not to disable the drop zone.
 * @param {DragEvent}  $1.onDragStart Called when dragging has started.
 * @param {DragEvent}  $1.onDragEnter Called when the zone is entered.
 * @param {DragEvent}  $1.onDragOver  Called when the zone is moved within.
 * @param {DragEvent}  $1.onDragLeave Called when the zone is left.
 * @param {MouseEvent} $1.onDragEnd   Called when dragging has ended.
 * @param {DragEvent}  $1.onDrop      Called when dropping in the zone.
 *
 * @return {RefCallback} Ref callback to be passed to the drop zone element.
 */
export default function useDropZone( {
	isDisabled,
	onDrop: _onDrop,
	onDragStart: _onDragStart,
	onDragEnter: _onDragEnter,
	onDragLeave: _onDragLeave,
	onDragEnd: _onDragEnd,
	onDragOver: _onDragOver,
} ) {
	const onDropRef = useFreshRef( _onDrop );
	const onDragStartRef = useFreshRef( _onDragStart );
	const onDragEnterRef = useFreshRef( _onDragEnter );
	const onDragLeaveRef = useFreshRef( _onDragLeave );
	const onDragEndRef = useFreshRef( _onDragEnd );
	const onDragOverRef = useFreshRef( _onDragOver );

	return useRefEffect(
		( element ) => {
			if ( isDisabled ) {
				return;
			}

			let isDragging = false;

			const { ownerDocument } = element;

			function maybeDragStart( event ) {
				if ( isDragging ) {
					return;
				}

				isDragging = true;

				ownerDocument.removeEventListener(
					'dragenter',
					maybeDragStart
				);

				if ( onDragStartRef.current ) {
					onDragStartRef.current( event );
				}
			}

			function onDragEnter( event ) {
				event.preventDefault();

				// The `dragenter` event will also fire when entering child
				// elements, but we only want to call `onDragEnter` when
				// entering the drop zone, which means the `relatedTarget`
				// (element that has been left) should be outside the drop zone.
				if ( element.contains( event.relatedTarget ) ) {
					return;
				}

				if ( onDragEnterRef.current ) {
					onDragEnterRef.current( event );
				}
			}

			function onDragOver( event ) {
				// Only call onDragOver for the innermost hovered drop zones.
				if ( ! event.defaultPrevented && onDragOverRef.current ) {
					onDragOverRef.current( event );
				}

				// Prevent the browser default while also signalling to parent
				// drop zones that `onDragOver` is already handled.
				event.preventDefault();
			}

			function onDragLeave( event ) {
				// The `dragleave` event will also fire when leaving child
				// elements, but we only want to call `onDragLeave` when
				// leaving the drop zone, which means the `relatedTarget`
				// (element that has been entered) should be outside the drop
				// zone.
				if ( element.contains( event.relatedTarget ) ) {
					return;
				}

				if ( onDragLeaveRef.current ) {
					onDragLeaveRef.current( event );
				}
			}

			function onDrop( event ) {
				// Don't handle drop if an inner drop zone already handled it.
				if ( event.defaultPrevented ) {
					return;
				}

				// Prevent the browser default while also signalling to parent
				// drop zones that `onDrop` is already handled.
				event.preventDefault();

				// This seemingly useless line has been shown to resolve a
				// Safari issue where files dragged directly from the dock are
				// not recognized.
				// eslint-disable-next-line no-unused-expressions
				event.dataTransfer && event.dataTransfer.files.length;

				if ( onDropRef.current ) {
					onDropRef.current( event );
				}

				maybeDragEnd( event );
			}

			function maybeDragEnd( event ) {
				if ( ! isDragging ) {
					return;
				}

				isDragging = false;

				ownerDocument.addEventListener( 'dragenter', maybeDragStart );

				if ( onDragEndRef.current ) {
					onDragEndRef.current( event );
				}
			}

			element.addEventListener( 'drop', onDrop );
			element.addEventListener( 'dragenter', onDragEnter );
			element.addEventListener( 'dragover', onDragOver );
			element.addEventListener( 'dragleave', onDragLeave );
			// Note that `dragend` doesn't fire consistently for file and HTML
			// drag  events where the drag origin is outside the browser window.
			// In Firefox it may also not fire if the originating node is
			// removed.
			ownerDocument.addEventListener( 'dragend', maybeDragEnd );
			ownerDocument.addEventListener( 'mouseup', maybeDragEnd );
			// The `dragstart` event doesn't fire if the drag started outside
			// the document.
			ownerDocument.addEventListener( 'dragenter', maybeDragStart );

			return () => {
				element.removeEventListener( 'drop', onDrop );
				element.removeEventListener( 'dragenter', onDragEnter );
				element.removeEventListener( 'dragover', onDragOver );
				element.removeEventListener( 'dragleave', onDragLeave );
				ownerDocument.removeEventListener( 'dragend', maybeDragEnd );
				ownerDocument.removeEventListener( 'mouseup', maybeDragEnd );
				ownerDocument.addEventListener( 'dragenter', maybeDragStart );
			};
		},
		[ isDisabled ]
	);
}
