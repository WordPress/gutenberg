/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

/**
 * Internal dependencies
 */
const { recordRequests } = require( './record-requests' );

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

		// `POST /wp/v2/users/me` (preferences persistence) occasionally
		// fires twice within the captured window; the duplicate count
		// isn't stable across runs, so this assertion deduplicates.
		// To do: these should all be removed or preloaded.
		expect( Array.from( new Set( requests ) ).sort() ).toEqual(
			[
				`GET /wp/v2/comments?context=edit&post=${ postId }&type=note&status=all&per_page=100`,
				'GET /wp/v2/taxonomies?context=edit&per_page=100',
				'GET /wp/v2/taxonomies?context=view',
				'GET /wp/v2/templates/lookup?slug=front-page',
				'GET /wp/v2/users/1?context=view&_fields=id%2Cname',
				'GET /wp/v2/wp_pattern_category?context=view&per_page=100&_fields=id%2Cname%2Cdescription%2Cslug',
				'OPTIONS /wp/v2/posts',
				'OPTIONS /wp/v2/settings',
				`POST /wp/v2/posts/${ postId }`,
				'POST /wp-sync/v1/updates',
				'POST /wp/v2/users/me',
			].sort()
		);
	} );
} );
