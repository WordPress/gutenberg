import { useSelect, useDispatch } from '@wordpress/data';
import { useRefEffect } from '@wordpress/compose';
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';

// How far the pointer must travel before a press counts as a drag, so that a
// click (with a slightly shaky hand) does not flash the box.
const DRAG_THRESHOLD = 3;

interface Rect {
	left: number;
	right: number;
	top: number;
	bottom: number;
}

// A press on an element's scrollbar targets the element, outside of its client
// area: right of it, or left of it in right-to-left layouts, or below it.
function isOnScrollbar( { target, offsetX, offsetY }: MouseEvent ) {
	const { clientWidth, clientHeight } = target as HTMLElement;
	return (
		offsetX < 0 ||
		offsetY < 0 ||
		offsetX > clientWidth ||
		offsetY > clientHeight
	);
}

function intersects( a: Rect, b: Rect ) {
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
	return useRefEffect< HTMLElement >(
		( node ) => {
			const { ownerDocument } = node;
			// A mounted element's document has a window.
			const defaultView = ownerDocument.defaultView!;
			// When the canvas is iframed, the node is the body, which becomes
			// an editing host during a multi-selection: keep the box out of
			// it.
			const container =
				node === ownerDocument.body
					? ownerDocument.documentElement
					: ownerDocument.body;

			let mouseDownEvent: MouseEvent | null;
			let origin: { x: number; y: number };
			let pointer: { x: number; y: number };
			let box: HTMLElement | null;
			let selectedRange: [ string, string ] | undefined;
			let rafId: number | null;

			function getScroll() {
				return {
					x: defaultView.scrollX + node.scrollLeft,
					y: defaultView.scrollY + node.scrollTop,
				};
			}

			// The box in viewport coordinates. The origin is kept in content
			// coordinates so it stays put when the canvas scrolls.
			function getRect(): Rect {
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

			function getBlockElement( clientId: string ) {
				return ownerDocument.getElementById( `block-${ clientId }` );
			}

			// Finds the deepest block the rect touches, first or last in
			// document order.
			function findEdgeBlock( rect: Rect, isLast: boolean ) {
				let found: string | undefined;
				let order: string[] = getBlockOrder();

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
			function selectInRect( rect: Rect ) {
				const first = findEdgeBlock( rect, false );
				const last = findEdgeBlock( rect, true );
				let range: [ string, string ] | undefined;

				if ( first && last ) {
					const firstPath: string[] = [
						...getBlockParents( first ),
						first,
					];
					const lastPath: string[] = [
						...getBlockParents( last ),
						last,
					];
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
					// No caret: a single block stays selected as a whole.
					multiSelect( range[ 0 ], range[ 1 ], null );
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
				// Updates are only scheduled while the box exists.
				const { style } = box!;
				style.left = `${ left }px`;
				style.top = `${ top }px`;
				style.width = `${ Math.max( right - left, 0 ) }px`;
				style.height = `${ Math.max( bottom - top, 0 ) }px`;
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
				if ( rafId ) {
					defaultView.cancelAnimationFrame( rafId );
				}
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

			function onMouseMove( event: MouseEvent ) {
				// The button was released outside of the window.
				if ( event.buttons !== 1 ) {
					stop();
					return;
				}

				pointer = { x: event.clientX, y: event.clientY };

				if ( ! box ) {
					// Moves are only listened to after a press.
					const distance = Math.hypot(
						pointer.x - mouseDownEvent!.clientX,
						pointer.y - mouseDownEvent!.clientY
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

			function onMouseDown( event: MouseEvent ) {
				if (
					event.button !== 0 ||
					event.shiftKey ||
					! isSelectionEnabled() ||
					isZoomOut()
				) {
					return;
				}

				const target = event.target as HTMLElement;
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
				defaultView.getSelection()?.removeAllRanges();
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
