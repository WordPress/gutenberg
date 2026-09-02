import { BACKSPACE, ESCAPE } from '@wordpress/keycodes';
import { useSelect } from '@wordpress/data';
import { useRefEffect } from '@wordpress/compose';
import { store as blockEditorStore } from '../../store';

export default function useUndoAutomaticChange() {
	const { didAutomaticChange, getSettings } = useSelect( blockEditorStore );

	return useRefEffect( ( node ) => {
		function onKeyDown( event ) {
			const { keyCode } = event;

			if ( event.defaultPrevented ) {
				return;
			}

			if ( keyCode !== BACKSPACE && keyCode !== ESCAPE ) {
				return;
			}

			const { __experimentalUndo } = getSettings();

			if ( ! __experimentalUndo ) {
				return;
			}

			if ( ! didAutomaticChange() ) {
				return;
			}

			event.preventDefault();
			__experimentalUndo();
		}

		// The undo claims the key ahead of fallbacks such as the Escape step
		// out of the canvas, which listen in the bubble phase and yield to
		// `defaultPrevented`.
		node.addEventListener( 'keydown', onKeyDown, { capture: true } );
		return () => {
			node.removeEventListener( 'keydown', onKeyDown, {
				capture: true,
			} );
		};
	}, [] );
}
