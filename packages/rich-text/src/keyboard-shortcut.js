/**
 * WordPress dependencies
 */
import { isKeyboardEvent } from '@wordpress/keycodes';
import { useEffect, useContext, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { keyboardShortcutContext } from './contexts';

export function RichTextShortcut( { character, type, onUse } ) {
	const keyboardShortcuts = useContext( keyboardShortcutContext );

	// Keep the latest `onUse` in a ref so the registered callback can call it
	// without re-running the registration effect on every render.
	const onUseRef = useRef( onUse );
	useEffect( () => {
		onUseRef.current = onUse;
	} );

	useEffect( () => {
		const shortcuts = keyboardShortcuts.current;
		function callback( event ) {
			if ( isKeyboardEvent[ type ]( event, character ) ) {
				onUseRef.current();
				event.preventDefault();
			}
		}

		shortcuts.add( callback );
		return () => {
			shortcuts.delete( callback );
		};
	}, [ character, type, keyboardShortcuts ] );

	return null;
}
