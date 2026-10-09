import { useSelect, useDispatch } from '@wordpress/data';
import { useRefEffect } from '@wordpress/compose';
import { store as blockEditorStore } from '../../store';
import { getBlockClientId } from '../../utils/dom';
import { unlock } from '../../lock-unlock';

// How far the pointer must travel before a press counts as a drag, so that a
// click (with a slightly shaky hand) does not flash the box.
const DRAG_THRESHOLD = 3;

const FOCUSABLE_SELECTOR =
	'a[href], button, input, select, textarea, [contenteditable="true"], [tabindex]';

function clampToRect( x, y, rect ) {
	return [
		Math.min( Math.max( x, rect.left + 1 ), rect.right - 1 ),
		Math.min( Math.max( y, rect.top + 1 ), rect.bottom - 1 ),
	];
}

function getRichTextElement( node ) {
	const element =
		node.nodeType === node.ELEMENT_NODE ? node : node.parentElement;
	return element?.closest( '[data-wp-block-attribute-key]' );
}

function intersects( a, b ) {
	return (
		a.left <= b.right &&
		a.right >= b.left &&
		a.top <= b.bottom &&
		a.bottom >= b.top
	);
}

/**
 * Draws a selection box from the point where the pointer was pressed to the
 * pointer while it is dragged across the canvas.
 *
 * A drag that starts in a block's content keeps the native selection behavior
 * (see `useDragSelection` and `useSelectionObserver`): the box only shows the
 * gesture. A drag that starts outside any block's content (the canvas margins,
 * the space between blocks, a container's padding) has no native selection to
 * follow, so it makes one with the same outcome: while the box touches a
 * single block with text, it selects the text from the press to the pointer,
 * and once it touches several blocks, it selects those blocks.
 */
export default function useSelectionBox() {
	const {
		startMultiSelect,
		stopMultiSelect,
		multiSelect,
		selectBlock,
		clearSelectedBlock,
	} = useDispatch( blockEditorStore );
	const {
		isSelectionEnabled,
		isDraggingBlocks,
		isZoomOut,
		getBlockOrder,
		getBlockParents,
	} = unlock( useSelect( blockEditorStore ) );
	return useRefEffect(
		( node ) => {
			const { ownerDocument } = node;
			const { defaultView } = ownerDocument;
			// When the canvas is iframed, the node is the body, which becomes
			// an editing host during a multi-selection: keep the box out of
			// it.
			const container =
				node === ownerDocument.body
					? ownerDocument.documentElement
					: ownerDocument.body;

			let mouseDownEvent;
			let origin;
			let pointer;
			let box;
			let selectsBlocks;
			// What the drag selects so far: `'text'` or `'blocks'`.
			let mode;
			let selectedRange;
			let rafId;

			function getScroll() {
				return {
					x: defaultView.scrollX + node.scrollLeft,
					y: defaultView.scrollY + node.scrollTop,
				};
			}

			// The box in viewport coordinates. The origin is kept in content
			// coordinates so it stays put when the canvas scrolls.
			function getRect() {
				const scroll = getScroll();
				const originX = origin.x - scroll.x;
				const originY = origin.y - scroll.y;
				return {
					left: Math.min( originX, pointer.x ),
					right: Math.max( originX, pointer.x ),
					top: Math.min( originY, pointer.y ),
					bottom: Math.max( originY, pointer.y ),
				};
			}

			function caretFromPoint( [ x, y ] ) {
				if ( ownerDocument.caretPositionFromPoint ) {
					const position = ownerDocument.caretPositionFromPoint(
						x,
						y
					);
					return position && [ position.offsetNode, position.offset ];
				}

				const range = ownerDocument.caretRangeFromPoint?.( x, y );
				return range && [ range.startContainer, range.startOffset ];
			}

			function getBlockElement( clientId ) {
				return ownerDocument.getElementById( `block-${ clientId }` );
			}

			// Finds the deepest block the rect touches, first or last in
			// document order.
			function findEdgeBlock( rect, isLast ) {
				let found;
				let order = getBlockOrder();

				while ( order.length ) {
					const children = isLast ? [ ...order ].reverse() : order;
					const next = children.find( ( clientId ) => {
						const element = getBlockElement( clientId );
						return (
							element &&
							intersects( rect, element.getBoundingClientRect() )
						);
					} );

					if ( ! next ) {
						break;
					}

					found = next;
					order = getBlockOrder( next );
				}

				return found;
			}

			// Selects the text of a block from the press to the pointer, both
			// brought within the block, as a native selection starting next to
			// the block would. The selection observer takes it from there.
			function selectText( clientId ) {
				const bounds =
					getBlockElement( clientId ).getBoundingClientRect();
				const scroll = getScroll();
				const anchor = caretFromPoint(
					clampToRect(
						origin.x - scroll.x,
						origin.y - scroll.y,
						bounds
					)
				);
				const focus = caretFromPoint(
					clampToRect( pointer.x, pointer.y, bounds )
				);
				const richTextElement =
					anchor && getRichTextElement( anchor[ 0 ] );

				if (
					! richTextElement ||
					! focus ||
					getRichTextElement( focus[ 0 ] ) !== richTextElement ||
					getBlockClientId( richTextElement ) !== clientId
				) {
					return false;
				}

				// Leave the multi-selection first: once it stops, a selection
				// of several blocks would replace the native selection.
				if ( mode === 'blocks' ) {
					selectBlock( clientId, null );
					stopMultiSelect();
				}

				mode = 'text';
				selectedRange = undefined;
				defaultView
					.getSelection()
					.setBaseAndExtent( ...anchor, ...focus );
				return true;
			}

			// Selects what the box touches: the text of a single block, or
			// the blocks. As with a native selection, the ends are promoted to
			// siblings, so a box across two containers selects both
			// containers.
			function selectInRect( rect ) {
				const first = findEdgeBlock( rect, false );
				const last = findEdgeBlock( rect, true );

				if ( first && first === last && selectText( first ) ) {
					return;
				}

				if ( mode !== 'blocks' ) {
					if ( mode === 'text' ) {
						defaultView.getSelection().removeAllRanges();
						node.focus( { preventScroll: true } );
					}

					mode = 'blocks';
					selectedRange = undefined;
					startMultiSelect();
				}

				let range;

				if ( first && last ) {
					const firstPath = [ ...getBlockParents( first ), first ];
					const lastPath = [ ...getBlockParents( last ), last ];
					let depth = 0;

					while (
						depth < firstPath.length &&
						depth < lastPath.length &&
						firstPath[ depth ] === lastPath[ depth ]
					) {
						depth++;
					}

					// One block contains the other: select the outer one.
					range =
						depth === firstPath.length || depth === lastPath.length
							? [ firstPath[ depth - 1 ], firstPath[ depth - 1 ] ]
							: [ firstPath[ depth ], lastPath[ depth ] ];
				}

				if (
					range?.[ 0 ] === selectedRange?.[ 0 ] &&
					range?.[ 1 ] === selectedRange?.[ 1 ]
				) {
					return;
				}

				selectedRange = range;

				if ( range ) {
					multiSelect( range[ 0 ], range[ 1 ] );
				} else {
					clearSelectedBlock();
				}
			}

			function update() {
				rafId = null;
				const rect = getRect();
				// Draw only the part within the visible canvas: the origin
				// may have scrolled out of view.
				const bounds = node.getBoundingClientRect();
				const { clientWidth, clientHeight } =
					ownerDocument.documentElement;
				const left = Math.max( rect.left, bounds.left, 0 );
				const top = Math.max( rect.top, bounds.top, 0 );
				const right = Math.min( rect.right, bounds.right, clientWidth );
				const bottom = Math.min(
					rect.bottom,
					bounds.bottom,
					clientHeight
				);
				box.style.left = `${ left }px`;
				box.style.top = `${ top }px`;
				box.style.width = `${ Math.max( right - left, 0 ) }px`;
				box.style.height = `${ Math.max( bottom - top, 0 ) }px`;

				if ( selectsBlocks ) {
					selectInRect( rect );
				}
			}

			function scheduleUpdate() {
				if ( ! rafId ) {
					rafId = defaultView.requestAnimationFrame( update );
				}
			}

			function start() {
				// Anything in a block that handles the press itself (a resize
				// handle, a focal point picker) prevents its default action.
				if (
					( ! selectsBlocks && mouseDownEvent.defaultPrevented ) ||
					isDraggingBlocks()
				) {
					return false;
				}

				box = ownerDocument.createElement( 'div' );
				box.className = 'block-editor-writing-flow__selection-box';
				container.appendChild( box );
				return true;
			}

			function stop() {
				defaultView.removeEventListener( 'mousemove', onMouseMove );
				defaultView.removeEventListener( 'mouseup', stop );
				ownerDocument.removeEventListener( 'scroll', onScroll, true );
				ownerDocument.removeEventListener( 'dragstart', stop );
				defaultView.cancelAnimationFrame( rafId );
				mouseDownEvent = null;

				if ( ! box ) {
					rafId = null;
					return;
				}

				// Apply the last pointer move: the release can come before the
				// frame it was scheduled for.
				if ( rafId ) {
					update();
				}

				box.remove();
				box = null;

				if ( mode === 'blocks' ) {
					stopMultiSelect();
				}
			}

			function onMouseMove( event ) {
				// The button was released outside of the window.
				if ( event.buttons !== 1 ) {
					stop();
					return;
				}

				pointer = { x: event.clientX, y: event.clientY };

				if ( ! box ) {
					const distance = Math.hypot(
						pointer.x - mouseDownEvent.clientX,
						pointer.y - mouseDownEvent.clientY
					);

					if ( distance < DRAG_THRESHOLD ) {
						return;
					}

					if ( ! start() ) {
						stop();
						return;
					}
				}

				scheduleUpdate();
			}

			function onScroll() {
				if ( box ) {
					scheduleUpdate();
				}
			}

			function onMouseDown( event ) {
				if (
					event.button !== 0 ||
					event.shiftKey ||
					! isSelectionEnabled() ||
					isZoomOut()
				) {
					return;
				}

				stop();
				mouseDownEvent = event;
				mode = undefined;
				const { target } = event;
				const clientId = getBlockClientId( target );
				const focusable = target.closest( FOCUSABLE_SELECTOR );
				// Outside of any block, or on a container block's own element
				// (its padding, the gap between its inner blocks) rather than
				// on its content. Not on a scrollbar, nor on anything else
				// the user can interact with, such as the post title.
				selectsBlocks =
					event.offsetX <= target.clientWidth &&
					event.offsetY <= target.clientHeight &&
					( clientId
						? target.id === `block-${ clientId }` &&
							// Not `isContentEditable`: the whole canvas is
							// editable while blocks are multi-selected.
							target.getAttribute( 'contenteditable' ) !== 'true'
						: ! focusable || focusable === node );

				if ( selectsBlocks ) {
					// The press would start a text selection, which, once
					// it reaches an editable field, puts a caret in it and
					// selects that block. Instead, do what else it does:
					// collapse the previous selection and move focus.
					event.preventDefault();
					defaultView.getSelection().removeAllRanges();
					( focusable ?? node ).focus( { preventScroll: true } );
				}

				const scroll = getScroll();
				origin = {
					x: event.clientX + scroll.x,
					y: event.clientY + scroll.y,
				};
				defaultView.addEventListener( 'mousemove', onMouseMove );
				defaultView.addEventListener( 'mouseup', stop );
				ownerDocument.addEventListener( 'scroll', onScroll, true );
				// A native drag (of an image, or of selected text) takes over
				// the pointer.
				ownerDocument.addEventListener( 'dragstart', stop );
			}

			node.addEventListener( 'mousedown', onMouseDown );

			return () => {
				stop();
				node.removeEventListener( 'mousedown', onMouseDown );
			};
		},
		[
			startMultiSelect,
			stopMultiSelect,
			multiSelect,
			selectBlock,
			clearSelectedBlock,
			isSelectionEnabled,
			isDraggingBlocks,
			isZoomOut,
			getBlockOrder,
			getBlockParents,
		]
	);
}
