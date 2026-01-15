/**
 * External dependencies
 */
const path = require( 'path' );
const fs = require( 'fs/promises' );
const os = require( 'os' );
const { v4: uuid } = require( 'uuid' );

/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Post save locking during image upload', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllMedia();
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllMedia();
	} );

	test( 'should lock post saving while an image is uploading', async ( {
		editor,
		page,
	} ) => {
		// Prepare a deferred promise to control when the upload completes.
		let resolveUpload;
		const uploadPromise = new Promise( ( resolve ) => {
			resolveUpload = resolve;
		} );

		// Intercept the media upload request and hold it until we're ready.
		let uploadRequestResolve;
		await page.route(
			( url ) =>
				url.href.includes( '/wp/v2/media' ) ||
				url.href.includes(
					`rest_route=${ encodeURIComponent( '/wp/v2/media' ) }`
				),
			async ( route, request ) => {
				if ( request.method() === 'POST' ) {
					// Signal that the upload request has started.
					resolveUpload();
					// Wait for the test to signal the request should complete.
					await new Promise( ( resolve ) => {
						uploadRequestResolve = resolve;
					} );
					await route.continue();
				} else {
					await route.continue();
				}
			}
		);

		// Insert an image block.
		await editor.insertBlock( { name: 'core/image' } );
		const imageBlock = editor.canvas.locator(
			'role=document[name="Block: Image"i]'
		);
		await expect( imageBlock ).toBeVisible();

		// Add a title so the post can be published.
		await editor.canvas
			.getByRole( 'textbox', { name: 'Add title' } )
			.fill( 'Test Post with Image Upload' );

		// Prepare the test image file.
		const basePath = path.join( __dirname, '..', '..', '..', 'assets' );
		const testImagePath = path.join(
			basePath,
			'10x10_e2e_test_image_z9T8jK.png'
		);
		const tmpDirectory = await fs.mkdtemp(
			path.join( os.tmpdir(), 'gutenberg-test-image-' )
		);
		const fileName = uuid();
		const tmpFileName = path.join( tmpDirectory, fileName + '.png' );
		await fs.copyFile( testImagePath, tmpFileName );

		// Start the upload.
		const inputElement = imageBlock.locator(
			'data-testid=form-file-upload-input'
		);
		await inputElement.setInputFiles( tmpFileName );

		// Wait for the upload request to be intercepted.
		await uploadPromise;

		// Verify that post saving is locked during the upload.
		// Use poll to wait for the state to propagate.
		await expect
			.poll( () =>
				page.evaluate( () =>
					window.wp.data.select( 'core/editor' ).isPostSavingLocked()
				)
			)
			.toBe( true );

		// The isPostSavingLocked state should be true during upload.
		const isLocked = await page.evaluate( () =>
			window.wp.data.select( 'core/editor' ).isPostSavingLocked()
		);
		expect( isLocked ).toBe( true );

		// Allow the upload to complete.
		uploadRequestResolve();

		// Wait for the image to appear (upload complete).
		const image = imageBlock.getByRole( 'img', {
			name: 'This image has an empty alt attribute',
		} );
		await expect( image ).toBeVisible();
		await expect( image ).toHaveAttribute( 'src', new RegExp( fileName ) );

		// Verify that post saving is no longer locked.
		await expect
			.poll( () =>
				page.evaluate( () =>
					window.wp.data.select( 'core/editor' ).isPostSavingLocked()
				)
			)
			.toBe( false );
	} );

	test( 'should unlock post saving if image upload fails', async ( {
		editor,
		page,
	} ) => {
		// Intercept the media upload request and return an error.
		await page.route(
			( url ) =>
				url.href.includes( '/wp/v2/media' ) ||
				url.href.includes(
					`rest_route=${ encodeURIComponent( '/wp/v2/media' ) }`
				),
			async ( route, request ) => {
				if ( request.method() === 'POST' ) {
					await route.fulfill( {
						status: 500,
						contentType: 'application/json',
						body: JSON.stringify( {
							code: 'upload_error',
							message: 'Upload failed',
							data: { status: 500 },
						} ),
					} );
				} else {
					await route.continue();
				}
			}
		);

		// Insert an image block.
		await editor.insertBlock( { name: 'core/image' } );
		const imageBlock = editor.canvas.locator(
			'role=document[name="Block: Image"i]'
		);
		await expect( imageBlock ).toBeVisible();

		// Add a title so the post can be published.
		await editor.canvas
			.getByRole( 'textbox', { name: 'Add title' } )
			.fill( 'Test Post with Failed Image Upload' );

		// Prepare the test image file.
		const basePath = path.join( __dirname, '..', '..', '..', 'assets' );
		const testImagePath = path.join(
			basePath,
			'10x10_e2e_test_image_z9T8jK.png'
		);
		const tmpDirectory = await fs.mkdtemp(
			path.join( os.tmpdir(), 'gutenberg-test-image-' )
		);
		const fileName = uuid();
		const tmpFileName = path.join( tmpDirectory, fileName + '.png' );
		await fs.copyFile( testImagePath, tmpFileName );

		// Start the upload.
		const inputElement = imageBlock.locator(
			'data-testid=form-file-upload-input'
		);
		await inputElement.setInputFiles( tmpFileName );

		// Wait for the error to appear as a snackbar notification.
		// The image block shows upload errors as snackbar notifications.
		await expect(
			page.getByRole( 'button', { name: 'Dismiss this notice' } )
		).toBeVisible( { timeout: 10000 } );

		// Verify that post saving is unlocked after the error.
		await expect
			.poll( () =>
				page.evaluate( () =>
					window.wp.data.select( 'core/editor' ).isPostSavingLocked()
				)
			)
			.toBe( false );

		// Verify the Publish button is enabled.
		const publishButton = page
			.getByRole( 'region', { name: 'Editor top bar' } )
			.getByRole( 'button', { name: 'Publish' } );
		await expect( publishButton ).toBeEnabled();
	} );

	test( 'should disable save keyboard shortcut while an image is uploading', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		// Prepare a deferred promise to control when the upload completes.
		let resolveUpload;
		const uploadPromise = new Promise( ( resolve ) => {
			resolveUpload = resolve;
		} );

		// Intercept the media upload request and hold it until we're ready.
		let uploadRequestResolve;
		await page.route(
			( url ) =>
				url.href.includes( '/wp/v2/media' ) ||
				url.href.includes(
					`rest_route=${ encodeURIComponent( '/wp/v2/media' ) }`
				),
			async ( route, request ) => {
				if ( request.method() === 'POST' ) {
					// Signal that the upload request has started.
					resolveUpload();
					// Wait for the test to signal the request should complete.
					await new Promise( ( resolve ) => {
						uploadRequestResolve = resolve;
					} );
					await route.continue();
				} else {
					await route.continue();
				}
			}
		);

		// Insert an image block.
		await editor.insertBlock( { name: 'core/image' } );
		const imageBlock = editor.canvas.locator(
			'role=document[name="Block: Image"i]'
		);
		await expect( imageBlock ).toBeVisible();

		// Add a title so the post can be published.
		await editor.canvas
			.getByRole( 'textbox', { name: 'Add title' } )
			.fill( 'Test Post with Image Upload - Shortcut Test' );

		// Prepare the test image file.
		const basePath = path.join( __dirname, '..', '..', '..', 'assets' );
		const testImagePath = path.join(
			basePath,
			'10x10_e2e_test_image_z9T8jK.png'
		);
		const tmpDirectory = await fs.mkdtemp(
			path.join( os.tmpdir(), 'gutenberg-test-image-' )
		);
		const fileName = uuid();
		const tmpFileName = path.join( tmpDirectory, fileName + '.png' );
		await fs.copyFile( testImagePath, tmpFileName );

		// Start the upload.
		const inputElement = imageBlock.locator(
			'data-testid=form-file-upload-input'
		);
		await inputElement.setInputFiles( tmpFileName );

		// Wait for the upload request to be intercepted.
		await uploadPromise;

		// Try to save with the keyboard shortcut - the save should not occur.
		await pageUtils.pressKeys( 'primary+s' );

		// The Save draft button should still be enabled (draft not saved).
		const saveDraftButton = page
			.getByRole( 'region', { name: 'Editor top bar' } )
			.getByRole( 'button', { name: 'Save draft' } );
		await expect( saveDraftButton ).toBeEnabled();

		// Allow the upload to complete.
		uploadRequestResolve();

		// Wait for the image to appear (upload complete).
		const image = imageBlock.getByRole( 'img', {
			name: 'This image has an empty alt attribute',
		} );
		await expect( image ).toBeVisible();

		// After the upload is complete, the save shortcut should work.
		await expect
			.poll( () =>
				page.evaluate( () =>
					window.wp.data.select( 'core/editor' ).isPostSavingLocked()
				)
			)
			.toBe( false );
	} );
} );
