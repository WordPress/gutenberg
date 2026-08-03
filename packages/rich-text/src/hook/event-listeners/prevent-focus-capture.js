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

		let stored = null;

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
			// The attribute may be absent: the element can be editable by
			// inheritance from the editing host, in which case it carries no
			// contenteditable attribute of its own.
			stored = { value: element.getAttribute( 'contenteditable' ) };
			defaultView.getSelection().removeAllRanges();
			element.setAttribute( 'contenteditable', 'false' );
		}

		function onPointerUp() {
			if ( stored ) {
				// Only restore when the attribute is still what onPointerDown
				// set: a render in between (e.g. the block was deselected by
				// the click, changing the editable between an editing host
				// and an inert part of one) owns the attribute now, and the
				// stored value is stale.
				if ( element.getAttribute( 'contenteditable' ) === 'false' ) {
					if ( stored.value === null ) {
						element.removeAttribute( 'contenteditable' );
					} else {
						element.setAttribute( 'contenteditable', stored.value );
					}
				}
				stored = null;
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
