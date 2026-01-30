/**
 * Builds a full REST API URL from a path, mimicking apiFetch middleware behavior.
 *
 * This function handles:
 * 1. Combining the WordPress REST API root with the given path
 * 2. Plain permalink support (converting ? to & when root contains ?)
 * 3. Adding _locale=user parameter for localized responses
 *
 * Note: This is used for XHR requests where we need progress tracking.
 * Custom apiFetch middlewares registered via apiFetch.use() are not supported.
 *
 * @param path The REST API path (e.g., '/wp/v2/media')
 * @return The full URL to the REST API endpoint
 */
export function buildRestUrl( path: string ): string {
	let url = path;

	// Check if we're in a WordPress environment with REST API root.
	if (
		typeof window !== 'undefined' &&
		( window as Window & { wpApiSettings?: { root?: string } } )
			.wpApiSettings?.root
	) {
		const apiRoot = (
			window as Window & { wpApiSettings?: { root?: string } }
		 ).wpApiSettings!.root!;

		// Remove leading slash from path for concatenation.
		let normalizedPath = path.replace( /^\//, '' );

		// Handle plain permalinks: if the API root contains a query string,
		// any ? in the path needs to become & to avoid duplicate ?.
		// Example: /wp-admin/admin-ajax.php?rest_route=/wp/v2/media?_embed=...
		// becomes: /wp-admin/admin-ajax.php?rest_route=/wp/v2/media&_embed=...
		if ( apiRoot.includes( '?' ) ) {
			normalizedPath = normalizedPath.replace( '?', '&' );
		}

		url = apiRoot + normalizedPath;
	}

	// Add _locale=user parameter to match apiFetch's userLocaleMiddleware behavior.
	// This ensures responses use the user's locale for translated strings.
	const separator = url.includes( '?' ) ? '&' : '?';
	url += `${ separator }_locale=user`;

	return url;
}
