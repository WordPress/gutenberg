/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';
import { useGlobalStylesOutput } from '../../hooks/use-global-styles-output';

function useGlobalStylesRenderer( disableRootPadding ) {
	const [ styles, settings ] = useGlobalStylesOutput( disableRootPadding );
	const { getEditorSettings } = useSelect( editorStore );
	const { updateEditorSettings } = useDispatch( editorStore );

	// Get the current post ID to force re-run when navigating between posts.
	// This ensures template-aware global styles are re-applied when the
	// active post or template changes, since ExperimentalEditorProvider's
	// updateEditorSettings call may overwrite styles before this effect runs.
	const postId = useSelect( ( select ) =>
		select( editorStore ).getCurrentPostId()
	);

	useEffect( () => {
		if ( ! styles || ! settings ) {
			return;
		}

		const currentStoreSettings = getEditorSettings();
		const nonGlobalStyles = Object.values(
			currentStoreSettings.styles ?? []
		).filter( ( style ) => ! style.isGlobalStyles );

		updateEditorSettings( {
			...currentStoreSettings,
			styles: [ ...nonGlobalStyles, ...styles ],
			__experimentalFeatures: settings,
		} );
	}, [ styles, settings, updateEditorSettings, getEditorSettings, postId ] );
}

export function GlobalStylesRenderer( { disableRootPadding } ) {
	useGlobalStylesRenderer( disableRootPadding );

	return null;
}
