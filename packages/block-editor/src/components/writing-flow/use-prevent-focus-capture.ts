import { useRefEffect } from '@wordpress/compose';

/**
 * Prevents focus from being captured by an editable element when clicking
 * _outside_ around it. This may happen when the parent element is flex.
 * @see https://github.com/WordPress/gutenberg/pull/65857
 * @see https://github.com/WordPress/gutenberg/pull/66402
 *
 * @return Ref callback for the writing flow element.
 */
export default function usePreventFocusCapture() {
	return useRefEffect< HTMLElement >( ( node ) => {
		const { ownerDocument } = node;
		// A rendered element's document has a window.
		const defaultView = ownerDocument.defaultView!;
		// The editable elements made non editable by the current press.
		const elements = new Set< HTMLElement >();

		function onPointerDown( event: PointerEvent ) {
			const target = event.target as Element;
			// Only presses in this canvas.
			if ( ! node.contains( target ) ) {
				return;
			}
			// Abort if the event is default prevented, we will not get a pointer up event.
			if ( event.defaultPrevented ) {
				return;
			}
			// Only relevant when a parent block is pressed.
			if ( ! target.closest( '[data-block]' ) ) {
				return;
			}
			for ( const element of target.querySelectorAll< HTMLElement >(
				'[contenteditable="true"]'
			) ) {
				elements.add( element );
				defaultView.getSelection()!.removeAllRanges();
				element.setAttribute( 'contenteditable', 'false' );
			}
		}

		function onPointerUp() {
			for ( const element of elements ) {
				element.setAttribute( 'contenteditable', 'true' );
				// Safari may still have placed a caret in the element.
				const selection = defaultView.getSelection()!;
				if (
					selection.isCollapsed &&
					element.contains( selection.anchorNode )
				) {
					selection.removeAllRanges();
				}
			}
			elements.clear();
		}

		// On the document, which runs after React's listeners, so
		// `defaultPrevented` is already known.
		ownerDocument.addEventListener( 'pointerdown', onPointerDown );
		defaultView.addEventListener( 'pointerup', onPointerUp );
		defaultView.addEventListener( 'pointercancel', onPointerUp );
		return () => {
			ownerDocument.removeEventListener( 'pointerdown', onPointerDown );
			defaultView.removeEventListener( 'pointerup', onPointerUp );
			defaultView.removeEventListener( 'pointercancel', onPointerUp );
		};
	}, [] );
}
