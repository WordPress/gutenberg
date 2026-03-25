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
 * Decode a base64 string to an ArrayBuffer, run vipsResizeImage
 * for each sub-size, and return the total elapsed time in ms.
 *
 * Runs inside page.evaluate().
 *
 * @param {Object}   args
 * @param {string}   args.base64   Base64-encoded image data.
 * @param {string}   args.mimeType MIME type of the image.
 * @param {Object[]} args.sizes    Array of { width, height, crop? } sub-sizes.
 * @return {Promise<number>} Elapsed time in milliseconds.
 */
async function measureProcessing( { base64, mimeType, sizes } ) {
	const { vipsResizeImage } = await import( '@wordpress/vips/worker' );
	const bytes = Uint8Array.from( atob( base64 ), ( c ) => c.charCodeAt( 0 ) );

	const start = performance.now();
	for ( const resize of sizes ) {
		// Create a fresh buffer copy for each resize because
		// the worker transfers (detaches) the ArrayBuffer.
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

		// Skip if SharedArrayBuffer is not available.
		// The vips library requires SharedArrayBuffer for WebAssembly-based
		// image processing. This is enabled via cross-origin isolation headers
		// (Document-Isolation-Policy or COOP/COEP).
		const hasSharedArrayBuffer = await page.evaluate(
			() => typeof SharedArrayBuffer !== 'undefined'
		);
		// eslint-disable-next-line playwright/no-skipped-test
		test.skip(
			! hasSharedArrayBuffer,
			'SharedArrayBuffer not available (cross-origin isolation not configured)'
		);

		// Warm up the vips WASM module by running a single resize.
		await page.evaluate( measureProcessing, {
			base64: jpegBase64,
			mimeType: 'image/jpeg',
			sizes: [ { width: 150, height: 150, crop: true } ],
		} );

		// Save the draft so iteration tests can navigate to it.
		// This ensures the import map for @wordpress/vips/worker is available.
		draftId = await page.evaluate( () =>
			window.wp.data.select( 'core/editor' ).getCurrentPostId()
		);
	} );

	const samples = 10;
	const throwaway = 1;
	const iterations = samples + throwaway;

	for ( let i = 1; i <= iterations; i++ ) {
		test( `Run the test (${ i } of ${ iterations })`, async ( {
			admin,
			page,
		} ) => {
			// eslint-disable-next-line playwright/no-skipped-test
			test.skip( ! draftId, 'Setup did not complete' );

			// Navigate to the editor to get the import map.
			await admin.editPost( draftId );

			// JPEG
			const jpegElapsed = await page.evaluate( measureProcessing, {
				base64: jpegBase64,
				mimeType: 'image/jpeg',
				sizes: IMAGE_SUB_SIZES,
			} );

			// WebP
			const webpElapsed = await page.evaluate( measureProcessing, {
				base64: webpBase64,
				mimeType: 'image/webp',
				sizes: IMAGE_SUB_SIZES,
			} );

			// AVIF
			const avifElapsed = await page.evaluate( measureProcessing, {
				base64: avifBase64,
				mimeType: 'image/avif',
				sizes: IMAGE_SUB_SIZES,
			} );

			if ( i > throwaway ) {
				results.mediaProcessingJpeg.push( jpegElapsed );
				results.mediaProcessingWebp.push( webpElapsed );
				results.mediaProcessingAvif.push( avifElapsed );
			}
		} );
	}
} );

/* eslint-enable playwright/expect-expect */
