/**
 * WordPress dependencies
 */

const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Validate multiple use', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'should display correct amount of warning message', async ( {
		editor,
		page,
	} ) => {
		// Insert a block with `multiple` feature enabled, such as `core/more`
		await editor.insertBlock( {
			name: 'core/more',
		} );

		const optionButton = page.locator(
			".components-dropdown-menu__toggle[data-toolbar-item='true'][aria-label='Options']"
		);

		// Group the block
		await optionButton.click();
		await page.getByText( 'Group' ).click();

		// Duplicate the block
		await optionButton.click();
		await page.getByText( 'Duplicate' ).click();

		// Check if warnings is visible
		await expect(
			page.frameLocator( 'iFrame' ).locator( '.block-editor-warning' )
		).toBeVisible();
	} );
} );
