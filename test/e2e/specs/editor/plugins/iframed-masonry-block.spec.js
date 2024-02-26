/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'iframed masonry block', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activatePlugin(
			'gutenberg-test-iframed-masonry-block'
		);
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deactivatePlugin(
			'gutenberg-test-iframed-masonry-block'
		);
	} );

	test( 'should load script and dependencies in iframe', async ( {
		editor,
	} ) => {
		await editor.insertBlock( { name: 'test/iframed-masonry-block' } );

		const masonry = editor.canvas.getByRole( 'document', {
			name: 'Block: Iframed Masonry Block',
		} );
		await expect( masonry ).toBeVisible();

		const masonryBox = await masonry.boundingBox();

		// Expect Masonry to set a non-zero height.
		expect( masonryBox.height ).toBeGreaterThan( 0 );

		// Expect Masonry to absolute position items.
		await expect( masonry.locator( '.grid-item' ).first() ).toHaveCSS(
			'position',
			'absolute'
		);
	} );
} );
