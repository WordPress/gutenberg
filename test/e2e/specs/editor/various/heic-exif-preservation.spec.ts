import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test, expect } from '@wordpress/e2e-test-utils-playwright';
import { skipIfClientSideMediaInactive } from './client-side-media-utils';

const ASSETS_DIR = join( __dirname, '..', '..', '..', 'assets' );

/**
 * Whether a JPEG carries an EXIF APP1 segment.
 *
 * Walks the marker segments between SOI and the start of the image data.
 *
 * @param bytes JPEG file contents.
 * @return True when an `Exif` APP1 segment is present.
 */
function hasExifSegment( bytes: Uint8Array ): boolean {
	let offset = 2;
	while ( offset + 4 <= bytes.length && bytes[ offset ] === 0xff ) {
		const marker = bytes[ offset + 1 ];
		// SOS: image data follows, metadata segments are all behind us.
		if ( marker === 0xda ) {
			break;
		}
		const length = bytes[ offset + 2 ] * 256 + bytes[ offset + 3 ];
		if (
			marker === 0xe1 &&
			String.fromCharCode(
				...bytes.subarray( offset + 4, offset + 8 )
			) === 'Exif'
		) {
			return true;
		}
		offset += 2 + length;
	}
	return false;
}

async function fetchBytes( url: string ): Promise< Uint8Array > {
	const response = await fetch( url );
	if ( ! response.ok ) {
		throw new Error( `Failed to fetch ${ url }: ${ response.status }` );
	}
	return new Uint8Array( await response.arrayBuffer() );
}

test.describe( 'HEIC upload EXIF preservation', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllMedia();
	} );

	test.beforeEach( async ( { admin, page } ) => {
		// Playwright's Chromium ships no HEVC decoder, so createImageBitmap()
		// cannot turn a HEIC into pixels. Stand in for the platform codec by
		// decoding a JPEG with the same dimensions instead. The HEIC bytes
		// themselves still reach vips untouched, which is where the EXIF is
		// read from, so everything past the decode is the real pipeline.
		const standIn = readFileSync(
			join( ASSETS_DIR, '1024x768_e2e_test_image_size.jpeg' )
		).toString( 'base64' );
		await page.addInitScript( ( base64: string ) => {
			// Decoded up front rather than fetched from a data: URL so the
			// stand-in cannot fail for reasons of its own.
			const binary = atob( base64 );
			const bytes = new Uint8Array( binary.length );
			for ( let i = 0; i < binary.length; i++ ) {
				bytes[ i ] = binary.charCodeAt( i );
			}
			const standInBlob = new Blob( [ bytes ], { type: 'image/jpeg' } );

			// Every type the shim is handed, so a miss can be diagnosed.
			const seen: unknown[] = [];
			( window as unknown as Record< string, unknown > ).__heicShimTypes =
				seen;

			const original = window.createImageBitmap.bind( window );
			window.createImageBitmap = ( async (
				source: ImageBitmapSource,
				...rest: unknown[]
			) => {
				/*
				 * Chromium types an upload from the platform, so the same
				 * fixture arrives as `image/heic` on macOS and `image/heif`
				 * on Linux. Match the family rather than one spelling.
				 */
				const type = ( source as { type?: unknown } )?.type;
				seen.push( type );
				if (
					typeof type === 'string' &&
					type.startsWith( 'image/hei' )
				) {
					source = standInBlob;
				}
				return ( original as ( ...args: unknown[] ) => unknown )(
					source,
					...rest
				);
			} ) as typeof createImageBitmap;
		}, standIn );

		await admin.createNewPost();
		await skipIfClientSideMediaInactive( page, test );
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllMedia();
	} );

	test( 'keeps EXIF in the uploaded JPEG and strips it from sub-sizes', async ( {
		editor,
		page,
		requestUtils,
	} ) => {
		await editor.insertBlock( { name: 'core/image' } );

		const imageBlock = editor.canvas.locator(
			'role=document[name="Block: Image"i]'
		);
		await imageBlock
			.locator( 'data-testid=form-file-upload-input' )
			.setInputFiles(
				join( ASSETS_DIR, '1024x768_e2e_test_image_exif_camera.heic' )
			);

		// The HEIC was converted client-side and uploaded as a JPEG.
		const image = imageBlock.getByRole( 'img', {
			name: 'This image has an empty alt attribute',
		} );
		try {
			await expect( image ).toHaveAttribute(
				'src',
				/^https?:\/\/.*\.jpg$/,
				{ timeout: 60_000 }
			);
		} catch ( error ) {
			// A conversion failure is always reported as a decode error,
			// whatever went wrong, so say what the stand-in was offered.
			const seen = await page.evaluate(
				() =>
					( window as unknown as Record< string, unknown > )
						.__heicShimTypes
			);
			throw new Error(
				`${ ( error as Error ).message }\n\n` +
					`createImageBitmap was called with: ${ JSON.stringify(
						seen
					) }`
			);
		}
		await page.waitForFunction(
			() =>
				window.wp.data.select( 'core/upload-media' ).getItems()
					.length === 0,
			undefined,
			{ timeout: 120_000 }
		);

		const imageId = await page.evaluate(
			() =>
				window.wp.data.select( 'core/block-editor' ).getSelectedBlock()
					?.attributes?.id
		);
		expect( imageId ).toBeDefined();
		const media = await requestUtils.rest( {
			method: 'GET',
			path: `/wp/v2/media/${ imageId }`,
		} );

		expect( media.mime_type ).toBe( 'image/jpeg' );

		// The server populated the attachment from the EXIF carried over
		// from the HEIC container.
		expect( media.media_details.image_meta ).toMatchObject( {
			camera: 'E2E Camera',
			credit: 'E2E Photographer',
			copyright: 'E2E copyright',
			title: 'E2E HEIC title',
			// The HEIC is tagged "rotate 90° CW". The decoded pixels are
			// already upright, so the copy must not rotate them again.
			orientation: '1',
		} );
		expect( media.media_details.width ).toBe( 1024 );
		expect( media.media_details.height ).toBe( 768 );

		// Only the original keeps its metadata. Sub-sizes are stripped of
		// everything but color profiles, matching WordPress core.
		expect( hasExifSegment( await fetchBytes( media.source_url ) ) ).toBe(
			true
		);

		const subSizes = Object.entries( media.media_details.sizes ).filter(
			( [ name ] ) => name !== 'full'
		) as Array< [ string, { source_url: string } ] >;
		expect( subSizes.length ).toBeGreaterThan( 0 );
		for ( const [ , size ] of subSizes ) {
			expect(
				hasExifSegment( await fetchBytes( size.source_url ) )
			).toBe( false );
		}
	} );
} );
