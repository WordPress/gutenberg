/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Post Edit Link variation', () => {
	let subscriberUser;

	test.beforeAll( async ( { requestUtils } ) => {
		const uniqueSuffix = Date.now();
		subscriberUser = await requestUtils.createUser( {
			username: `sub_${ uniqueSuffix }`,
			password: 'password123',
			email: `sub_${ uniqueSuffix }@example.com`,
			role: 'subscriber',
		} );
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'should be discoverable in the slash inserter', async ( {
		page,
	} ) => {
		await page.keyboard.press( 'Enter' );

		await page.keyboard.type( '/post edit link' );

		await expect(
			page.getByRole( 'option', { name: 'Post Edit Link' } )
		).toBeVisible();
	} );

	test( 'should render for admins and disappear for logged out and unauthorized users', async ( {
		editor,
		page,
		browser,
	} ) => {
		await editor.insertBlock( {
			name: 'core/buttons',
			attributes: { className: 'wp-block-post-edit-link-wrapper' },
			innerBlocks: [
				{
					name: 'core/button',
					attributes: {
						text: 'Edit Post',
						url: '#',
						rel: 'nofollow',
						metadata: {
							bindings: {
								url: {
									source: 'core/post-edit-url',
								},
							},
						},
					},
				},
			],
		} );

		await expect( editor.canvas.getByText( 'Edit Post' ) ).toBeVisible();

		await editor.publishPost();
		const postUrl = await page.evaluate( () => {
			const postId = window.wp.data
				.select( 'core/editor' )
				.getCurrentPostId();
			return `${ window.location.origin }/?p=${ postId }`;
		} );

		await page.goto( postUrl );
		const adminButton = page.locator( '.wp-block-button__link', {
			hasText: 'Edit Post',
		} );
		await expect( adminButton ).toBeVisible();
		await expect( adminButton ).toHaveAttribute( 'href', /action=edit/ );

		const loggedOutContext = await browser.newContext();
		await loggedOutContext.clearCookies();
		const loggedOutPage = await loggedOutContext.newPage();
		await loggedOutPage.goto( postUrl );

		await expect(
			loggedOutPage.locator( '.wp-block-button__link', {
				hasText: 'Edit Post',
			} )
		).toHaveCount( 0 );
		await expect(
			loggedOutPage.locator( '.wp-block-post-edit-link-wrapper' )
		).toHaveCount( 0 );
		await loggedOutContext.close();

		const subscriberContext = await browser.newContext();
		await subscriberContext.clearCookies();
		const subscriberPage = await subscriberContext.newPage();

		await subscriberPage.goto( '/wp-login.php' );
		await subscriberPage
			.locator( '#user_login' )
			.fill( subscriberUser.username );
		await subscriberPage.locator( '#user_pass' ).fill( 'password123' );
		await subscriberPage.locator( '#wp-submit' ).click();

		await subscriberPage.goto( postUrl );

		await expect(
			subscriberPage.locator( '.wp-block-button__link', {
				hasText: 'Edit Post',
			} )
		).toHaveCount( 0 );
		await expect(
			subscriberPage.locator( '.wp-block-post-edit-link-wrapper' )
		).toHaveCount( 0 );
		await subscriberContext.close();
	} );
} );
