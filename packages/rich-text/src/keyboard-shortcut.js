/**
 * WordPress dependencies
 */
import { isKeyboardEvent } from '@wordpress/keycodes';
import { useEffect, useContext } from '@wordpress/element';
import { useEvent } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { KeyboardShortcutContext } from './contexts';

export function RichTextShortcut( { character, type, onUse } ) {
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

	return null;
}
