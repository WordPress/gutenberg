/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'New User Experience (NUX)', () => {
	test( 'should show the guide to first-time users', async ( {
		admin,
		editor,
		page,
	} ) => {
		await admin.createNewPost( { showWelcomeGuide: true } );

		const welcomeGuide = page.getByRole( 'dialog', {
			name: 'Welcome to the editor',
		} );
		const guideHeading = welcomeGuide.getByRole( 'heading', { level: 1 } );
		const nextButton = welcomeGuide.getByRole( 'button', { name: 'Next' } );
		const prevButton = welcomeGuide.getByRole( 'button', {
			name: 'Previous',
		} );

		await expect( guideHeading ).toHaveText( 'Welcome to the editor' );

		await nextButton.click();
		await expect( guideHeading ).toHaveText( 'Customize each block' );

		await prevButton.click();
		// Guide should be on page 1 of 4
		await expect( guideHeading ).toHaveText( 'Welcome to the editor' );

		// Press the button for Page 2.
		await welcomeGuide
			.getByRole( 'button', { name: 'Page 2 of 4' } )
			.click();
		await expect( guideHeading ).toHaveText( 'Customize each block' );

		// Press the right arrow key for Page 3.
		await page.keyboard.press( 'ArrowRight' );
		await expect( guideHeading ).toHaveText( 'Explore all blocks' );

		// Press the right arrow key for Page 4.
		await page.keyboard.press( 'ArrowRight' );
		await expect( guideHeading ).toHaveText( 'Learn more' );

		// Click on the *visible* 'Get started' button.
		await welcomeGuide
			.getByRole( 'button', { name: 'Get started' } )
			.click();

		// Guide should be closed.
		await expect( welcomeGuide ).toBeHidden();

		// Reload the editor.
		await page.reload();

		// Guide should be closed.
		await expect(
			editor.canvas.getByRole( 'textbox', { name: 'Add title' } )
		).toBeVisible();
		await expect( welcomeGuide ).toBeHidden();
	} );

	test( 'should not show the welcome guide again if it is dismissed', async ( {
		admin,
		editor,
		page,
	} ) => {
		await admin.createNewPost( { showWelcomeGuide: true } );

		const welcomeGuide = page.getByRole( 'dialog', {
			name: 'Welcome to the editor',
		} );

		await expect( welcomeGuide ).toBeVisible();
		await welcomeGuide.getByRole( 'button', { name: 'Close' } ).click();

		// Reload the editor.
		await page.reload();
		await expect(
			editor.canvas.getByRole( 'textbox', { name: 'Add title' } )
		).toBeFocused();

		await expect( welcomeGuide ).toBeHidden();
	} );

	test( 'should focus post title field after welcome guide is dismissed and post is empty', async ( {
		admin,
		editor,
		page,
	} ) => {
		await admin.createNewPost( { showWelcomeGuide: true } );

		const welcomeGuide = page.getByRole( 'dialog', {
			name: 'Welcome to the editor',
		} );

		await expect( welcomeGuide ).toBeVisible();
		await welcomeGuide.getByRole( 'button', { name: 'Close' } ).click();

		await expect(
			editor.canvas.getByRole( 'textbox', { name: 'Add title' } )
		).toBeFocused();
	} );

	test( 'should show the welcome guide if it is manually opened', async ( {
		admin,
		page,
	} ) => {
		await admin.createNewPost();
		const welcomeGuide = page.getByRole( 'dialog', {
			name: 'Welcome to the editor',
		} );

		await expect( welcomeGuide ).toBeHidden();

		// Manually open the guide
		await page
			.getByRole( 'region', {
				name: 'Editor top bar',
			} )
			.getByRole( 'button', { name: 'Options' } )
			.click();
		await page
			.getByRole( 'menuitemcheckbox', { name: 'Welcome Guide' } )
			.click();

		await expect( welcomeGuide ).toBeVisible();
	} );
} );
