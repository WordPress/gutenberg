import { isReusableBlock, isTemplatePart } from '@wordpress/blocks';
import { isTextField } from '@wordpress/dom';
import { ENTER, BACKSPACE, DELETE } from '@wordpress/keycodes';
import { useSelect, useDispatch } from '@wordpress/data';
import { useRefEffect } from '@wordpress/compose';
import { store as blockEditorStore } from '../../../store';
import { unlock } from '../../../lock-unlock';

// The distance of the dragged blocks from the pointer.
const PILE_OFFSET = 8;

function isColorTransparent( color ) {
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
 * @param {string} clientId Block client ID.
 */
export function useEventHandlers( { clientId, isSelected, isMultiSelected } ) {
	const {
		getBlockRootClientId,
		getSelectedBlockClientIds,
		canMoveBlocks,
		isZoomOut,
		hasMultiSelection,
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

	return useRefEffect(
		( node ) => {
			if ( ! isSelected && ! isMultiSelected ) {
				return;
			}

			/**
			 * Interprets keydown event intent to remove or insert after block if
			 * key event occurs on wrapper node. This can occur when the block has
			 * no text fields of its own, particularly after initial insertion, to
			 * allow for easy deletion and continuous writing flow to add additional
			 * content.
			 *
			 * @param {KeyboardEvent} event Keydown event.
			 */
			function onKeyDown( event ) {
				const { keyCode, target } = event;

				if (
					keyCode !== ENTER &&
					keyCode !== BACKSPACE &&
					keyCode !== DELETE
				) {
					return;
				}

				if ( target !== node || isTextField( target ) ) {
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
			 * @param {MouseEvent} event Mouse down event.
			 */
			function onMouseDown( event ) {
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
					node.parentElement.closest( '[contenteditable="true"]' ),
					event.target.closest( '[contenteditable="true"]' ),
				].filter( Boolean );

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
			function startPile( event, clientIds, rect, inverted ) {
				const { ownerDocument } = node;
				const index = clientIds.indexOf( clientId );
				const backNode = ownerDocument.querySelector(
					`[data-block="${
						clientIds[ index + 1 ] ?? clientIds[ index - 1 ]
					}"]`
				);
				// Scales a block down to a fixed diagonal.
				const cardScale = ( { width, height } ) =>
					Math.min( 1, 420 / Math.hypot( width, height ) );
				// Moves a block's top left corner to x, y, compensating for
				// scaling around the center.
				const toTransform = ( from, x, y, scale, turn = 0 ) =>
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

				let restoreBackNode;
				if ( backNode ) {
					const backRect = backNode.getBoundingClientRect();
					const backScale = cardScale( backRect );
					const backStyle = backNode.getAttribute( 'style' );
					const backId = backNode.id;
					const backClone = backNode.cloneNode();
					backClone.style.display = 'none';
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
							ownerDocument.defaultView.getComputedStyle(
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

				function positionCountBadge( clientX, clientY ) {
					countBadge.style.left = `${
						( clientX + PILE_OFFSET + width ) * inverted - 12
					}px`;
					countBadge.style.top = `${
						( clientY + PILE_OFFSET ) * inverted - 12
					}px`;
				}
				positionCountBadge( event.clientX, event.clientY );

				return {
					move( clientX, clientY ) {
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
			 * @param {DragEvent} event Drag event.
			 */
			function onDragStart( event ) {
				const { target } = event;
				const { activeElement } = node.ownerDocument;
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

				if ( ! isDirectBlockDrag && ! isMultiSelectionDrag ) {
					event.preventDefault();
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
				event.dataTransfer.effectAllowed = 'move'; // remove "+" cursor
				event.dataTransfer.clearData();
				event.dataTransfer.setData( 'wp-blocks', data );
				const { ownerDocument } = node;
				const { defaultView } = ownerDocument;
				const selection = defaultView.getSelection();
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
				event.dataTransfer.setDragImage( dragElement, 0, 0 );

				const rect = node.getBoundingClientRect();

				// Remove the id and leave it on a shallow clone so that drop
				// target calculations are correct.
				const id = node.id;
				const clone = node.cloneNode();
				clone.style.display = 'none';
				node.id = null;
				node.after( clone );

				let _scale = 1;

				{
					let parentElement = node;
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

				const originalNodeProperties = {};
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
				] ) {
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
					let parentElement = node;
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

				function dragOver( e ) {
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
						node.style[ property ] = value;
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

			// Blocks in a multi selection only get the drag handling; the
			// key and double click handling is for the selected block.
			if ( ! isSelected ) {
				return () => {
					node.removeEventListener( 'dragstart', onDragStart );
					node.removeEventListener( 'mousedown', onMouseDown );
				};
			}

			node.addEventListener( 'keydown', onKeyDown );

			/**
			 * Handles double-click events on section blocks to edit content only section.
			 *
			 * @param {MouseEvent} event Double-click event.
			 */
			function onDoubleClick( event ) {
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
				node.removeEventListener( 'dblclick', onDoubleClick );
			};
		},
		[
			clientId,
			isSelected,
			isMultiSelected,
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
			startDraggingBlocks,
			stopDraggingBlocks,
			isSectionBlock,
			editedContentOnlySection,
			editContentOnlySection,
		]
	);
}
