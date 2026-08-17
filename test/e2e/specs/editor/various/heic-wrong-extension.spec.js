const path = require( 'path' );
const fs = require( 'fs/promises' );
const os = require( 'os' );
const { randomUUID } = require( 'crypto' );
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

const ASSETS_DIR = path.join( __dirname, '..', '..', '..', 'assets' );

/**
 * The same HEIC photo under two names: one honest, one with the extension a
 * user (or an over-eager export tool) changed to `.jpg`. The browser derives
 * `File.type` from the extension, so the second file announces itself as a
 * JPEG even though its bytes are HEIC.
 */
const HEIC_FILE = '450x600_e2e_test_image.heic';
const HEIC_FILE_NAMED_JPG = '450x600_e2e_test_image_heic_wrong_extension.jpg';

/**
 * Uploads an asset through a file input under a unique name, so parallel runs
 * and repeat uploads never collide on the server's de-duplicating suffixes.
 *
 * @param {import('@playwright/test').Locator} inputElement File input locator.
 * @param {string}                             fileName     File name in the assets directory.
 */
async function upload( inputElement, fileName ) {
	const tmpDirectory = await fs.mkdtemp(
		path.join( os.tmpdir(), 'gutenberg-test-media-' )
	);
	const extension = path.extname( fileName );
	const tmpFileName = path.join(
		tmpDirectory,
		randomUUID() + extension.toLowerCase()
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

test.describe( 'Uploading a HEIC file with a mismatched extension', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllMedia();
	} );

	test( 'reports the HEIC decode failure instead of uploading the raw HEIC bytes', async ( {
		editor,
		page,
	} ) => {
		// Chromium ships no HEVC codec, so every decoding strategy in
		// canvasConvertToJpeg() fails here and the HEIC path always ends in
		// the same error. That makes this the deterministic half of the pair:
		// what matters is that the file reaches that path at all.
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

	test( 'converts it the same way as a correctly named HEIC file (@webkit, -chromium, -firefox)', async ( {
		editor,
		page,
	} ) => {
		// WebKit decodes HEIC through the OS codec, so this is the half that
		// proves the wrongly named file takes the full conversion path: the
		// converted JPEG is uploaded and the untouched original is sideloaded
		// alongside it, exactly as for the honestly named file.
		const sideloadRequest = page.waitForRequest(
			( request ) =>
				request.method() === 'POST' &&
				request.url().includes( 'sideload' ),
			{ timeout: 60_000 }
		);

		const imageBlock = await insertImageBlock( editor );
		await upload(
			imageBlock.locator( 'data-testid=form-file-upload-input' ),
			HEIC_FILE_NAMED_JPG
		);

		await sideloadRequest;

		const image = imageBlock.getByRole( 'img', {
			name: 'This image has an empty alt attribute',
		} );
		await expect( image ).toHaveAttribute( 'src', /\.jpg$/, {
			timeout: 60_000,
		} );

		// The uploaded file is a real JPEG, not HEIC bytes wearing a .jpg
		// name, so the server never had to correct the extension.
		const src = await image.getAttribute( 'src' );
		const magic = await page.evaluate( async ( url ) => {
			const response = await fetch( url );
			const bytes = new Uint8Array(
				( await response.arrayBuffer() ).slice( 0, 3 )
			);
			return Array.from( bytes );
		}, src );
		expect( magic ).toEqual( [ 0xff, 0xd8, 0xff ] );
	} );

	test( 'matches the behavior of the same file with its real extension (@webkit, -chromium, -firefox)', async ( {
		editor,
		page,
	} ) => {
		const sideloadRequest = page.waitForRequest(
			( request ) =>
				request.method() === 'POST' &&
				request.url().includes( 'sideload' ),
			{ timeout: 60_000 }
		);

		const imageBlock = await insertImageBlock( editor );
		await upload(
			imageBlock.locator( 'data-testid=form-file-upload-input' ),
			HEIC_FILE
		);

		await sideloadRequest;

		const image = imageBlock.getByRole( 'img', {
			name: 'This image has an empty alt attribute',
		} );
		await expect( image ).toHaveAttribute( 'src', /\.jpg$/, {
			timeout: 60_000,
		} );
	} );
} );
