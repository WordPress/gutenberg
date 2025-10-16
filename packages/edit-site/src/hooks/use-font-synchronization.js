/**
 * WordPress dependencies
 */
import { useEffect, useRef } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';

/**
 * Internal dependencies
 */
import { copyFontsFromDocumentToIframe } from '../components/global-styles/font-library-modal/utils';

/**
 * Hook that monitors editor mode changes and synchronizes fonts
 * from the root document to the iframe when switching from text to visual mode.
 * This ensures that fonts uploaded while in code editor mode are available
 * in the visual editor.
 *
 * @see https://github.com/WordPress/gutenberg/issues/69139
 */
export function useFontSynchronization() {
	const previousModeRef = useRef( null );

	const mode = useSelect( ( select ) => {
		return select( editorStore ).getEditorMode();
	}, [] );

	useEffect( () => {
		const previousMode = previousModeRef.current;

		// Check if we're switching from text/code mode to visual mode
		if ( previousMode === 'text' && mode === 'visual' ) {
			// Small delay to ensure the iframe is rendered before copying fonts
			setTimeout( () => {
				copyFontsFromDocumentToIframe();
			}, 100 );
		}

		// Update the previous mode for the next comparison
		previousModeRef.current = mode;
	}, [ mode ] );
}
