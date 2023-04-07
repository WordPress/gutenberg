/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Focus toolbar shortcut (alt + F10)', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'should focus the top level toolbar when no block is selected', async ( {
		page,
		pageUtils,
	} ) => {
		await page.type(
			'.editor-post-title__input',
			'Focus toolbar shortcut (alt + F10)'
		);
		// Focus the top level toolbar.
		await pageUtils.pressKeys( 'alt+F10' );

		// The first top level toolbar button should be focused.
		await expect(
			page.getByRole( 'button', { name: 'Toggle block inserter' } )
		).toBeFocused();
	} );

	test( 'should focus the block toolbar when a block is selected', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.insertBlock( { name: 'core/paragraph' } );
		await page.keyboard.type( 'Paragraph' );
		// Focus the block toolbar.
		await pageUtils.pressKeys( 'alt+F10' );
		// The paragraph block toolbar button should be focused.
		await expect(
			page.getByRole( 'button', { name: 'Paragraph' } )
		).toBeFocused();
	} );

	test( 'should focus the block toolbar when a block is selected and the toolbar is visible', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.insertBlock( { name: 'core/paragraph' } );
		await page.keyboard.type( 'Paragraph' );
		// We need to force the toolbar to show. Otherwise, the bug from
		// https://github.com/WordPress/gutenberg/pull/49644 won't surface in the e2e tests.
		await editor.showBlockToolbar();

		// Focus the block toolbar.
		await pageUtils.pressKeys( 'alt+F10' );
		// The block toolbar should be focused.
		await expect(
			page.getByRole( 'button', { name: 'Paragraph' } )
		).toBeFocused();

		// The document toolbar popup should not be visible
		await expect(
			page.locator( 'text=Toggle block inserter' )
		).not.toBeVisible();
	} );
} );
