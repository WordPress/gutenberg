/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Child Blocks', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activatePlugin( 'gutenberg-test-child-blocks' );
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deactivatePlugin( 'gutenberg-test-child-blocks' );
	} );

	test( 'are hidden from the global block inserter', async ( { page } ) => {
		const blockInserter = page
			.getByRole( 'toolbar', { name: 'Document tools' } )
			.getByRole( 'button', { name: 'Toggle block inserter' } );
		const blockLibrary = page.getByRole( 'region', {
			name: 'Block Library',
		} );

		await blockInserter.click();
		await expect( blockLibrary ).toBeVisible();
		expect( blockLibrary.getByRole( 'option' ) ).not.toContain( [
			'Child Blocks Child',
		] );
	} );

	test( 'shows up in a parent block', async ( { page, editor } ) => {
		await editor.insertBlock( {
			name: 'test/child-blocks-unrestricted-parent',
		} );

		await page
			.getByRole( 'document', {
				name: 'Block: Child Blocks Unrestricted Parent',
			} )
			.getByRole( 'button', {
				name: 'Add block',
			} )
			.click();

		const blockInserter = page
			.getByRole( 'toolbar', { name: 'Document tools' } )
			.getByRole( 'button', { name: 'Toggle block inserter' } );
		const blockLibrary = page.getByRole( 'region', {
			name: 'Block Library',
		} );

		await blockInserter.click();
		await expect( blockLibrary ).toBeVisible();
		expect(
			await blockLibrary.getByRole( 'option' ).count()
		).toBeGreaterThan( 10 );
	} );

	test( 'display in a parent block with allowedItems', async ( {
		page,
		editor,
	} ) => {
		await editor.insertBlock( {
			name: 'test/child-blocks-restricted-parent',
		} );

		await page.click(
			'[data-type="test/child-blocks-restricted-parent"] .block-editor-default-block-appender'
		);

		const blockInserter = page
			.getByRole( 'toolbar', { name: 'Document tools' } )
			.getByRole( 'button', { name: 'Toggle block inserter' } );
		const blockLibrary = page.getByRole( 'region', {
			name: 'Block Library',
		} );

		await blockInserter.click();
		await expect( blockLibrary ).toBeVisible();
		await expect( blockLibrary.getByRole( 'option' ) ).toHaveText( [
			'Paragraph',
			'Child Blocks Child',
			'Image',
		] );
	} );
} );
