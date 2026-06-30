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
	const tmpFileName = path.join( tmpDirectory, randomUUID() + ext );
	await fs.copyFile( path.join( E2E_ASSETS_PATH, sourceFile ), tmpFileName );
	return { tmpFileName, tmpDirectory };
}

/**
 * Runs upload iterations for a single image variant within one editor lifecycle.
 *
 * Inserts an image block, uploads the file, measures elapsed time, then
 * removes the block and deletes uploaded media before the next iteration.
 *
 * @param {Object}   options
 * @param {Object}   options.editor       Editor utility.
 * @param {Object}   options.page         Playwright page.
 * @param {Object}   options.requestUtils Request utility for media cleanup.
 * @param {string}   options.sourceFile   Filename in the e2e assets directory.
 * @param {string}   options.ext          File extension.
 * @param {number[]} options.results      Array to append elapsed times to.
 * @param {number}   options.samples      Number of measured iterations.
 * @param {number}   options.throwaway    Number of warmup iterations to discard.
 */
async function runUploadIterations( {
	editor,
	page,
	requestUtils,
	sourceFile,
	ext,
	results: bucket,
	samples,
	throwaway,
} ) {
	const iterations = samples + throwaway;

	for ( let i = 1; i <= iterations; i++ ) {
		const { tmpFileName, tmpDirectory } = await createTempImage(
			sourceFile,
			ext
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
			bucket.push( elapsed );
		}

		// Reset state for next iteration. Use resetBlocks rather than
		// selecting and pressing Backspace because after upload, DOM focus
		// is inside the block and Backspace is consumed by an inner element.
		await page.evaluate( () => {
			window.wp.data.dispatch( 'core/block-editor' ).resetBlocks( [] );
		} );
		await requestUtils.deleteAllMedia();
		await fs.rm( tmpDirectory, {
			recursive: true,
			force: true,
		} );
	}
}

test.describe( 'Media Upload Performance', () => {
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

	test.describe( 'Single Image Upload', () => {
		const samples = 10;
		const throwaway = 1;

		test( 'JPEG uploads', async ( {
			admin,
			editor,
			page,
			requestUtils,
		} ) => {
			await admin.createNewPost();
			await runUploadIterations( {
				editor,
				page,
				requestUtils,
				sourceFile: '1024x768_e2e_test_image_size.jpeg',
				ext: '.jpeg',
				results: results.jpegUploadProcessing,
				samples,
				throwaway,
			} );
		} );

		test( 'PNG uploads', async ( {
			admin,
			editor,
			page,
			requestUtils,
		} ) => {
			await admin.createNewPost();
			await runUploadIterations( {
				editor,
				page,
				requestUtils,
				sourceFile: '1024x768_e2e_test_image.png',
				ext: '.png',
				results: results.pngUploadProcessing,
				samples,
				throwaway,
			} );
		} );

		test( 'Large JPEG uploads', async ( {
			admin,
			editor,
			page,
			requestUtils,
		} ) => {
			await admin.createNewPost();
			await runUploadIterations( {
				editor,
				page,
				requestUtils,
				sourceFile: '3200x2400_e2e_test_image_responsive_lightbox.jpeg',
				ext: '.jpeg',
				results: results.largeJpegUploadProcessing,
				samples,
				throwaway,
			} );
		} );
	} );

	test.describe( 'Multiple Image Upload', () => {
		const samples = 5;
		const throwaway = 1;
		const iterations = samples + throwaway;

		test( 'Batch upload 5 images', async ( {
			admin,
			editor,
			page,
			requestUtils,
		} ) => {
			await admin.createNewPost();

			for ( let i = 1; i <= iterations; i++ ) {
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
						randomUUID() + '.jpeg'
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

				// Reset state for next iteration.
				await page.evaluate( () => {
					window.wp.data
						.dispatch( 'core/block-editor' )
						.resetBlocks( [] );
				} );
				await requestUtils.deleteAllMedia();
				await fs.rm( tmpDirectory, {
					recursive: true,
					force: true,
				} );
			}
		} );
	} );
} );
