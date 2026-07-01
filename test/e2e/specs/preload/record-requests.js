/**
 * Subscribes to all `fetch` requests made from `page` and returns
 * normalised `${ method } ${ path }${ query }` strings.
 *
 * Path captures the REST route, stripping the `/wp-json` prefix (or
 * reading the `rest_route` query arg when the site is on plain
 * permalinks). The `_locale` query arg is removed because it's added
 * uniformly to every `apiFetch` call and carries no signal.
 *
 * @param {import('@playwright/test').Page} page
 * @return {{ requests: string[], stop: () => void }} Live array of captured
 *         request strings, and a function to detach the listener.
 */
function recordRequests( page ) {
	const requests = [];

	function onRequest( request ) {
		if ( request.resourceType() !== 'fetch' ) {
			return;
		}
		const urlObject = new URL( request.url() );
		const restRoute =
			urlObject.searchParams.get( 'rest_route' ) ??
			urlObject.pathname.replace( /^\/wp-json/, '' );
		urlObject.searchParams.delete( '_locale' );
		const query = urlObject.searchParams.toString();
		requests.push(
			`${ request.method() } ${ restRoute }${
				query ? `?${ query }` : ''
			}`
		);
	}

	page.on( 'request', onRequest );

	return {
		requests,
		stop: () => page.off( 'request', onRequest ),
	};
}

module.exports = { recordRequests };
