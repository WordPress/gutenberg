import {
	privateApis as composePrivateApis,
	useRefEffect,
} from '@wordpress/compose';
import { unlock } from '../../lock-unlock';

const { subscribeDelegatedListener } = unlock( composePrivateApis );

/**
 * Prevents focus from being captured by a rich text field when clicking
 * _outside_ around it. This may happen when the parent element is flex.
 * @see https://github.com/WordPress/gutenberg/pull/65857
 * @see https://github.com/WordPress/gutenberg/pull/66402
 *
 * @return Ref callback for the writing flow element.
 */
export default function usePreventFocusCapture() {
	return useRefEffect< HTMLElement >( ( node ) => {
		// A rendered element's document has a window.
		const defaultView = node.ownerDocument.defaultView!;
		// The fields made non editable by the current press, with their value.
		const values = new Map< HTMLElement, string | null >();

		function onPointerDown( event: PointerEvent ) {
			const target = event.target as Element;
			// Abort if the event is default prevented, we will not get a pointer up event.
			if ( event.defaultPrevented ) {
				return;
			}
			// Only relevant when a parent block is pressed.
			if ( ! target.closest( '[data-block]' ) ) {
				return;
			}
			for ( const element of target.querySelectorAll< HTMLElement >(
				'.block-editor-rich-text__editable'
			) ) {
				values.set(
					element,
					element.getAttribute( 'contenteditable' )
				);
				defaultView.getSelection()!.removeAllRanges();
				element.setAttribute( 'contenteditable', 'false' );
			}
		}

		function onPointerUp() {
			for ( const [ element, value ] of values ) {
				if ( value === null ) {
					continue;
				}
				element.setAttribute( 'contenteditable', value );
				// Safari may still have placed a caret in the element.
				const selection = defaultView.getSelection()!;
				if (
					selection.isCollapsed &&
					element.contains( selection.anchorNode )
				) {
					selection.removeAllRanges();
				}
			}
			values.clear();
		}

		const unsubscribePointerDown = subscribeDelegatedListener(
			defaultView,
			'pointerdown',
			onPointerDown as EventListener
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
	}, [] );
}
