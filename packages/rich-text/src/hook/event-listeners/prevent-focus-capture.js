import { privateApis as composePrivateApis } from '@wordpress/compose';
import { unlock } from '../../lock-unlock';

const { subscribeDelegatedListener } = unlock( composePrivateApis );

/**
 * Prevents focus from being captured by the element when clicking _outside_
 * around the element. This may happen when the parent element is flex.
 * @see https://github.com/WordPress/gutenberg/pull/65857
 * @see https://github.com/WordPress/gutenberg/pull/66402
 */
export function preventFocusCapture() {
	return ( element ) => {
		const { ownerDocument } = element;
		const { defaultView } = ownerDocument;

		let value = null;

		function onPointerDown( event ) {
			// Abort if the event is default prevented, we will not get a pointer up event.
			if ( event.defaultPrevented ) {
				return;
			}
			if ( event.target === element ) {
				return;
			}
			if ( ! event.target.contains( element ) ) {
				return;
			}
			// Only relevant when a parent block is pressed.
			if ( ! event.target.closest( '[data-block]' ) ) {
				return;
			}
			value = element.getAttribute( 'contenteditable' );
			defaultView.getSelection().removeAllRanges();
			element.setAttribute( 'contenteditable', 'false' );
		}

		function onPointerUp() {
			if ( value !== null ) {
				element.setAttribute( 'contenteditable', value );
				value = null;
				// Safari may still have placed a caret in the element.
				const selection = defaultView.getSelection();
				if (
					selection.isCollapsed &&
					element.contains( selection.anchorNode )
				) {
					selection.removeAllRanges();
				}
			}
		}

		const unsubscribePointerDown = subscribeDelegatedListener(
			defaultView,
			'pointerdown',
			onPointerDown
		);
		const unsubscribePointerUp = subscribeDelegatedListener(
			defaultView,
			'pointerup',
			onPointerUp
		);
		const unsubscribePointerCancel = subscribeDelegatedListener(
			defaultView,
			'pointercancel',
			onPointerUp
		);
		return () => {
			unsubscribePointerDown();
			unsubscribePointerUp();
			unsubscribePointerCancel();
		};
	};
}
