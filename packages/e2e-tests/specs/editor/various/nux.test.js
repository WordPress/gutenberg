/**
 * WordPress dependencies
 */
import { createNewPost, clickOnMoreMenuItem } from '@wordpress/e2e-test-utils';

describe( 'New User Experience (NUX)', () => {
	it( 'should show the guide to first-time users', async () => {
		let welcomeGuideText, welcomeGuide;

		// Create a new post as a first-time user
		await createNewPost( { showWelcomeGuide: true } );

		// Guide should be on page 1 of 4
		welcomeGuideText = await page.$eval( '.edit-post-welcome-guide', ( element ) => element.innerText );
		expect( welcomeGuideText ).toContain( 'Welcome to the Block Editor' );

		// Click on the 'Next' button
		const [ nextButton ] = await page.$x( '//button[contains(text(), "Next")]' );
		await nextButton.click();

		// Guide should be on page 2 of 4
		welcomeGuideText = await page.$eval( '.edit-post-welcome-guide', ( element ) => element.innerText );
		expect( welcomeGuideText ).toContain( 'Make each block your own' );

		// Click on the 'Previous' button
		const [ previousButton ] = await page.$x( '//button[contains(text(), "Previous")]' );
		await previousButton.click();

		// Guide should be on page 1 of 4
		welcomeGuideText = await page.$eval( '.edit-post-welcome-guide', ( element ) => element.innerText );
		expect( welcomeGuideText ).toContain( 'Welcome to the Block Editor' );

		// Press the button for Page 2
		await page.click( 'button[aria-label="Page 2 of 4"]' );
		await page.waitForXPath( '//h1[contains(text(), "Make each block your own")]' );
		// This shouldn't be necessary
		// eslint-disable-next-line no-restricted-syntax
		await page.waitFor( 500 );

		// Press the right arrow key for Page 3
		await page.keyboard.press( 'ArrowRight' );
		await page.waitForXPath( '//h1[contains(text(), "Get to know the Block Library")]' );

		// Press the right arrow key for Page 4
		await page.keyboard.press( 'ArrowRight' );
		await page.waitForXPath( '//h1[contains(text(), "Learn how to use the Block Editor")]' );

		// Click on the *visible* 'Get started' button. There are two in the DOM
		// but only one is shown depending on viewport size
		let getStartedButton;
		for ( const buttonHandle of await page.$x( '//button[contains(text(), "Get started")]' ) ) {
			if (
				await page.evaluate( ( button ) => button.style.display !== 'none', buttonHandle )
			) {
				getStartedButton = buttonHandle;
			}
		}
		await getStartedButton.click();

		// Guide should be closed
		welcomeGuide = await page.$( '.edit-post-welcome-guide' );
		expect( welcomeGuide ).toBeNull();

		// Reload the editor
		await page.reload();

		// Guide should be closed
		welcomeGuide = await page.$( '.edit-post-welcome-guide' );
		expect( welcomeGuide ).toBeNull();
	} );

	it( 'should not show the welcome guide again if it is dismissed', async () => {
		let welcomeGuide;

		// Create a new post as a first-time user
		await createNewPost( { showWelcomeGuide: true } );

		// Guide should be open
		welcomeGuide = await page.$( '.edit-post-welcome-guide' );
		expect( welcomeGuide ).not.toBeNull();

		// Close the guide
		await page.click( 'button[aria-label="Close dialog"]' );

		// Reload the editor
		await page.reload();

		// Guide should be closed
		welcomeGuide = await page.$( '.edit-post-welcome-guide' );
		expect( welcomeGuide ).toBeNull();
	} );

	it( 'should show the welcome guide if it is manually opened', async () => {
		let welcomeGuide;

		// Create a new post as a returning user
		await createNewPost();

		// Guide should be closed
		welcomeGuide = await page.$( '.edit-post-welcome-guide' );
		expect( welcomeGuide ).toBeNull();

		// Manually open the guide
		await clickOnMoreMenuItem( 'Welcome Guide' );

		// Guide should be open
		welcomeGuide = await page.$( '.edit-post-welcome-guide' );
		expect( welcomeGuide ).not.toBeNull();
	} );
} );
