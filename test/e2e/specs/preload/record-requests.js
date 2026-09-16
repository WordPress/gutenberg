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

/**
 * Resolves once the recorded REST requests have gone quiet — no new entry has
 * been pushed to `requests` for `quietMs` — or after `maxMs` as a safety cap.
 *
 * These specs previously waited on `page.waitForLoadState( 'networkidle' )`,
 * but `networkidle` never settles once client-side media processing is active
 * (cross-origin isolation via `Document-Isolation-Policy`, which on Chromium
 * 148+ is established for the editor). CSM eagerly spins up the `@wordpress/vips`
 * Web Worker — a module worker loaded from a `blob:` URL — and Chromium keeps
 * that worker's `script` request in-flight for the worker's lifetime, so the
 * page is never network-idle. That worker is not a `fetch` request, so it never
 * enters `requests`; the REST traffic these specs assert on does settle. Wait
 * for that fetch traffic to go quiet instead, which is the signal the
 * assertions actually depend on and works in every isolation mode.
 *
 * The quiet window comfortably exceeds the sub-second startup request burst yet
 * stays under the multi-second collaboration polling interval, so it lands in
 * the gap after startup without waiting for (or being reset by) a poll.
 *
 * @param {string[]} requests          Live array from `recordRequests`.
 * @param {Object}   [options]
 * @param {number}   [options.quietMs] Required idle window, in milliseconds.
 * @param {number}   [options.maxMs]   Overall cap, in milliseconds.
 * @return {Promise<void>} Resolves when the requests have settled.
 */
async function waitForRequestsToSettle(
	requests,
	{ quietMs = 1000, maxMs = 15000 } = {}
) {
	const deadline = Date.now() + maxMs;
	let lastCount = requests.length;
	let quietSince = Date.now();

	while ( Date.now() < deadline ) {
		await new Promise( ( resolve ) => setTimeout( resolve, 100 ) );

		if ( requests.length !== lastCount ) {
			lastCount = requests.length;
			quietSince = Date.now();
		} else if ( Date.now() - quietSince >= quietMs ) {
			return;
		}
	}
}

module.exports = { recordRequests, waitForRequestsToSettle };
