import { useSelect, useDispatch } from '@wordpress/data';
import { useRefEffect } from '@wordpress/compose';
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';

// How far the pointer must travel before a press counts as a drag, so that a
// click (with a slightly shaky hand) does not flash the box.
const DRAG_THRESHOLD = 3;

// A press on an element's scrollbar targets the element, outside of its client
// area: right of it, or left of it in right-to-left layouts, or below it.
function isOnScrollbar( { target, offsetX, offsetY } ) {
	return (
		offsetX < 0 ||
		offsetY < 0 ||
		offsetX > target.clientWidth ||
		offsetY > target.clientHeight
	);
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
 * Draws a selection box from the point where the pointer was pressed outside
 * of the blocks (the canvas margins, the space between top level blocks) to
 * the pointer, and selects the blocks the box touches. It never selects text,
 * and a drag that starts in a block is left alone, so it does not compete with
 * text selection and dragging blocks.
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
			function selectInRect( rect ) {
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
				selectInRect( rect );
			}

			function scheduleUpdate() {
				if ( ! rafId ) {
					rafId = defaultView.requestAnimationFrame( update );
				}
			}

			function start() {
				if ( isDraggingBlocks() ) {
					return false;
				}

				box = ownerDocument.createElement( 'div' );
				box.className = 'block-editor-writing-flow__selection-box';
				container.appendChild( box );
				selectedRange = undefined;
				startMultiSelect();
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
				stopMultiSelect();
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

				const { target } = event;
				// Only a press outside of the blocks: the canvas, or the root
				// block list layout (the gaps between top level blocks).
				if (
					isOnScrollbar( event ) ||
					( target !== node &&
						! (
							target.classList.contains(
								'block-editor-block-list__layout'
							) && ! target.closest( '[data-block]' )
						) )
				) {
					return;
				}

				stop();
				mouseDownEvent = event;
				// The press would start a text selection, which, once it
				// reaches an editable field, puts a caret in it and selects
				// that block. Instead, do what else it does: collapse the
				// previous selection and move focus.
				event.preventDefault();
				defaultView.getSelection().removeAllRanges();
				node.focus( { preventScroll: true } );

				const scroll = getScroll();
				origin = {
					x: event.clientX + scroll.x,
					y: event.clientY + scroll.y,
				};
				defaultView.addEventListener( 'mousemove', onMouseMove );
				defaultView.addEventListener( 'mouseup', stop );
				ownerDocument.addEventListener( 'scroll', onScroll, true );
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
