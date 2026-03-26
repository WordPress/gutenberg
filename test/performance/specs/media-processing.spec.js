/* eslint-disable playwright/expect-expect */

/**
 * External dependencies
 */
import { readFileSync } from 'fs';
import path from 'path';

/**
 * WordPress dependencies
 */
import { test } from '@wordpress/e2e-test-utils-playwright';

const results = {
	mediaProcessingJpeg: [],
	mediaProcessingWebp: [],
	mediaProcessingAvif: [],
	mediaProcessingAvifToJpeg: [],
	mediaProcessingAvifToJpegViaPng: [],
};

// WordPress default image sub-sizes (since WP 5.3).
const IMAGE_SUB_SIZES = [
	{ width: 150, height: 150, crop: true }, // thumbnail
	{ width: 300, height: 300 }, // medium
	{ width: 768, height: 0 }, // medium_large
	{ width: 1024, height: 1024 }, // large
	{ width: 1536, height: 1536 }, // 1536x1536
	{ width: 2048, height: 2048 }, // 2048x2048
];

const ASSETS_PATH = process.env.ASSETS_PATH;

/**
 * Same-format resize: decode, resize each sub-size, encode back to same format.
 *
 * @param {Object}   root0          Function arguments.
 * @param {string}   root0.base64   Base64-encoded image data.
 * @param {string}   root0.mimeType MIME type of the image.
 * @param {Object[]} root0.sizes    Array of sub-size specs.
 * @return {Promise<number>} Elapsed time in milliseconds.
 */
async function measureProcessing( { base64, mimeType, sizes } ) {
	const { vipsResizeImage } = await import( '@wordpress/vips/worker' );
	const bytes = Uint8Array.from( atob( base64 ), ( c ) => c.charCodeAt( 0 ) );

	const start = performance.now();
	for ( const resize of sizes ) {
		const buffer = bytes.slice().buffer;
		await vipsResizeImage(
			`perf-${ resize.width }`,
			buffer,
			mimeType,
			resize,
			false,
			0.82
		);
	}
	return performance.now() - start;
}

/**
 * Cross-format (current approach): resize each sub-size in source format,
 * then convert each to target format. Simulates AVIF→resize→AVIF→transcode→JPEG.
 *
 * @param {Object}   root0         Function arguments.
 * @param {string}   root0.base64  Base64-encoded image data.
 * @param {string}   root0.srcType Source MIME type.
 * @param {string}   root0.dstType Target MIME type.
 * @param {Object[]} root0.sizes   Array of sub-size specs.
 * @return {Promise<number>} Elapsed time in milliseconds.
 */
async function measureCrossFormatProcessing( {
	base64,
	srcType,
	dstType,
	sizes,
} ) {
	const { vipsResizeImage, vipsConvertImageFormat } = await import(
		'@wordpress/vips/worker'
	);
	const bytes = Uint8Array.from( atob( base64 ), ( c ) => c.charCodeAt( 0 ) );

	const start = performance.now();
	for ( const resize of sizes ) {
		const buffer = bytes.slice().buffer;
		const resized = await vipsResizeImage(
			`perf-xfmt-${ resize.width }`,
			buffer,
			srcType,
			resize,
			false,
			0.82
		);
		await vipsConvertImageFormat(
			`perf-xfmt-conv-${ resize.width }`,
			resized.buffer,
			srcType,
			dstType,
			0.82,
			false
		);
	}
	return performance.now() - start;
}

/**
 * Cross-format via PNG intermediate (proposed optimization):
 * convert source to lossless PNG once, resize each sub-size from PNG,
 * then convert each resized PNG to target format.
 *
 * @param {Object}   root0         Function arguments.
 * @param {string}   root0.base64  Base64-encoded image data.
 * @param {string}   root0.srcType Source MIME type.
 * @param {string}   root0.dstType Target MIME type.
 * @param {Object[]} root0.sizes   Array of sub-size specs.
 * @return {Promise<number>} Elapsed time in milliseconds.
 */
async function measureCrossFormatViaPng( { base64, srcType, dstType, sizes } ) {
	const { vipsResizeImage, vipsConvertImageFormat } = await import(
		'@wordpress/vips/worker'
	);
	const bytes = Uint8Array.from( atob( base64 ), ( c ) => c.charCodeAt( 0 ) );

	const start = performance.now();

	// Step 1: Convert source to lossless PNG intermediate (once).
	const pngBuffer = await vipsConvertImageFormat(
		'perf-png-intermediate',
		bytes.slice().buffer,
		srcType,
		'image/png',
		1,
		false
	);

	const pngBytes = new Uint8Array( pngBuffer );

	// Step 2: Resize each sub-size from the PNG intermediate.
	for ( const resize of sizes ) {
		const buffer = pngBytes.slice().buffer;
		const resized = await vipsResizeImage(
			`perf-png-${ resize.width }`,
			buffer,
			'image/png',
			resize,
			false,
			0.82
		);
		// Step 3: Transcode resized PNG to target format.
		await vipsConvertImageFormat(
			`perf-png-conv-${ resize.width }`,
			resized.buffer,
			'image/png',
			dstType,
			0.82,
			false
		);
	}
	return performance.now() - start;
}

test.describe( 'Media Processing Performance', () => {
	// Read test images once at module level — these don't change.
	const jpegBase64 = readFileSync(
		path.join( ASSETS_PATH, 'test-image-3000x2000.jpeg' )
	).toString( 'base64' );

	const webpBase64 = readFileSync(
		path.join( ASSETS_PATH, 'test-image-3000x2000.webp' )
	).toString( 'base64' );

	const avifBase64 = readFileSync(
		path.join( ASSETS_PATH, 'test-image-3000x2000.avif' )
	).toString( 'base64' );

	let draftId = null;

	test.afterAll( async ( {}, testInfo ) => {
		await testInfo.attach( 'results', {
			body: JSON.stringify( results, null, 2 ),
			contentType: 'application/json',
		} );
	} );

	test( 'Setup', async ( { admin, page } ) => {
		await admin.createNewPost();

		const hasSharedArrayBuffer = await page.evaluate(
			() => typeof SharedArrayBuffer !== 'undefined'
		);
		// eslint-disable-next-line playwright/no-skipped-test
		test.skip(
			! hasSharedArrayBuffer,
			'SharedArrayBuffer not available (cross-origin isolation not configured)'
		);

		// Warm up the vips WASM module.
		await page.evaluate( measureProcessing, {
			base64: jpegBase64,
			mimeType: 'image/jpeg',
			sizes: [ { width: 150, height: 150, crop: true } ],
		} );

		draftId = await page.evaluate( () =>
			window.wp.data.select( 'core/editor' ).getCurrentPostId()
		);
	} );

	const samples = 5;
	const throwaway = 1;
	const iterations = samples + throwaway;

	for ( let i = 1; i <= iterations; i++ ) {
		test( `Run the test (${ i } of ${ iterations })`, async ( {
			admin,
			page,
		} ) => {
			// eslint-disable-next-line playwright/no-skipped-test
			test.skip( ! draftId, 'Setup did not complete' );

			await admin.editPost( draftId );

			// JPEG (same-format resize).
			const jpegElapsed = await page.evaluate( measureProcessing, {
				base64: jpegBase64,
				mimeType: 'image/jpeg',
				sizes: IMAGE_SUB_SIZES,
			} );

			// WebP (same-format resize).
			const webpElapsed = await page.evaluate( measureProcessing, {
				base64: webpBase64,
				mimeType: 'image/webp',
				sizes: IMAGE_SUB_SIZES,
			} );

			// AVIF (same-format resize).
			const avifElapsed = await page.evaluate( measureProcessing, {
				base64: avifBase64,
				mimeType: 'image/avif',
				sizes: IMAGE_SUB_SIZES,
			} );

			// AVIF → JPEG: current approach (resize as AVIF, then transcode each).
			const avifToJpegElapsed = await page.evaluate(
				measureCrossFormatProcessing,
				{
					base64: avifBase64,
					srcType: 'image/avif',
					dstType: 'image/jpeg',
					sizes: IMAGE_SUB_SIZES,
				}
			);

			// AVIF → JPEG via PNG intermediate (proposed optimization).
			const avifToJpegViaPngElapsed = await page.evaluate(
				measureCrossFormatViaPng,
				{
					base64: avifBase64,
					srcType: 'image/avif',
					dstType: 'image/jpeg',
					sizes: IMAGE_SUB_SIZES,
				}
			);

			if ( i > throwaway ) {
				results.mediaProcessingJpeg.push( jpegElapsed );
				results.mediaProcessingWebp.push( webpElapsed );
				results.mediaProcessingAvif.push( avifElapsed );
				results.mediaProcessingAvifToJpeg.push( avifToJpegElapsed );
				results.mediaProcessingAvifToJpegViaPng.push(
					avifToJpegViaPngElapsed
				);
			}
		} );
	}
} );

/* eslint-enable playwright/expect-expect */
