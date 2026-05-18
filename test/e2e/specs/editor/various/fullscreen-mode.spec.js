/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Fullscreen Mode', () => {
	test.beforeEach( async ( { admin, editor } ) => {
		await admin.createNewPost();
		await editor.setPreferences( 'core/edit-post', {
			fullscreenMode: false,
		} );
	} );

	test.afterEach( async ( { requestUtils, editor } ) => {
		await requestUtils.deleteAllPosts();
		await editor.setPreferences( 'core/edit-post', {
			fullscreenMode: true,
		} );
	} );

	test( 'should open and close the fullscreen mode from the more menu', async ( {
		page,
	} ) => {
		// Open Options Menu
		await page.click(
			'role=region[name="Editor top bar"i] >> role=button[name="Options"i]'
		);

		const body = page.locator( 'body' );

		const fullScreenCheckbox = page
			.getByRole( 'menuitemcheckbox' )
			.filter( { hasText: 'Fullscreen mode' } );

		const viewPostsLink = page.getByRole( 'link', {
			name: 'View Posts',
		} );

		// Select Full Screen Mode.
		await fullScreenCheckbox.click();

		// Check the body does have the CSS class.
		await expect( body ).toHaveClass( /is-fullscreen-mode/ );

		// Check the View Posts link is visible.
		await expect( viewPostsLink ).toBeVisible();

		// Unselect Full Screen Mode.
		await fullScreenCheckbox.click();

		// Check the body does not have the CSS class.
		await expect( body ).not.toHaveClass( /is-fullscreen-mode/ );

		// Check the View Posts link is not visible.
		await expect( viewPostsLink ).toBeHidden();
	} );

	test( 'should open and close the fullscreen mode via the keyboard shortcut', async ( {
		page,
		pageUtils,
	} ) => {
		const body = page.locator( 'body' );

		const viewPostsLink = page.getByRole( 'link', {
			name: 'View Posts',
		} );

		// Emulates CTRL+Shift+Alt + F
		await pageUtils.pressKeys( 'secondary+F' );

		// Check the body does have the CSS class.
		await expect( body ).toHaveClass( /is-fullscreen-mode/ );

		// Check the View Posts link is visible.
		await expect( viewPostsLink ).toBeVisible();

		await expect(
			page
				.getByRole( 'button', { name: 'Dismiss this notice' } )
				.filter( { hasText: 'Fullscreen mode activated' } )
		).toBeVisible();

		// Emulates CTRL+Shift+Alt + F
		await pageUtils.pressKeys( 'secondary+F' );

		// Check the body does not have the CSS class.
		await expect( body ).not.toHaveClass( /is-fullscreen-mode/ );

		// Check the View Posts link is not visible.
		await expect( viewPostsLink ).toBeHidden();

		await expect(
			page
				.getByRole( 'button', { name: 'Dismiss this notice' } )
				.filter( { hasText: 'Fullscreen mode deactivated' } )
		).toBeVisible();
	} );
} );
