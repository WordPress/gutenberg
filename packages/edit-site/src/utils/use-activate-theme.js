/**
 * WordPress dependencies
 */
import { store as coreStore } from '@wordpress/core-data';
import { useDispatch } from '@wordpress/data';
import { privateApis as routerPrivateApis } from '@wordpress/router';

/**
 * Internal dependencies
 */
import { unlock } from '../lock-unlock';
import {
	isPreviewingTheme,
	currentlyPreviewingTheme,
} from './is-previewing-theme';

const { useHistory, useLocation } = unlock( routerPrivateApis );

/**
 * This should be refactored to use the REST API, once the REST API can activate themes.
 *
 * @return {Function} A function that activates the theme.
 */
export function useActivateTheme() {
	const history = useHistory();
	const location = useLocation();
	const { startResolution, finishResolution } = useDispatch( coreStore );

	return async () => {
		if ( isPreviewingTheme() ) {
			const activationURL =
				'themes.php?action=activate&stylesheet=' +
				currentlyPreviewingTheme() +
				'&_wpnonce=' +
				window.WP_BLOCK_THEME_ACTIVATE_NONCE;
			startResolution( 'activateTheme' );
			await window.fetch( activationURL );
			finishResolution( 'activateTheme' );
			const { wp_theme_preview: themePreview, ...params } =
				location.params;
			history.replace( params );
		}
	};
}
