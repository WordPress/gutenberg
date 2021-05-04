/**
 * WordPress dependencies
 */
import { useRefEffect } from '@wordpress/compose';

import { BACKSPACE, DELETE, ESCAPE } from '@wordpress/keycodes';

export function useUndoAutomaticChange( { didAutomaticChange, undo } ) {
	return useRefEffect(
		( element ) => {
			function onKeyDown( event ) {
				const { keyCode } = event;

				if ( ! didAutomaticChange ) {
					return;
				}

				if (
					keyCode !== DELETE &&
					keyCode !== BACKSPACE &&
					keyCode !== ESCAPE
				) {
					return;
				}

				event.preventDefault();
				undo();
			}

			element.addEventListener( 'keydown', onKeyDown );
			return () => {
				element.removeEventListener( 'keydown', onKeyDown );
			};
		},
		[ didAutomaticChange, undo ]
	);
}
