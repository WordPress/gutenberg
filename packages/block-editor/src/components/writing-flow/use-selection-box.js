import { useSelect } from '@wordpress/data';
import { useRefEffect } from '@wordpress/compose';
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';
import { DRAG_THRESHOLD, isOnScrollbar } from './utils';

/**
 * Draws a selection box from the point where the pointer was pressed to the
 * pointer while it is dragged across the canvas. The box only shows the
 * gesture: the selection is the native one (see `useDragSelection` and
 * `useSelectionObserver`).
 */
export default function useSelectionBox() {
	const { isSelectionEnabled, isDraggingBlocks, isZoomOut } = unlock(
		useSelect( blockEditorStore )
	);
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
			let rafId;

			function getScroll() {
				return {
					x: defaultView.scrollX + node.scrollLeft,
					y: defaultView.scrollY + node.scrollTop,
				};
			}

			function update() {
				rafId = null;
				// The origin is kept in content coordinates so it stays put
				// when the canvas scrolls.
				const scroll = getScroll();
				const originX = origin.x - scroll.x;
				const originY = origin.y - scroll.y;
				// Draw only the part within the visible canvas: the origin
				// may have scrolled out of view.
				const bounds = node.getBoundingClientRect();
				const { clientWidth, clientHeight } =
					ownerDocument.documentElement;
				const left = Math.max(
					Math.min( originX, pointer.x ),
					bounds.left,
					0
				);
				const top = Math.max(
					Math.min( originY, pointer.y ),
					bounds.top,
					0
				);
				const right = Math.min(
					Math.max( originX, pointer.x ),
					bounds.right,
					clientWidth
				);
				const bottom = Math.min(
					Math.max( originY, pointer.y ),
					bounds.bottom,
					clientHeight
				);
				box.style.left = `${ left }px`;
				box.style.top = `${ top }px`;
				box.style.width = `${ Math.max( right - left, 0 ) }px`;
				box.style.height = `${ Math.max( bottom - top, 0 ) }px`;
			}

			function scheduleUpdate() {
				if ( ! rafId ) {
					rafId = defaultView.requestAnimationFrame( update );
				}
			}

			function stop() {
				defaultView.removeEventListener( 'mousemove', onMouseMove );
				defaultView.removeEventListener( 'mouseup', stop );
				ownerDocument.removeEventListener( 'scroll', onScroll, true );
				ownerDocument.removeEventListener( 'dragstart', stop );
				defaultView.cancelAnimationFrame( rafId );
				rafId = null;
				mouseDownEvent = null;
				box?.remove();
				box = null;
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

					// Anything that handles the press itself (a resize
					// handle, a focal point picker) prevents its default
					// action.
					if (
						mouseDownEvent.defaultPrevented ||
						isDraggingBlocks()
					) {
						stop();
						return;
					}

					box = ownerDocument.createElement( 'div' );
					box.className = 'block-editor-writing-flow__selection-box';
					container.appendChild( box );
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
					isOnScrollbar( event ) ||
					! isSelectionEnabled() ||
					isZoomOut()
				) {
					return;
				}

				stop();
				mouseDownEvent = event;
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
		[ isSelectionEnabled, isDraggingBlocks, isZoomOut ]
	);
}
