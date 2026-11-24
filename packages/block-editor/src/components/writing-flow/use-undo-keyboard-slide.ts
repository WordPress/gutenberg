import { useRefEffect } from '@wordpress/compose';
import { getScrollContainer } from '@wordpress/dom';

/**
 * iOS slides the whole page up to reveal the caret above the keyboard, taking
 * the editor's header and block toolbar off screen. Once the canvas stops
 * scrolling, move that slide into the canvas, so the header comes back.
 */
export default function useUndoKeyboardSlide() {
	return useRefEffect< HTMLElement >( ( node ) => {
		const { ownerDocument } = node;
		// A node attached to a document has a window.
		const defaultView = ownerDocument.defaultView!;
		// In an iframe, the keyboard slides the parent window.
		const view =
			defaultView.frameElement?.ownerDocument.defaultView ?? defaultView;

		function onScrollEnd() {
			const slide = view.scrollY;
			// Panning a zoomed in page also scrolls: leave it.
			if ( ! slide || view.visualViewport?.scale !== 1 ) {
				return;
			}
			// Focus is outside the canvas, like a sidebar field: that slide
			// reveals it.
			if (
				! ownerDocument.hasFocus() ||
				! node.contains( ownerDocument.activeElement )
			) {
				return;
			}
			// A page taller than the screen may have been scrolled by the user.
			const page = view.document.scrollingElement!;
			if ( page.scrollHeight > page.clientHeight ) {
				return;
			}
			const canvas = getScrollContainer( node )!;
			const { scrollTop } = canvas;
			canvas.scrollTop += slide;
			// Near its end, the canvas can't take all of it: the page keeps the
			// rest, so the caret stays above the keyboard.
			view.scrollBy( 0, scrollTop - canvas.scrollTop );
		}

		// Not on scroll: iOS overrides a scroll of the canvas while it moves.
		ownerDocument.addEventListener( 'scrollend', onScrollEnd, true );
		return () => {
			ownerDocument.removeEventListener( 'scrollend', onScrollEnd, true );
		};
	}, [] );
}
