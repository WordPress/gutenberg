/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Managing reusable blocks', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.visitAdminPage( 'edit.php', 'post_type=wp_block' );
	} );

	test( 'Should import reusable blocks', async ( { page } ) => {
		const originalEntries = await page.locator( '.hentry' ).count();

		// Import Reusable block.
		await page.getByRole( 'button', { name: 'Import from JSON' } ).click();

		// Select the file to upload.
		const testReusableBlockFile = './assets/greeting-reusable-block.json';
		await page
			.locator( 'input[type="file"]' )
			.setInputFiles( testReusableBlockFile );

		// Submit the form.
		await page
			.getByRole( 'button', { name: 'Import', exact: true } )
			.click();

		// Wait for the success notice.
		await expect(
			page.locator( 'text=Pattern imported successfully!' )
		).toBeVisible();

		// Refresh the page.
		await page.reload();

		await expect( page.locator( '.hentry' ) ).toHaveCount(
			originalEntries + 1
		);
	} );
} );
