/**
 * External dependencies
 */
import { readFileSync } from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { test, expect } from '@playwright/test';

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

const ASSETS_PATH =
	process.env.ASSETS_PATH || path.join( __dirname, '..', 'assets' );

let vips;

/**
 * Initializes the wasm-vips instance with HEIF support for AVIF processing.
 */
async function getVips() {
	if ( vips ) {
		return vips;
	}
	// Resolve wasm-vips from the @wordpress/vips package where it's installed.
	const require = createRequire(
		path.join( __dirname, '..', '..', '..', 'packages', 'vips', 'index.js' )
	);
	const Vips = require( 'wasm-vips' );
	vips = await Vips( {
		dynamicLibraries: [ 'vips-heif.wasm' ],
		preRun: ( module ) => {
			module.setAutoDeleteLater( true );
			module.setDelayFunction( ( fn ) => {
				cleanup = fn;
			} );
		},
	} );
	return vips;
}

let cleanup;

/**
 * Runs cleanup for vips memory management.
 */
function runCleanup() {
	if ( cleanup ) {
		cleanup();
	}
}

/**
 * Same-format resize: decode, resize each sub-size, encode back to same format.
 *
 * @param {Buffer}   buffer   Image file buffer.
 * @param {string}   mimeType MIME type of the image.
 * @param {Object[]} sizes    Array of sub-size specs.
 * @return {Promise<number>} Elapsed time in milliseconds.
 */
async function measureProcessing( buffer, mimeType, sizes ) {
	const v = await getVips();
	const ext = mimeType.split( '/' )[ 1 ];

	const saveOptions = { keep: 'icc' };
	if ( mimeType === 'image/jpeg' || mimeType === 'image/avif' ) {
		saveOptions.Q = 82;
	}
	if ( mimeType === 'image/avif' ) {
		saveOptions.effort = 2;
	}

	const start = performance.now();
	for ( const resize of sizes ) {
		const thumbnailOptions = { size: 'down' };
		const height = resize.height || 0;
		if ( height ) {
			thumbnailOptions.height = height;
		}
		if ( resize.crop === true ) {
			thumbnailOptions.crop = 'centre';
		}

		const image = v.Image.thumbnailBuffer(
			buffer,
			resize.width,
			thumbnailOptions
		);
		image.writeToBuffer( `.${ ext }`, saveOptions );
		runCleanup();
	}
	return performance.now() - start;
}

/**
 * Cross-format processing: resize each sub-size in source format,
 * then convert each to target format.
 *
 * @param {Buffer}   buffer  Image file buffer.
 * @param {string}   srcType Source MIME type.
 * @param {string}   dstType Target MIME type.
 * @param {Object[]} sizes   Array of sub-size specs.
 * @return {Promise<Object>} Elapsed time and output metadata.
 */
async function measureCrossFormatProcessing( buffer, srcType, dstType, sizes ) {
	const v = await getVips();
	const srcExt = srcType.split( '/' )[ 1 ];
	const dstExt = dstType.split( '/' )[ 1 ];
	const outputs = [];

	const srcSaveOptions = { keep: 'icc', Q: 82 };
	const dstSaveOptions = { keep: 'icc', Q: 82 };
	if ( dstType === 'image/avif' ) {
		dstSaveOptions.effort = 2;
	}

	const start = performance.now();
	for ( const resize of sizes ) {
		const thumbnailOptions = { size: 'down' };
		const height = resize.height || 0;
		if ( height ) {
			thumbnailOptions.height = height;
		}
		if ( resize.crop === true ) {
			thumbnailOptions.crop = 'centre';
		}

		// Resize in source format.
		const resized = v.Image.thumbnailBuffer(
			buffer,
			resize.width,
			thumbnailOptions
		);
		const resizedBuffer = resized.writeToBuffer(
			`.${ srcExt }`,
			srcSaveOptions
		);

		// Convert to target format.
		const loaded = v.Image.newFromBuffer( resizedBuffer );
		const converted = loaded.writeToBuffer(
			`.${ dstExt }`,
			dstSaveOptions
		);

		const header = Array.from( converted.slice( 0, 12 ) );
		outputs.push( {
			width: resized.width,
			height: resized.height,
			byteLength: converted.byteLength,
			header,
		} );

		runCleanup();
	}
	return { elapsed: performance.now() - start, outputs };
}

test.describe( 'Media Processing Performance', () => {
	// Read test images once at module level.
	const jpegBuffer = readFileSync(
		path.join( ASSETS_PATH, 'test-image-3000x2000.jpeg' )
	);
	const avifBuffer = readFileSync(
		path.join( ASSETS_PATH, 'test-image-3000x2000.avif' )
	);

	test.afterAll( async ( {}, testInfo ) => {
		await testInfo.attach( 'results', {
			body: JSON.stringify( results, null, 2 ),
			contentType: 'application/json',
		} );
	} );

	test( 'Warm up', async () => {
		// Initialize vips and warm up the WASM module.
		await measureProcessing( jpegBuffer, 'image/jpeg', [
			{ width: 150, height: 150, crop: true },
		] );
	} );

	const samples = 7;
	const throwaway = 1;
	const iterations = samples + throwaway;

	for ( let i = 1; i <= iterations; i++ ) {
		test( `Run the test (${ i } of ${ iterations })`, async () => {
			// JPEG (same-format resize).
			const jpegElapsed = await measureProcessing(
				jpegBuffer,
				'image/jpeg',
				IMAGE_SUB_SIZES
			);

			// AVIF (same-format resize).
			const avifElapsed = await measureProcessing(
				avifBuffer,
				'image/avif',
				IMAGE_SUB_SIZES
			);

			// JPEG -> AVIF: resize as JPEG, then transcode each sub-size to AVIF.
			const jpegToAvif = await measureCrossFormatProcessing(
				jpegBuffer,
				'image/jpeg',
				'image/avif',
				IMAGE_SUB_SIZES
			);

			// Validate that cross-format outputs are actually AVIF.
			// AVIF files are ISOBMFF containers: bytes 4-7 = "ftyp".
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
