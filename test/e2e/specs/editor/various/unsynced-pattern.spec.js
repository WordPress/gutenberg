/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Unsynced pattern', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'create a new unsynced pattern via the block options menu', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'A useful paragraph to reuse' },
		} );

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
		await page.getByLabel( 'Synced' ).click();

		await page.keyboard.press( 'Enter' );
		const content = await editor.getEditedPostContent();

		// Check that the block content is still the same. If the pattern was added as synced
		// the content would be wrapped by a pattern block.
		expect( content ).toBe(
			`<!-- wp:paragraph -->
<p>A useful paragraph to reuse</p>
<!-- /wp:paragraph -->`
		);

		// Check that the new pattern is availble in the inserter and that is gets inserted as
		// a plain paragraph block.
		await page.getByLabel( 'Toggle block inserter' ).click();
		await page
			.getByRole( 'searchbox', {
				name: 'Search for blocks and patterns',
			} )
			.fill( 'My unsynced pattern' );
		await page.getByLabel( 'Search for blocks and patterns' ).click();
		await page.getByLabel( 'My unsynced pattern' ).click();

		const updatedContent = await editor.getEditedPostContent();
		expect( updatedContent ).toBe(
			`<!-- wp:paragraph -->
<p>A useful paragraph to reuse</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>A useful paragraph to reuse</p>
<!-- /wp:paragraph -->`
		);
	} );
} );
