/**
 * Internal dependencies
 */
import useRefEffect from '../use-ref-effect';
import useEvent from '../use-event';

/**
 * A hook to facilitate drag and drop handling.
 *
 * @param {Object}                  props                   Named parameters.
 * @param {?HTMLElement}            [props.dropZoneElement] Optional element to be used as the drop zone.
 * @param {boolean}                 [props.isDisabled]      Whether or not to disable the drop zone.
 * @param {(e: DragEvent) => void}  [props.onDragStart]     Called when dragging has started.
 * @param {(e: DragEvent) => void}  [props.onDragEnter]     Called when the zone is entered.
 * @param {(e: DragEvent) => void}  [props.onDragOver]      Called when the zone is moved within.
 * @param {(e: DragEvent) => void}  [props.onDragLeave]     Called when the zone is left.
 * @param {(e: MouseEvent) => void} [props.onDragEnd]       Called when dragging has ended.
 * @param {(e: DragEvent) => void}  [props.onDrop]          Called when dropping in the zone.
 *
 * @return {import('react').RefCallback<HTMLElement>} Ref callback to be passed to the drop zone element.
 */
export default function useDropZone( {
	dropZoneElement,
	isDisabled,
	onDrop: _onDrop,
	onDragStart: _onDragStart,
	onDragEnter: _onDragEnter,
	onDragLeave: _onDragLeave,
	onDragEnd: _onDragEnd,
	onDragOver: _onDragOver,
} ) {
	const onDropEvent = useEvent( _onDrop );
	const onDragStartEvent = useEvent( _onDragStart );
	const onDragEnterEvent = useEvent( _onDragEnter );
	const onDragLeaveEvent = useEvent( _onDragLeave );
	const onDragEndEvent = useEvent( _onDragEnd );
	const onDragOverEvent = useEvent( _onDragOver );

	return useRefEffect(
		( elem ) => {
			if ( isDisabled ) {
				return;
			}

			// If a custom dropZoneRef is passed, use that instead of the element.
			// This allows the dropzone to cover an expanded area, rather than
			// be restricted to the area of the ref returned by this hook.
			const element = dropZoneElement ?? elem;

			let isDragging = false;

			const { ownerDocument } = element;

			/**
			 * Checks if an element is in the drop zone.
			 *
			 * @param {EventTarget|null} targetToCheck
			 *
			 * @return {boolean} True if in drop zone, false if not.
			 */
			function isElementInZone( targetToCheck ) {
				const { defaultView } = ownerDocument;

				if (
					! targetToCheck ||
					! defaultView ||
					! ( targetToCheck instanceof defaultView.HTMLElement ) ||
					! element.contains( targetToCheck )
				) {
					return false;
				}

				/** @type {HTMLElement|null} */
				let elementToCheck = targetToCheck;

				do {
					if ( elementToCheck.dataset.isDropZone ) {
						return elementToCheck === element;
					}
				} while ( ( elementToCheck = elementToCheck.parentElement ) );

				return false;
			}

			function maybeDragStart( /** @type {DragEvent} */ event ) {
				if ( isDragging ) {
					return;
				}

				isDragging = true;

				// Note that `dragend` doesn't fire consistently for file and
				// HTML drag events where the drag origin is outside the browser
				// window. In Firefox it may also not fire if the originating
				// node is removed.
				ownerDocument.addEventListener( 'dragend', maybeDragEnd );
				ownerDocument.addEventListener( 'mousemove', maybeDragEnd );

				if ( _onDragStart ) {
					onDragStartEvent( event );
				}
			}

			function onDragEnter( /** @type {DragEvent} */ event ) {
				event.preventDefault();

				// The `dragenter` event will also fire when entering child
				// elements, but we only want to call `onDragEnter` when
				// entering the drop zone, which means the `relatedTarget`
				// (element that has been left) should be outside the drop zone.
				if (
					element.contains(
						/** @type {Node} */ ( event.relatedTarget )
					)
				) {
					return;
				}

				if ( _onDragEnter ) {
					onDragEnterEvent( event );
				}
			}

			function onDragOver( /** @type {DragEvent} */ event ) {
				// Only call onDragOver for the innermost hovered drop zones.
				if ( ! event.defaultPrevented && _onDragOver ) {
					onDragOverEvent( event );
				}

				// Prevent the browser default while also signalling to parent
				// drop zones that `onDragOver` is already handled.
				event.preventDefault();
			}

			function onDragLeave( /** @type {DragEvent} */ event ) {
				// The `dragleave` event will also fire when leaving child
				// elements, but we only want to call `onDragLeave` when
				// leaving the drop zone, which means the `relatedTarget`
				// (element that has been entered) should be outside the drop
				// zone.
				// Note: This is not entirely reliable in Safari due to this bug
				// https://bugs.webkit.org/show_bug.cgi?id=66547

				if ( isElementInZone( event.relatedTarget ) ) {
					return;
				}

				if ( _onDragLeave ) {
					onDragLeaveEvent( event );
				}
			}

			function onDrop( /** @type {DragEvent} */ event ) {
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

				if ( _onDrop ) {
					onDropEvent( event );
				}

				maybeDragEnd( event );
			}

			function maybeDragEnd( /** @type {MouseEvent} */ event ) {
				if ( ! isDragging ) {
					return;
				}

				isDragging = false;

				ownerDocument.removeEventListener( 'dragend', maybeDragEnd );
				ownerDocument.removeEventListener( 'mousemove', maybeDragEnd );

				if ( _onDragEnd ) {
					onDragEndEvent( event );
				}
			}

			element.setAttribute( 'data-is-drop-zone', 'true' );
			element.addEventListener( 'drop', onDrop );
			element.addEventListener( 'dragenter', onDragEnter );
			element.addEventListener( 'dragover', onDragOver );
			element.addEventListener( 'dragleave', onDragLeave );
			// The `dragstart` event doesn't fire if the drag started outside
			// the document.
			ownerDocument.addEventListener( 'dragenter', maybeDragStart );

			return () => {
				element.removeAttribute( 'data-is-drop-zone' );
				element.removeEventListener( 'drop', onDrop );
				element.removeEventListener( 'dragenter', onDragEnter );
				element.removeEventListener( 'dragover', onDragOver );
				element.removeEventListener( 'dragleave', onDragLeave );
				ownerDocument.removeEventListener( 'dragend', maybeDragEnd );
				ownerDocument.removeEventListener( 'mousemove', maybeDragEnd );
				ownerDocument.removeEventListener(
					'dragenter',
					maybeDragStart
				);
			};
		},
		[ isDisabled, dropZoneElement ] // Refresh when the passed in dropZoneElement changes.
	);
}
