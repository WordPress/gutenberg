/**
 * WordPress dependencies
 */
import { useRefEffect } from '@wordpress/compose';

export function useInputEvents( inputEvents ) {
	return useRefEffect( ( element ) => {
		function onInput( event ) {
			for ( const keyboardShortcut of inputEvents.current ) {
				keyboardShortcut( event );
			}
		}

		element.addEventListener( 'input', onInput );
		return () => {
			element.removeEventListener( 'input', onInput );
		};
	}, [] );
}
