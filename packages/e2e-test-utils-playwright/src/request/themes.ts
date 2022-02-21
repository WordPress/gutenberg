/**
 * Internal dependencies
 */
import type { RequestUtils } from './index';
import { WP_BASE_URL } from '../config';

const THEMES_URL = new URL( '/wp-admin/themes.php', WP_BASE_URL ).href;

async function activateTheme( this: RequestUtils, themeSlug: string ) {
	let response = await this.request.get( THEMES_URL );
	const html = await response.text();
	const matchGroup = html.match(
		new RegExp(
			`action=activate&amp;stylesheet=${ themeSlug }&amp;_wpnonce=[a-z0-9]+`
		)
	);

	if ( ! matchGroup ) {
		if ( html.includes( `data-slug="${ themeSlug }"` ) ) {
			// The theme is already activated.
			return;
		}

		throw new Error( `The theme "${ themeSlug }" is not installed` );
	}

	const [ activateQuery ] = matchGroup;
	const activateLink =
		THEMES_URL + `?${ activateQuery }`.replace( /&amp;/g, '&' );

	response = await this.request.get( activateLink );

	await response.dispose();
}

export { activateTheme };
