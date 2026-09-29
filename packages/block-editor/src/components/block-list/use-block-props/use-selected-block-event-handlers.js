import { isReusableBlock, isTemplatePart } from '@wordpress/blocks';
import { isTextField } from '@wordpress/dom';
import { ENTER, BACKSPACE, DELETE, ESCAPE } from '@wordpress/keycodes';
import { useSelect, useDispatch } from '@wordpress/data';
import { useRefEffect } from '@wordpress/compose';
import { store as blockEditorStore } from '../../../store';
import { unlock } from '../../../lock-unlock';

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
		isZoomOut,
		hasMultiSelection,
		isSectionBlock,
		editedContentOnlySection,
		getBlock,
	} = unlock( useSelect( blockEditorStore ) );
	const {
		multiSelect,
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
			 * Starts a multi-selection drag from plain mouse events. The
			 * browser only starts a native drag by itself when the press
			 * lands exactly on selected text, which makes dragging a multi
			 * selection unreliable. From the movement threshold on, this
			 * drives the exact same machinery as a native drag: a synthetic
			 * dragstart runs the handler below, and synthetic dragover and
			 * drop events feed the drop zones and the insertion indicator.
			 *
			 * @param {MouseEvent} event Mouse down event.
			 */
			function onMouseDown( event ) {
				if ( event.button !== 0 || ! hasMultiSelection() ) {
					return;
				}

				// Shift and other modifiers adjust the selection; those
				// presses keep their native behavior.
				if (
					event.shiftKey ||
					event.metaKey ||
					event.ctrlKey ||
					event.altKey
				) {
					return;
				}

				// Without a constructable DataTransfer (older Safari) the
				// synthetic flow cannot carry the block payload; the native
				// press-on-text drag remains the only path there.
				if ( typeof window.DataTransfer !== 'function' ) {
					return;
				}

				// The press either drags the selection or collapses it on
				// click; it never starts a text selection or moves the
				// caret. Preventing the default also stops the browser
				// from starting its own selection gesture, which Safari
				// otherwise keeps extending during the drag.
				event.preventDefault();

				const { ownerDocument } = node;
				const startX = event.clientX;
				const startY = event.clientY;
				const selectedClientIds = getSelectedBlockClientIds();
				let dragging = false;
				let dataTransfer = null;

				function dispatchDragEvent( type, e, target ) {
					const dragEvent = new window.DragEvent( type, {
						bubbles: true,
						cancelable: true,
						clientX: e.clientX,
						clientY: e.clientY,
						dataTransfer,
					} );
					( target ?? node ).dispatchEvent( dragEvent );
				}

				// Pressing on selected text also makes the browser start
				// its own drag of the selection, but only when the press
				// lands exactly on the glyphs, and the two drags would
				// fight over the same gesture. Cancel the native drag for
				// the length of the press; the synthetic one below handles
				// every press the same way.
				function suppressNativeDragStart( e ) {
					if ( e.isTrusted ) {
						e.preventDefault();
						e.stopImmediatePropagation();
					}
				}

				function onMouseMove( e ) {
					if ( ! dragging ) {
						if (
							Math.abs( e.clientX - startX ) < 5 &&
							Math.abs( e.clientY - startY ) < 5
						) {
							return;
						}
						dragging = true;
						dataTransfer = new window.DataTransfer();
						// The press placed the caret where it landed, which
						// collapses the multi selection to that block. Now
						// that the press is a drag, not a click, restore the
						// selection from before the press so the whole
						// selection is dragged and stays selected after the
						// drop.
						multiSelect(
							selectedClientIds[ 0 ],
							selectedClientIds[ selectedClientIds.length - 1 ]
						);
						// The handler is called directly instead of through
						// a dispatched dragstart event: automation tools
						// watch dragstart events to decide whether a native
						// drag session follows, and would wait forever on
						// one that is dispatched from a script.
						onDragStart( {
							target: node,
							clientX: startX,
							clientY: startY,
							dataTransfer,
							preventDefault() {},
						} );
					}
					// Stop the press from growing a text selection while
					// the blocks are being dragged.
					e.preventDefault();
					const under = ownerDocument.elementFromPoint(
						e.clientX,
						e.clientY
					);
					dispatchDragEvent( 'dragover', e, under ?? node );
				}

				function suppressNextClick( e ) {
					e.preventDefault();
					e.stopPropagation();
				}

				function onMouseUp( e ) {
					if ( ! dragging ) {
						// The prevented press also prevented the browser
						// from placing the caret for the coming click;
						// place it where the press landed, so collapsing
						// the selection by clicking keeps putting the
						// caret at the click position.
						const selection =
							ownerDocument.defaultView.getSelection();
						const position = ownerDocument.caretPositionFromPoint?.(
							e.clientX,
							e.clientY
						);

						if ( position ) {
							selection.setPosition(
								position.offsetNode,
								position.offset
							);
						} else {
							const range = ownerDocument.caretRangeFromPoint?.(
								e.clientX,
								e.clientY
							);

							if ( range ) {
								selection.removeAllRanges();
								selection.addRange( range );
							}
						}
					}
					if ( dragging ) {
						const under = ownerDocument.elementFromPoint(
							e.clientX,
							e.clientY
						);
						dispatchDragEvent(
							'drop',
							e,
							under ?? ownerDocument.body
						);
						// The press placed a caret where it landed. Remove
						// it and select the dropped blocks, so the caret
						// does not pull the selection to its block once the
						// drag is over.
						ownerDocument.defaultView
							.getSelection()
							.removeAllRanges();
						multiSelect(
							selectedClientIds[ 0 ],
							selectedClientIds[ selectedClientIds.length - 1 ]
						);
						// The click after the drop would collapse the multi
						// selection to the pressed block.
						ownerDocument.addEventListener(
							'click',
							suppressNextClick,
							{ capture: true, once: true }
						);
					}
					cleanup();
				}

				function onDragKeyDown( e ) {
					if ( e.keyCode !== ESCAPE ) {
						return;
					}
					if ( dragging ) {
						// Ends the visuals and lets the drop zones clear
						// the insertion indicator.
						dispatchDragEvent( 'dragend', e );
					}
					cleanup();
				}

				function cleanup() {
					ownerDocument.removeEventListener(
						'dragstart',
						suppressNativeDragStart,
						{ capture: true }
					);
					ownerDocument.removeEventListener(
						'mousemove',
						onMouseMove
					);
					ownerDocument.removeEventListener( 'mouseup', onMouseUp );
					ownerDocument.removeEventListener(
						'keydown',
						onDragKeyDown
					);
				}

				ownerDocument.addEventListener(
					'dragstart',
					suppressNativeDragStart,
					{ capture: true }
				);
				ownerDocument.addEventListener( 'mousemove', onMouseMove );
				ownerDocument.addEventListener( 'mouseup', onMouseUp );
				ownerDocument.addEventListener( 'keydown', onDragKeyDown );
			}

			/**
			 * Starts the visuals of a multi-selection drag: the pressed
			 * block hangs below and right of the pointer, the next block
			 * of the selection slides out from underneath it, slightly
			 * turned, and a count of all dragged blocks sits on its top
			 * right corner. The rest of the selection hides in place.
			 *
			 * @param {DragEvent}   event       Drag event.
			 * @param {string[]}    clientIds   The dragged block client IDs.
			 * @param {HTMLElement} dragElement The fake drag image element.
			 */
			function startPileDrag( event, clientIds, dragElement ) {
				const { ownerDocument } = node;
				const { defaultView } = ownerDocument;
				const blockNodes = clientIds
					.map( ( selectedClientId ) =>
						ownerDocument.querySelector(
							`[data-block="${ selectedClientId }"]`
						)
					)
					.filter( Boolean );

				// The pressed block is the drag visual. The block after it
				// (or before it, for the last block) slides out from
				// underneath, so the visual reads as a stack. The rest of
				// the selection hides in place.
				const anchorPlace = blockNodes.indexOf( node );
				const backNode =
					blockNodes[ anchorPlace + 1 ] ??
					blockNodes[ anchorPlace - 1 ];
				const pileNodes = backNode ? [ node, backNode ] : [ node ];
				const restNodes = blockNodes.filter(
					( blockNode ) => ! pileNodes.includes( blockNode )
				);

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
				// Every block scales towards the same diagonal, and only
				// ever down. Wide blocks come out long and thin, tall ones
				// narrow.
				const cardScale = ( rect ) =>
					Math.min( 1, 420 / Math.hypot( rect.width, rect.height ) );
				const anchorRect = node.getBoundingClientRect();
				const dragScale = cardScale( anchorRect );
				const grabX = event.clientX;
				const grabY = event.clientY;
				// The visual hangs just below and right of the pointer,
				// wherever the press landed in the block.
				const anchorVisual = {
					left: grabX + 8,
					top: grabY + 10,
					width: anchorRect.width * dragScale,
					height: anchorRect.height * dragScale,
				};

				// Scaling happens around the center; compensate the shift
				// so the box still lands on its slot.
				function translationTo( rect, scale, left, top ) {
					return {
						x:
							left -
							rect.left -
							( rect.width * ( 1 - scale ) ) / 2,
						y: top - rect.top - ( rect.height * ( 1 - scale ) ) / 2,
					};
				}

				const cards = pileNodes.map( ( blockNode, index ) => {
					const rect = blockNode.getBoundingClientRect();
					const scale = cardScale( rect );

					if ( index === 0 ) {
						const to = translationTo(
							rect,
							scale,
							anchorVisual.left,
							anchorVisual.top
						);
						return { scale, turn: 0, from: { x: 0, y: 0 }, to };
					}

					const width = rect.width * scale;
					const height = rect.height * scale;
					// It starts centered under the pressed block and slides
					// out a little to the left, its bottom edge peeking out
					// below, slightly turned.
					const from = translationTo(
						rect,
						scale,
						anchorVisual.left + ( anchorVisual.width - width ) / 2,
						anchorVisual.top + ( anchorVisual.height - height ) / 2
					);
					const to = translationTo(
						rect,
						scale,
						anchorVisual.left - 12,
						anchorVisual.top + anchorVisual.height + 24 - height
					);
					return { scale, turn: 1.5, from, to };
				} );
				const toTransform = ( { x, y }, scale, turn ) =>
					`translate(${ x * inverted }px, ${
						y * inverted
					}px) scale(${ scale }) rotate(${ turn }deg)`;
				const restoreCallbacks = [];

				pileNodes.forEach( ( blockNode, index ) => {
					const savedProperties = {};

					for ( const property of [
						'transform',
						'transformOrigin',
						'transition',
						'zIndex',
						'position',
						'top',
						'left',
						'pointerEvents',
						'backgroundColor',
						'boxShadow',
					] ) {
						savedProperties[ property ] =
							blockNode.style[ property ];
					}

					// Remove the id and leave it on a hidden shallow clone
					// so that drop target calculations are correct.
					const blockId = blockNode.id;
					const placeholder = blockNode.cloneNode();
					placeholder.style.display = 'none';
					blockNode.id = null;
					blockNode.after( placeholder );
					// The attribute keeps the slot styling for dragged
					// blocks from hiding the selection overlay on the
					// stack.
					blockNode.dataset.dragPile = 'true';

					restoreCallbacks.push( () => {
						for ( const [ property, value ] of Object.entries(
							savedProperties
						) ) {
							blockNode.style[ property ] = value;
						}
						delete blockNode.dataset.dragPile;
						blockNode.id = blockId;
						placeholder.remove();
					} );

					const { style } = blockNode;
					const { scale, from } = cards[ index ];
					style.position = 'relative';
					style.zIndex = `${ 1000 - index }`;
					style.transformOrigin = '50% 50%';
					style.pointerEvents = 'none';
					style.boxShadow = '4px 4px 8px rgba(0, 0, 0, 0.15)';
					style.transform = toTransform( from, index ? scale : 1, 0 );

					// If the block has no background color, use the
					// nearest ancestor's, so it does not show the content
					// it moves over through the gaps between lines.
					if (
						isColorTransparent(
							defaultView.getComputedStyle( blockNode )
								.backgroundColor
						)
					) {
						let bgColor = 'transparent';
						let parentElement = blockNode;

						while (
							( parentElement = parentElement.parentElement )
						) {
							const { backgroundColor } =
								defaultView.getComputedStyle( parentElement );
							if ( ! isColorTransparent( backgroundColor ) ) {
								bgColor = backgroundColor;
								break;
							}
						}

						style.backgroundColor = bgColor;
					}
				} );

				// Flush the starting styles, then set the targets, so the
				// pressed block animates from its place to the pointer and
				// the block behind it slides out from underneath.
				void pileNodes[ 0 ].offsetHeight;
				pileNodes.forEach( ( blockNode, index ) => {
					const { scale, turn, to } = cards[ index ];
					blockNode.style.transition = 'transform 0.2s ease-out';
					blockNode.style.transform = toTransform( to, scale, turn );
				} );

				// The other selected blocks hide in place; their spots
				// keep their size until the drag ends.
				for ( const blockNode of restNodes ) {
					const savedVisibility = blockNode.style.visibility;
					blockNode.style.visibility = 'hidden';
					restoreCallbacks.push( () => {
						blockNode.style.visibility = savedVisibility;
					} );
				}

				const originScrollTop = defaultView.scrollY;
				const originScrollLeft = defaultView.scrollX;
				const originClientX = grabX;
				const originClientY = grabY;
				let lastClientX = originClientX;
				let lastClientY = originClientY;

				// A count near the pointer: most of the selection may be
				// hidden, so the stack alone does not tell how many
				// blocks are dragged.
				const countBadge = ownerDocument.createElement( 'div' );
				countBadge.className = 'block-editor-block-list__drag-count';
				countBadge.textContent = String( clientIds.length );
				ownerDocument.body.appendChild( countBadge );

				function positionCountBadge() {
					// On the stack's top right corner, clear of the
					// pointer at its top left.
					countBadge.style.left = `${
						( lastClientX + 8 + anchorVisual.width ) * inverted - 12
					}px`;
					countBadge.style.top = `${
						( lastClientY + 10 ) * inverted - 12
					}px`;
				}
				positionCountBadge();

				function over() {
					const topDelta =
						( lastClientY -
							originClientY +
							defaultView.scrollY -
							originScrollTop ) *
						inverted;
					const leftDelta =
						( lastClientX -
							originClientX +
							defaultView.scrollX -
							originScrollLeft ) *
						inverted;

					for ( const blockNode of pileNodes ) {
						blockNode.style.top = `${ topDelta }px`;
						blockNode.style.left = `${ leftDelta }px`;
					}

					positionCountBadge();
				}
				over();

				function dragOver( e ) {
					// Only move if the pointer has moved.
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

				function end() {
					ownerDocument.removeEventListener( 'dragover', dragOver );
					ownerDocument.removeEventListener( 'dragend', end );
					ownerDocument.removeEventListener( 'drop', end );
					ownerDocument.removeEventListener( 'scroll', over );
					restoreCallbacks.forEach( ( restore ) => restore() );
					countBadge.remove();
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
					isMultiSelected && hasMultiSelection();

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

				if ( isMultiSelectionDrag ) {
					startPileDrag( event, clientIds, dragElement );
					return;
				}

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
			multiSelect,
			startDraggingBlocks,
			stopDraggingBlocks,
			isSectionBlock,
			editedContentOnlySection,
			editContentOnlySection,
		]
	);
}
