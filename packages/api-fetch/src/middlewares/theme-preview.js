/**
 * WordPress dependencies
 */
import { addQueryArgs, getQueryArg, removeQueryArgs } from '@wordpress/url';

/**
 * This appends a `wp_theme_preview` parameter to the REST API request URL if
 * the admin URL contains a `theme` GET parameter.
 *
 * If the REST API request URL has contained the `wp_theme_preview` parameter as `''`,
 * then bypass this middleware.
 *
 * @param {Record<string, any>} themePath
 * @return {import('../types').APIFetchMiddleware} Preloading middleware.
 */
const createThemePreviewMiddleware = ( themePath ) => ( options, next ) => {
	if ( typeof options.url === 'string' ) {
		const wpThemePreview = getQueryArg( options.url, 'wp_theme_preview' );
		if ( wpThemePreview === undefined ) {
			options.url = addQueryArgs( options.url, {
				wp_theme_preview: themePath,
			} );
		} else if ( wpThemePreview === '' ) {
			options.url = removeQueryArgs( options.url, 'wp_theme_preview' );
		}
	}

	if ( typeof options.path === 'string' ) {
		const wpThemePreview = getQueryArg( options.path, 'wp_theme_preview' );
		if ( wpThemePreview === undefined ) {
			options.path = addQueryArgs( options.path, {
				wp_theme_preview: themePath,
			} );
		} else if ( wpThemePreview === '' ) {
			options.path = removeQueryArgs( options.path, 'wp_theme_preview' );
		}
	}

	return next( options );
};

export default createThemePreviewMiddleware;
