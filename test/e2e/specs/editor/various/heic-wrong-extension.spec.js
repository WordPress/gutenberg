const path = require( 'path' );
const fs = require( 'fs/promises' );
const os = require( 'os' );
const { randomUUID } = require( 'crypto' );
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

const ASSETS_DIR = path.join( __dirname, '..', '..', '..', 'assets' );

/**
 * A HEIC photo under the name a user (or an over-eager export tool) gave it.
 * The browser derives `File.type` from the extension, so this file announces
 * itself as a JPEG even though its bytes are HEIC.
 */
const HEIC_FILE_NAMED_JPG = '450x600_e2e_test_image_heic_wrong_extension.jpg';

/**
 * Uploads an asset through a file input under a unique name, so repeat uploads
 * never collide on the server's de-duplicating suffixes.
 *
 * @param {import('@playwright/test').Locator} inputElement File input locator.
 * @param {string}                             fileName     File name in the assets directory.
 */
async function upload( inputElement, fileName ) {
	const tmpDirectory = await fs.mkdtemp(
		path.join( os.tmpdir(), 'gutenberg-test-media-' )
	);
	const tmpFileName = path.join(
		tmpDirectory,
		randomUUID() + path.extname( fileName )
	);
	await fs.copyFile( path.join( ASSETS_DIR, fileName ), tmpFileName );
	await inputElement.setInputFiles( tmpFileName );
}

/**
 * Inserts an image block and returns its locator.
 *
 * @param {Object} editor The editor fixture.
 * @return {Promise<import('@playwright/test').Locator>} The image block.
 */
async function insertImageBlock( editor ) {
	await editor.insertBlock( { name: 'core/image' } );
	const imageBlock = editor.canvas.locator(
		'role=document[name="Block: Image"i]'
	);
	await expect( imageBlock ).toBeVisible();
	return imageBlock;
}

/*
 * Both tests run in Chromium, which ships no HEVC codec, so every decoding
 * strategy fails and a HEIC file always ends at the same error. What is being
 * tested is that the file reaches that path at all rather than being uploaded
 * as undecodable bytes, and reaching it is what the error proves. Asserting a
 * successful conversion would mean a browser that decodes HEIC, and WebKit on
 * Linux CI crashes the page rather than decoding.
 */
test.describe( 'Uploading a HEIC file with a mismatched extension', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllMedia();
	} );

	test( 'converts it rather than uploading the raw HEIC bytes', async ( {
		editor,
		page,
	} ) => {
		const mediaRequests = [];
		page.on( 'request', ( request ) => {
			if (
				request.method() === 'POST' &&
				/\/wp\/v2\/media\b/.test( request.url() )
			) {
				mediaRequests.push( request.url() );
			}
		} );

		const imageBlock = await insertImageBlock( editor );
		await upload(
			imageBlock.locator( 'data-testid=form-file-upload-input' ),
			HEIC_FILE_NAMED_JPG
		);

		// The same message a correctly named .heic file produces in this
		// browser: the upload has to resolve one way or the other rather than
		// leaving the progress snackbar spinning forever.
		await expect(
			page.locator( '.components-snackbar' ).filter( { hasText: 'HEIC' } )
		).toBeVisible( { timeout: 60_000 } );

		// Nothing decodable came out of the conversion, so nothing should have
		// been sent to the server. Uploading the HEIC bytes under a .jpg name
		// leaves an attachment WordPress has to rename and re-encode behind
		// the editor's back.
		expect( mediaRequests ).toEqual( [] );
	} );

	test.describe( 'HEIC-only canvas mode', () => {
		test.beforeAll( async ( { requestUtils } ) => {
			// Disable cross-origin isolation while leaving client-side media
			// processing enabled, so the editor falls back to the HEIC
			// canvas-conversion mode. This mirrors Safari, where full
			// client-side processing is unsupported but HEIC files are still
			// converted before upload. That mode sorts each batch into HEIC
			// and non-HEIC files, which is a second place the file's name
			// could speak for its contents.
			await requestUtils.activatePlugin(
				'gutenberg-test-plugin-disable-cross-origin-isolation'
			);
		} );

		test.afterAll( async ( { requestUtils } ) => {
			await requestUtils.deactivatePlugin(
				'gutenberg-test-plugin-disable-cross-origin-isolation'
			);
		} );

		test( 'routes it to the HEIC conversion, not to the server', async ( {
			editor,
			page,
		} ) => {
			// Guards the test against silently falling back to full
			// client-side mode, where the first test already passes and this
			// one would prove nothing.
			await expect
				.poll( () => page.evaluate( () => window.crossOriginIsolated ) )
				.toBe( false );

			const imageBlock = await insertImageBlock( editor );
			await upload(
				imageBlock.locator( 'data-testid=form-file-upload-input' ),
				HEIC_FILE_NAMED_JPG
			);

			// Handing the file to the server-side upload instead uploads it
			// happily and never mentions HEIC.
			await expect(
				page
					.locator( '.components-snackbar' )
					.filter( { hasText: 'HEIC' } )
			).toBeVisible( { timeout: 60_000 } );
		} );
	} );
} );
