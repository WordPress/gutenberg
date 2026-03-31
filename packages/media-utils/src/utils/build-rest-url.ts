/**
 * WordPress dependencies
 */
import { addQueryArgs, hasQueryArg } from '@wordpress/url';

declare global {
	interface Window {
		wpApiSettings?: {
			root?: string;
			nonce?: string;
		};
	}
}

/**
 * Builds a full URL for REST API requests.
 *
 * This is needed for XHR requests which require a full URL rather than
 * just a path. It handles:
 * - Getting the REST API root from WordPress settings
 * - Plain permalinks where the root URL contains a `?`
 * - Adding the `_locale` parameter for localized responses
 *
 * @param path The REST API path (e.g., '/wp/v2/media').
 * @return The full URL for the REST API request.
 */
export function buildRestUrl( path: string ): string {
	// Get the REST API root from WordPress settings or fall back to default.
	const apiRoot = window.wpApiSettings?.root ?? '/wp-json/';

	// Remove leading slash from path for consistent joining.
	let normalizedPath = path.replace( /^\//, '' );

	// Handle plain permalinks where the API root contains a `?`.
	// In this case, the path's `?` needs to become `&`.
	if ( apiRoot.includes( '?' ) ) {
		normalizedPath = normalizedPath.replaceAll( '?', '&' );
	}

	let url = apiRoot + normalizedPath;

	// Add the _locale parameter for localized responses, matching apiFetch behavior.
	if ( ! hasQueryArg( url, '_locale' ) ) {
		url = addQueryArgs( url, { _locale: 'user' } );
	}

	return url;
}
