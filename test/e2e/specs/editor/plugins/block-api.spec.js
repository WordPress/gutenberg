/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Using Block API', () => {
	test( 'Inserts the filtered hello world block even when filter added after block registration', async ( {
		page,
		pageUtils,
		requestUtils,
	} ) => {
		await requestUtils.activatePlugin( 'gutenberg-test-block-api' );
		await pageUtils.createNewPost();

		await pageUtils.insertBlock( 'Filtered Hello World' );

		const blockContent = await page.textContent(
			'div[data-type="e2e-tests/hello-world"]'
		);

		expect( blockContent ).toBe( 'Hello Editor!' );

		await requestUtils.deactivatePlugin( 'gutenberg-test-block-api' );
	} );
} );
