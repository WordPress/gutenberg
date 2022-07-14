/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

/**
 * @typedef {import('@playwright/test').Page} Page
 * @typedef {import('@wordpress/e2e-test-utils-playwright').RequestUtils} RequestUtils
 */

/**
 * Sets a site option, from the options-general admin page.
 *
 * This is a temporary solution until we can handle WP options through the REST
 * API. Note that this function needs to be binded to work properly.
 *
 * @param {string} setting The option, used to get the option by id.
 * @param {string} value   The value to set the option to.
 *
 * @return {Promise<string>} A Promise that resolves to the option's previous value.
 */
async function _setOption( setting, value ) {
	await this.admin.visitAdminPage( 'options.php', '' );
	const previousValue = await this.page.inputValue( `#${ setting }` );

	await this.page.fill( `#${ setting }`, value );
	await this.page.click( '#Update' );

	return previousValue;
}

test.describe( 'Comments', () => {
	let previousPageComments,
		previousCommentsPerPage,
		previousDefaultCommentsPage,
		setOption;

	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
	} );

	test.beforeEach( async ( { admin, page } ) => {
		// Initializes `setOption`, binding it with required dependencies.
		setOption = _setOption.bind( { admin, page } );

		// Ideally, we'd set options in beforeAll. Unfortunately, these
		// aren't exposed via the REST API, so we have to set them through the
		// relevant wp-admin screen, which involves page utils; but those are
		// prohibited from beforeAll.
		previousPageComments = await setOption( 'page_comments', '1' );
		previousCommentsPerPage = await setOption( 'comments_per_page', '1' );
		previousDefaultCommentsPage = await setOption(
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
		await setOption( 'page_comments', '0' );
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

	test.afterEach( async ( { requestUtils } ) => {
		// Ideally, we'd set options in afterAll. Unfortunately, these
		// aren't exposed via the REST API, so we have to set them through the
		// relevant wp-admin screen, which involves page utils; but those are
		// prohibited from beforeAll.
		await setOption( 'page_comments', previousPageComments );
		await setOption( 'comments_per_page', previousCommentsPerPage );
		await setOption( 'default_comments_page', previousDefaultCommentsPage );
		await requestUtils.deleteAllComments();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );
} );
