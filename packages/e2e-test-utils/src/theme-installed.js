/**
 * Internal dependencies
 */
import { rest } from './rest-api';

/**
 * Checks whether a theme exists on the site.
 *
 * @param {string} slug Theme slug to check.
 * @return {boolean} Whether the theme exists.
 */
export async function isThemeInstalled( slug ) {
	const themes = await rest( {
		method: 'GET',
		path: '/wp/v2/themes',
	} );
	const themeFound = themes.some( ( theme ) => theme.stylesheet === slug );
	return themeFound;
}
