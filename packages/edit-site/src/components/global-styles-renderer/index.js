/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../store';
import { unlock } from '../../lock-unlock';

const { useGlobalStylesOutput } = unlock( blockEditorPrivateApis );

function useGlobalStylesRenderer() {
	const [ styles, settings ] = useGlobalStylesOutput();
	const { getSettings } = useSelect( editSiteStore );
	const { updateSettings } = useDispatch( editSiteStore );

	useEffect( () => {
		if ( ! styles || ! settings ) {
			return;
		}

		const currentStoreSettings = getSettings();
		const nonGlobalStyles = Object.values(
			currentStoreSettings.styles ?? []
		).filter( ( style ) => ! style.isGlobalStyles );
		updateSettings( {
			...currentStoreSettings,
			styles: [ ...nonGlobalStyles, ...styles ],
			__experimentalFeatures: settings,
		} );
	}, [ styles, settings ] );
}

export function GlobalStylesRenderer() {
	useGlobalStylesRenderer();

	return null;
}
