/**
 * WordPress dependencies
 */
import { useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import useRefEffect from '../use-ref-effect';

/* eslint-disable jsdoc/valid-types */
/**
 * @template T
 * @param {T} value
 * @return {import('react').MutableRefObject<T|null>} A ref with the value.
 */
function useFreshRef( value ) {
	/* eslint-enable jsdoc/valid-types */
	/* eslint-disable jsdoc/no-undefined-types */
	/** @type {import('react').MutableRefObject<T>} */
	/* eslint-enable jsdoc/no-undefined-types */
	// Disable reason: We're doing something pretty JavaScript-y here where the
	// ref will always have a current value that is not null or undefined but it
	// needs to start as undefined. We don't want to change the return type so
	// it's easier to just ts-ignore this specific line that's complaining about
	// undefined not being part of T.
	// @ts-ignore
	const ref = useRef();
	ref.current = value;
	return ref;
}

/**
 * A hook to facilitate drag and drop handling.
 *
 * @param {Object}                  props             Named parameters.
 * @param {boolean}                 props.isDisabled  Whether or not to disable the drop zone.
 * @param {(e: DragEvent) => void}  props.onDragStart Called when dragging has started.
 * @param {(e: DragEvent) => void}  props.onDragEnter Called when the zone is entered.
 * @param {(e: DragEvent) => void}  props.onDragOver  Called when the zone is moved within.
 * @param {(e: DragEvent) => void}  props.onDragLeave Called when the zone is left.
 * @param {(e: MouseEvent) => void} props.onDragEnd   Called when dragging has ended.
 * @param {(e: DragEvent) => void}  props.onDrop      Called when dropping in the zone.
 *
 * @return {import('react').RefCallback<HTMLElement>} Ref callback to be passed to the drop zone element.
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

				ownerDocument.removeEventListener(
					'dragenter',
					maybeDragStart
				);

				// Note that `dragend` doesn't fire consistently for file and
				// HTML drag events where the drag origin is outside the browser
				// window. In Firefox it may also not fire if the originating
				// node is removed.
				ownerDocument.addEventListener( 'dragend', maybeDragEnd );
				ownerDocument.addEventListener( 'mousemove', maybeDragEnd );

				if ( onDragStartRef.current ) {
					onDragStartRef.current( event );
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

				if ( onDragEnterRef.current ) {
					onDragEnterRef.current( event );
				}
			}

			function onDragOver( /** @type {DragEvent} */ event ) {
				// Only call onDragOver for the innermost hovered drop zones.
				if ( ! event.defaultPrevented && onDragOverRef.current ) {
					onDragOverRef.current( event );
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
				if ( isElementInZone( event.relatedTarget ) ) {
					return;
				}

				if ( onDragLeaveRef.current ) {
					onDragLeaveRef.current( event );
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

				if ( onDropRef.current ) {
					onDropRef.current( event );
				}

				maybeDragEnd( event );
			}

			function maybeDragEnd( /** @type {MouseEvent} */ event ) {
				if ( ! isDragging ) {
					return;
				}

				isDragging = false;

				ownerDocument.addEventListener( 'dragenter', maybeDragStart );
				ownerDocument.removeEventListener( 'dragend', maybeDragEnd );
				ownerDocument.removeEventListener( 'mousemove', maybeDragEnd );

				if ( onDragEndRef.current ) {
					onDragEndRef.current( event );
				}
			}

			element.dataset.isDropZone = 'true';
			element.addEventListener( 'drop', onDrop );
			element.addEventListener( 'dragenter', onDragEnter );
			element.addEventListener( 'dragover', onDragOver );
			element.addEventListener( 'dragleave', onDragLeave );
			// The `dragstart` event doesn't fire if the drag started outside
			// the document.
			ownerDocument.addEventListener( 'dragenter', maybeDragStart );

			return () => {
				onDropRef.current = null;
				onDragStartRef.current = null;
				onDragEnterRef.current = null;
				onDragLeaveRef.current = null;
				onDragEndRef.current = null;
				onDragOverRef.current = null;
				delete element.dataset.isDropZone;
				element.removeEventListener( 'drop', onDrop );
				element.removeEventListener( 'dragenter', onDragEnter );
				element.removeEventListener( 'dragover', onDragOver );
				element.removeEventListener( 'dragleave', onDragLeave );
				ownerDocument.removeEventListener( 'dragend', maybeDragEnd );
				ownerDocument.removeEventListener( 'mousemove', maybeDragEnd );
				ownerDocument.addEventListener( 'dragenter', maybeDragStart );
			};
		},
		[ isDisabled ]
	);
}
