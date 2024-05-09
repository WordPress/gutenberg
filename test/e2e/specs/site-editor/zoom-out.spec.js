/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Zoom Out', () => {
	test( 'Clicking on inserter while on zoom-out should open the patterns tab on the inserter', async ( {
		page,
	} ) => {
		const zoomOutButton = page.getByRole( 'button', {
			name: 'Zoom-out View',
			exact: true,
		} );

		await zoomOutButton.click();
		await expect( page.getByLabel( 'Add pattern' ) ).toHaveCount( 3 );
		await page.getByLabel( 'Add pattern' ).first().click();
		await expect( page.getByLabel( 'Add pattern' ) ).toHaveCount( 2 );

		await expect(
			page
				.locator( '#tabs-2-allPatterns-view div' )
				.filter( { hasText: 'All' } )
				.nth( 1 )
		).toBeVisible();
	} );
} );
