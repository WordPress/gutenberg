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
 * follow, so it selects the blocks the box touches instead.
 */
export default function useSelectionBox() {
	const {
		startMultiSelect,
		stopMultiSelect,
		multiSelect,
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

			// Selects the blocks the box touches. As with a native selection,
			// the ends are promoted to siblings, so a box across two
			// containers selects both containers.
			function selectBlocksInRect( rect ) {
				const first = findEdgeBlock( rect, false );
				const last = findEdgeBlock( rect, true );
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
					selectBlocksInRect( rect );
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

				if ( selectsBlocks ) {
					selectedRange = undefined;
					startMultiSelect();
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

				if ( selectsBlocks ) {
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
			clearSelectedBlock,
			isSelectionEnabled,
			isDraggingBlocks,
			isZoomOut,
			getBlockOrder,
			getBlockParents,
		]
	);
}
