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

	test( 'Should import reusable blocks', async ( { admin, page } ) => {
		async function getNumberOfEntries() {
			return page.evaluate(
				() => document.querySelectorAll( '.hentry' ).length
			);
		}

		const originalEntries = await getNumberOfEntries();

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
			page.locator(
				"div[class='notice notice-success is-dismissible'] p"
			)
		).toHaveText( 'Reusable block imported successfully!' );

		await page.waitForTimeout( 2000 );

		// Refresh the page.
		await admin.visitAdminPage( 'edit.php', 'post_type=wp_block' );

		const expectedEntries = originalEntries + 1;
		const actualEntries = await page.locator( '.hentry' ).count();

		expect( actualEntries ).toBe( expectedEntries );
	} );
} );
