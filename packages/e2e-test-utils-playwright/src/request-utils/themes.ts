/**
 * Internal dependencies
 */
import type { RequestUtils } from './index';
import { WP_BASE_URL } from '../config';

const THEMES_URL = new URL( 'wp-admin/themes.php', WP_BASE_URL ).href;

async function activateTheme(
	this: RequestUtils,
	themeSlug: string
): Promise< void > {
	let response = await this.request.get( THEMES_URL );
	const html = await response.text();
	const optionalFolder = '([a-z0-9-]+%2F)?';

	// The `optionalFolder` regex part matches paths with a folder,
	// so it will return the first match, which might contain a folder.
	// First try to honor the included theme slug, that is, without a folder.
	let matchGroup = html.match(
		`action=activate&amp;stylesheet=${ encodeURIComponent(
			themeSlug
		) }&amp;_wpnonce=[a-z0-9]+`
	);

	// If the theme is not found, try to match the theme slug with a folder.
	if ( ! matchGroup ) {
		matchGroup = html.match(
			`action=activate&amp;stylesheet=${ optionalFolder }${ encodeURIComponent(
				themeSlug
			) }&amp;_wpnonce=[a-z0-9]+`
		);
	}

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

// https://developer.wordpress.org/rest-api/reference/themes/#definition
async function getCurrentThemeGlobalStylesPostId( this: RequestUtils ) {
	type ThemeItem = {
		stylesheet: string;
		status: string;
		_links: { 'wp:user-global-styles': { href: string }[] };
	};
	const themes = await this.rest< ThemeItem[] >( {
		path: '/wp/v2/themes',
	} );
	let themeGlobalStylesId: string = '';
	if ( themes && themes.length ) {
		const currentTheme: ThemeItem | undefined = themes.find(
			( { status } ) => status === 'active'
		);

		const globalStylesURL =
			currentTheme?._links?.[ 'wp:user-global-styles' ]?.[ 0 ]?.href;
		if ( globalStylesURL ) {
			themeGlobalStylesId = globalStylesURL?.split(
				'rest_route=/wp/v2/global-styles/'
			)[ 1 ];
		}
	}
	return themeGlobalStylesId;
}

/**
 * Deletes all post revisions using the REST API.
 *
 * @param {}              this     RequestUtils.
 * @param {string|number} parentId Post attributes.
 */
async function getThemeGlobalStylesRevisions(
	this: RequestUtils,
	parentId: number | string
) {
	// Lists all global styles revisions.
	return await this.rest< Record< string, Object >[] >( {
		path: `/wp/v2/global-styles/${ parentId }/revisions`,
		params: {
			per_page: 100,
		},
	} );
}

export {
	activateTheme,
	getCurrentThemeGlobalStylesPostId,
	getThemeGlobalStylesRevisions,
};
