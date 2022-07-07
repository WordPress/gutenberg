/**
 * WordPress dependencies
 */
import { useRefEffect } from '@wordpress/compose';

export function useShortcuts( keyboardShortcuts ) {
	return useRefEffect( ( element ) => {
		function onKeyDown( event ) {
			for ( const keyboardShortcut of keyboardShortcuts.current ) {
				keyboardShortcut( event );
			}
		}

		element.addEventListener( 'keydown', onKeyDown );
		return () => {
			element.removeEventListener( 'keydown', onKeyDown );
		};
	}, [] );
}
