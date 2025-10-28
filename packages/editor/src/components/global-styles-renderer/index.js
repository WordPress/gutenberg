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
	const { getEditorStyles } = useSelect( editorStore );
	const { setEditorStyles, updateEditorSettings } =
		useDispatch( editorStore );

	useEffect( () => {
		if ( ! styles || ! settings ) {
			return;
		}

		const currentStyles = getEditorStyles();
		const nonGlobalStyles = Object.values( currentStyles ?? [] ).filter(
			( style ) => ! style.isGlobalStyles
		);
		setEditorStyles( [ ...nonGlobalStyles, ...styles ] );
		updateEditorSettings( { __experimentalFeatures: settings } );
	}, [
		styles,
		settings,
		setEditorStyles,
		updateEditorSettings,
		getEditorStyles,
	] );
}

export function GlobalStylesRenderer( { disableRootPadding } ) {
	useGlobalStylesRenderer( disableRootPadding );

	return null;
}
