/**
 * The upload operation API, exercised from outside the package: a test
 * plugin registers a step through `wp.uploadMedia.registerUploadOperation()`
 * that reads the image before it is uploaded and sends what it found along
 * with the upload. Nothing here reaches into the queue; the assertions are
 * what the server received.
 */
const path = require( 'path' );
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );
const {
	skipIfClientSideMediaInactive,
} = require( './client-side-media-utils' );

const ASSETS_DIR = path.join( __dirname, '..', '..', '..', 'assets' );

/**
 * Half of this image is #00ff00, the rest white at two opacities, so the
 * dominant color is unambiguous but not the only color.
 */
const GREEN_FIXTURE = '10x10_e2e_test_image_green.png';

test.describe( 'Upload operations: dominant color plugin', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activatePlugin(
			'gutenberg-test-plugin-upload-operation-dominant-color'
		);
		await requestUtils.deleteAllMedia();
	} );

	test.beforeEach( async ( { admin, page } ) => {
		await admin.createNewPost();
		await skipIfClientSideMediaInactive( page, test );
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllMedia();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deactivatePlugin(
			'gutenberg-test-plugin-upload-operation-dominant-color'
		);
	} );

	test( 'registers its step through the public API', async ( { page } ) => {
		const operation = await page.evaluate( () => {
			const registered = window.wp.uploadMedia.getUploadOperation(
				'gutenberg-test/dominant-color'
			);
			return (
				registered && {
					name: registered.name,
					label: registered.label,
				}
			);
		} );

		expect( operation ).toEqual( {
			name: 'gutenberg-test/dominant-color',
			label: 'Finding dominant color',
		} );
	} );

	test( 'sends the color it worked out along with the upload', async ( {
		editor,
		page,
		requestUtils,
	} ) => {
		await expect(
			editor.canvas.getByRole( 'document', { name: 'Add default block' } )
		).toBeVisible();

		await editor.insertBlock( { name: 'core/image' } );
		const imageBlock = editor.canvas.locator(
			'role=document[name="Block: Image"i]'
		);
		await expect( imageBlock ).toBeVisible();

		await imageBlock
			.locator( 'data-testid=form-file-upload-input' )
			.setInputFiles( path.join( ASSETS_DIR, GREEN_FIXTURE ) );

		// Drain the queue: the plugin's step, the upload and the sub-sizes.
		await page.waitForFunction(
			() =>
				window.wp.data.select( 'core/upload-media' ).getItems()
					.length === 0,
			undefined,
			{ timeout: 60_000 }
		);

		const attachmentId = await page.evaluate(
			() =>
				window.wp.data
					.select( 'core/block-editor' )
					.getBlocks()
					.find( ( block ) => block.name === 'core/image' )
					?.attributes.id
		);
		expect( attachmentId ).toBeDefined();

		// The color travelled as a field of the create request and the
		// plugin's PHP side kept it, so it comes back on the attachment.
		const media = await requestUtils.rest( {
			method: 'GET',
			path: `/wp/v2/media/${ attachmentId }`,
		} );
		expect( media.dominant_color ).toBe( '#00ff00' );
	} );
} );
