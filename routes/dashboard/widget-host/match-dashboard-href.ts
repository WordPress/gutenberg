/*
 * A query both navigations read alike. The route link hands the router one
 * string per key; the router's own parser, which a full load runs, folds a
 * repeated key into an array and reads JSON values as such.
 */
function isPlainQuery( query: string ): boolean {
	const seen = new Set< string >();

	for ( const [ key, value ] of new URLSearchParams( query ) ) {
		let isJson = true;
		try {
			JSON.parse( value );
		} catch {
			isJson = false;
		}

		if ( seen.has( key ) || isJson ) {
			return false;
		}
		seen.add( key );
	}

	return true;
}

/**
 * Resolves an action href to a route inside this SPA.
 *
 * A href belongs here when it targets the same document (origin and
 * pathname) and the same admin `page`; the route is then whatever `p`
 * carries, its own query included, which the router reads as the route's
 * search params. Anything a route navigation cannot deliver faithfully
 * stays a plain anchor: a hash, search params beyond `page` and `p`,
 * duplicates of either, a `p` that is not a root-relative path, or a
 * query the router would not read as the route link hands it over (a
 * repeated key, or a value that parses as JSON).
 *
 * @param {string} href Action href, absolute or relative.
 * @param {string} base Document URL the href is judged against; defaults
 *                      to the current location.
 * @return {string | null} The in-app route, its query included, or `null`.
 */
export function matchDashboardHref(
	href: string,
	base: string = window.location.href
): string | null {
	let url: URL;
	let baseUrl: URL;
	try {
		baseUrl = new URL( base );
		url = new URL( href, baseUrl );
	} catch {
		return null;
	}

	if (
		url.origin !== baseUrl.origin ||
		url.pathname !== baseUrl.pathname ||
		url.hash
	) {
		return null;
	}

	if (
		url.searchParams.get( 'page' ) !== baseUrl.searchParams.get( 'page' )
	) {
		return null;
	}

	for ( const key of url.searchParams.keys() ) {
		if ( key !== 'page' && key !== 'p' ) {
			return null;
		}
	}

	/*
	 * On duplicates, `URLSearchParams.get()` reads the first value while
	 * PHP reads the last: the two navigations would diverge.
	 */
	if (
		url.searchParams.getAll( 'page' ).length > 1 ||
		url.searchParams.getAll( 'p' ).length > 1
	) {
		return null;
	}

	const path = url.searchParams.get( 'p' ) || '/';

	/*
	 * The router writes a root-relative pathname into `p`, the route's query
	 * behind it. Any other shape (`https://…`, `mailto:…`, `//host`,
	 * `reports`) the router link would resolve as an external URL or a
	 * relative path, where the full load cannot follow; a hash never
	 * survives the round trip.
	 */
	const queryStart = path.indexOf( '?' );
	const pathname = queryStart === -1 ? path : path.slice( 0, queryStart );
	if ( ! /^\/(?!\/)/.test( pathname ) || path.includes( '#' ) ) {
		return null;
	}

	if ( queryStart !== -1 && ! isPlainQuery( path.slice( queryStart + 1 ) ) ) {
		return null;
	}

	return path;
}
