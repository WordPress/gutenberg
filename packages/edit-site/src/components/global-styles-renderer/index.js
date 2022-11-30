/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../store';

/**
 * Internal dependencies
 */
import { useGlobalStylesOutput } from '../global-styles/use-global-styles-output';

function useGlobalStylesRenderer() {
	const [ styles, settings, svgFilters ] = useGlobalStylesOutput();
	const { getSettings } = useSelect( editSiteStore );
	const { updateSettings } = useDispatch( editSiteStore );
	const customCSS = useSelect( ( select ) => {
		const { getEntityRecord } = select( coreStore );
		return getEntityRecord( 'postType', 'custom_css' )?.post_content;
	} );

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
			styles: [
				...nonGlobalStyles,
				...styles,
				{ css: customCSS, isGlobalStyles: false },
			],
			svgFilters,
			__experimentalFeatures: settings,
		} );
	}, [ styles, settings, customCSS ] );
}

export function GlobalStylesRenderer() {
	useGlobalStylesRenderer();

	return null;
}
