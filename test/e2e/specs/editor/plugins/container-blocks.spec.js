/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Container block without paragraph support', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activatePlugin(
			'gutenberg-test-container-block-without-paragraph'
		);
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deactivatePlugin(
			'gutenberg-test-container-block-without-paragraph'
		);
	} );

	test( 'ensures we can use the alternative block appender properly', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'test/container-without-paragraph',
		} );

		await page
			.getByRole( 'document', {
				name: 'Block: Container without paragraph',
			} )
			.getByRole( 'button', { name: 'Add block' } )
			.click();

		await page
			.getByRole( 'listbox', { name: 'Blocks' } )
			.getByRole( 'option', { name: 'Image' } )
			.click();

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'test/container-without-paragraph',
				innerBlocks: [ { name: 'core/image' } ],
			},
		] );
	} );
} );
