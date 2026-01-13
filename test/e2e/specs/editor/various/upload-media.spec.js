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

test.describe( 'Upload Media Store', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllMedia();
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllMedia();
	} );

	test( 'should track upload state changes in the store', async ( {
		editor,
		page,
	} ) => {
		// Enable debug logging to capture events.
		await page.evaluate( () => {
			window.UPLOAD_MEDIA_DEBUG = true;
		} );

		// Set up a listener to collect store state changes.
		await page.evaluate( () => {
			window.__uploadMediaStateChanges = [];

			// Subscribe to store changes.
			const { subscribe, select } = window.wp.data;
			const unsubscribe = subscribe( () => {
				const items = select( 'core/upload-media' ).getItems();
				const isUploading = select( 'core/upload-media' ).isUploading();
				window.__uploadMediaStateChanges.push( {
					timestamp: Date.now(),
					itemCount: items.length,
					isUploading,
					items: items.map( ( item ) => ( {
						id: item.id,
						status: item.status,
						file: item.file?.name,
						operations: item.operations,
						currentOperation: item.currentOperation,
					} ) ),
				} );
			} );

			window.__uploadMediaUnsubscribe = unsubscribe;
			return [];
		} );

		// Insert an image block.
		await editor.insertBlock( { name: 'core/image' } );

		const imageBlock = editor.canvas.locator(
			'role=document[name="Block: Image"i]'
		);
		await expect( imageBlock ).toBeVisible();

		// Prepare and upload the test image.
		const testImagePath = path.join(
			__dirname,
			'..',
			'..',
			'..',
			'assets',
			'1024x768_e2e_test_image_size.jpeg'
		);
		const tmpDirectory = await fs.mkdtemp(
			path.join( os.tmpdir(), 'gutenberg-test-upload-media-' )
		);
		const fileName = uuid();
		const tmpFileName = path.join( tmpDirectory, fileName + '.jpeg' );
		await fs.copyFile( testImagePath, tmpFileName );

		const inputElement = imageBlock.locator(
			'data-testid=form-file-upload-input'
		);
		await inputElement.setInputFiles( tmpFileName );

		// Wait for the upload to complete by checking the store.
		await page.waitForFunction(
			() => {
				const { select } = window.wp.data;
				const items = select( 'core/upload-media' ).getItems();
				// Upload is complete when queue is empty.
				return items.length === 0;
			},
			{ timeout: 60000 }
		);

		// Get the collected state changes.
		const collectedChanges = await page.evaluate( () => {
			window.__uploadMediaUnsubscribe();
			return window.__uploadMediaStateChanges;
		} );

		// Verify we captured state changes.
		expect( collectedChanges.length ).toBeGreaterThan( 0 );

		// Find the changes where items were in the queue.
		const changesWithItems = collectedChanges.filter(
			( change ) => change.itemCount > 0
		);
		expect( changesWithItems.length ).toBeGreaterThan( 0 );

		// Verify the upload flow: items should transition through states.
		const hasUploadingState = changesWithItems.some(
			( change ) => change.isUploading
		);
		expect( hasUploadingState ).toBe( true );

		// Verify the final state - queue should be empty.
		const lastChange = collectedChanges[ collectedChanges.length - 1 ];
		expect( lastChange.itemCount ).toBe( 0 );
		expect( lastChange.isUploading ).toBe( false );

		// Verify the image was uploaded successfully.
		const image = imageBlock.getByRole( 'img', {
			name: 'This image has an empty alt attribute',
		} );
		await expect( image ).toBeVisible();
		await expect( image ).toHaveAttribute(
			'src',
			expect.stringMatching( /\/wp-content\/uploads\// )
		);

		// Clean up temp file.
		await fs.rm( tmpDirectory, { recursive: true } );
	} );

	test( 'should track item operations during upload', async ( {
		editor,
		page,
	} ) => {
		// Enable debug logging.
		await page.evaluate( () => {
			window.UPLOAD_MEDIA_DEBUG = true;
		} );

		// Set up detailed operation tracking.
		await page.evaluate( () => {
			window.__uploadOperations = [];

			const { subscribe, select } = window.wp.data;
			const unsubscribe = subscribe( () => {
				const items = select( 'core/upload-media' ).getItems();
				if ( items.length > 0 ) {
					const item = items[ 0 ];
					window.__uploadOperations.push( {
						timestamp: Date.now(),
						id: item.id,
						status: item.status,
						currentOperation: item.currentOperation,
						remainingOperations: item.operations?.length || 0,
						progress: item.progress,
					} );
				}
			} );

			window.__uploadOperationsUnsubscribe = unsubscribe;
		} );

		// Insert an image block.
		await editor.insertBlock( { name: 'core/image' } );

		const imageBlock = editor.canvas.locator(
			'role=document[name="Block: Image"i]'
		);
		await expect( imageBlock ).toBeVisible();

		// Prepare and upload the test image.
		const testImagePath = path.join(
			__dirname,
			'..',
			'..',
			'..',
			'assets',
			'1024x768_e2e_test_image_size.jpeg'
		);
		const tmpDirectory = await fs.mkdtemp(
			path.join( os.tmpdir(), 'gutenberg-test-upload-operations-' )
		);
		const fileName = uuid();
		const tmpFileName = path.join( tmpDirectory, fileName + '.jpeg' );
		await fs.copyFile( testImagePath, tmpFileName );

		const inputElement = imageBlock.locator(
			'data-testid=form-file-upload-input'
		);
		await inputElement.setInputFiles( tmpFileName );

		// Wait for the upload to complete.
		await page.waitForFunction(
			() => {
				const { select } = window.wp.data;
				const items = select( 'core/upload-media' ).getItems();
				return items.length === 0;
			},
			{ timeout: 60000 }
		);

		// Get the collected operations.
		const operations = await page.evaluate( () => {
			window.__uploadOperationsUnsubscribe();
			return window.__uploadOperations;
		} );

		// Verify we captured operations.
		expect( operations.length ).toBeGreaterThan( 0 );

		// Log operations for debugging (visible in test output).
		// eslint-disable-next-line no-console
		console.log(
			'Upload operations captured:',
			JSON.stringify( operations, null, 2 )
		);

		// Verify the image was uploaded successfully.
		const image = imageBlock.getByRole( 'img', {
			name: 'This image has an empty alt attribute',
		} );
		await expect( image ).toBeVisible();

		// Clean up temp file.
		await fs.rm( tmpDirectory, { recursive: true } );
	} );

	test( 'should report correct isUploading state', async ( {
		editor,
		page,
	} ) => {
		// Insert an image block.
		await editor.insertBlock( { name: 'core/image' } );

		const imageBlock = editor.canvas.locator(
			'role=document[name="Block: Image"i]'
		);
		await expect( imageBlock ).toBeVisible();

		// Verify initial state - not uploading.
		const initialIsUploading = await page.evaluate( () => {
			return window.wp.data.select( 'core/upload-media' ).isUploading();
		} );
		expect( initialIsUploading ).toBe( false );

		// Prepare the test image.
		const testImagePath = path.join(
			__dirname,
			'..',
			'..',
			'..',
			'assets',
			'1024x768_e2e_test_image_size.jpeg'
		);
		const tmpDirectory = await fs.mkdtemp(
			path.join( os.tmpdir(), 'gutenberg-test-is-uploading-' )
		);
		const fileName = uuid();
		const tmpFileName = path.join( tmpDirectory, fileName + '.jpeg' );
		await fs.copyFile( testImagePath, tmpFileName );

		// Start upload.
		const inputElement = imageBlock.locator(
			'data-testid=form-file-upload-input'
		);
		await inputElement.setInputFiles( tmpFileName );

		// Verify isUploading becomes true during upload.
		const wasUploadingDuringUpload = await page.waitForFunction(
			() => {
				return window.wp.data
					.select( 'core/upload-media' )
					.isUploading();
			},
			{ timeout: 10000 }
		);
		expect( wasUploadingDuringUpload ).toBeTruthy();

		// Wait for upload to complete.
		await page.waitForFunction(
			() => {
				const { select } = window.wp.data;
				return (
					! select( 'core/upload-media' ).isUploading() &&
					select( 'core/upload-media' ).getItems().length === 0
				);
			},
			{ timeout: 60000 }
		);

		// Verify final state - not uploading.
		const finalIsUploading = await page.evaluate( () => {
			return window.wp.data.select( 'core/upload-media' ).isUploading();
		} );
		expect( finalIsUploading ).toBe( false );

		// Verify the image was uploaded.
		const image = imageBlock.getByRole( 'img', {
			name: 'This image has an empty alt attribute',
		} );
		await expect( image ).toBeVisible();

		// Clean up temp file.
		await fs.rm( tmpDirectory, { recursive: true } );
	} );
} );
