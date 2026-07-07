/**
 * WordPress dependencies
 */
import { isKeyboardEvent } from '@wordpress/keycodes';
import { useEffect, useContext } from '@wordpress/element';
import { useEvent } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { KeyboardShortcutContext } from './events';

/**
 * Calls `onUse` when the given keyboard shortcut is pressed within the rich
 * text field, and prevents the default behavior of the keystroke.
 *
 * @param {Object}   props
 * @param {string}   props.character The character to match.
 * @param {string}   props.type      The modifier combination to match. See
 *                                   `isKeyboardEvent` in `@wordpress/keycodes`.
 * @param {Function} props.onUse     Called when the shortcut is pressed.
 */
export function useRichTextShortcut( { character, type, onUse } ) {
	const keyboardShortcuts = useContext( KeyboardShortcutContext );

	/*
	 * Keep a stable reference to the latest `onUse` so the registered
	 * callback can call it without re-running the registration effect on
	 * every render.
	 */
	const stableOnUse = useEvent( onUse );

	useEffect( () => {
		const shortcuts = keyboardShortcuts.current;
		function callback( event ) {
			if ( isKeyboardEvent[ type ]( event, character ) ) {
				stableOnUse();
				event.preventDefault();
			}
		}

		shortcuts.add( callback );
		return () => {
			shortcuts.delete( callback );
		};
	}, [ character, type, keyboardShortcuts, stableOnUse ] );
}
