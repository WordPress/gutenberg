/* eslint-disable playwright/expect-expect */

/**
 * External dependencies
 */
import { readFileSync } from 'fs';
import path from 'path';

/**
 * WordPress dependencies
 */
import { test, expect } from '@wordpress/e2e-test-utils-playwright';

const results = {
	mediaProcessingJpeg: [],
	mediaProcessingAvif: [],
	mediaProcessingJpegToAvif: [],
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
 * Cross-format processing: resize each sub-size in source format,
 * then convert each to target format.
 *
 * @param {Object}   root0         Function arguments.
 * @param {string}   root0.base64  Base64-encoded image data.
 * @param {string}   root0.srcType Source MIME type.
 * @param {string}   root0.dstType Target MIME type.
 * @param {Object[]} root0.sizes   Array of sub-size specs.
 * @return {Promise<Object>} Elapsed time and output metadata.
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
	const outputs = [];

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
		const converted = await vipsConvertImageFormat(
			`perf-xfmt-conv-${ resize.width }`,
			resized.buffer,
			srcType,
			dstType,
			0.82,
			false
		);
		const header = Array.from( new Uint8Array( converted ).slice( 0, 12 ) );
		outputs.push( {
			width: resized.width,
			height: resized.height,
			byteLength: converted.byteLength,
			header,
		} );
	}
	return { elapsed: performance.now() - start, outputs };
}

test.describe( 'Media Processing Performance', () => {
	// Read test images once at module level — these don't change.
	const jpegBase64 = readFileSync(
		path.join( ASSETS_PATH, 'test-image-3000x2000.jpeg' )
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

			// AVIF (same-format resize).
			const avifElapsed = await page.evaluate( measureProcessing, {
				base64: avifBase64,
				mimeType: 'image/avif',
				sizes: IMAGE_SUB_SIZES,
			} );

			// JPEG → AVIF: resize as JPEG, then transcode each sub-size to AVIF.
			// Simulates an optimization plugin converting uploaded JPEGs to AVIF.
			const jpegToAvif = await page.evaluate(
				measureCrossFormatProcessing,
				{
					base64: jpegBase64,
					srcType: 'image/jpeg',
					dstType: 'image/avif',
					sizes: IMAGE_SUB_SIZES,
				}
			);

			// Validate that cross-format outputs are actually AVIF.
			// AVIF files are ISOBMFF containers: bytes 4-7 = "ftyp" (0x66 0x74 0x79 0x70).
			for ( const output of jpegToAvif.outputs ) {
				expect( output.header[ 4 ] ).toBe( 0x66 ); // 'f'
				expect( output.header[ 5 ] ).toBe( 0x74 ); // 't'
				expect( output.header[ 6 ] ).toBe( 0x79 ); // 'y'
				expect( output.header[ 7 ] ).toBe( 0x70 ); // 'p'
				expect( output.byteLength ).toBeGreaterThan( 0 );
				expect( output.width ).toBeGreaterThan( 0 );
				expect( output.height ).toBeGreaterThan( 0 );
			}

			if ( i > throwaway ) {
				results.mediaProcessingJpeg.push( jpegElapsed );
				results.mediaProcessingAvif.push( avifElapsed );
				results.mediaProcessingJpegToAvif.push( jpegToAvif.elapsed );
			}
		} );
	}
} );

/* eslint-enable playwright/expect-expect */
