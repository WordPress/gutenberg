import { useRefEffect } from '@wordpress/compose';
import { getScrollContainer } from '@wordpress/dom';

/**
 * Mobile browsers don't shrink the page for the on-screen keyboard: they
 * slide the whole page up to reveal the caret, taking the editor's header
 * and block toolbar off screen. Move each slide into the canvas instead, so
 * the caret stays where it is and the page stays put.
 */
export default function useKeepCaretAboveKeyboard() {
	return useRefEffect< HTMLElement >( ( node ) => {
		// A node attached to a document has a window.
		const defaultView = node.ownerDocument.defaultView!;
		// In an iframe, the keyboard slides the parent window.
		const view =
			defaultView.frameElement?.ownerDocument.defaultView ?? defaultView;
		const { visualViewport } = view;

		if ( ! visualViewport ) {
			return;
		}

		function onScroll() {
			const slide = view.scrollY;
			// Panning a zoomed in page also scrolls: leave it.
			if ( ! slide || visualViewport!.scale !== 1 ) {
				return;
			}
			const canvas = getScrollContainer( node )!;
			// The page itself scrolls the canvas: nothing to move.
			if ( canvas === view.document.scrollingElement ) {
				return;
			}
			const { scrollTop } = canvas;
			canvas.scrollTop += slide;
			// Near its end, the canvas can't take all of it: the page keeps the
			// rest, so the caret stays above the keyboard.
			view.scrollBy( 0, scrollTop - canvas.scrollTop );
		}

		visualViewport.addEventListener( 'scroll', onScroll );
		return () => {
			visualViewport.removeEventListener( 'scroll', onScroll );
		};
	}, [] );
}
