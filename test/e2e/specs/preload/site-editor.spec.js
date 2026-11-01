const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );
const {
	recordRequests,
	waitForRequestsToSettle,
} = require( './record-requests' );

/**
 * Records the REST requests of a site editor load, split at the preload
 * boundary log that the kickoff prints right before React mounts.
 *
 * @param {import('@playwright/test').Page} page
 */
function recordStartup( page ) {
	const all = recordRequests( page );
	const untilMount = recordRequests( page );
	const result = { all, untilMount, preloadStatus: undefined };
	page.on( 'console', ( msg ) => {
		const text = msg.text();
		if ( text.startsWith( '[api-fetch][preload] ' ) ) {
			result.preloadStatus = text;
			untilMount.stop();
		}
	} );
	return result;
}

test.describe( 'Preload', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
		await requestUtils.resetPreferences();
		// Posts left behind by earlier specs change the startup requests:
		// with at least one post, emptytheme's index template query loop
		// renders the Post Excerpt block, whose editor component fetches
		// /wp/v2/types/post?context=edit.
		await requestUtils.deleteAllPosts();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllPages();
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test( 'Site editor root should fetch a known set of routes during startup', async ( {
		page,
		admin,
	} ) => {
		const startup = recordStartup( page );

		await admin.visitSiteEditor();
		await page
			.frameLocator( 'iframe[name="editor-canvas"]' )
			.locator( '[data-block]' )
			.first()
			.waitFor();
		await waitForRequestsToSettle( startup.all.requests );
		startup.all.stop();

		// Everything the kickoff touches is served by the preload cache.
		expect( startup.untilMount.requests ).toEqual( [] );
		expect( startup.preloadStatus ).toBe(
			'[api-fetch][preload] All preloads consumed.'
		);

		// `POST /wp/v2/users/me` (preferences persistence) occasionally
		// fires twice within the captured window; the duplicate count
		// isn't stable across runs, so this assertion deduplicates.
		// The posts query comes from the Query Loop block in the template.
		expect( Array.from( new Set( startup.all.requests ) ).sort() ).toEqual(
			[
				'GET /wp/v2/posts?context=edit&offset=0&order=desc&orderby=date&per_page=10&ignore_sticky=false',
				'POST /wp/v2/users/me',
			].sort()
		);
	} );

	for ( const status of [ 'draft', 'publish' ] ) {
		test( `Editing a ${
			status === 'publish' ? 'published' : 'draft'
		} page should fetch a known set of routes during startup`, async ( {
			page,
			admin,
			requestUtils,
		} ) => {
			// A draft without a title has no slug, so its template lookup
			// uses `slug=page` rather than `slug=page-{slug}`.
			const { id: pageId } = await requestUtils.createPage( {
				title:
					status === 'publish' ? 'Published preload page' : undefined,
				content:
					'<!-- wp:heading -->\n<h2 class="wp-block-heading">Hello</h2>\n<!-- /wp:heading -->',
				status,
			} );
			const startup = recordStartup( page );

			await admin.visitSiteEditor( {
				postId: pageId,
				postType: 'page',
				canvas: 'edit',
			} );
			await page
				.frameLocator( 'iframe[name="editor-canvas"]' )
				.getByRole( 'document', { name: 'Block: Heading' } )
				.filter( { hasText: 'Hello' } )
				.waitFor();
			await waitForRequestsToSettle( startup.all.requests );
			startup.all.stop();

			expect( startup.untilMount.requests ).toEqual( [] );
			expect( startup.preloadStatus ).toBe(
				'[api-fetch][preload] All preloads consumed.'
			);

			// The same requests the post editor still makes after mount.
			expect(
				Array.from( new Set( startup.all.requests ) ).sort()
			).toEqual(
				[
					`GET /wp/v2/comments?context=edit&post=${ pageId }&type=note&status=all&per_page=100`,
					'GET /wp/v2/users?context=view&include%5B0%5D=1&who=authors',
					'POST /wp/v2/users/me',
				].sort()
			);
		} );
	}

	test( 'Editing a page opened from the pages list should fetch a known set of routes during startup', async ( {
		page,
		admin,
		requestUtils,
	} ) => {
		const { id: pageId } = await requestUtils.createPage( {
			title: 'Listed preload page',
			content:
				'<!-- wp:heading -->\n<h2 class="wp-block-heading">Hello</h2>\n<!-- /wp:heading -->',
			status: 'publish',
		} );
		const startup = recordStartup( page );

		await admin.visitAdminPage(
			'site-editor.php',
			`p=%2Fpage&postId=${ pageId }&canvas=edit`
		);
		await page
			.frameLocator( 'iframe[name="editor-canvas"]' )
			.getByRole( 'document', { name: 'Block: Heading' } )
			.filter( { hasText: 'Hello' } )
			.waitFor();
		await waitForRequestsToSettle( startup.all.requests );
		startup.all.stop();

		expect( startup.untilMount.requests ).toEqual( [] );
		expect( startup.preloadStatus ).toBe(
			'[api-fetch][preload] All preloads consumed.'
		);

		// The pages list behind the canvas also loads its view config.
		expect( Array.from( new Set( startup.all.requests ) ).sort() ).toEqual(
			[
				`GET /wp/v2/comments?context=edit&post=${ pageId }&type=note&status=all&per_page=100`,
				'GET /wp/v2/users?context=view&include%5B0%5D=1&who=authors',
				'GET /wp/v2/view-config?kind=postType&name=page',
				'POST /wp/v2/users/me',
			].sort()
		);
	} );
} );
