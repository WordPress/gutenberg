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
