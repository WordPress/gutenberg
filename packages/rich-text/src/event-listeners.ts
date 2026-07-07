/**
 * External dependencies
 */
import type { MutableRefObject } from 'react';

/*
 * Format types register their keyboard shortcut and input event callbacks
 * into these Sets via `KeyboardShortcutContext` / `InputEventContext` (see
 * `./contexts`). The rich text field that owns the editable element provides
 * the Sets and attaches these listeners to dispatch the callbacks.
 */
export type EventListenersProps = {
	keyboardShortcuts: MutableRefObject<
		Set< ( event: KeyboardEvent ) => void >
	>;
	inputEvents: MutableRefObject< Set< ( event: Event ) => void > >;
};

/**
 * Attaches a `keydown` listener that dispatches the keyboard shortcut
 * callbacks format types registered through `KeyboardShortcutContext`.
 *
 * @param props Ref holding the registered callback Sets.
 *
 * @return Function that attaches the listener to an element and returns its
 *         cleanup function.
 */
export const shortcutsListener =
	( props: MutableRefObject< EventListenersProps > ) =>
	( element: HTMLElement ) => {
		const { keyboardShortcuts } = props.current;
		function onKeyDown( event: KeyboardEvent ) {
			for ( const keyboardShortcut of keyboardShortcuts.current ) {
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
 * @param props Ref holding the registered callback Sets.
 *
 * @return Function that attaches the listener to an element and returns its
 *         cleanup function.
 */
export const inputEventsListener =
	( props: MutableRefObject< EventListenersProps > ) =>
	( element: HTMLElement ) => {
		const { inputEvents } = props.current;
		function onInput( event: Event ) {
			for ( const inputEventHandler of inputEvents.current ) {
				inputEventHandler( event );
			}
		}

		element.addEventListener( 'input', onInput );
		return () => {
			element.removeEventListener( 'input', onInput );
		};
	};
