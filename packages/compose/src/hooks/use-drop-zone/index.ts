/**
 * Internal dependencies
 */
import useRefEffect from '../use-ref-effect';
import useEvent from '../use-event';

interface UseDropZoneProps {
	dropZoneElement?: HTMLElement | null;
	isDisabled?: boolean;
	onDragStart?: ( e: DragEvent ) => void;
	onDragEnter?: ( e: DragEvent ) => void;
	onDragOver?: ( e: DragEvent ) => void;
	onDragLeave?: ( e: DragEvent ) => void;
	onDragEnd?: ( e: MouseEvent ) => void;
	onDrop?: ( e: DragEvent ) => void;
}

/**
 * A hook to facilitate drag and drop handling.
 *
 * @param props                 Hook options
 * @param props.dropZoneElement
 * @param props.isDisabled
 * @param props.onDrop
 * @param props.onDragStart
 * @param props.onDragEnter
 * @param props.onDragLeave
 * @param props.onDragEnd
 * @param props.onDragOver
 * @return Ref callback to be passed to the drop zone element.
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
}: UseDropZoneProps ): React.RefCallback< HTMLElement > {
	const onDropEvent = useEvent( _onDrop );
	const onDragStartEvent = useEvent( _onDragStart );
	const onDragEnterEvent = useEvent( _onDragEnter );
	const onDragLeaveEvent = useEvent( _onDragLeave );
	const onDragEndEvent = useEvent( _onDragEnd );
	const onDragOverEvent = useEvent( _onDragOver );

	return useRefEffect(
		( elem: HTMLElement ) => {
			if ( isDisabled ) {
				return;
			}

			const element = dropZoneElement ?? elem;
			let isDragging = false;
			const { ownerDocument } = element;

			function isElementInZone(
				targetToCheck: EventTarget | null
			): boolean {
				const { defaultView } = ownerDocument;

				if (
					! targetToCheck ||
					! defaultView ||
					! ( targetToCheck instanceof defaultView.HTMLElement ) ||
					! element.contains( targetToCheck )
				) {
					return false;
				}

				let elementToCheck: HTMLElement | null = targetToCheck;

				do {
					if ( elementToCheck.dataset.isDropZone ) {
						return elementToCheck === element;
					}
				} while ( ( elementToCheck = elementToCheck.parentElement ) );

				return false;
			}

			function maybeDragStart( event: DragEvent ): void {
				if ( isDragging ) {
					return;
				}

				isDragging = true;

				ownerDocument.addEventListener( 'dragend', maybeDragEnd );
				ownerDocument.addEventListener( 'mousemove', maybeDragEnd );

				if ( _onDragStart ) {
					onDragStartEvent( event );
				}
			}

			function onDragEnter( event: DragEvent ): void {
				event.preventDefault();

				if ( element.contains( event.relatedTarget as Node ) ) {
					return;
				}

				if ( _onDragEnter ) {
					onDragEnterEvent( event );
				}
			}

			function onDragOver( event: DragEvent ): void {
				if ( ! event.defaultPrevented && _onDragOver ) {
					onDragOverEvent( event );
				}

				event.preventDefault();
			}

			function onDragLeave( event: DragEvent ): void {
				if ( isElementInZone( event.relatedTarget ) ) {
					return;
				}

				if ( _onDragLeave ) {
					onDragLeaveEvent( event );
				}
			}

			function onDrop( event: DragEvent ): void {
				if ( event.defaultPrevented ) {
					return;
				}

				event.preventDefault();

				// eslint-disable-next-line no-unused-expressions
				event.dataTransfer && event.dataTransfer.files.length;

				if ( _onDrop ) {
					onDropEvent( event );
				}

				maybeDragEnd( event );
			}

			function maybeDragEnd( event: Event ): void {
				if ( ! isDragging ) {
					return;
				}

				isDragging = false;

				ownerDocument.removeEventListener( 'dragend', maybeDragEnd );
				ownerDocument.removeEventListener( 'mousemove', maybeDragEnd );

				if ( _onDragEnd ) {
					onDragEndEvent( event as MouseEvent );
				}
			}

			element.setAttribute( 'data-is-drop-zone', 'true' );
			element.addEventListener( 'drop', onDrop );
			element.addEventListener( 'dragenter', onDragEnter );
			element.addEventListener( 'dragover', onDragOver );
			element.addEventListener( 'dragleave', onDragLeave );
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
		[ isDisabled, dropZoneElement ]
	);
}
