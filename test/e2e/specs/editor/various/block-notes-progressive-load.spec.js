/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

// The core-data resolver streams notes in pages of 100, so seeding a little
// over one page is enough to observe progressive rendering.
const PER_PAGE = 100;
const TOTAL_NOTES = 105;

/**
 * Matches the second page of the notes collection request, in both permalink
 * styles (`/wp-json/wp/v2/comments?...` and `?rest_route=%2Fwp%2Fv2%2Fcomments&...`).
 *
 * @param {URL} url Request URL.
 * @return {boolean} Whether the URL is page 2 of the notes query.
 */
function isNotesPageTwo( url ) {
	const restRoute = url.searchParams.get( 'rest_route' ) ?? url.pathname;
	return (
		restRoute.includes( '/wp/v2/comments' ) &&
		url.searchParams.get( 'type' ) === 'note' &&
		url.searchParams.get( 'page' ) === '2'
	);
}

test.describe( 'Block Notes progressive loading', () => {
	let postId;

	test.beforeAll( async ( { requestUtils } ) => {
		const post = await requestUtils.createPost( {
			title: 'Post with many notes',
			content:
				'<!-- wp:paragraph --><p>Hello notes</p><!-- /wp:paragraph -->',
			status: 'draft',
		} );
		postId = post.id;

		const currentUser = await requestUtils.rest( {
			path: '/wp/v2/users/me',
			method: 'GET',
		} );

		// Seed the notes in small parallel batches: fast enough for CI without
		// hammering the REST API with a hundred simultaneous writes.
		const noteNumbers = Array.from(
			{ length: TOTAL_NOTES },
			( _, index ) => index + 1
		);
		const batchSize = 20;
		for ( let i = 0; i < noteNumbers.length; i += batchSize ) {
			await Promise.all(
				noteNumbers.slice( i, i + batchSize ).map( ( n ) =>
					requestUtils.rest( {
						method: 'POST',
						path: '/wp/v2/comments',
						data: {
							post: postId,
							// Unique content: identical comments trip the
							// duplicate-comment check.
							content: `Progressive note ${ n }`,
							type: 'note',
							status: 'hold',
							parent: 0,
							author: currentUser.id,
						},
					} )
				)
			);
		}
	} );

	test.afterAll( async ( { requestUtils } ) => {
		// deleteAllComments removes at most 100 records per call.
		await requestUtils.deleteAllComments( 'note' );
		await requestUtils.deleteAllComments( 'note' );
		await requestUtils.deleteAllPosts();
	} );

	test( 'streams notes into the sidebar page by page', async ( {
		admin,
		page,
	} ) => {
		// Hold the second page of the notes query so the test can observe the
		// state between pages. Without RECEIVE_INTERMEDIATE_RESULTS the store
		// only receives records once every page has loaded, so nothing would
		// render while this request is held.
		let releasePageTwo;
		const pageTwoHeld = new Promise( ( resolve ) => {
			releasePageTwo = resolve;
		} );
		await page.route( isNotesPageTwo, async ( route ) => {
			await pageTwoHeld;
			await route.continue();
		} );

		await admin.editPost( postId );

		// Open the pinned notes sidebar.
		await page
			.getByRole( 'region', { name: 'Editor top bar' } )
			.getByRole( 'button', { name: 'All notes', exact: true } )
			.click();

		const noteThreads = page
			.getByRole( 'tree', { name: 'All notes' } )
			.getByRole( 'treeitem' );

		// The first page renders while page 2 is still in flight.
		await expect( noteThreads ).toHaveCount( PER_PAGE );

		// Once page 2 is released the remaining notes stream in.
		releasePageTwo();
		await expect( noteThreads ).toHaveCount( TOTAL_NOTES );
	} );
} );
