/**
 * The drag data type that marks a drag started from a grid item's drag handle.
 * Drag data can only be read on drop, but its types can be read while
 * dragging. Types are lowercase.
 */
const HANDLE_DRAG_TYPE = 'wp-grid-item-handle';

/**
 * Whether a drag event belongs to a drag started from a grid item's drag
 * handle, rather than from the block's body or anywhere else.
 *
 * @param {DragEvent} event A drag event.
 *
 * @return {boolean} Whether the drag started from a drag handle.
 */
export function isGridItemHandleDrag( event ) {
	return !! event.dataTransfer?.types?.includes( HANDLE_DRAG_TYPE );
}

/**
 * Starts dragging a block of a manual placement grid, from its body or from
 * its drag handle. The grid shows the cells the block will land in, so the
 * block stays in place, dimmed, instead of following the pointer, and the
 * browser's drag image is a hidden pixel.
 *
 * @param {DragEvent}                     event                       The `dragstart` event.
 * @param {Object}                        options
 * @param {string}                        options.clientId            Client ID of the dragged block.
 * @param {string}                        options.rootClientId        Client ID of the grid.
 * @param {HTMLElement}                   options.blockElement        The block's element in the canvas.
 * @param {(clientIds: string[]) => void} options.startDraggingBlocks Marks blocks as being dragged.
 * @param {() => void}                    options.stopDraggingBlocks  Marks the drag as over.
 */
export function startGridItemDrag(
	event,
	{
		clientId,
		rootClientId,
		blockElement,
		startDraggingBlocks,
		stopDraggingBlocks,
	}
) {
	event.dataTransfer.effectAllowed = 'move'; // remove "+" cursor
	event.dataTransfer.clearData();
	event.dataTransfer.setData(
		'wp-blocks',
		JSON.stringify( {
			type: 'block',
			srcClientIds: [ clientId ],
			srcRootClientId: rootClientId,
		} )
	);
	if ( event.target !== blockElement ) {
		event.dataTransfer.setData( HANDLE_DRAG_TYPE, '1' );
	}

	// The canvas, and the editor around it when the drag starts on a handle
	// there.
	const { ownerDocument } = blockElement;
	const sourceDocument = event.target.ownerDocument;
	ownerDocument.defaultView.getSelection().removeAllRanges();

	// Chrome shows a globe icon if the drag image has no dimensions.
	const dragElement = sourceDocument.createElement( 'div' );
	dragElement.style.width = '1px';
	dragElement.style.height = '1px';
	dragElement.style.position = 'fixed';
	dragElement.style.visibility = 'hidden';
	sourceDocument.body.appendChild( dragElement );
	event.dataTransfer.setDragImage( dragElement, 0, 0 );

	const originalOpacity = blockElement.style.opacity;
	blockElement.style.opacity = '0.5';

	// The grid's drop layer is in the editor's document, outside the canvas,
	// and a drop there can re-render the block, after which its `dragend` no
	// longer reaches the canvas. The drag ends on whichever comes first.
	const documents = new Set( [ ownerDocument, document ] );
	const endTargets = new Set( [ ...documents, blockElement, event.target ] );

	// The grid's drop layer covers the block once dragging starts. Chrome
	// cancels a drag when that happens during `dragstart`, so it waits for
	// the first `dragover`, over the canvas or the editor around it.
	function startGridDrag() {
		for ( const startTarget of documents ) {
			startTarget.removeEventListener( 'dragover', startGridDrag );
		}
		startDraggingBlocks( [ clientId ] );
		document.body.classList.add( 'is-dragging-components-draggable' );
		ownerDocument.documentElement.classList.add( 'is-dragging' );
	}

	function endGridDrag() {
		for ( const startTarget of documents ) {
			startTarget.removeEventListener( 'dragover', startGridDrag );
		}
		for ( const endTarget of endTargets ) {
			endTarget.removeEventListener( 'dragend', endGridDrag );
			endTarget.removeEventListener( 'drop', endGridDrag );
		}
		blockElement.style.opacity = originalOpacity;
		dragElement.remove();
		stopDraggingBlocks();
		document.body.classList.remove( 'is-dragging-components-draggable' );
		ownerDocument.documentElement.classList.remove( 'is-dragging' );
	}

	for ( const endTarget of endTargets ) {
		endTarget.addEventListener( 'dragend', endGridDrag );
		endTarget.addEventListener( 'drop', endGridDrag );
	}
	for ( const startTarget of documents ) {
		startTarget.addEventListener( 'dragover', startGridDrag );
	}
}
