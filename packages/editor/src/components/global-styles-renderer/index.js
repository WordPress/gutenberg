/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';
import { useGlobalStylesOutputWithConfig } from '../../hooks/use-global-styles-output';
import { useGlobalStylesContext } from '../global-styles-provider';

function useGlobalStylesRenderer( disableRootPadding ) {
	// Use useGlobalStylesContext which includes connected style variation for the current post.
	const { merged: mergedConfig } = useGlobalStylesContext();
	const [ styles, settings ] = useGlobalStylesOutputWithConfig(
		mergedConfig,
		disableRootPadding
	);
	const { getEditorSettings } = useSelect( editorStore );
	const { updateEditorSettings } = useDispatch( editorStore );

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
	}, [ styles, settings, updateEditorSettings, getEditorSettings ] );
}

export function GlobalStylesRenderer( { disableRootPadding } ) {
	useGlobalStylesRenderer( disableRootPadding );

	return null;
}
