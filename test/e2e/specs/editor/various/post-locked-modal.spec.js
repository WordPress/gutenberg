const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

const SECOND_USER = {
	username: 'secondeditor',
	email: 'secondeditor@example.com',
	password: 'password',
	roles: [ 'editor' ],
};

test.describe( 'Post locked modal', () => {
	let postId;

	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllUsers();
		await requestUtils.createUser( SECOND_USER );
		const post = await requestUtils.createPost( {
			title: 'Locked post',
			content:
				'<!-- wp:paragraph --><p>Hello world</p><!-- /wp:paragraph -->',
			status: 'draft',
		} );
		postId = post.id;
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllPosts();
		await requestUtils.deleteAllUsers();
	} );

	test( 'tells the second user that the post is already being edited', async ( {
		admin,
		browser,
		page,
	} ) => {
		// The first user opens the post, which takes the edit lock.
		await admin.editPost( postId );
		await expect(
			page.locator( '.editor-post-locked-modal' )
		).toBeHidden();

		// A second user, in their own browser session, opens the same post.
		const context = await browser.newContext( {
			storageState: undefined,
		} );
		const secondPage = await context.newPage();
		await secondPage.goto( '/wp-login.php' );
		await secondPage.locator( '#user_login' ).fill( SECOND_USER.username );
		await secondPage.locator( '#user_pass' ).fill( SECOND_USER.password );
		await secondPage.locator( '#wp-submit' ).click();
		await secondPage.goto(
			`/wp-admin/post.php?post=${ postId }&action=edit`
		);

		const modal = secondPage.getByRole( 'dialog', {
			name: 'This post is already being edited',
		} );
		await expect( modal ).toBeVisible();
		await expect( modal ).toContainText(
			'is currently working on this post'
		);

		await context.close();
	} );
} );
