/**
 * A Set of callbacks that format types register for an event.
 */
export type EventCallbacksSet< E extends Event > = Set< ( event: E ) => void >;

/**
 * Attaches a `keydown` listener that dispatches the keyboard shortcut
 * callbacks format types registered through `KeyboardShortcutContext`.
 *
 * @param keyboardShortcuts The Set the field provides on the context.
 *
 * @return Function that attaches the listener to an element and returns its
 *         cleanup function.
 */
export const shortcutsListener =
	( keyboardShortcuts: EventCallbacksSet< KeyboardEvent > ) =>
	( element: HTMLElement ) => {
		function onKeyDown( event: KeyboardEvent ) {
			for ( const keyboardShortcut of keyboardShortcuts ) {
				keyboardShortcut( event );
			}
		}

		element.addEventListener( 'keydown', onKeyDown );
		return () => {
			element.removeEventListener( 'keydown', onKeyDown );
		};
	};

/**
 * Attaches an `input` listener that dispatches the `InputEvent` callbacks
 * format types registered through `InputEventContext`.
 *
 * @param inputEvents The Set the field provides on the context.
 *
 * @return Function that attaches the listener to an element and returns its
 *         cleanup function.
 */
export const inputEventsListener =
	( inputEvents: EventCallbacksSet< InputEvent > ) =>
	( element: HTMLElement ) => {
		function onInput( event: InputEvent ) {
			for ( const inputEventHandler of inputEvents ) {
				inputEventHandler( event );
			}
		}

		element.addEventListener( 'input', onInput );
		return () => {
			element.removeEventListener( 'input', onInput );
		};
	};
