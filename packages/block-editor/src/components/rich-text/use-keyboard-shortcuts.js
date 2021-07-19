/**
 * WordPress dependencies
 */
import { useRefEffect } from '@wordpress/compose';
import { isKeyboardEvent } from '@wordpress/keycodes';

export function useKeyboardShortcuts( shortcuts ) {
	return useRefEffect(
		( element ) => {
			function onKeyDown( event ) {
				for ( const {
					modifier,
					character,
					callbackRef,
				} of shortcuts.current ) {
					if ( isKeyboardEvent[ modifier ]( event, character ) ) {
						callbackRef.current();
						event.preventDefault();
						return false;
					}
				}
			}
			element.addEventListener( 'keydown', onKeyDown );
			return () => {
				element.removeEventListener( 'keydown', onKeyDown );
			};
		},
		[ shortcuts ]
	);
}
