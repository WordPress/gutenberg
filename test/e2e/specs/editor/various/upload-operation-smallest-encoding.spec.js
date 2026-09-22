/**
 * The upload operation API's escape hatch, exercised from outside the
 * package: a test plugin unregisters `core/transcode-image`, registers its
 * own step under the same name, and plans it into every image upload. The
 * assertions are what the server received.
 */
const path = require( 'path' );
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );
const {
	skipIfClientSideMediaInactive,
} = require( './client-side-media-utils' );

const ASSETS_DIR = path.join( __dirname, '..', '..', '..', 'assets' );

const PLUGIN = 'gutenberg-test-plugin-upload-operation-smallest-encoding';

test.describe( 'Upload operations: smallest encoding plugin', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activatePlugin( PLUGIN );
		await requestUtils.deleteAllMedia();
	} );

	test.beforeEach( async ( { admin, page } ) => {
		await admin.createNewPost();
		await skipIfClientSideMediaInactive( page, test );
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllMedia();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deactivatePlugin( PLUGIN );
	} );

	test( 'replaces the core step under its own name', async ( { page } ) => {
		const label = await page.evaluate(
			() =>
				window.wp.uploadMedia.getUploadOperation(
					'core/transcode-image'
				)?.label
		);

		expect( label ).toBe( 'Picking the smallest encoding' );
	} );

	test( 'uploads whichever encoding came out smallest', async ( {
		editor,
		page,
		requestUtils,
	} ) => {
		await expect(
			editor.canvas.getByRole( 'document', { name: 'Add default block' } )
		).toBeVisible();

		await editor.insertBlock( { name: 'core/image' } );
		const imageBlock = editor.canvas.locator(
			'role=document[name="Block: Image"i]'
		);
		await expect( imageBlock ).toBeVisible();

		// Watch the create request so a refusal reads as a status and a
		// body rather than as a block without an attachment.
		const created = page.waitForResponse(
			( response ) =>
				response.request().method() === 'POST' &&
				/\/wp\/v2\/media(\?|$)/.test( response.url() ),
			{ timeout: 60_000 }
		);

		await imageBlock
			.locator( 'data-testid=form-file-upload-input' )
			.setInputFiles(
				path.join( ASSETS_DIR, '1024x768_e2e_test_image.png' )
			);

		const response = await created;
		expect(
			response.status(),
			`The create request was refused: ${ await response.text() }`
		).toBe( 201 );

		await page.waitForFunction(
			() =>
				window.wp.data.select( 'core/upload-media' ).getItems()
					.length === 0,
			undefined,
			{ timeout: 60_000 }
		);

		const attachmentId = await page.evaluate(
			() =>
				window.wp.data
					.select( 'core/block-editor' )
					.getBlocks()
					.find( ( block ) => block.name === 'core/image' )
					?.attributes.id
		);
		expect( attachmentId ).toBeDefined();

		const media = await requestUtils.rest( {
			method: 'GET',
			path: `/wp/v2/media/${ attachmentId }`,
		} );

		// The step recorded what it compared. Which format wins depends on
		// the browser's encoders, so the assertion is the invariant: the
		// file the server holds is the one the step picked, and that one
		// is the smallest of the candidates.
		const record = media.smallest_encoding;
		expect( record ).toEqual(
			expect.objectContaining( {
				type: expect.stringMatching( /^image\/(jpeg|png|webp)$/ ),
				size: expect.any( Number ),
				candidates: expect.objectContaining( {
					'image/png': expect.any( Number ),
					'image/webp': expect.any( Number ),
				} ),
			} )
		);
		expect( record.size ).toBe(
			Math.min( ...Object.values( record.candidates ) )
		);
		expect( media.mime_type ).toBe( record.type );

		const served = await fetch( media.source_url );
		expect( served.ok ).toBe( true );
		const bytes = await served.arrayBuffer();
		expect( bytes.byteLength ).toBe( record.size );
	} );
} );
