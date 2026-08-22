import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from '@wordpress/element';
import { addQueryArgs } from '@wordpress/url';

const ACTIVE_THEMES_URL = '/wp/v2/themes?status=active';

type ActiveTheme = { name?: { rendered?: string } };

/**
 * The actually active theme, read past the theme preview: an empty
 * `wp_theme_preview` makes Core's apiFetch middleware strip the parameter
 * instead of forwarding it, so the endpoint reports the real active theme
 * rather than the previewed one.
 */
export function useActualCurrentTheme() {
	const [ currentTheme, setCurrentTheme ] = useState< ActiveTheme >();

	useEffect( () => {
		const path = addQueryArgs( ACTIVE_THEMES_URL, {
			context: 'edit',
			wp_theme_preview: '',
		} );

		apiFetch< ActiveTheme[] >( { path } )
			.then( ( activeThemes ) => setCurrentTheme( activeThemes[ 0 ] ) )
			.catch( () => {} );
	}, [] );

	return currentTheme;
}
