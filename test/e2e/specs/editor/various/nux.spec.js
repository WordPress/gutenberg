/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'New User Experience (NUX)', () => {
	test( 'should show the guide to first-time users', async ( {
		page,
		pageUtils,
	} ) => {
		let welcomeGuideText, welcomeGuide;

		// Create a new post as a first-time user.
		await pageUtils.createNewPost( { showWelcomeGuide: true } );

		// Guide should be on page 1 of 4
		welcomeGuideText = await page.locator( '.edit-post-welcome-guide' );
		await expect( welcomeGuideText ).toContainText(
			'Welcome to the block editor'
		);

		// Click on the 'Next' button.
		const nextButton = await page.locator(
			'//button[contains(text(), "Next")]'
		);
		await nextButton.click();

		// Guide should be on page 2 of 4
		welcomeGuideText = await page.locator( '.edit-post-welcome-guide' );
		await expect( welcomeGuideText ).toContainText(
			'Make each block your own'
		);

		// Click on the 'Previous' button.
		const previousButton = await page.locator(
			'//button[contains(text(), "Previous")]'
		);
		await previousButton.click();

		// Guide should be on page 1 of 4
		welcomeGuideText = await page.locator( '.edit-post-welcome-guide' );
		await expect( welcomeGuideText ).toContainText(
			'Welcome to the block editor'
		);

		// Press the button for Page 2.
		await page.click( 'button[aria-label="Page 2 of 4"]' );
		await page.locator(
			'//h1[contains(text(), "Make each block your own")]'
		);

		// Press the right arrow key for Page 3.
		await page.keyboard.press( 'ArrowRight' );
		await page.locator(
			'//h1[contains(text(), "Get to know the block library")]'
		);

		// Press the right arrow key for Page 4.
		await page.keyboard.press( 'ArrowRight' );
		await page.locator(
			'//h1[contains(text(), "Learn how to use the block editor")]'
		);

		// Click on the *visible* 'Get started' button. There are two in the DOM
		// but only one is shown depending on viewport size.
		const getStartedButton = page.locator(
			'.components-guide__footer button:text("Get started")'
		);
		await getStartedButton.click();

		// Guide should be closed
		welcomeGuide = await page.locator( '.edit-post-welcome-guide' );
		await expect( welcomeGuide ).not.toBeVisible();

		// Reload the editor.
		await page.reload();
		await page.waitForSelector( '.edit-post-layout' );

		// Guide should be closed
		welcomeGuide = await page.locator( '.edit-post-welcome-guide' );
		await expect( welcomeGuide ).not.toBeVisible();
	} );

	test( 'should not show the welcome guide again if it is dismissed', async ( {
		page,
		pageUtils,
	} ) => {
		let welcomeGuide;

		// Create a new post as a first-time user.
		await pageUtils.createNewPost( { showWelcomeGuide: true } );

		// Guide should be open
		welcomeGuide = await page.locator( '.edit-post-welcome-guide' );
		await expect( welcomeGuide ).toBeVisible();

		// Close the guide
		await page.click( 'button[aria-label="Close dialog"]' );

		// Reload the editor.
		await page.reload();
		await page.waitForSelector( '.edit-post-layout' );

		// Guide should be closed
		welcomeGuide = await page.locator( '.edit-post-welcome-guide' );
		await expect( welcomeGuide ).not.toBeVisible();
	} );

	test( 'should show the welcome guide if it is manually opened', async ( {
		page,
		pageUtils,
	} ) => {
		let welcomeGuide;

		// Create a new post as a returning user.
		await pageUtils.createNewPost();

		// Guide should be closed
		welcomeGuide = await page.locator( '.edit-post-welcome-guide' );
		await expect( welcomeGuide ).not.toBeVisible();

		// Manually open the guide
		await pageUtils.clickOnMoreMenuItem( 'Welcome Guide' );

		// Guide should be open
		welcomeGuide = await page.locator( '.edit-post-welcome-guide' );
		await expect( welcomeGuide ).toBeVisible();
	} );
} );
