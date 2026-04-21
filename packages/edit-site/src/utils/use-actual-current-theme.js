/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { useState, useEffect } from '@wordpress/element';
import { addQueryArgs } from '@wordpress/url';

const ACTIVE_THEMES_URL = '/wp/v2/themes?status=active';

export function useActualCurrentTheme() {
	const [ currentTheme, setCurrentTheme ] = useState();

	useEffect( () => {
		// Set the `wp_theme_preview` to empty string to bypass the createThemePreviewMiddleware.
		const path = addQueryArgs( ACTIVE_THEMES_URL, {
			context: 'edit',
			wp_theme_preview: '',
		} );

		apiFetch( { path } )
			.then( ( activeThemes ) => setCurrentTheme( activeThemes[ 0 ] ) )
			// Do nothing
			.catch( () => {} );
	}, [] );

	return currentTheme;
}
