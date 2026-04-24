/**
 * WordPress dependencies
 */
import { store as coreStore } from '@wordpress/core-data';
import { useDispatch } from '@wordpress/data';
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { addQueryArgs } from '@wordpress/url';

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
	const { path } = useLocation();
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
			// Remove the wp_theme_preview query param: we've finished activating
			// the queue and are switching to normal Site Editor.
			history.navigate( addQueryArgs( path, { wp_theme_preview: '' } ) );
		}
	};
}
