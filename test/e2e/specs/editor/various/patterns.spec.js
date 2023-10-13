/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Unsynced pattern', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllBlocks();
		await requestUtils.deleteAllPatternCategories();
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllBlocks();
		await requestUtils.deleteAllPatternCategories();
	} );

	test( 'create a new unsynced pattern via the block options menu', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'A useful paragraph to reuse' },
		} );
		const before = await editor.getBlocks();

		// Create an unsynced pattern from the paragraph block.
		await editor.showBlockToolbar();
		await page
			.getByRole( 'toolbar', { name: 'Block tools' } )
			.getByRole( 'button', { name: 'Options' } )
			.click();
		await page.getByRole( 'menuitem', { name: 'Create pattern' } ).click();

		const createPatternDialog = page.getByRole( 'dialog', {
			name: 'Create pattern',
		} );
		await createPatternDialog
			.getByRole( 'textbox', { name: 'Name' } )
			.fill( 'My unsynced pattern' );
		const newCategory = 'Contact details';
		await createPatternDialog
			.getByRole( 'combobox', { name: 'Categories' } )
			.fill( newCategory );
		await createPatternDialog
			.getByRole( 'checkbox', { name: 'Synced' } )
			.setChecked( false );

		await page.keyboard.press( 'Enter' );

		// Check that the block content is still the same. If the pattern was added as synced
		// the content would be wrapped by a pattern block.
		await expect
			.poll(
				editor.getBlocks,
				'The block content should be the same after converting to an unsynced pattern'
			)
			.toEqual( before );

		// Check that the new pattern is available in the inserter and that it gets inserted as
		// a plain paragraph block.
		await page.getByLabel( 'Toggle block inserter' ).click();
		await page
			.getByRole( 'tab', {
				name: 'Patterns',
			} )
			.click();
		await page
			.getByRole( 'button', {
				name: newCategory,
			} )
			.click();
		await page.getByLabel( 'My unsynced pattern' ).click();

		await expect
			.poll( editor.getBlocks )
			.toEqual( [ ...before, ...before ] );
	} );
} );
