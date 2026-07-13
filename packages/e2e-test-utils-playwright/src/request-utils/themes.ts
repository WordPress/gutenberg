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
	const maxAttempts = 5;
	const baseDelay = 1000;

	for ( let attempt = 1; attempt <= maxAttempts; attempt++ ) {
		try {
			await activateThemeOnce.call( this, themeSlug );
			await verifyThemeActive.call( this, themeSlug );
			return;
		} catch ( error ) {
			const message =
				error instanceof Error ? error.message : String( error );
			const isTransient =
				/socket hang up|ECONNRESET|ETIMEDOUT|5\d{2}|ERR_HTTP|timeout|ENOTFOUND/i.test(
					message
				);

			if ( ! isTransient || attempt === maxAttempts ) {
				throw error;
			}

			const delay =
				baseDelay * Math.pow( 2, attempt - 1 ) + Math.random() * 500;
			await new Promise( ( resolve ) => setTimeout( resolve, delay ) );
		}
	}
}

async function activateThemeOnce(
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

async function verifyThemeActive(
	this: RequestUtils,
	themeSlug: string
): Promise< void > {
	type ThemeItem = {
		stylesheet: string;
		status: string;
	};

	const themes = await this.rest< ThemeItem[] >( {
		path: '/wp/v2/themes',
	} );

	if ( ! themes || ! themes.length ) {
		throw new Error( 'Failed to fetch themes via REST API' );
	}

	const activeTheme = themes.find( ( { status } ) => status === 'active' );

	if ( ! activeTheme ) {
		throw new Error( 'No active theme found' );
	}

	// The stylesheet may include a folder path, so check both exact match and partial match
	const isActive =
		activeTheme.stylesheet === themeSlug ||
		activeTheme.stylesheet.endsWith( `/${ themeSlug }` );

	if ( ! isActive ) {
		throw new Error(
			`Theme verification failed. Expected: ${ themeSlug }, Got: ${ activeTheme.stylesheet }`
		);
	}
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
			// Extract the ID from the URL. The URL format depends on
			// the permalink structure:
			// - Plain: ?rest_route=/wp/v2/global-styles/123
			// - Pretty: /wp-json/wp/v2/global-styles/123
			const idMatch = globalStylesURL.match(
				/\/wp\/v2\/global-styles\/(\d+)/
			);
			if ( idMatch ) {
				themeGlobalStylesId = idMatch[ 1 ];
			}
		}
	}
	return themeGlobalStylesId;
}

/**
 * Resets the current theme's user global styles to an empty config.
 *
 * Useful for ensuring test isolation when a prior spec has saved global
 * styles for the same theme, which would otherwise leak into later specs
 * sharing the database.
 *
 * @param this Request utils.
 */
async function resetThemeGlobalStyles( this: RequestUtils ) {
	const stylesPostId = await getCurrentThemeGlobalStylesPostId.call( this );

	if ( ! stylesPostId ) {
		return;
	}

	await this.rest( {
		method: 'POST',
		path: `/wp/v2/global-styles/${ stylesPostId }`,
		data: {
			id: stylesPostId,
			settings: {},
			styles: {},
		},
	} );
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
	resetThemeGlobalStyles,
};
