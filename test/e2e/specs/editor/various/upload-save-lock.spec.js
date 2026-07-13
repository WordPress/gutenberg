/**
 * External dependencies
 */
const path = require( 'path' );
const fs = require( 'fs/promises' );
const os = require( 'os' );
const { randomUUID } = require( 'crypto' );

/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

const TEST_IMAGE_FILE_PATH = path.join(
	__dirname,
	'..',
	'..',
	'..',
	'assets',
	'10x10_e2e_test_image_z9T8jK.png'
);

const MEDIA_URLS = [
	'/wp/v2/media',
	`rest_route=${ encodeURIComponent( '/wp/v2/media' ) }`,
];

const isMediaURL = ( url ) =>
	MEDIA_URLS.some( ( u ) => url.href.includes( u ) );

/**
 * Creates a temporary copy of the test image with a unique name.
 *
 * @return {Promise<string>} Path to the temporary image file.
 */
async function createTempImage() {
	const tmpDirectory = await fs.mkdtemp(
		path.join( os.tmpdir(), 'gutenberg-test-image-' )
	);
	const tmpFileName = path.join( tmpDirectory, randomUUID() + '.png' );
	await fs.copyFile( TEST_IMAGE_FILE_PATH, tmpFileName );
	return tmpFileName;
}

/**
 * Whether the client-side media processing pipeline is the active upload path.
 *
 * The hard save lock only applies to the legacy (server-side) upload path;
 * under CSM the durable upload queue makes saving mid-upload safe and keeps
 * the save buttons available.
 *
 * @param {import('@playwright/test').Page} page Playwright page.
 * @return {Promise<boolean>} True when CSM handles uploads.
 */
async function isClientSideMediaActive( page ) {
	return await page.evaluate( () => {
		if ( ! window.__clientSideMediaProcessing ) {
			return false;
		}
		if (
			window.wp?.uploadMedia &&
			typeof window.wp.uploadMedia.isClientSideMediaSupported ===
				'function'
		) {
			return window.wp.uploadMedia.isClientSideMediaSupported();
		}
		return (
			window.crossOriginIsolated === true &&
			typeof SharedArrayBuffer !== 'undefined' &&
			typeof WebAssembly !== 'undefined' &&
			typeof Worker !== 'undefined'
		);
	} );
}

const LEGACY_LOCK_SKIP_REASON =
	'The durable upload queue keeps saving available during CSM uploads; the hard lock only applies to the legacy upload path.';

test.describe( 'Upload save lock', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllMedia();
	} );

	test.beforeEach( async ( { admin, editor } ) => {
		await admin.createNewPost();
		// Add a title so the post is saveable.
		await editor.canvas
			.getByRole( 'textbox', { name: 'Add title' } )
			.fill( 'Upload Lock Test' );
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllMedia();
	} );

	test( 'keeps Save draft available during an upload when the durable queue is active', async ( {
		editor,
		page,
	} ) => {
		test.skip(
			! ( await isClientSideMediaActive( page ) ),
			'Requires client-side media processing'
		);

		const saveDraftButton = page
			.getByRole( 'region', { name: 'Editor top bar' } )
			.getByRole( 'button', { name: 'Save draft' } );

		await expect( saveDraftButton ).toBeEnabled();

		// Hold the upload request so the upload stays in flight.
		let resolveUpload;
		const uploadPromise = new Promise( ( resolve ) => {
			resolveUpload = resolve;
		} );
		await page.route( isMediaURL, async ( route ) => {
			if ( route.request().method() !== 'POST' ) {
				return route.fallback();
			}
			await uploadPromise;
			await route.continue();
		} );

		await editor.insertBlock( { name: 'core/image' } );
		const imageBlock = editor.canvas.locator(
			'role=document[name="Block: Image"i]'
		);
		const tmpFile = await createTempImage();
		await imageBlock
			.locator( 'data-testid=form-file-upload-input' )
			.setInputFiles( tmpFile );

		// The upload is in flight...
		await expect
			.poll( () =>
				page.evaluate(
					() =>
						window.wp.data.select( 'core/upload-media' ).getItems()
							.length
				)
			)
			.toBeGreaterThan( 0 );

		// ...yet saving stays unlocked and available.
		expect(
			await page.evaluate( () =>
				window.wp.data.select( 'core/editor' ).isPostSavingLocked()
			)
		).toBe( false );
		await expect( saveDraftButton ).toBeEnabled();

		// Saving mid-upload serializes the durable uploadId marker so the
		// upload can be reconnected to the block after a reload.
		await editor.saveDraft();
		const savedContent = await page.evaluate(
			() =>
				window.wp.data.select( 'core/editor' ).getCurrentPost().content
		);
		expect( savedContent ).toContain( '"uploadId":' );

		// Clean up: let the upload complete.
		resolveUpload();
		const image = imageBlock.getByRole( 'img', {
			name: 'This image has an empty alt attribute',
		} );
		await expect( image ).toHaveAttribute( 'src', /^https?:\/\//, {
			timeout: 30_000,
		} );
	} );

	test( 'should disable Save draft button during a single image upload', async ( {
		editor,
		page,
	} ) => {
		test.skip(
			await isClientSideMediaActive( page ),
			LEGACY_LOCK_SKIP_REASON
		);

		const saveDraftButton = page
			.getByRole( 'region', { name: 'Editor top bar' } )
			.getByRole( 'button', { name: 'Save draft' } );

		// Save draft should be enabled before upload.
		await expect( saveDraftButton ).toBeEnabled();

		// Hold the upload request so we can verify the lock state.
		let resolveUpload;
		const uploadPromise = new Promise( ( resolve ) => {
			resolveUpload = resolve;
		} );
		await page.route( isMediaURL, async ( route ) => {
			if ( route.request().method() !== 'POST' ) {
				return route.fallback();
			}
			await uploadPromise;
			await route.continue();
		} );

		// Insert an image block and start uploading.
		await editor.insertBlock( { name: 'core/image' } );
		const imageBlock = editor.canvas.locator(
			'role=document[name="Block: Image"i]'
		);
		const tmpFile = await createTempImage();
		await imageBlock
			.locator( 'data-testid=form-file-upload-input' )
			.setInputFiles( tmpFile );

		// Wait for the lock to be set (may be async with client-side processing).
		await expect
			.poll(
				() =>
					page.evaluate( () =>
						window.wp.data
							.select( 'core/editor' )
							.isPostSavingLocked()
					),
				{ timeout: 10_000 }
			)
			.toBe( true );

		// Save draft should be disabled while upload is in progress.
		await expect( saveDraftButton ).toBeDisabled();

		// Let the upload complete.
		resolveUpload();

		// Wait for the image to finish uploading.
		const image = imageBlock.getByRole( 'img', {
			name: 'This image has an empty alt attribute',
		} );
		await expect( image ).toHaveAttribute( 'src', /^https?:\/\//, {
			timeout: 30_000,
		} );

		// Save draft should be re-enabled after upload completes.
		await expect( saveDraftButton ).toBeEnabled( { timeout: 10_000 } );
	} );

	test( 'should disable Save draft button during a multi-file gallery upload', async ( {
		editor,
		page,
	} ) => {
		test.skip(
			await isClientSideMediaActive( page ),
			LEGACY_LOCK_SKIP_REASON
		);

		const saveDraftButton = page
			.getByRole( 'region', { name: 'Editor top bar' } )
			.getByRole( 'button', { name: 'Save draft' } );

		await expect( saveDraftButton ).toBeEnabled();

		let resolveAllUploads;
		const allUploadsPromise = new Promise( ( resolve ) => {
			resolveAllUploads = resolve;
		} );

		await page.route( isMediaURL, async ( route ) => {
			if ( route.request().method() !== 'POST' ) {
				return route.fallback();
			}
			await allUploadsPromise;
			await route.continue();
		} );

		// Insert a gallery block and upload 3 images at once.
		await editor.insertBlock( { name: 'core/gallery' } );
		const galleryBlock = editor.canvas.locator(
			'role=document[name="Block: Gallery"i]'
		);
		const tmpFiles = await Promise.all( [
			createTempImage(),
			createTempImage(),
			createTempImage(),
		] );
		await galleryBlock
			.locator( 'data-testid=form-file-upload-input' )
			.setInputFiles( tmpFiles );

		// Wait for the lock to be set (may be async with client-side processing).
		await expect
			.poll(
				() =>
					page.evaluate( () =>
						window.wp.data
							.select( 'core/editor' )
							.isPostSavingLocked()
					),
				{ timeout: 10_000 }
			)
			.toBe( true );

		// Save draft should be disabled while uploads are in progress.
		await expect( saveDraftButton ).toBeDisabled();

		// Let all uploads complete.
		resolveAllUploads();

		// Wait for all 3 images to finish uploading.
		const images = galleryBlock.locator( 'role=img' );
		await expect( images ).toHaveCount( 3, { timeout: 30_000 } );
		for ( let i = 0; i < 3; i++ ) {
			await expect( images.nth( i ) ).toHaveAttribute(
				'src',
				/^https?:\/\//,
				{ timeout: 30_000 }
			);
		}

		// Save draft should be re-enabled after all uploads complete.
		await expect( saveDraftButton ).toBeEnabled( { timeout: 10_000 } );
	} );

	test( 'should disable Publish button during a single image upload', async ( {
		editor,
		page,
	} ) => {
		test.skip(
			await isClientSideMediaActive( page ),
			LEGACY_LOCK_SKIP_REASON
		);

		const publishButton = page
			.getByRole( 'region', { name: 'Editor top bar' } )
			.getByRole( 'button', { name: 'Publish', exact: true } );

		// Publish should be enabled before upload.
		await expect( publishButton ).toBeEnabled();

		// Hold the upload request so we can verify the lock state.
		let resolveUpload;
		const uploadPromise = new Promise( ( resolve ) => {
			resolveUpload = resolve;
		} );
		await page.route( isMediaURL, async ( route ) => {
			if ( route.request().method() !== 'POST' ) {
				return route.fallback();
			}
			await uploadPromise;
			await route.continue();
		} );

		// Insert an image block and start uploading.
		await editor.insertBlock( { name: 'core/image' } );
		const imageBlock = editor.canvas.locator(
			'role=document[name="Block: Image"i]'
		);
		const tmpFile = await createTempImage();
		await imageBlock
			.locator( 'data-testid=form-file-upload-input' )
			.setInputFiles( tmpFile );

		// Wait for the lock to be set.
		await expect
			.poll(
				() =>
					page.evaluate( () =>
						window.wp.data
							.select( 'core/editor' )
							.isPostSavingLocked()
					),
				{ timeout: 10_000 }
			)
			.toBe( true );

		// Publish button should be disabled while upload is in progress.
		await expect( publishButton ).toBeDisabled();

		// Let the upload complete.
		resolveUpload();

		// Wait for the image to finish uploading.
		const image = imageBlock.getByRole( 'img', {
			name: 'This image has an empty alt attribute',
		} );
		await expect( image ).toHaveAttribute( 'src', /^https?:\/\//, {
			timeout: 30_000,
		} );

		// Publish button should be re-enabled after upload completes.
		await expect( publishButton ).toBeEnabled( { timeout: 10_000 } );
	} );

	test( 'should prevent saving via keyboard shortcut during upload', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		test.skip(
			await isClientSideMediaActive( page ),
			LEGACY_LOCK_SKIP_REASON
		);

		// Save the post first so we can detect that Ctrl+S doesn't save during upload.
		await page
			.getByRole( 'region', { name: 'Editor top bar' } )
			.getByRole( 'button', { name: 'Save draft' } )
			.click();
		await expect(
			page
				.getByRole( 'region', { name: 'Editor top bar' } )
				.getByRole( 'button', { name: 'Saved' } )
		).toBeVisible();

		// Make the post dirty again so Save draft becomes available.
		await editor.canvas
			.getByRole( 'textbox', { name: 'Add title' } )
			.fill( 'Upload Lock Shortcut Test' );

		let resolveUpload;
		const uploadPromise = new Promise( ( resolve ) => {
			resolveUpload = resolve;
		} );
		await page.route( isMediaURL, async ( route ) => {
			if ( route.request().method() !== 'POST' ) {
				return route.fallback();
			}
			await uploadPromise;
			await route.continue();
		} );

		await editor.insertBlock( { name: 'core/image' } );
		const imageBlock = editor.canvas.locator(
			'role=document[name="Block: Image"i]'
		);
		const tmpFile = await createTempImage();
		await imageBlock
			.locator( 'data-testid=form-file-upload-input' )
			.setInputFiles( tmpFile );

		// Wait for lock to be set.
		await expect
			.poll(
				() =>
					page.evaluate( () =>
						window.wp.data
							.select( 'core/editor' )
							.isPostSavingLocked()
					),
				{ timeout: 10_000 }
			)
			.toBe( true );

		// Try to save via keyboard shortcut — it should not trigger a save.
		await pageUtils.pressKeys( 'primary+s' );

		// Verify the post is NOT currently saving.
		const isSaving = await page.evaluate( () =>
			window.wp.data.select( 'core/editor' ).isSavingPost()
		);
		expect( isSaving ).toBe( false );

		// Clean up: let the upload complete.
		resolveUpload();

		const image = imageBlock.getByRole( 'img', {
			name: 'This image has an empty alt attribute',
		} );
		await expect( image ).toHaveAttribute( 'src', /^https?:\/\//, {
			timeout: 30_000,
		} );
	} );

	test( 'should re-enable Save draft button after upload error', async ( {
		editor,
		page,
	} ) => {
		test.skip(
			await isClientSideMediaActive( page ),
			LEGACY_LOCK_SKIP_REASON
		);

		const saveDraftButton = page
			.getByRole( 'region', { name: 'Editor top bar' } )
			.getByRole( 'button', { name: 'Save draft' } );

		await expect( saveDraftButton ).toBeEnabled();

		// Intercept the upload request and return an error.
		await page.route( isMediaURL, async ( route ) => {
			if ( route.request().method() !== 'POST' ) {
				return route.fallback();
			}
			await route.fulfill( {
				status: 500,
				contentType: 'application/json',
				body: JSON.stringify( {
					code: 'rest_upload_error',
					message: 'Simulated upload failure',
					data: { status: 500 },
				} ),
			} );
		} );

		await editor.insertBlock( { name: 'core/image' } );
		const imageBlock = editor.canvas.locator(
			'role=document[name="Block: Image"i]'
		);
		const tmpFile = await createTempImage();
		await imageBlock
			.locator( 'data-testid=form-file-upload-input' )
			.setInputFiles( tmpFile );

		// After the error, save draft should be re-enabled.
		await expect( saveDraftButton ).toBeEnabled( { timeout: 10_000 } );

		// Lock should be cleared.
		await expect
			.poll(
				() =>
					page.evaluate( () =>
						window.wp.data
							.select( 'core/editor' )
							.isPostSavingLocked()
					),
				{ timeout: 10_000 }
			)
			.toBe( false );
	} );
} );
