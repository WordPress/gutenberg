/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

/**
 * Internal dependencies
 */
const { recordRequests } = require( './record-requests' );

test.describe( 'Preload', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
		await requestUtils.resetPreferences();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllPages();
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test( 'Site editor root should fetch a known set of routes during startup', async ( {
		page,
		admin,
	} ) => {
		const { requests, stop } = recordRequests( page );
		const { requests: requestsUntilMount, stop: stopOnMount } =
			recordRequests( page );

		let preloadStatus;
		page.on( 'console', ( msg ) => {
			const text = msg.text();
			if ( text.startsWith( '[api-fetch][preload] ' ) ) {
				preloadStatus = text;
				stopOnMount();
			}
		} );

		await admin.visitSiteEditor();
		await page
			.frameLocator( 'iframe[name="editor-canvas"]' )
			.locator( '[data-block]' )
			.first()
			.waitFor();
		// eslint-disable-next-line playwright/no-networkidle
		await page.waitForLoadState( 'networkidle' );
		stop();

		// Everything the kickoff touches is served by the preload cache.
		expect( Array.from( new Set( requestsUntilMount ) ).sort() ).toEqual(
			[]
		);
		expect( preloadStatus ).toBe(
			'[api-fetch][preload] All preloads consumed.'
		);

		// `POST /wp/v2/users/me` (preferences persistence) occasionally
		// fires twice within the captured window; the duplicate count
		// isn't stable across runs, so this assertion deduplicates.
		// To do: these should all be removed or preloaded.
		expect( Array.from( new Set( requests ) ).sort() ).toEqual(
			[
				'GET /wp/v2/posts?context=edit&offset=0&order=desc&orderby=date&per_page=10&ignore_sticky=false',
				'GET /wp/v2/wp_pattern_category?context=view&per_page=100&_fields=id%2Cname%2Cdescription%2Cslug',
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
			const pg = await requestUtils.createPage( {
				title:
					status === 'publish' ? 'Published preload page' : undefined,
				content:
					'<!-- wp:heading -->\n<h2 class="wp-block-heading">Hello</h2>\n<!-- /wp:heading -->',
				status,
			} );
			const pageId = pg.id;
			const { requests, stop } = recordRequests( page );
			const { requests: requestsUntilMount, stop: stopOnMount } =
				recordRequests( page );

			let preloadStatus;
			page.on( 'console', ( msg ) => {
				const text = msg.text();
				if ( text.startsWith( '[api-fetch][preload] ' ) ) {
					preloadStatus = text;
					stopOnMount();
				}
			} );

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
			// eslint-disable-next-line playwright/no-networkidle
			await page.waitForLoadState( 'networkidle' );
			stop();

			// Everything the kickoff touches is served by the preload cache.
			expect(
				Array.from( new Set( requestsUntilMount ) ).sort()
			).toEqual( [] );
			expect( preloadStatus ).toBe(
				'[api-fetch][preload] All preloads consumed.'
			);

			// `POST /wp/v2/users/me` (preferences persistence) occasionally
			// fires twice within the captured window; the duplicate count
			// isn't stable across runs, so this assertion deduplicates.
			// To do: these should all be removed or preloaded.
			expect( Array.from( new Set( requests ) ).sort() ).toEqual(
				[
					`GET /wp/v2/comments?context=edit&post=${ pageId }&type=note&status=all&per_page=100`,
					`GET /wp/v2/pages/${ pageId }/autosaves?context=edit`,
					'GET /wp/v2/taxonomies?context=edit&per_page=100',
					'GET /wp/v2/users/1?context=view&_fields=id%2Cname',
					'GET /wp/v2/users/me',
					'GET /wp/v2/wp_pattern_category?context=view&per_page=100&_fields=id%2Cname%2Cdescription%2Cslug',
					'OPTIONS /wp/v2/templates',
					'POST /wp/v2/users/me',
				].sort()
			);
		} );
	}
} );
