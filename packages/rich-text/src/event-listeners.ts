import type { RefObject } from 'react';
import type { EventListenersProps } from './types';

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
	( props: RefObject< EventListenersProps > ) => ( element: HTMLElement ) => {
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
	( props: RefObject< EventListenersProps > ) => ( element: HTMLElement ) => {
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
