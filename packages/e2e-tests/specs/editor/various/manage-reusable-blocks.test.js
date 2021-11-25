/**
 * External dependencies
 */
import path from 'path';

/**
 * WordPress dependencies
 */
import { visitAdminPage } from '@wordpress/e2e-test-utils';

describe( 'Managing reusable blocks', () => {
	/**
	 * Returns a Promise which resolves to the number of post list entries on
	 * the current page.
	 *
	 * @return {Promise} Promise resolving to number of post list entries.
	 */
	async function getNumberOfEntries() {
		return page.evaluate(
			() => document.querySelectorAll( '.hentry' ).length
		);
	}

	beforeAll( async () => {
		await visitAdminPage( 'edit.php', 'post_type=wp_block' );
	} );

	it( 'Should import reusable blocks', async () => {
		const originalEntries = await getNumberOfEntries();

		// Import Reusable block.
		await page.waitForSelector( '.list-reusable-blocks__container' );
		const importButton = await page.$(
			'.list-reusable-blocks__container button'
		);
		await importButton.click();

		// Select the file to upload.
		const testReusableBlockFile = path.join(
			__dirname,
			'..',
			'..',
			'..',
			'assets',
			'greeting-reusable-block.json'
		);
		const input = await page.$( '.list-reusable-blocks-import-form input' );
		await input.uploadFile( testReusableBlockFile );

		// Submit the form.
		const button = await page.$(
			'.list-reusable-blocks-import-form__button'
		);
		await button.click();

		// Wait for the success notice.
		await page.waitForSelector( '.notice-success' );
		const noticeContent = await page.$eval(
			'.notice-success',
			( element ) => element.textContent
		);
		expect( noticeContent ).toEqual(
			'Reusable block imported successfully!'
		);

		// Refresh the page.
		await visitAdminPage( 'edit.php', 'post_type=wp_block' );

		const expectedEntries = originalEntries + 1;
		const actualEntries = await getNumberOfEntries();

		expect( actualEntries ).toBe( expectedEntries );
	} );
} );
