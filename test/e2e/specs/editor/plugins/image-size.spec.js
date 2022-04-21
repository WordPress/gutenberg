/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'changing image size', () => {
	test.beforeEach( async ( { requestUtils, pageUtils } ) => {
		await requestUtils.activatePlugin( 'gutenberg-test-image-size' );
		await pageUtils.createNewPost();
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deactivatePlugin( 'gutenberg-test-image-size' );
	} );

	test( 'should insert and change my image size', async ( {
		page,
		pageUtils,
	} ) => {
		await pageUtils.insertBlock( { name: 'core/image' } );
		const inputElement = await page.$(
			'figure[aria-label="Block: Image"] input[type=file]'
		);

		const filename = '1024x768_e2e_test_image_size.jpeg';
		const filepath = './test/e2e/assets/' + filename;

		await inputElement.setInputFiles( filepath );

		// // Wait for upload to finish.
		const img = page.locator( `//img[contains(@src, "${ filename }")]` );
		await img.waitFor();

		await expect( img ).toBeVisible();

		// Select the new size updated with the plugin.
		await pageUtils.openDocumentSettingsSidebar();
		await page.selectOption(
			'.components-select-control__input',
			'custom-size-one'
		);

		// Verify that the custom size was applied to the image.
		await page.waitForSelector( '.wp-block-image.size-custom-size-one' );
		await page.waitForFunction(
			() =>
				document.querySelector(
					'.block-editor-image-size-control__width input'
				).value === '499'
		);
	} );
} );
