/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Buttons', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentytwo' );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test( 'inner content should match the aria-label when showing label option is activated', async ( {
		admin,
		page,
	} ) => {
		await admin.visitSiteEditor();

		// Set the options for showing buttons labels
		await page.locator( '[aria-label="Options"]' ).click();
		await page
			.locator( 'button[role="menuitem"]:has-text("Preferences")' )
			.click();
		await page.locator( 'text=Show button text labels' ).click();
		await page.locator( '[aria-label="Close dialog"]' ).click();

		const buttons = page.locator( 'button.is-primary' );
		const count = await buttons.count();

		for ( let i = 0; i < count; i++ ) {
			const button = buttons.nth( i );
			const ariaLabel = await button.getAttribute( 'aria-label' );
			const innerText = await button.innerText();

			expect( innerText ).toBe( ariaLabel );
		}
	} );
} );
