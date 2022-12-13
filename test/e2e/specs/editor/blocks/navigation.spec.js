/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe(
	'As a user I want the navigation block to fallback to the best possible default',
	() => {
		test.beforeEach( async ( { admin } ) => {
			await admin.createNewPost();
		} );

		test( 'default to a list of pages if there are no menus', async ( {
			editor,
		} ) => {
			await editor.insertBlock( { name: 'core/navigation' } );

			// Check Page List is in the list view.

			// Open the list view.
			await editor.page.locator( '[aria-label="List View"i]' ).click();
			// Click the Navigation block expander, we need to use force because it has aria-hidden set to true.
			await editor.page
				.locator(
					`//a[.//span[text()='Navigation']]/span[contains(@class, 'block-editor-list-view__expander')]`
				)
				.click( { force: true } );
			// Find the Page list selector inside the navigation block.
			const pageListSelector = await editor.page.locator(
				`//table[contains(@aria-label,'Block navigation structure')]//a[.//span[text()='Page List']]`
			);

			expect( pageListSelector ).toBeTruthy();

			// Check the markup of the block is correct.
			await editor.publishPost();
			const content = await editor.getEditedPostContent();
			expect( content ).toBe(
				`<!-- wp:navigation -->
<!-- wp:page-list /-->
<!-- /wp:navigation -->`
			);
		} );
	}
);
