/**
 * WordPress dependencies
 */
import { useRefEffect } from '@wordpress/compose';

export default function useLastFocus( lastFocus ) {
	return useRefEffect( ( node ) => {
		function onFocusOut( event ) {
			lastFocus.current = event.target;
		}

		node.addEventListener( 'focusout', onFocusOut );
		return () => {
			node.removeEventListener( 'focusout', onFocusOut );
		};
	}, [] );
}
