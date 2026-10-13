import { isKeyboardEvent } from '@wordpress/keycodes';
import { useEffect, useContext } from '@wordpress/element';
import { useEvent } from '@wordpress/compose';
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
		function callback( event ) {
			if ( isKeyboardEvent[ type ]( event, character ) ) {
				stableOnUse();
				event.preventDefault();
			}
		}

		keyboardShortcuts.add( callback );
		return () => {
			keyboardShortcuts.delete( callback );
		};
	}, [ character, type, keyboardShortcuts, stableOnUse ] );

	return null;
}
