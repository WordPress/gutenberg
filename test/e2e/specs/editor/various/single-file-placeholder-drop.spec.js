const path = require( 'path' );
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );
const {
	skipIfClientSideMediaInactive,
} = require( './client-side-media-utils' );

const IMAGES = [
	path.join( __dirname, '../../../assets/10x10_e2e_test_image_z9T8jK.png' ),
	path.join( __dirname, '../../../assets/10x10_e2e_test_image_green.png' ),
];

/**
 * Drops both images at once on the Cover block's placeholder, which does not
 * set `multiple` and so takes a single file (see gutenberg#82041).
 *
 * @param {Object} editor    Editor utils.
 * @param {Object} pageUtils Page utils.
 *
 * @return {Promise<Object>} Locator for the Cover block.
 */
async function dropTwoImagesOnCoverPlaceholder( editor, pageUtils ) {
	await editor.insertBlock( { name: 'core/cover' } );

	const coverBlock = editor.canvas.getByRole( 'document', {
		name: 'Block: Cover',
	} );
	await expect( coverBlock ).toBeVisible();

	const dragging = await pageUtils.dragFiles( IMAGES );
	await dragging.dragOver( coverBlock );
	await dragging.drop();

	return coverBlock;
}

test.describe( 'Dropping multiple files on a single-file placeholder', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllMedia();
	} );

	test.describe( 'with client-side media processing', () => {
		test.beforeEach( async ( { page } ) => {
			await skipIfClientSideMediaInactive( page, test );
		} );

		test( 'refuses the drop and uploads nothing', async ( {
			editor,
			page,
			pageUtils,
			requestUtils,
		} ) => {
			const coverBlock = await dropTwoImagesOnCoverPlaceholder(
				editor,
				pageUtils
			);

			await expect(
				page
					.locator( '.components-snackbar-list' )
					.getByText( 'Only one file can be used here.' )
			).toBeVisible();

			// The client-side path used to ignore the limit entirely: every
			// dropped file was uploaded and the block kept whichever one
			// finished last.
			await expect( coverBlock.locator( 'img' ) ).toHaveCount( 0 );
			expect( await requestUtils.listMedia() ).toHaveLength( 0 );
		} );
	} );

	test.describe( 'with client-side media processing disabled', () => {
		test.beforeAll( async ( { requestUtils } ) => {
			await requestUtils.activatePlugin(
				'gutenberg-test-plugin-disable-client-side-media-processing'
			);
		} );

		test.afterAll( async ( { requestUtils } ) => {
			await requestUtils.deactivatePlugin(
				'gutenberg-test-plugin-disable-client-side-media-processing'
			);
		} );

		test( 'refuses the drop without stranding the progress snackbar', async ( {
			editor,
			page,
			pageUtils,
		} ) => {
			await dropTwoImagesOnCoverPlaceholder( editor, pageUtils );

			const snackbarList = page.locator( '.components-snackbar-list' );
			await expect(
				snackbarList.getByText( 'Only one file can be used here.' )
			).toBeVisible();

			// The refusal used to register every dropped file with the progress
			// snackbar while only ever finishing one of them, leaving
			// "Uploading …" up for the rest of the session.
			await expect( snackbarList.getByText( /^Uploading/ ) ).toBeHidden();

			// So a later single-file upload still reports completion, rather
			// than being folded into the stranded session.
			await editor.insertBlock( { name: 'core/image' } );
			const imageBlock = editor.canvas.locator(
				'role=document[name="Block: Image"i]'
			);
			await imageBlock
				.locator( 'data-testid=form-file-upload-input' )
				.setInputFiles( IMAGES[ 0 ] );

			await expect(
				imageBlock.getByRole( 'img', {
					name: 'This image has an empty alt attribute',
				} )
			).toHaveAttribute( 'src', /^https?:\/\//, { timeout: 30_000 } );
			await expect(
				snackbarList.getByText( 'Upload complete' )
			).toBeVisible( { timeout: 10_000 } );
		} );
	} );
} );
