/**
 * Internal dependencies
 */
import type { RequestUtils } from './index';

/**
 * Get the current user global styles post id.
 *
 * @see https://developer.wordpress.org/rest-api/reference/themes/#definition
 * @param {RequestUtils} this RequestUtils.
 * @return {Promise<string>} The user global styles post id.
 */
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
 * Update the user's global styles. Note that this overwrites and previously
 * set styles. Styles that you want to keep should be merged in manually.
 *
 * @param {RequestUtils} this   RequestUtils.
 * @param {Object}       styles A theme.json compatible object.
 */
async function updateGlobalStyles( this: RequestUtils, styles: Object ) {
	const globalStylesPostId = await this.getCurrentThemeGlobalStylesPostId();

	if ( ! globalStylesPostId ) {
		return;
	}

	return await this.rest( {
		path: `/wp/v2/global-styles/${ globalStylesPostId }`,
		method: 'POST',
		data: { id: globalStylesPostId, styles },
	} );
}

/**
 * List all post revisions using the REST API.
 *
 * @param {RequestUtils}  this     RequestUtils.
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
	getCurrentThemeGlobalStylesPostId,
	getThemeGlobalStylesRevisions,
	updateGlobalStyles,
};
