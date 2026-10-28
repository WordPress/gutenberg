import { privateApis as composePrivateApis } from '@wordpress/compose';
import { unlock } from '../../lock-unlock';

const { subscribeDelegatedListener } = unlock( composePrivateApis );

// The fields of each window. One set of listeners per window serves them all,
// rather than every field adding its own to every press.
const fieldsPerWindow = new WeakMap<
	Window,
	{ fields: Set< HTMLElement >; unsubscribe: VoidFunction }
>();

function subscribe( defaultView: Window, fields: Set< HTMLElement > ) {
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
		for ( const element of fields ) {
			if ( target === element || ! target.contains( element ) ) {
				continue;
			}
			values.set( element, element.getAttribute( 'contenteditable' ) );
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
}

/**
 * Prevents focus from being captured by the element when clicking _outside_
 * around the element. This may happen when the parent element is flex.
 * @see https://github.com/WordPress/gutenberg/pull/65857
 * @see https://github.com/WordPress/gutenberg/pull/66402
 */
export function preventFocusCapture() {
	return ( element: HTMLElement ) => {
		// A rendered field's document has a window.
		const defaultView = element.ownerDocument.defaultView!;
		let entry = fieldsPerWindow.get( defaultView );
		if ( ! entry ) {
			const fields = new Set< HTMLElement >();
			entry = { fields, unsubscribe: subscribe( defaultView, fields ) };
			fieldsPerWindow.set( defaultView, entry );
		}
		const { fields, unsubscribe } = entry;
		fields.add( element );
		return () => {
			fields.delete( element );
			if ( ! fields.size ) {
				unsubscribe();
				fieldsPerWindow.delete( defaultView );
			}
		};
	};
}
