/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

/**
 * Internal dependencies
 */
const { recordRequests } = require( './record-requests' );

/**
 * Returns the major Chromium version from the browser's user agent, or 0 if
 * not Chromium.
 *
 * @param {import('@playwright/test').Page} page Playwright page object.
 * @return {Promise<number>} Major Chromium version.
 */
async function getChromiumMajorVersion( page ) {
	return page.evaluate( () => {
		const match = window.navigator.userAgent.match( /Chrome\/(\d+)/ );
		return match ? parseInt( match[ 1 ], 10 ) : 0;
	} );
}

test.describe( 'Preload', () => {
	let postId;

	test.beforeAll( async ( { requestUtils } ) => {
		const post = await requestUtils.createPost( {
			content:
				'<!-- wp:heading -->\n<h2 class="wp-block-heading">Hello</h2>\n<!-- /wp:heading -->',
			status: 'draft',
		} );
		postId = post.id;
	} );

	test.beforeEach( async ( { page } ) => {
		// These editor-startup request assertions fail in CI after the
		// Playwright upgrade to Chrome for Testing 148/149 (the only change in
		// #78632): on the Document-Isolation-Policy editor screen, startup
		// never reaches `networkidle` and the page is torn down, so the test
		// times out. Skip until the bundled browser is past the affected
		// versions. See https://github.com/WordPress/gutenberg/pull/78632.
		test.skip(
			( await getChromiumMajorVersion( page ) ) >= 148,
			'Document-Isolation-Policy is broken in Chromium 148+'
		);
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllPosts();
	} );

	test( 'Should fetch a known set of routes during startup', async ( {
		page,
		admin,
		editor,
	} ) => {
		const { requests, stop } = recordRequests( page );
		const { requests: requestsUntilMount, stop: stopOnMount } =
			recordRequests( page );

		// Mount boundary. `clearPreloadedData` warns if any preload
		// entry went unused, logs the success line otherwise.
		let preloadStatus;
		page.on( 'console', ( msg ) => {
			const text = msg.text();
			if ( text.startsWith( '[api-fetch][preload] ' ) ) {
				preloadStatus = text;
				stopOnMount();
			}
		} );

		await admin.editPost( postId );
		// Ensure the document sidebar is open — its default state isn't
		// stable across environments (CI vs. local). Several of the routes
		// asserted below are fired by panels inside the sidebar (post
		// author, post actions).
		await editor.openDocumentSettingsSidebar();
		await page
			.frameLocator( 'iframe[name="editor-canvas"]' )
			.getByRole( 'document', { name: 'Block: Heading' } )
			.filter( { hasText: 'Hello' } )
			.waitFor();
		// This spec is explicitly testing network behaviour, so waiting for
		// the network to settle (rather than a UI marker) is the right
		// signal here: it ensures trailing startup fetches and the racy
		// resolver duplicates have all been observed before we assert.
		// eslint-disable-next-line playwright/no-networkidle
		await page.waitForLoadState( 'networkidle' );
		stop();

		// Only collab side effects (CRDT persist + first wp-sync poll)
		// should escape before mount — they're detached promise chains
		// off `receiveEntityRecords`.
		expect( Array.from( new Set( requestsUntilMount ) ).sort() ).toEqual(
			[ 'POST /wp-sync/v1/save', 'POST /wp-sync/v1/updates' ].sort()
		);
		// Every preloaded path should be consumed by the kickoff.
		expect( preloadStatus ).toBe(
			'[api-fetch][preload] All preloads consumed.'
		);
		// `POST /wp/v2/users/me` (preferences persistence) occasionally
		// fires twice within the captured window; the duplicate count
		// isn't stable across runs, so this assertion deduplicates.
		// To do: these should all be removed or preloaded.
		expect( Array.from( new Set( requests ) ).sort() ).toEqual(
			[
				`GET /wp/v2/comments?context=edit&post=${ postId }&type=note&status=all&per_page=100`,
				'POST /wp-sync/v1/save',
				'POST /wp-sync/v1/updates',
				'POST /wp/v2/users/me',
			].sort()
		);
	} );
} );
