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

/**
 * Internal dependencies
 */
const { PerfUtils } = require( '../fixtures' );

const results = {
	jpegUploadProcessing: [],
	pngUploadProcessing: [],
	largeJpegUploadProcessing: [],
	multipleImageUploadProcessing: [],
};

const E2E_ASSETS_PATH = path.join( __dirname, '..', '..', 'e2e', 'assets' );

/**
 * Creates a temporary copy of a test image with a unique filename.
 *
 * @param {string} sourceFile Filename in the e2e assets directory.
 * @param {string} ext        File extension (e.g. '.jpeg', '.png').
 * @return {Promise<{tmpFileName: string, tmpDirectory: string}>} Temp file info.
 */
async function createTempImage( sourceFile, ext ) {
	const tmpDirectory = await fs.mkdtemp(
		path.join( os.tmpdir(), 'gutenberg-perf-media-' )
	);
	const tmpFileName = path.join( tmpDirectory, uuid() + ext );
	await fs.copyFile( path.join( E2E_ASSETS_PATH, sourceFile ), tmpFileName );
	return { tmpFileName, tmpDirectory };
}

test.describe( 'Media Processing Performance', () => {
	test.use( {
		perfUtils: async ( { page }, use ) => {
			await use( new PerfUtils( { page } ) );
		},
	} );

	test.afterAll( async ( {}, testInfo ) => {
		await testInfo.attach( 'results', {
			body: JSON.stringify( results, null, 2 ),
			contentType: 'application/json',
		} );
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllMedia();
	} );

	test.describe( 'Single Image Upload', () => {
		const samples = 10;
		const throwaway = 1;
		const iterations = samples + throwaway;

		for ( let i = 1; i <= iterations; i++ ) {
			test( `JPEG upload (${ i } of ${ iterations })`, async ( {
				admin,
				editor,
			} ) => {
				await admin.createNewPost();

				const { tmpFileName, tmpDirectory } = await createTempImage(
					'1024x768_e2e_test_image_size.jpeg',
					'.jpeg'
				);

				await editor.insertBlock( { name: 'core/image' } );
				const imageBlock = editor.canvas.locator(
					'role=document[name="Block: Image"i]'
				);
				await expect( imageBlock ).toBeVisible();

				const startTime = performance.now();
				await imageBlock
					.locator( 'data-testid=form-file-upload-input' )
					.setInputFiles( tmpFileName );

				await expect(
					imageBlock.getByRole( 'img', {
						name: 'This image has an empty alt attribute',
					} )
				).toHaveAttribute( 'src', /^https?:\/\//, {
					timeout: 120_000,
				} );
				const elapsed = performance.now() - startTime;

				if ( i > throwaway ) {
					results.jpegUploadProcessing.push( elapsed );
				}

				await fs.rm( tmpDirectory, {
					recursive: true,
					force: true,
				} );
			} );
		}

		for ( let i = 1; i <= iterations; i++ ) {
			test( `PNG upload (${ i } of ${ iterations })`, async ( {
				admin,
				editor,
			} ) => {
				await admin.createNewPost();

				const { tmpFileName, tmpDirectory } = await createTempImage(
					'10x10_e2e_test_image_z9T8jK.png',
					'.png'
				);

				await editor.insertBlock( { name: 'core/image' } );
				const imageBlock = editor.canvas.locator(
					'role=document[name="Block: Image"i]'
				);
				await expect( imageBlock ).toBeVisible();

				const startTime = performance.now();
				await imageBlock
					.locator( 'data-testid=form-file-upload-input' )
					.setInputFiles( tmpFileName );

				await expect(
					imageBlock.getByRole( 'img', {
						name: 'This image has an empty alt attribute',
					} )
				).toHaveAttribute( 'src', /^https?:\/\//, {
					timeout: 120_000,
				} );
				const elapsed = performance.now() - startTime;

				if ( i > throwaway ) {
					results.pngUploadProcessing.push( elapsed );
				}

				await fs.rm( tmpDirectory, {
					recursive: true,
					force: true,
				} );
			} );
		}

		for ( let i = 1; i <= iterations; i++ ) {
			test( `Large JPEG upload (${ i } of ${ iterations })`, async ( {
				admin,
				editor,
			} ) => {
				await admin.createNewPost();

				const { tmpFileName, tmpDirectory } = await createTempImage(
					'3200x2400_e2e_test_image_responsive_lightbox.jpeg',
					'.jpeg'
				);

				await editor.insertBlock( { name: 'core/image' } );
				const imageBlock = editor.canvas.locator(
					'role=document[name="Block: Image"i]'
				);
				await expect( imageBlock ).toBeVisible();

				const startTime = performance.now();
				await imageBlock
					.locator( 'data-testid=form-file-upload-input' )
					.setInputFiles( tmpFileName );

				await expect(
					imageBlock.getByRole( 'img', {
						name: 'This image has an empty alt attribute',
					} )
				).toHaveAttribute( 'src', /^https?:\/\//, {
					timeout: 120_000,
				} );
				const elapsed = performance.now() - startTime;

				if ( i > throwaway ) {
					results.largeJpegUploadProcessing.push( elapsed );
				}

				await fs.rm( tmpDirectory, {
					recursive: true,
					force: true,
				} );
			} );
		}
	} );

	test.describe( 'Multiple Image Upload', () => {
		const samples = 5;
		const throwaway = 1;
		const iterations = samples + throwaway;

		for ( let i = 1; i <= iterations; i++ ) {
			test( `Batch upload 5 images (${ i } of ${ iterations })`, async ( {
				admin,
				editor,
			} ) => {
				await admin.createNewPost();

				// Insert a gallery block for batch upload.
				await editor.insertBlock( { name: 'core/gallery' } );

				const galleryBlock = editor.canvas.locator(
					'role=document[name="Block: Gallery"i]'
				);
				await expect( galleryBlock ).toBeVisible();

				// Create 5 temp copies of the test image.
				const tmpDirectory = await fs.mkdtemp(
					path.join( os.tmpdir(), 'gutenberg-perf-media-batch-' )
				);
				const tmpFiles = [];
				for ( let j = 0; j < 5; j++ ) {
					const tmpFileName = path.join(
						tmpDirectory,
						uuid() + '.jpeg'
					);
					await fs.copyFile(
						path.join(
							E2E_ASSETS_PATH,
							'1024x768_e2e_test_image_size.jpeg'
						),
						tmpFileName
					);
					tmpFiles.push( tmpFileName );
				}

				const startTime = performance.now();
				await galleryBlock
					.locator( 'data-testid=form-file-upload-input' )
					.setInputFiles( tmpFiles );

				// Wait for all 5 images to finish uploading.
				await expect(
					editor.canvas.locator( '.wp-block-image img[src^="http"]' )
				).toHaveCount( 5, { timeout: 120_000 } );

				const elapsed = performance.now() - startTime;

				if ( i > throwaway ) {
					results.multipleImageUploadProcessing.push( elapsed );
				}

				await fs.rm( tmpDirectory, {
					recursive: true,
					force: true,
				} );
			} );
		}
	} );
} );
