/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Preload', () => {
	test( 'Should fetch a known set of routes during startup', async ( {
		page,
		admin,
		editor,
	} ) => {
		const requests = [];

		function onRequest( request ) {
			if ( request.resourceType() !== 'fetch' ) {
				return;
			}
			const urlObject = new URL( request.url() );
			const restRoute =
				urlObject.searchParams.get( 'rest_route' ) ??
				urlObject.pathname.replace( /^\/wp-json/, '' );
			requests.push( `${ request.method() } ${ restRoute }` );
		}

		page.on( 'request', onRequest );

		await admin.createNewPost( {
			content: '<!-- wp:paragraph --><p>Hello</p><!-- /wp:paragraph -->',
		} );
		// Ensure the document sidebar is open — its default state isn't
		// stable across environments (CI vs. local). Several of the routes
		// asserted below are fired by panels inside the sidebar (post
		// author, post actions).
		await editor.openDocumentSettingsSidebar();
		await page
			.frameLocator( 'iframe[name="editor-canvas"]' )
			.locator( '[data-block]' )
			.first()
			.waitFor();
		// This spec is explicitly testing network behaviour, so waiting for
		// the network to settle (rather than a UI marker) is the right
		// signal here: it ensures trailing startup fetches and the racy
		// resolver duplicates have all been observed before we assert.
		// eslint-disable-next-line playwright/no-networkidle
		await page.waitForLoadState( 'networkidle' );
		page.off( 'request', onRequest );

		// Some routes are requested more than once across the captured
		// window because of resolver races (e.g. `GET /wp/v2/templates/lookup`,
		// `POST /wp/v2/users/me`); the duplicate counts are not stable
		// across runs, so this assertion deduplicates.
		// To do: these should all be removed or preloaded.
		expect( Array.from( new Set( requests ) ).sort() ).toEqual(
			[
				'GET /wp/v2/comments',
				'GET /wp/v2/taxonomies',
				'GET /wp/v2/templates/lookup',
				'GET /wp/v2/users/1',
				'GET /wp/v2/wp_pattern_category',
				'OPTIONS /wp/v2/posts',
				'OPTIONS /wp/v2/settings',
				'POST /wp-sync/v1/updates',
				'POST /wp/v2/users/me',
			].sort()
		);
	} );
} );
