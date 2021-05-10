/**
 * WordPress dependencies
 */
import { useRef } from '@wordpress/element';
import { useRefEffect } from '@wordpress/compose';
import { BACKSPACE, DELETE, ESCAPE } from '@wordpress/keycodes';

export function useUndoAutomaticChange( props ) {
	const propsRef = useRef( props );
	propsRef.current = props;
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
