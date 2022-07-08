/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

/**
 * @typedef {import('@playwright/test').Page} Page
 * @typedef {import('@wordpress/e2e-test-utils-playwright').RequestUtils} RequestUtils
 */

test.describe( 'Comments', () => {
	let previousPageComments,
		previousCommentsPerPage,
		previousDefaultCommentsPage;

	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
	} );

	test.beforeEach( async ( { admin } ) => {
		// Ideally, we'd set options in beforeAll. Unfortunately, these
		// aren't exposed via the REST API, so we have to set them through the
		// relevant wp-admin screen, which involves page utils; but those are
		// prohibited from beforeAll.
		previousPageComments = await admin.setOption( 'page_comments', '1' );
		previousCommentsPerPage = await admin.setOption(
			'comments_per_page',
			'1'
		);
		previousDefaultCommentsPage = await admin.setOption(
			'default_comments_page',
			'newest'
		);
	} );

	test( 'We show no results message if there are no comments', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		await requestUtils.deleteAllComments();
		await admin.createNewPost();
		await editor.insertBlock( { name: 'core/comments' } );
		await expect(
			await page.locator( 'text="No results found."' )
		).toHaveCount( 1 );
	} );

	test( 'Pagination links are working as expected', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		const author = requestUtils.getCurrentUser();
		await admin.createNewPost();
		await editor.insertBlock( { name: 'core/comments' } );
		const postId = await editor.publishPost();

		// Create three comments for that post.
		for ( let i = 0; i < 3; i++ ) {
			await requestUtils.createComment( {
				author: author.id,
				content: `This is an automated comment - ${ i }`,
				post: postId,
			} );
		}

		// Visit the post that was just published.
		await page.click(
			'role=region[name="Editor publish"i] >> "View Post"'
		);

		// We check that there is a previous comments page link.
		await expect(
			await page.locator( 'text="Older Comments"' )
		).toHaveCount( 1 );
		await expect(
			await page.locator( 'text="Newer Comments"' )
		).toHaveCount( 0 );

		await page.click( 'text="Older Comments"' );

		// We check that there are a previous and a next link.
		await expect(
			await page.locator( 'text="Older Comments"' )
		).toHaveCount( 1 );
		await expect(
			await page.locator( 'text="Newer Comments"' )
		).toHaveCount( 1 );

		await page.click( 'text="Older Comments"' );

		// We check that there is only have a next link
		await expect(
			await page.locator( 'text="Older Comments"' )
		).toHaveCount( 0 );
		await expect(
			await page.locator( 'text="Newer Comments"' )
		).toHaveCount( 1 );
	} );
	test( 'Pagination links are not appearing if break comments is not enabled', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		const author = requestUtils.getCurrentUser();
		await admin.setOption( 'page_comments', '0' );
		await admin.createNewPost();
		await editor.insertBlock( { name: 'core/comments' } );
		const postId = await editor.publishPost();

		// Create three comments for that post.
		for ( let i = 0; i < 3; i++ ) {
			await requestUtils.createComment( {
				author: author.id,
				content: `This is an automated comment - ${ i }`,
				post: postId,
			} );
		}

		// Visit the post that was just published.
		await page.click(
			'role=region[name="Editor publish"i] >> "View Post"'
		);

		// We check that there are no comments page link.
		await expect(
			await page.locator( 'text="Older Comments"' )
		).toHaveCount( 0 );
		await expect(
			await page.locator( 'text="Newer Comments"' )
		).toHaveCount( 0 );
	} );

	test.afterEach( async ( { admin } ) => {
		// Ideally, we'd set options in afterAll. Unfortunately, these
		// aren't exposed via the REST API, so we have to set them through the
		// relevant wp-admin screen, which involves page utils; but those are
		// prohibited from beforeAll.
		await admin.setOption( 'page_comments', previousPageComments );
		await admin.setOption( 'comments_per_page', previousCommentsPerPage );
		await admin.setOption(
			'default_comments_page',
			previousDefaultCommentsPage
		);
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllComments();
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );
} );
