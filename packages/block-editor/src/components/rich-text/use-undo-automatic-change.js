/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useRefEffect } from '@wordpress/compose';
import { BACKSPACE, DELETE, ESCAPE } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';

export function useUndoAutomaticChange() {
	const { didAutomaticChange, getSettings } = useSelect( blockEditorStore );
	return useRefEffect( ( element ) => {
		function onKeyDown( event ) {
			const { keyCode } = event;

			if (
				keyCode !== DELETE &&
				keyCode !== BACKSPACE &&
				keyCode !== ESCAPE
			) {
				return;
			}

			if ( ! didAutomaticChange() ) {
				return;
			}

			event.preventDefault();
			getSettings().__experimentalUndo();
		}

		element.addEventListener( 'keydown', onKeyDown );
		return () => {
			element.removeEventListener( 'keydown', onKeyDown );
		};
	}, [] );
}
