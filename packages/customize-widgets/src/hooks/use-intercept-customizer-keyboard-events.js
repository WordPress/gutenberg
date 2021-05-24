/**
 * WordPress dependencies
 */
import { useRefEffect } from '@wordpress/compose';
import { ENTER, ESCAPE } from '@wordpress/keycodes';

export default function useInterceptCustomizerKeyboardEvents() {
	return useRefEffect( ( node ) => {
		function interceptCustomizerKeyboardEvents( event ) {
			if ( event.keyCode === ESCAPE || event.keyCode === ENTER ) {
				event.stopPropagation();
			}
		}

		node.addEventListener( 'keydown', interceptCustomizerKeyboardEvents );

		return () => {
			node.removeEventListener(
				'keydown',
				interceptCustomizerKeyboardEvents
			);
		};
	} );
}
