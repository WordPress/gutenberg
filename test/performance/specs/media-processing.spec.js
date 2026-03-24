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

test.describe( 'Media Processing Performance', () => {
	// Shared state across tests.
	let jpegBase64;
	let webpBase64;
	let avifBase64;

	test.afterAll( async ( {}, testInfo ) => {
		await testInfo.attach( 'results', {
			body: JSON.stringify( results, null, 2 ),
			contentType: 'application/json',
		} );
	} );

	test( 'Setup', async ( { admin, page } ) => {
		await admin.createNewPost();

		// Skip if cross-origin isolation is not enabled.
		// The vips library requires SharedArrayBuffer which needs cross-origin isolation.
		const isCrossOriginIsolated = await page.evaluate(
			() => window.crossOriginIsolated
		);
		// eslint-disable-next-line playwright/no-skipped-test
		test.skip(
			! isCrossOriginIsolated,
			'Cross-origin isolation headers not configured on server'
		);

		// Read test images from disk.
		jpegBase64 = readFileSync(
			path.join( ASSETS_PATH, 'test-image-3000x2000.jpeg' )
		).toString( 'base64' );

		webpBase64 = readFileSync(
			path.join( ASSETS_PATH, 'test-image-3000x2000.webp' )
		).toString( 'base64' );

		avifBase64 = readFileSync(
			path.join( ASSETS_PATH, 'test-image-3000x2000.avif' )
		).toString( 'base64' );

		// Warm up the vips WASM module by running a single resize.
		await page.evaluate( async ( base64 ) => {
			const { vipsResizeImage } = await import(
				'@wordpress/vips/worker'
			);
			const buffer = Uint8Array.from( atob( base64 ), ( c ) =>
				c.charCodeAt( 0 )
			).buffer;
			await vipsResizeImage(
				'warmup',
				buffer,
				'image/jpeg',
				{ width: 150, height: 150, crop: true },
				false,
				0.82
			);
		}, jpegBase64 );
	} );

	const samples = 10;
	const throwaway = 1;
	const iterations = samples + throwaway;

	for ( let i = 1; i <= iterations; i++ ) {
		test( `JPEG processing (${ i } of ${ iterations })`, async ( {
			page,
		} ) => {
			// eslint-disable-next-line playwright/no-skipped-test
			test.skip( ! jpegBase64, 'Setup did not complete' );

			const elapsed = await page.evaluate(
				async ( { base64, sizes } ) => {
					const { vipsResizeImage } = await import(
						'@wordpress/vips/worker'
					);
					const buffer = Uint8Array.from( atob( base64 ), ( c ) =>
						c.charCodeAt( 0 )
					).buffer;

					const start = performance.now();
					for ( const resize of sizes ) {
						await vipsResizeImage(
							`perf-jpeg-${ resize.width }`,
							buffer,
							'image/jpeg',
							resize,
							false,
							0.82
						);
					}
					return performance.now() - start;
				},
				{ base64: jpegBase64, sizes: IMAGE_SUB_SIZES }
			);

			if ( i > throwaway ) {
				results.mediaProcessingJpeg.push( elapsed );
			}
		} );

		test( `WebP processing (${ i } of ${ iterations })`, async ( {
			page,
		} ) => {
			// eslint-disable-next-line playwright/no-skipped-test
			test.skip( ! webpBase64, 'Setup did not complete' );

			const elapsed = await page.evaluate(
				async ( { base64, sizes } ) => {
					const { vipsResizeImage } = await import(
						'@wordpress/vips/worker'
					);
					const buffer = Uint8Array.from( atob( base64 ), ( c ) =>
						c.charCodeAt( 0 )
					).buffer;

					const start = performance.now();
					for ( const resize of sizes ) {
						await vipsResizeImage(
							`perf-webp-${ resize.width }`,
							buffer,
							'image/webp',
							resize,
							false,
							0.82
						);
					}
					return performance.now() - start;
				},
				{ base64: webpBase64, sizes: IMAGE_SUB_SIZES }
			);

			if ( i > throwaway ) {
				results.mediaProcessingWebp.push( elapsed );
			}
		} );

		test( `AVIF processing (${ i } of ${ iterations })`, async ( {
			page,
		} ) => {
			// eslint-disable-next-line playwright/no-skipped-test
			test.skip( ! avifBase64, 'Setup did not complete' );

			const elapsed = await page.evaluate(
				async ( { base64, sizes } ) => {
					const { vipsResizeImage } = await import(
						'@wordpress/vips/worker'
					);
					const buffer = Uint8Array.from( atob( base64 ), ( c ) =>
						c.charCodeAt( 0 )
					).buffer;

					const start = performance.now();
					for ( const resize of sizes ) {
						await vipsResizeImage(
							`perf-avif-${ resize.width }`,
							buffer,
							'image/avif',
							resize,
							false,
							0.82
						);
					}
					return performance.now() - start;
				},
				{ base64: avifBase64, sizes: IMAGE_SUB_SIZES }
			);

			if ( i > throwaway ) {
				results.mediaProcessingAvif.push( elapsed );
			}
		} );
	}
} );

/* eslint-enable playwright/expect-expect */
