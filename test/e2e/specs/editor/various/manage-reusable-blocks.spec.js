/**
 * External dependencies
 */
import path from 'path';

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
		await page.click( 'role=button[name="Import from JSON"i]' );

		// Select the file to upload.
		const testReusableBlockFile = path.join(
			__dirname,
			'..',
			'..',
			'..',
			'assets',
			'greeting-reusable-block.json'
		);
		await page.setInputFiles( 'input[type="file"]', testReusableBlockFile );

		// Submit the form.
		await page.click( 'role=button[name="Import"i]' );

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
