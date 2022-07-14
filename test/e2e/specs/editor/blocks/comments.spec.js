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
			page.locator( 'role=document[name="Block: Comment Template"i]' )
		).toContainText( 'No results found.' );
	} );

	test( 'Pagination links are working as expected', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		await admin.createNewPost();
		await editor.insertBlock( { name: 'core/comments' } );
		const postId = await editor.publishPost();

		// Create three comments for that post.
		for ( let i = 0; i < 3; i++ ) {
			await requestUtils.createComment( {
				content: `This is an automated comment - ${ i }`,
				post: postId,
			} );
		}

		// Visit the post that was just published.
		await page.click(
			'role=region[name="Editor publish"] >> role=link[name="View Post"i]'
		);

		// We check that there is a previous comments page link.
		await expect(
			page.locator( 'role=link[name="Older Comments"i]' )
		).toBeVisible();
		await expect(
			page.locator( 'role=link[name="Newer Comments"i]' )
		).toBeHidden();

		await page.click( 'role=link[name="Older Comments"i]' );

		// We check that there are a previous and a next link.
		await expect(
			page.locator( 'role=link[name="Older Comments"i]' )
		).toBeVisible();
		await expect(
			page.locator( 'role=link[name="Newer Comments"i]' )
		).toBeVisible();

		await page.click( 'role=link[name="Older Comments"i]' );

		// We check that there is only have a next link
		await expect(
			page.locator( 'role=link[name="Older Comments"i]' )
		).toBeHidden();
		await expect(
			page.locator( 'role=link[name="Newer Comments"i]' )
		).toBeVisible();
	} );
	test( 'Pagination links are not appearing if break comments is not enabled', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		await admin.setOption( 'page_comments', '0' );
		await admin.createNewPost();
		await editor.insertBlock( { name: 'core/comments' } );
		const postId = await editor.publishPost();

		// Create three comments for that post.
		for ( let i = 0; i < 3; i++ ) {
			await requestUtils.createComment( {
				content: `This is an automated comment - ${ i }`,
				post: postId,
			} );
		}

		// Visit the post that was just published.
		await page.click(
			'role=region[name="Editor publish"] >> role=link[name="View Post"i]'
		);

		// We check that there are no comments page link.
		await expect(
			page.locator( 'role=link[name="Older Comments"i]' )
		).toBeHidden();
		await expect(
			page.locator( 'role=link[name="Newer Comments"i]' )
		).toBeHidden();
	} );

	test.afterEach( async ( { admin, requestUtils } ) => {
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
		await requestUtils.deleteAllComments();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );
} );
