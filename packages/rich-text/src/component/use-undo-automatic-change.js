/**
 * WordPress dependencies
 */
import { useRefEffect } from '@wordpress/compose';
import { BACKSPACE, DELETE, ESCAPE } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import { useFreshRef } from './use-fresh-ref';

export function useUndoAutomaticChange( props ) {
	const propsRef = useFreshRef( props );
	return useRefEffect( ( element ) => {
		function onKeyDown( event ) {
			const { keyCode } = event;
			const { didAutomaticChange, undo } = propsRef.current;

			if ( ! didAutomaticChange || ! undo ) {
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
	}, [] );
}
