import type { ChildDragOptions } from '../../layouts/types';

/**
 * The drag data type that marks a drag started from a grid item's drag handle.
 * Drag data can only be read on drop, but its types can be read while
 * dragging. Types are lowercase.
 */
const HANDLE_DRAG_TYPE = 'wp-grid-item-handle';

/**
 * The class of a grid's drop layer, which takes the drags over that grid.
 */
const DROP_LAYER_CLASS = 'block-editor-grid-visualizer__drop-layer';

/**
 * Where a touch drag from a grid item's drag handle is, whether it is moving,
 * dropped, or cancelled, and the drop layer of the innermost grid under it.
 */
export interface GridItemPointerDragEvent {
	type: 'move' | 'drop' | 'cancel';
	clientX: number;
	clientY: number;
	dropLayer: Element | undefined;
}

/**
 * Called as a touch drag from a grid item's drag handle moves, when it is
 * dropped, and when it is cancelled.
 */
export type GridItemPointerDragListener = (
	event: GridItemPointerDragEvent
) => void;

/**
 * Whether a drag event belongs to a drag started from a grid item's drag
 * handle, rather than from the block's body or anywhere else.
 *
 * @param event A drag event.
 *
 * @return Whether the drag started from a drag handle.
 */
export function isGridItemHandleDrag( event: DragEvent ) {
	return !! event.dataTransfer?.types?.includes( HANDLE_DRAG_TYPE );
}

/**
 * Starts dragging a block of a manual placement grid, from its body or from
 * its drag handle. The grid shows the cells the block will land in, so the
 * block stays in place, dimmed, instead of following the pointer, and the
 * browser's drag image is a hidden pixel.
 *
 * @param event                       The `dragstart` event.
 * @param options                     Options.
 * @param options.clientId            Client ID of the dragged block.
 * @param options.rootClientId        Client ID of the grid.
 * @param options.blockElement        The block's element in the canvas.
 * @param options.startDraggingBlocks Marks blocks as being dragged.
 * @param options.stopDraggingBlocks  Marks the drag as over.
 * @param options.isHandle            Whether the drag starts from the drag handle.
 */
export function startGridItemDrag(
	event: DragEvent,
	{
		clientId,
		rootClientId,
		blockElement,
		startDraggingBlocks,
		stopDraggingBlocks,
		isHandle = false,
	}: ChildDragOptions & {
		/** Whether the drag starts from the drag handle. */
		isHandle?: boolean;
	}
) {
	// A `dragstart` event always has drag data, and starts on the block or
	// on its handle.
	const dataTransfer = event.dataTransfer!;
	const target = event.target as Element;

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
	if ( isHandle ) {
		dataTransfer.setData( HANDLE_DRAG_TYPE, '1' );
	}

	// The canvas, and the editor around it when the drag starts on a handle
	// there.
	const { ownerDocument } = blockElement;
	const sourceDocument = target.ownerDocument;
	ownerDocument.defaultView!.getSelection()!.removeAllRanges();

	// Chrome shows a globe icon if the drag image has no dimensions.
	const dragElement = sourceDocument.createElement( 'div' );
	dragElement.style.width = '1px';
	dragElement.style.height = '1px';
	dragElement.style.position = 'fixed';
	dragElement.style.visibility = 'hidden';
	sourceDocument.body.appendChild( dragElement );
	dataTransfer.setDragImage( dragElement, 0, 0 );

	const originalOpacity = blockElement.style.opacity;
	blockElement.style.opacity = '0.5';

	// The grid's drop layer is in the editor's document, outside the canvas,
	// and a drop there can re-render the block, after which its `dragend` no
	// longer reaches the canvas. The drag ends on whichever comes first.
	const documents = new Set( [ ownerDocument, document ] );
	const endTargets = new Set< EventTarget >( [
		...documents,
		blockElement,
		target,
	] );

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

/**
 * The drop layers of the grids on screen, told where a touch drag from a drag
 * handle goes, since touch screens don't start the browser's drag and drop
 * from a handle.
 */
const pointerDragListeners = new Set< GridItemPointerDragListener >();

/**
 * Listens to touch drags started from grid item drag handles.
 *
 * @param listener Called as the drag moves, when it is dropped, and when it is cancelled.
 *
 * @return Stops listening.
 */
export function subscribeToGridItemPointerDrag(
	listener: GridItemPointerDragListener
): () => void {
	pointerDragListeners.add( listener );
	return () => {
		pointerDragListeners.delete( listener );
	};
}

/**
 * Starts dragging a block of a manual placement grid from its drag handle with
 * a touch. It follows the touch with pointer events and tells the grids' drop
 * layers, which work out the landing cells as they do for a drag with a mouse.
 * The block stays in place, dimmed.
 *
 * @param event                       The `pointerdown` event on the handle.
 * @param options                     Options.
 * @param options.clientId            Client ID of the dragged block.
 * @param options.blockElement        The block's element in the canvas.
 * @param options.handle              The drag handle.
 * @param options.startDraggingBlocks Marks blocks as being dragged.
 * @param options.stopDraggingBlocks  Marks the drag as over.
 */
export function startGridItemPointerDrag(
	event: PointerEvent,
	{
		clientId,
		blockElement,
		handle,
		startDraggingBlocks,
		stopDraggingBlocks,
	}: Omit< ChildDragOptions, 'rootClientId' > & {
		/** The drag handle. */
		handle: HTMLElement;
	}
) {
	const { pointerId } = event;
	// Keeps the drag going while the touch is over the canvas iframe, and
	// stops the press from selecting text. The toolbar the handle is in is
	// hidden while dragging, so the drag is followed from the handle's
	// document, which still gets the events if the capture is lost.
	handle.setPointerCapture( pointerId );
	event.preventDefault();
	const { ownerDocument } = handle;

	const originalOpacity = blockElement.style.opacity;
	let isStarted = false;

	// The drop layers are in the handle's document. The topmost one under the
	// touch is looked up once for all the grids.
	function notify(
		type: GridItemPointerDragEvent[ 'type' ],
		{ clientX, clientY }: Pick< PointerEvent, 'clientX' | 'clientY' >
	) {
		const dropLayer = ownerDocument
			.elementsFromPoint( clientX, clientY )
			.find( ( element ) =>
				element.classList.contains( DROP_LAYER_CLASS )
			);
		for ( const listener of pointerDragListeners ) {
			listener( { type, clientX, clientY, dropLayer } );
		}
	}

	function onPointerMove( moveEvent: PointerEvent ) {
		if ( moveEvent.pointerId !== pointerId ) {
			return;
		}
		// A tap on the handle doesn't start a drag.
		if ( ! isStarted ) {
			isStarted = true;
			blockElement.style.opacity = '0.5';
			startDraggingBlocks( [ clientId ] );
		}
		notify( 'move', moveEvent );
	}

	function end( endEvent: PointerEvent ) {
		if ( endEvent.pointerId !== pointerId ) {
			return;
		}
		ownerDocument.removeEventListener( 'pointermove', onPointerMove );
		ownerDocument.removeEventListener( 'pointerup', end );
		ownerDocument.removeEventListener( 'pointercancel', end );
		if ( ! isStarted ) {
			return;
		}
		notify( endEvent.type === 'pointerup' ? 'drop' : 'cancel', endEvent );
		blockElement.style.opacity = originalOpacity;
		stopDraggingBlocks();
	}

	ownerDocument.addEventListener( 'pointermove', onPointerMove );
	ownerDocument.addEventListener( 'pointerup', end );
	ownerDocument.addEventListener( 'pointercancel', end );
}
