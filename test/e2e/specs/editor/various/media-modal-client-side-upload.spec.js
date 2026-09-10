const path = require( 'path' );
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );
const {
	skipIfClientSideMediaInactive,
} = require( './client-side-media-utils' );

// A 1024x768 JPEG: larger than the thumbnail and medium sub-sizes, so the
// pipeline generates and sideloads them.
const TEST_IMAGE_PATH = path.join(
	__dirname,
	'..',
	'..',
	'..',
	'assets',
	'1024x768_e2e_test_image_size.jpeg'
);

// An AVIF the server cannot process without an image editor that supports it,
// which is what made the modal's server-side uploads fail where the block
// editor's own client-side uploads succeeded.
const TEST_AVIF_PATH = path.join(
	__dirname,
	'..',
	'..',
	'..',
	'assets',
	'200x150_e2e_test_image_decode.avif'
);

// The plupload HTML5 runtime creates this hidden file input over the modal's
// "Select Files" button; setting files on it triggers FilesAdded, the same
// event a file dropped on the modal fires.
const FILE_INPUT_SELECTOR = '.media-modal .moxie-shim-html5 input[type="file"]';

test.describe( 'Media modal client-side uploads', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllMedia();
	} );

	test( 'processes an upload started from the media modal in the browser', async ( {
		editor,
		page,
		requestUtils,
	} ) => {
		await skipIfClientSideMediaInactive( page, test );

		// The REST route may be a pretty permalink (/wp/v2/media) or the plain
		// form (index.php?rest_route=%2Fwp%2Fv2%2Fmedia), so match on the
		// decoded URL.
		let mediaCreateCount = 0;
		let sideloadCount = 0;
		let finalizeCount = 0;
		const asyncUploads = [];
		page.on( 'request', ( request ) => {
			if ( request.method() !== 'POST' ) {
				return;
			}
			const url = request.url();
			if ( url.includes( '/async-upload.php' ) ) {
				asyncUploads.push( url );
				return;
			}
			const decoded = decodeURIComponent( url );
			if ( /\/wp\/v2\/media\/\d+\/sideload/.test( decoded ) ) {
				sideloadCount++;
			} else if ( /\/wp\/v2\/media\/\d+\/finalize/.test( decoded ) ) {
				finalizeCount++;
			} else if ( /\/wp\/v2\/media(?:[?&]|$)/.test( decoded ) ) {
				mediaCreateCount++;
			}
		} );

		await editor.insertBlock( { name: 'core/image' } );
		await editor.canvas
			.getByRole( 'button', { name: 'Media Library' } )
			.click();

		const modal = page.locator( '.media-modal' );
		await expect( modal ).toBeVisible();

		await modal
			.locator( '.media-router' )
			.getByText( 'Upload files' )
			.click();

		const fileInput = page.locator( FILE_INPUT_SELECTOR ).first();
		await fileInput.waitFor( { state: 'attached' } );
		await fileInput.setInputFiles( TEST_IMAGE_PATH );

		// The finalized attachment resolves to a normal (non-uploading) tile.
		await expect(
			modal.locator( 'li.attachment:not(.uploading)' ).first()
		).toBeVisible( { timeout: 60_000 } );

		// The original upload and every sub-size go through the REST API, and
		// the upload is finalized exactly once.
		expect( mediaCreateCount ).toBeGreaterThanOrEqual( 1 );
		expect( sideloadCount ).toBeGreaterThanOrEqual( 1 );
		expect( finalizeCount ).toBe( 1 );

		// Nothing goes through the classic async-upload.php endpoint.
		expect( asyncUploads ).toEqual( [] );

		// The attachment carries the browser-generated sub-sizes.
		const [ attachment ] = await requestUtils.rest( {
			path: '/wp/v2/media',
			params: { per_page: 1 },
		} );
		expect( Object.keys( attachment.media_details.sizes || {} ) ).toEqual(
			expect.arrayContaining( [ 'thumbnail', 'medium' ] )
		);

		// The modal still hands the finished upload back to the block.
		await modal
			.getByRole( 'button', { name: 'Select', exact: true } )
			.click();
		await expect(
			editor.canvas.locator( 'figure.wp-block-image img' )
		).toHaveAttribute( 'src', attachment.source_url );
	} );

	test( 'uploads a format the server may not be able to process', async ( {
		editor,
		page,
	} ) => {
		await skipIfClientSideMediaInactive( page, test );

		const asyncUploads = [];
		page.on( 'request', ( request ) => {
			if (
				request.method() === 'POST' &&
				request.url().includes( '/async-upload.php' )
			) {
				asyncUploads.push( request.url() );
			}
		} );

		await editor.insertBlock( { name: 'core/image' } );
		await editor.canvas
			.getByRole( 'button', { name: 'Media Library' } )
			.click();

		const modal = page.locator( '.media-modal' );
		await expect( modal ).toBeVisible();
		await modal
			.locator( '.media-router' )
			.getByText( 'Upload files' )
			.click();

		const fileInput = page.locator( FILE_INPUT_SELECTOR ).first();
		await fileInput.waitFor( { state: 'attached' } );
		await fileInput.setInputFiles( TEST_AVIF_PATH );

		await expect(
			modal.locator( 'li.attachment:not(.uploading)' ).first()
		).toBeVisible( { timeout: 60_000 } );

		// No upload error is reported and nothing reached the classic
		// endpoint that would have rejected the file.
		await expect( modal.locator( '.upload-error' ) ).toHaveCount( 0 );
		expect( asyncUploads ).toEqual( [] );
	} );
} );
