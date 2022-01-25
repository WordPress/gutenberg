/**
 * External dependencies
 */
import { filter } from 'lodash';

/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../store';

/**
 * Internal dependencies
 */
import { useGlobalStylesOutput } from '../global-styles/use-global-styles-output';

function useGlobalStylesRenderer() {
	const [ styles, settings ] = useGlobalStylesOutput();
	const { getSettings } = useSelect( editSiteStore );
	const { updateSettings } = useDispatch( editSiteStore );

	useEffect( () => {
		if ( ! styles || ! settings ) {
			return;
		}

		const currentStoreSettings = getSettings();
		const nonGlobalStyles = filter(
			currentStoreSettings.styles,
			( style ) => ! style.isGlobalStyles
		);
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
