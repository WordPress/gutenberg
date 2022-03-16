/**
 * External dependencies
 */
const path = require( 'path' );
const fs = require( 'fs' );
const os = require( 'os' );
// eslint-disable-next-line import/no-extraneous-dependencies
const { v4: uuidv4 } = require( 'uuid' );

/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'changing image size', () => {
	test.beforeEach( async ( { pageUtils, requestUtils } ) => {
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
		// Insert an image.
		await pageUtils.insertBlock( 'Image' );

		const inputElementSelector =
			'figure[aria-label="Block: Image"] input[type="file"]';

		const testImagePath = path.join(
			__dirname,
			'..',
			'..',
			'..',
			'assets',
			'1024x768_e2e_test_image_size.jpg'
		);
		const filename = uuidv4();
		const tmpFileName = path.join( os.tmpdir(), filename + '.jpg' );

		fs.copyFileSync( testImagePath, tmpFileName );

		await page.setInputFiles( inputElementSelector, tmpFileName );

		await page.waitForLoadState( 'networkidle' );

		const imageSrcContent = await page.$eval(
			'figure[aria-label="Block: Image"] img',
			( element ) => element.getAttribute( 'src' )
		);

		expect( imageSrcContent ).toContain( filename );

		// Select the new size updated with the plugin.
		await pageUtils.openDocumentSettingsSidebar();
		const imageSizeLabel = await page.locator(
			'label:has-text("Image size")'
		);

		await imageSizeLabel.click();

		// Find the active element.
		const imageSizeSelect = await page.evaluateHandle(
			() => document.activeElement
		);

		imageSizeSelect.selectOption( 'custom-size-one' );

		// Verify that the custom size was applied to the image.

		await expect(
			await page.locator( '.wp-block-image.size-custom-size-one' )
		).toBeVisible();

		await expect(
			await page.locator(
				'.block-editor-image-size-control__width input'
			)
		).toHaveValue( '499' );
	} );
} );
