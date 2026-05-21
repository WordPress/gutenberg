/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

/**
 * Internal dependencies
 */
const { recordRequests } = require( './record-requests' );

test.describe( 'Preload hydration', () => {
	let postId;

	test.beforeAll( async ( { requestUtils } ) => {
		const post = await requestUtils.createPost( {
			title: 'Hydration target',
			content:
				'<!-- wp:heading -->\n<h2 class="wp-block-heading">Hello</h2>\n<!-- /wp:heading -->',
			status: 'draft',
		} );
		postId = post.id;
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllPosts();
	} );

	test( 'does not refetch the current post on editor mount', async ( {
		page,
		admin,
	} ) => {
		const { requests, stop } = recordRequests( page );

		await admin.editPost( postId );
		await page
			.frameLocator( 'iframe[name="editor-canvas"]' )
			.getByRole( 'document', { name: 'Block: Heading' } )
			.filter( { hasText: 'Hello' } )
			.waitFor();
		// eslint-disable-next-line playwright/no-networkidle
		await page.waitForLoadState( 'networkidle' );
		stop();

		// The hydration script should have folded the current post into
		// the @wordpress/core-data store at boot. The store's resolution
		// metadata should report `getEntityRecord` as finished without
		// the resolver having to fire.
		const hydrationState = await page.evaluate(
			( id ) => ( {
				hasFinished: window.wp.data
					.select( 'core' )
					.hasFinishedResolution( 'getEntityRecord', [
						'postType',
						'post',
						id,
					] ),
				record: window.wp.data
					.select( 'core' )
					.getEntityRecord( 'postType', 'post', id ),
				currentUserFinished: window.wp.data
					.select( 'core' )
					.hasFinishedResolution( 'getCurrentUser', [] ),
				entitiesConfigFinished: window.wp.data
					.select( 'core' )
					.hasFinishedResolution( 'getEntitiesConfig', [
						'postType',
					] ),
			} ),
			postId
		);

		expect( hydrationState.hasFinished ).toBe( true );
		expect( hydrationState.currentUserFinished ).toBe( true );
		expect( hydrationState.entitiesConfigFinished ).toBe( true );
		expect( hydrationState.record?.id ).toBe( postId );

		const themeFetches = requests.filter( ( r ) =>
			/\/wp\/v2\/themes(?:\?|$)/.test( r )
		);
		expect( themeFetches ).toEqual( [] );

		// The post must not be refetched (either the GET that primes the
		// record, or the OPTIONS that the canUser resolver would issue
		// when the record's Allow header isn't already in the store).
		const postFetches = requests.filter( ( r ) =>
			new RegExp(
				`^(GET|OPTIONS) /wp/v2/posts/${ postId }(?:\\?|$)`
			).test( r )
		);

		expect( postFetches ).toEqual( [] );

		// Same for the two other migrated paths.
		const userFetches = requests.filter( ( r ) =>
			/^GET \/wp\/v2\/users\/me(?:\?|$)/.test( r )
		);
		expect( userFetches ).toEqual( [] );

		const typesFetches = requests.filter( ( r ) =>
			/^GET \/wp\/v2\/types(?:\?|$)/.test( r )
		);
		expect( typesFetches ).toEqual( [] );
	} );
} );
