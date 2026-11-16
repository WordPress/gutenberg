import { isReusableBlock, isTemplatePart } from '@wordpress/blocks';
import { isTextField } from '@wordpress/dom';
import { ENTER, BACKSPACE, DELETE } from '@wordpress/keycodes';
import { useSelect, useDispatch } from '@wordpress/data';
import { useRefEffect } from '@wordpress/compose';
import { store as blockEditorStore } from '../../../store';
import { unlock } from '../../../lock-unlock';

declare global {
	interface Window {
		/**
		 * Whether the "drag blocks from anywhere" experiment is enabled.
		 */
		__experimentalBlockDragFromAnywhere?: boolean;
	}
}

// The distance of the dragged blocks from the pointer.
const PILE_OFFSET = 8;

// Elements inside a block that keep their own pointer behaviour when blocks
// can be dragged from anywhere.
const INTERACTIVE_ELEMENTS =
	'button, input, textarea, select, label, summary, iframe, video, audio, [role="button"]';

/**
 * Whether the block is being edited: the caret, or keyboard focus, is in one
 * of its fields, as opposed to on the block itself or elsewhere.
 *
 * @param node The block's element.
 */
export function isEditingBlock( node: HTMLElement ) {
	const { ownerDocument } = node;
	const { activeElement } = ownerDocument;
	// A field of the block has focus. The block itself can be the field, as a
	// Paragraph is; otherwise focus on the block is not editing.
	if (
		activeElement &&
		node.contains( activeElement ) &&
		// Only the innermost block that contains the focus is being edited.
		activeElement.closest( '[data-block]' ) === node &&
		( ( activeElement as HTMLElement ).isContentEditable ||
			isTextField( activeElement ) ||
			activeElement !== node )
	) {
		return true;
	}
	// While a text block is selected, the writing flow wrapper is the editing
	// host and holds focus (see `useEditableRoot`), so the caret tells which
	// block is being edited.
	if ( ! node.classList.contains( 'is-selected' ) ) {
		return false;
	}
	// A document with a window has a selection.
	const anchor = ownerDocument.defaultView!.getSelection()!.anchorNode;
	const element =
		anchor?.nodeType === anchor?.ELEMENT_NODE
			? ( anchor as HTMLElement )
			: anchor?.parentElement;
	return (
		!! element &&
		node.contains( element ) &&
		element.closest( '[data-block]' ) === node &&
		element.isContentEditable
	);
}

/**
 * Places the caret at a point in the viewport, if the point is in an editable
 * field.
 *
 * @param doc The document.
 * @param x   Horizontal position within the viewport.
 * @param y   Vertical position within the viewport.
 */
function placeCaretAtPoint( doc: Document, x: number, y: number ) {
	let range: Range | null = null;
	if ( doc.caretPositionFromPoint ) {
		const point = doc.caretPositionFromPoint( x, y );
		if ( point ) {
			range = doc.createRange();
			range.setStart( point.offsetNode, point.offset );
			range.collapse( true );
		}
	} else if ( doc.caretRangeFromPoint ) {
		range = doc.caretRangeFromPoint( x, y );
	}
	const container = range?.startContainer;
	const element =
		container?.nodeType === container?.ELEMENT_NODE
			? ( container as Element )
			: container?.parentElement;
	const editable = element?.closest< HTMLElement >(
		'[contenteditable="true"]'
	);
	if ( ! range || ! editable ) {
		return;
	}
	editable.focus();
	// A document with a window has a selection.
	const selection = doc.defaultView!.getSelection()!;
	selection.removeAllRanges();
	selection.addRange( range );
}

function isColorTransparent( color: string ) {
	return ! color || color === 'transparent' || color === 'rgba(0, 0, 0, 0)';
}

/**
 * Adds block behaviour:
 *   - Removes the block on BACKSPACE.
 *   - Inserts a default block on ENTER.
 *   - Disables dragging of block contents.
 *
 * For a block that is part of a multi selection, only the drag handling is
 * added, so that dragging any of the selected blocks moves them all.
 *
 * @param options                 Options.
 * @param options.clientId        Block client ID.
 * @param options.isSelected      Whether the block is selected.
 * @param options.isMultiSelected Whether the block is part of a multi selection.
 */
export function useEventHandlers( {
	clientId,
	isSelected,
	isMultiSelected,
}: {
	clientId: string;
	isSelected?: boolean;
	isMultiSelected?: boolean;
} ) {
	const {
		getBlockRootClientId,
		getSelectedBlockClientIds,
		canMoveBlocks,
		isZoomOut,
		hasMultiSelection,
		canMoveBlock,
		hasSelectedInnerBlock,
		__unstableIsFullySelected,
		isSectionBlock,
		editedContentOnlySection,
		getBlock,
	} = unlock( useSelect( blockEditorStore ) );
	const {
		removeBlock,
		resetZoomLevel,
		startDraggingBlocks,
		stopDraggingBlocks,
		editContentOnlySection,
	} = unlock( useDispatch( blockEditorStore ) );

	const isDragFromAnywhere = !! window.__experimentalBlockDragFromAnywhere;

	return useRefEffect< HTMLElement >(
		( node ) => {
			if ( ! isSelected && ! isMultiSelected && ! isDragFromAnywhere ) {
				return;
			}

			// Whether the current press started a "drag from anywhere": a
			// press on a block that isn't being edited, which drags the block
			// if the pointer moves and puts the caret in it if it doesn't.
			let isPressToDrag = false;

			/**
			 * Lets the browser start a drag of the block from a press anywhere
			 * on it, text included, while the block isn't being edited. The
			 * fields under the press are taken out of editing for the length
			 * of the press, so the browser drags the draggable block instead
			 * of placing a caret or selecting text. If the press ends without
			 * a drag, the caret goes where the press was, as a click would
			 * have put it, and from then on the block is being edited, so
			 * dragging over its text selects text again.
			 *
			 * @param event Mouse down event.
			 */
			function onPressToDrag( event: MouseEvent ) {
				// Mouse events target elements.
				const target = event.target as HTMLElement;
				// A double click needs no check of its own: the first click
				// puts the caret in the block, so the second press is left to
				// the browser, which selects a word.
				if (
					event.button !== 0 ||
					event.shiftKey ||
					event.metaKey ||
					event.ctrlKey ||
					event.altKey ||
					// The innermost block under the press handles it.
					target.closest( '[data-block]' ) !== node ||
					! canMoveBlock( clientId ) ||
					hasSelectedInnerBlock( clientId, true ) ||
					hasMultiSelection() ||
					isEditingBlock( node ) ||
					target.closest( INTERACTIVE_ELEMENTS )
				) {
					return;
				}

				const { ownerDocument } = node;
				const editables = [
					// The writing flow wrapper, while it is the editing host
					// for a selected text block (see `useEditableRoot`).
					node.parentElement?.closest< HTMLElement >(
						'[contenteditable="true"]'
					),
					target.closest< HTMLElement >( '[contenteditable="true"]' ),
					...Array.from(
						node.querySelectorAll< HTMLElement >(
							'[contenteditable="true"]'
						)
					),
				].filter(
					( element, index, all ): element is HTMLElement =>
						!! element && all.indexOf( element ) === index
				);

				if ( ! editables.length ) {
					// Nothing to take out of editing: a block without fields,
					// such as an Image, drags from a press already once it's
					// focused, and focusing it is what a press does.
					isPressToDrag = true;
					const reset = () => {
						isPressToDrag = false;
						ownerDocument.removeEventListener( 'mouseup', reset );
						ownerDocument.removeEventListener( 'dragend', reset );
					};
					ownerDocument.addEventListener( 'mouseup', reset );
					ownerDocument.addEventListener( 'dragend', reset );
					return;
				}

				isPressToDrag = true;
				for ( const element of editables ) {
					element.contentEditable = 'false';
				}
				// Rich text unsets `draggable` on a block that is itself the
				// editable field, such as a Paragraph, and a press in a field
				// takes it off the block (`useFirefoxDraggableCompatibility`),
				// so it is set here for the length of the press.
				const hadDraggable = node.getAttribute( 'draggable' );
				node.setAttribute( 'draggable', 'true' );
				node.classList.add( 'is-pressed-to-drag' );

				let hasDragged = false;
				const { clientX, clientY } = event;

				function onDragStarted() {
					hasDragged = true;
				}

				function restore() {
					isPressToDrag = false;
					node.classList.remove( 'is-pressed-to-drag' );
					if ( hadDraggable === null ) {
						node.removeAttribute( 'draggable' );
					} else {
						node.setAttribute( 'draggable', hadDraggable );
					}
					for ( const element of editables ) {
						element.contentEditable = 'true';
					}
					ownerDocument.removeEventListener( 'mouseup', onRelease );
					ownerDocument.removeEventListener(
						'dragstart',
						onDragStarted
					);
					ownerDocument.removeEventListener( 'dragend', restore );
				}

				function onRelease() {
					restore();
					if ( ! hasDragged ) {
						placeCaretAtPoint( ownerDocument, clientX, clientY );
					}
				}

				ownerDocument.addEventListener( 'mouseup', onRelease );
				ownerDocument.addEventListener( 'dragstart', onDragStarted );
				ownerDocument.addEventListener( 'dragend', restore );
			}

			/**
			 * Interprets keydown event intent to remove or insert after block if
			 * key event occurs on wrapper node. This can occur when the block has
			 * no text fields of its own, particularly after initial insertion, to
			 * allow for easy deletion and continuous writing flow to add additional
			 * content.
			 *
			 * @param event Keydown event.
			 */
			function onKeyDown( event: KeyboardEvent ) {
				const { keyCode, target } = event;

				if (
					keyCode !== ENTER &&
					keyCode !== BACKSPACE &&
					keyCode !== DELETE
				) {
					return;
				}

				// Key events target elements.
				if ( target !== node || isTextField( target as Element ) ) {
					return;
				}

				if ( keyCode === ENTER ) {
					if ( isZoomOut() ) {
						event.preventDefault();
						resetZoomLevel();
					}
				} else {
					event.preventDefault();
					removeBlock( clientId );
				}
			}

			/**
			 * Lets the browser start a drag of the block from any press
			 * inside a fully selected multi-selection. The canvas is an
			 * editing host while blocks are multi-selected, and inside an
			 * editing host the browser places a caret on press instead of
			 * dragging the draggable block, so the host and the pressed
			 * field are taken out of editing for the length of the press.
			 *
			 * @param event Mouse down event.
			 */
			function onMouseDown( event: MouseEvent ) {
				if (
					event.button !== 0 ||
					event.shiftKey ||
					event.metaKey ||
					event.ctrlKey ||
					event.altKey ||
					! isMultiSelected ||
					! hasMultiSelection() ||
					! __unstableIsFullySelected() ||
					! canMoveBlocks( getSelectedBlockClientIds() )
				) {
					return;
				}

				const { ownerDocument } = node;
				// Multi-selected blocks are not draggable by themselves;
				// the pressed one is, for the length of the press.
				const hadDraggable = node.getAttribute( 'draggable' );
				node.setAttribute( 'draggable', 'true' );
				const editables = [
					// A rendered block has a parent.
					node.parentElement!.closest< HTMLElement >(
						'[contenteditable="true"]'
					),
					// Mouse events target elements.
					( event.target as Element ).closest< HTMLElement >(
						'[contenteditable="true"]'
					),
					// `Boolean` drops the missing editing hosts.
				].filter( Boolean ) as HTMLElement[];

				for ( const element of editables ) {
					element.contentEditable = 'false';
				}

				function restore() {
					if ( hadDraggable === null ) {
						node.removeAttribute( 'draggable' );
					} else {
						node.setAttribute( 'draggable', hadDraggable );
					}
					for ( const element of editables ) {
						element.contentEditable = 'true';
					}
					ownerDocument.removeEventListener( 'mouseup', restore );
					ownerDocument.removeEventListener( 'dragend', restore );
				}

				ownerDocument.addEventListener( 'mouseup', restore );
				ownerDocument.addEventListener( 'dragend', restore );
			}

			// Adds the multi-selection drag visuals to the pressed block that
			// the block drag lifts: its top left corner hangs just below and
			// right of the pointer, so the pointer stays over the drop
			// targets, the next selected block peeks out from underneath it,
			// and a count of the dragged blocks sits on its top right corner.
			function startPile(
				event: DragEvent,
				clientIds: string[],
				rect: DOMRect,
				inverted: number
			) {
				const { ownerDocument } = node;
				const index = clientIds.indexOf( clientId );
				const backNode = ownerDocument.querySelector< HTMLElement >(
					`[data-block="${
						clientIds[ index + 1 ] ?? clientIds[ index - 1 ]
					}"]`
				);
				// Scales a block down to a fixed diagonal.
				const cardScale = ( { width, height }: DOMRect ) =>
					Math.min( 1, 420 / Math.hypot( width, height ) );
				// Moves a block's top left corner to x, y, compensating for
				// scaling around the center.
				const toTransform = (
					from: DOMRect,
					x: number,
					y: number,
					scale: number,
					turn = 0
				) =>
					`translate(${
						( x - from.left - ( from.width * ( 1 - scale ) ) / 2 ) *
						inverted
					}px, ${
						( y - from.top - ( from.height * ( 1 - scale ) ) / 2 ) *
						inverted
					}px) scale(${ scale }) rotate(${ turn }deg)`;
				const left = event.clientX + PILE_OFFSET;
				const top = event.clientY + PILE_OFFSET;
				const scale = cardScale( rect );
				const width = rect.width * scale;
				const height = rect.height * scale;

				// Hides the rest of the selection and keeps the slot styling
				// off the cards.
				ownerDocument.documentElement.dataset.dragPile = 'true';
				node.dataset.dragPile = 'true';
				node.style.transformOrigin = '50% 50%';
				node.style.transform = toTransform( rect, left, top, scale );
				node.style.opacity = '';

				let restoreBackNode: ( () => void ) | undefined;
				if ( backNode ) {
					const backRect = backNode.getBoundingClientRect();
					const backScale = cardScale( backRect );
					const backStyle = backNode.getAttribute( 'style' );
					const backId = backNode.id;
					// A shallow clone of an element is an element.
					const backClone = backNode.cloneNode() as HTMLElement;
					backClone.style.display = 'none';
					// @ts-expect-error Bug: assigning `null` sets the id to the string `null`.
					backNode.id = null;
					backNode.after( backClone );
					backNode.dataset.dragPile = 'true';
					restoreBackNode = () => {
						backNode.setAttribute( 'style', backStyle ?? '' );
						delete backNode.dataset.dragPile;
						backNode.id = backId;
						backClone.remove();
					};

					const { style } = backNode;
					if (
						isColorTransparent(
							// A rendered block's document has a window.
							ownerDocument.defaultView!.getComputedStyle(
								backNode
							).backgroundColor
						)
					) {
						style.backgroundColor = node.style.backgroundColor;
					}
					// Slides out to the left with its bottom edge peeking out
					// below the pressed block.
					style.transition = 'transform 0.2s ease-out';
					style.transform = toTransform(
						backRect,
						left - 12,
						top + height + 24 - backRect.height * backScale,
						backScale,
						1.5
					);
				}

				const countBadge = ownerDocument.createElement( 'div' );
				countBadge.className = 'block-editor-block-list__drag-count';
				countBadge.textContent = String( clientIds.length );
				ownerDocument.body.appendChild( countBadge );

				function positionCountBadge(
					clientX: number,
					clientY: number
				) {
					countBadge.style.left = `${
						( clientX + PILE_OFFSET + width ) * inverted - 12
					}px`;
					countBadge.style.top = `${
						( clientY + PILE_OFFSET ) * inverted - 12
					}px`;
				}
				positionCountBadge( event.clientX, event.clientY );

				return {
					move( clientX: number, clientY: number ) {
						if ( backNode ) {
							backNode.style.pointerEvents = 'none';
							backNode.style.top = node.style.top;
							backNode.style.left = node.style.left;
						}
						positionCountBadge( clientX, clientY );
					},
					end() {
						delete ownerDocument.documentElement.dataset.dragPile;
						delete node.dataset.dragPile;
						restoreBackNode?.();
						countBadge.remove();
					},
				};
			}

			/**
			 * Prevents default dragging behavior within a block, except when
			 * the block is part of a multi selection (then the drag moves
			 * all selected blocks).
			 * To do: we must handle partial selections in the future and
			 * clean up the drag target.
			 *
			 * @param event Drag event.
			 */
			function onDragStart( event: DragEvent ) {
				// Checked to be an element below, before it is used as one.
				const target = event.target as Element;
				const { activeElement } = node.ownerDocument;
				// A nested block has already claimed this drag. Drag events
				// from the browser carry a data transfer.
				if ( event.dataTransfer!.types.includes( 'wp-blocks' ) ) {
					return;
				}
				// The drag of a press anywhere on a block that isn't being
				// edited (see `onPressToDrag`).
				const isPressDrag =
					isPressToDrag &&
					! hasMultiSelection() &&
					target.nodeType === target.ELEMENT_NODE &&
					target.closest( '[draggable="true"]' ) === node;
				// The drag may start on an image, which is draggable by
				// default: it is the block's drag as long as no nested
				// draggable, such as an inner block, is closer to the source.
				// The data and the drag image set below replace the image's.
				// A selection drag, whose source Firefox reports as the text
				// node, is not the block's.
				const isDirectBlockDrag =
					! node.isContentEditable &&
					activeElement === node &&
					! hasMultiSelection() &&
					target.nodeType === target.ELEMENT_NODE &&
					target.closest( '[draggable="true"]' ) === node;
				// When multiple blocks are selected, dragging any of them
				// moves the whole selection, the same way dragging the drag
				// handle in the block toolbar does.
				const isMultiSelectionDrag =
					isMultiSelected &&
					hasMultiSelection() &&
					__unstableIsFullySelected() &&
					canMoveBlocks( getSelectedBlockClientIds() );

				if (
					! isDirectBlockDrag &&
					! isMultiSelectionDrag &&
					! isPressDrag
				) {
					// Blocks that are neither selected nor multi-selected only
					// listen for drags from anywhere; any other drag in them is
					// left to the selected block or the browser.
					if ( ! isSelected && ! isMultiSelected ) {
						return;
					}
					// Rich text carries a drag of the text selected in a field.
					// Drag events from the browser carry a data transfer.
					if ( ! event.dataTransfer!.types.includes( 'rich-text' ) ) {
						event.preventDefault();
					}
					return;
				}
				const clientIds = isMultiSelectionDrag
					? getSelectedBlockClientIds()
					: [ clientId ];
				const data = JSON.stringify( {
					type: 'block',
					srcClientIds: clientIds,
					srcRootClientId: getBlockRootClientId( clientIds[ 0 ] ),
				} );
				// Drag events from the browser carry a data transfer.
				const dataTransfer = event.dataTransfer!;
				dataTransfer.effectAllowed = 'move'; // remove "+" cursor
				dataTransfer.clearData();
				dataTransfer.setData( 'wp-blocks', data );
				const { ownerDocument } = node;
				// A rendered block's document has a window with a selection.
				const defaultView = ownerDocument.defaultView!;
				const selection = defaultView.getSelection()!;
				selection.removeAllRanges();

				// Setting the drag chip as the drag image actually works, but
				// the behaviour is slightly different in every browser. In
				// Safari, it animates, in Firefox it's slightly transparent...
				// So we set a fake drag image and have to reposition it
				// ourselves.
				const dragElement = ownerDocument.createElement( 'div' );
				// Chrome will show a globe icon if the drag element does not
				// have dimensions.
				dragElement.style.width = '1px';
				dragElement.style.height = '1px';
				dragElement.style.position = 'fixed';
				dragElement.style.visibility = 'hidden';
				ownerDocument.body.appendChild( dragElement );
				dataTransfer.setDragImage( dragElement, 0, 0 );

				const rect = node.getBoundingClientRect();

				// Remove the id and leave it on a shallow clone so that drop
				// target calculations are correct.
				const id = node.id;
				// A clone of an element is an element.
				const clone = node.cloneNode() as HTMLElement;
				clone.style.display = 'none';
				// @ts-expect-error Bug: this sets the ID to `"null"`, not removes it.
				node.id = null;
				node.after( clone );

				let _scale = 1;

				{
					let parentElement: HTMLElement | null = node;
					while ( ( parentElement = parentElement.parentElement ) ) {
						const { scale } =
							defaultView.getComputedStyle( parentElement );
						if ( scale && scale !== 'none' ) {
							_scale = parseFloat( scale );
							break;
						}
					}
				}

				const inverted = 1 / _scale;

				const originalNodeProperties: Record< string, string > = {};
				for ( const property of [
					'transform',
					'transformOrigin',
					'transition',
					'zIndex',
					'position',
					'top',
					'left',
					'pointerEvents',
					'opacity',
					'backgroundColor',
					// The names are style properties.
				] as const ) {
					originalNodeProperties[ property ] = node.style[ property ];
				}

				// Get scroll position.
				const originScrollTop = defaultView.scrollY;
				const originScrollLeft = defaultView.scrollX;
				const originClientX = event.clientX;
				const originClientY = event.clientY;

				// We can't use position fixed because it will behave different
				// if the html element is scaled or transformed (position will
				// no longer be relative to the viewport). The downside of
				// relative is that we have to listen to scroll events. On the
				// upside we don't have to clone to keep a space. Absolute
				// positioning might be weird because it will be based on the
				// positioned parent, but it might be worth a try.
				node.style.position = 'relative';
				node.style.top = `${ 0 }px`;
				node.style.left = `${ 0 }px`;

				const originX = event.clientX - rect.left;
				const originY = event.clientY - rect.top;

				// Scale everything to 200px.
				const dragScale = rect.height > 200 ? 200 / rect.height : 1;

				node.style.zIndex = '1000';
				node.style.transformOrigin = `${ originX * inverted }px ${
					originY * inverted
				}px`;
				node.style.transition = 'transform 0.2s ease-out';
				node.style.transform = `scale(${ dragScale })`;
				node.style.opacity = '0.9';

				// If the block has no background color, use the parent's
				// background color.
				if (
					isColorTransparent(
						defaultView.getComputedStyle( node ).backgroundColor
					)
				) {
					let bgColor = 'transparent';
					let parentElement: HTMLElement | null = node;
					while ( ( parentElement = parentElement.parentElement ) ) {
						const { backgroundColor } =
							defaultView.getComputedStyle( parentElement );
						if ( ! isColorTransparent( backgroundColor ) ) {
							bgColor = backgroundColor;
							break;
						}
					}

					node.style.backgroundColor = bgColor;
				}

				const pile = isMultiSelectionDrag
					? startPile( event, clientIds, rect, inverted )
					: undefined;

				let hasStarted = false;
				let lastClientX = originClientX;
				let lastClientY = originClientY;

				function dragOver( e: DragEvent ) {
					// Only trigger `over` if the mouse has moved.
					if (
						e.clientX === lastClientX &&
						e.clientY === lastClientY
					) {
						return;
					}
					lastClientX = e.clientX;
					lastClientY = e.clientY;
					over();
				}

				function over() {
					if ( ! hasStarted ) {
						hasStarted = true;
						node.style.pointerEvents = 'none';
					}
					const pointerYDelta = lastClientY - originClientY;
					const pointerXDelta = lastClientX - originClientX;
					const scrollTop = defaultView.scrollY;
					const scrollLeft = defaultView.scrollX;
					const scrollTopDelta = scrollTop - originScrollTop;
					const scrollLeftDelta = scrollLeft - originScrollLeft;
					const topDelta = pointerYDelta + scrollTopDelta;
					const leftDelta = pointerXDelta + scrollLeftDelta;
					node.style.top = `${ topDelta * inverted }px`;
					node.style.left = `${ leftDelta * inverted }px`;
					pile?.move( lastClientX, lastClientY );
				}

				function end() {
					ownerDocument.removeEventListener( 'dragover', dragOver );
					ownerDocument.removeEventListener( 'dragend', end );
					ownerDocument.removeEventListener( 'drop', end );
					ownerDocument.removeEventListener( 'scroll', over );
					for ( const [ property, value ] of Object.entries(
						originalNodeProperties
					) ) {
						// These are the style properties saved above.
						( node.style as unknown as Record< string, string > )[
							property
						] = value;
					}
					clone.remove();
					node.id = id;
					pile?.end();
					dragElement.remove();
					stopDraggingBlocks();
					document.body.classList.remove(
						'is-dragging-components-draggable'
					);
					ownerDocument.documentElement.classList.remove(
						'is-dragging'
					);
				}

				ownerDocument.addEventListener( 'dragover', dragOver );
				ownerDocument.addEventListener( 'dragend', end );
				ownerDocument.addEventListener( 'drop', end );
				ownerDocument.addEventListener( 'scroll', over );

				startDraggingBlocks( clientIds );
				// Important because it hides the block toolbar.
				document.body.classList.add(
					'is-dragging-components-draggable'
				);
				ownerDocument.documentElement.classList.add( 'is-dragging' );
			}

			node.addEventListener( 'dragstart', onDragStart );
			node.addEventListener( 'mousedown', onMouseDown );
			if ( isDragFromAnywhere ) {
				node.addEventListener( 'mousedown', onPressToDrag );
			}

			// Blocks in a multi selection, and with drag from anywhere every
			// other block, only get the drag handling; the key and double
			// click handling is for the selected block.
			if ( ! isSelected ) {
				return () => {
					node.removeEventListener( 'dragstart', onDragStart );
					node.removeEventListener( 'mousedown', onMouseDown );
					node.removeEventListener( 'mousedown', onPressToDrag );
				};
			}

			node.addEventListener( 'keydown', onKeyDown );

			/**
			 * Handles double-click events on section blocks to edit content only section.
			 *
			 * @param event Double-click event.
			 */
			function onDoubleClick( event: MouseEvent ) {
				const isSection = isSectionBlock( clientId );
				const block = getBlock( clientId );
				const isSyncedPattern = isReusableBlock( block );
				const isTemplatePartBlock = isTemplatePart( block );
				const isAlreadyEditing = editedContentOnlySection === clientId;

				if (
					! isSection ||
					isAlreadyEditing ||
					isSyncedPattern ||
					isTemplatePartBlock
				) {
					return;
				}

				event.preventDefault();
				editContentOnlySection( clientId );
			}

			node.addEventListener( 'dblclick', onDoubleClick );

			return () => {
				node.removeEventListener( 'keydown', onKeyDown );
				node.removeEventListener( 'dragstart', onDragStart );
				node.removeEventListener( 'mousedown', onMouseDown );
				node.removeEventListener( 'mousedown', onPressToDrag );
				node.removeEventListener( 'dblclick', onDoubleClick );
			};
		},
		[
			clientId,
			isSelected,
			isMultiSelected,
			isDragFromAnywhere,
			getBlockRootClientId,
			getSelectedBlockClientIds,
			getBlock,
			isReusableBlock,
			isTemplatePart,
			removeBlock,
			isZoomOut,
			resetZoomLevel,
			hasMultiSelection,
			canMoveBlocks,
			canMoveBlock,
			hasSelectedInnerBlock,
			startDraggingBlocks,
			stopDraggingBlocks,
			isSectionBlock,
			editedContentOnlySection,
			editContentOnlySection,
		]
	);
}
