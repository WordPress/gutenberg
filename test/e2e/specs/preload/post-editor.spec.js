/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

/**
 * Internal dependencies
 */
const {
	recordRequests,
	waitForRequestsToSettle,
} = require( './record-requests' );

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
		// the REST traffic to settle (rather than a UI marker) is the right
		// signal here: it ensures trailing startup fetches and the racy
		// resolver duplicates have all been observed before we assert.
		await waitForRequestsToSettle( requests );
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

test.describe( 'Preload with the DataForm inspector experiment', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.setGutenbergExperiments( [
			'gutenberg-dataform-inspector',
		] );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.setGutenbergExperiments( [] );
	} );

	test( 'Should serve the view config form request from the preload cache', async ( {
		page,
		admin,
		editor,
	} ) => {
		const { requests, stop } = recordRequests( page );

		// `clearPreloadedData` warns if any preload entry went unused —
		// including the view config path, should it drift from the request
		// issued by the `getViewConfig` resolver kickoff.
		let preloadStatus;
		page.on( 'console', ( msg ) => {
			const text = msg.text();
			if ( text.startsWith( '[api-fetch][preload] ' ) ) {
				preloadStatus = text;
			}
		} );

		await admin.createNewPost();
		await openPostSummary( { editor, page } );
		await waitForRequestsToSettle( requests );
		stop();

		// Every preloaded path — including the view config form request —
		// should be consumed by the kickoff.
		expect( preloadStatus ).toBe(
			'[api-fetch][preload] All preloads consumed.'
		);
		// The DataForm-based inspector's form config must be served from the
		// preload cache; a real request here means the sidebar renders an
		// empty form first and flashes once the response arrives.
		expect(
			requests.filter( ( request ) =>
				request.includes( '/wp/v2/view-config' )
			)
		).toEqual( [] );
	} );
} );

async function openPostSummary( { editor, page } ) {
	await editor.openDocumentSettingsSidebar();

	await expect( page.locator( '.editor-post-summary' ) ).toBeVisible();
}
