import type { ChildDragOptions } from '../../layouts/types';

/**
 * Starts dragging a block of a manual placement grid by its body. The grid
 * shows the cells the block will land in, so the block stays in place, dimmed,
 * instead of following the pointer, and the browser's drag image is a hidden
 * pixel.
 *
 * @param event                       The `dragstart` event.
 * @param options                     Options.
 * @param options.clientId            Client ID of the dragged block.
 * @param options.rootClientId        Client ID of the grid.
 * @param options.blockElement        The block's element in the canvas.
 * @param options.startDraggingBlocks Marks blocks as being dragged.
 * @param options.stopDraggingBlocks  Marks the drag as over.
 */
export function startGridItemDrag(
	event: DragEvent,
	{
		clientId,
		rootClientId,
		blockElement,
		startDraggingBlocks,
		stopDraggingBlocks,
	}: ChildDragOptions
) {
	// A `dragstart` event always has drag data.
	const dataTransfer = event.dataTransfer!;

	dataTransfer.effectAllowed = 'move'; // remove "+" cursor
	dataTransfer.clearData();
	dataTransfer.setData(
		'wp-blocks',
		JSON.stringify( {
			type: 'block',
			srcClientIds: [ clientId ],
			srcRootClientId: rootClientId,
		} )
	);

	const { ownerDocument } = blockElement;
	ownerDocument.defaultView!.getSelection()!.removeAllRanges();

	// Chrome shows a globe icon if the drag image has no dimensions.
	const dragElement = ownerDocument.createElement( 'div' );
	dragElement.style.width = '1px';
	dragElement.style.height = '1px';
	dragElement.style.position = 'fixed';
	dragElement.style.visibility = 'hidden';
	ownerDocument.body.appendChild( dragElement );
	dataTransfer.setDragImage( dragElement, 0, 0 );

	const originalOpacity = blockElement.style.opacity;
	blockElement.style.opacity = '0.5';

	// The grid's drop layer is in the editor's document, outside the canvas,
	// and a drop there can re-render the block, after which its `dragend` no
	// longer reaches the canvas. The drag ends on whichever comes first.
	const endTargets = new Set< EventTarget >( [
		ownerDocument,
		document,
		blockElement,
	] );

	// The grid's drop layer covers the block once dragging starts. Chrome
	// cancels a drag when that happens during `dragstart`, so it waits for
	// the first `dragover`.
	function startGridDrag() {
		ownerDocument.removeEventListener( 'dragover', startGridDrag );
		startDraggingBlocks( [ clientId ] );
		document.body.classList.add( 'is-dragging-components-draggable' );
		ownerDocument.documentElement.classList.add( 'is-dragging' );
	}

	function endGridDrag() {
		ownerDocument.removeEventListener( 'dragover', startGridDrag );
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
	ownerDocument.addEventListener( 'dragover', startGridDrag );
}
