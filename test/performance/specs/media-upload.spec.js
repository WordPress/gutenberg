/* eslint-disable playwright/expect-expect */

/**
 * External dependencies
 */
import path from 'path';
import fs from 'fs/promises';
import os from 'os';
import { v4 as uuid } from 'uuid';

/**
 * WordPress dependencies
 */
import { test } from '@wordpress/e2e-test-utils-playwright';

const ASSETS_DIR = path.join( process.cwd(), 'test', 'e2e', 'assets' );

const results = {
	mediaUploadSingle: [],
	mediaUploadLarge: [],
	mediaUploadMultiple: [],
};

/**
 * Upload a file to an image block input element.
 *
 * @param {string} fileName File name in the assets directory.
 * @return {Promise<string>} Temp file path.
 */
async function prepareTempFile( fileName ) {
	const tmpDirectory = await fs.mkdtemp(
		path.join( os.tmpdir(), 'gutenberg-perf-media-' )
	);
	const uniqueName = uuid();
	const extension = path.extname( fileName );
	const tmpFileName = path.join( tmpDirectory, uniqueName + extension );
	await fs.copyFile( path.join( ASSETS_DIR, fileName ), tmpFileName );
	return tmpFileName;
}

test.describe( 'Media Upload Performance', () => {
	test.afterAll( async ( {}, testInfo ) => {
		await testInfo.attach( 'results', {
			body: JSON.stringify( results, null, 2 ),
			contentType: 'application/json',
		} );
	} );

	test.describe( 'Single image upload', () => {
		const iterations = 5;

		for ( let i = 1; i <= iterations; i++ ) {
			test( `Run ${ i } of ${ iterations }`, async ( {
				page,
				admin,
				editor,
				requestUtils,
			} ) => {
				await admin.createNewPost();

				// Skip if cross-origin isolation is not enabled.
				const isCrossOriginIsolated = await page.evaluate(
					() => window.crossOriginIsolated
				);
				// eslint-disable-next-line playwright/no-skipped-test
				test.skip(
					! isCrossOriginIsolated,
					'Cross-origin isolation headers not configured'
				);

				await editor.insertBlock( { name: 'core/image' } );

				const imageBlock = editor.canvas.locator(
					'role=document[name="Block: Image"i]'
				);
				await imageBlock.waitFor();

				const tmpFile = await prepareTempFile(
					'1024x768_e2e_test_image_size.jpeg'
				);

				const startTime = performance.now();

				await imageBlock
					.locator( 'data-testid=form-file-upload-input' )
					.setInputFiles( tmpFile );

				// Wait for upload queue to empty.
				await page.waitForFunction(
					() => {
						const uploadStore =
							window.wp.data.select( 'core/upload-media' );
						if ( ! uploadStore ) {
							return true;
						}
						return uploadStore.getItems().length === 0;
					},
					{ timeout: 120000 }
				);

				const endTime = performance.now();
				results.mediaUploadSingle.push( endTime - startTime );

				await requestUtils.deleteAllMedia();
			} );
		}
	} );

	test.describe( 'Large image with processing', () => {
		const iterations = 5;

		for ( let i = 1; i <= iterations; i++ ) {
			test( `Run ${ i } of ${ iterations }`, async ( {
				page,
				admin,
				editor,
				requestUtils,
			} ) => {
				await admin.createNewPost();

				const isCrossOriginIsolated = await page.evaluate(
					() => window.crossOriginIsolated
				);
				// eslint-disable-next-line playwright/no-skipped-test
				test.skip(
					! isCrossOriginIsolated,
					'Cross-origin isolation headers not configured'
				);

				await editor.insertBlock( { name: 'core/image' } );

				const imageBlock = editor.canvas.locator(
					'role=document[name="Block: Image"i]'
				);
				await imageBlock.waitFor();

				const tmpFile = await prepareTempFile(
					'3200x2400_e2e_test_image_responsive_lightbox.jpeg'
				);

				const startTime = performance.now();

				await imageBlock
					.locator( 'data-testid=form-file-upload-input' )
					.setInputFiles( tmpFile );

				await page.waitForFunction(
					() => {
						const uploadStore =
							window.wp.data.select( 'core/upload-media' );
						if ( ! uploadStore ) {
							return true;
						}
						return uploadStore.getItems().length === 0;
					},
					{ timeout: 120000 }
				);

				const endTime = performance.now();
				results.mediaUploadLarge.push( endTime - startTime );

				await requestUtils.deleteAllMedia();
			} );
		}
	} );

	test.describe( 'Multiple image upload', () => {
		const iterations = 5;

		for ( let i = 1; i <= iterations; i++ ) {
			test( `Run ${ i } of ${ iterations }`, async ( {
				page,
				admin,
				editor,
				requestUtils,
			} ) => {
				await admin.createNewPost();

				const isCrossOriginIsolated = await page.evaluate(
					() => window.crossOriginIsolated
				);
				// eslint-disable-next-line playwright/no-skipped-test
				test.skip(
					! isCrossOriginIsolated,
					'Cross-origin isolation headers not configured'
				);

				await editor.insertBlock( { name: 'core/gallery' } );

				const galleryBlock = editor.canvas.locator(
					'role=document[name="Block: Gallery"i]'
				);
				await galleryBlock.waitFor();

				// Prepare 3 temp files.
				const fileNames = [
					'1024x768_e2e_test_image_size.jpeg',
					'200x150_e2e_test_image_opaque.png',
					'10x10_e2e_test_image_z9T8jK.png',
				];

				const tmpFiles = await Promise.all(
					fileNames.map( prepareTempFile )
				);

				const startTime = performance.now();

				await galleryBlock
					.locator( 'data-testid=form-file-upload-input' )
					.setInputFiles( tmpFiles );

				await page.waitForFunction(
					() => {
						const uploadStore =
							window.wp.data.select( 'core/upload-media' );
						if ( ! uploadStore ) {
							return true;
						}
						return uploadStore.getItems().length === 0;
					},
					{ timeout: 120000 }
				);

				const endTime = performance.now();
				results.mediaUploadMultiple.push( endTime - startTime );

				await requestUtils.deleteAllMedia();
			} );
		}
	} );
} );
