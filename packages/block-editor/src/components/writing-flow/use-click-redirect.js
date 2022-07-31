/**
 * WordPress dependencies
 */
import { useRefEffect } from '@wordpress/compose';

export default function useClickSelection() {
	return useRefEffect( ( node ) => {
		function onMouseDown( event ) {
			if (
				! event.target.classList.contains(
					'block-editor-block-list__layout'
				)
			) {
				return;
			}

			node.contentEditable = true;
			// Firefox doesn't automatically move focus.
			node.focus();
			// The selection observer will turn off contentEditable after a
			// selection change.
		}

		node.addEventListener( 'mousedown', onMouseDown );

		return () => {
			node.removeEventListener( 'mousedown', onMouseDown );
		};
	}, [] );
}
