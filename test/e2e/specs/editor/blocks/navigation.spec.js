/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe(
	'As a user I want the navigation block to fallback to the best possible default',
	() => {
		test.beforeAll( async ( { requestUtils } ) => {
			await requestUtils.activateTheme( 'emptytheme' );
		} );

		test.beforeEach( async ( { admin } ) => {
			await admin.createNewPost();
		} );

		test.afterAll( async ( { requestUtils } ) => {
			await requestUtils.activateTheme( 'twentytwentyone' );
		} );

		test.afterEach( async ( { requestUtils } ) => {
			await requestUtils.deleteAllPosts();
		} );

		test( 'default to a list of pages if there are no menus', async ( {
			editor,
			page,
		} ) => {
			await editor.insertBlock( { name: 'core/navigation' } );

			// Check Page List is in the list view.

			// Open the list view.
			await page.locator( '[aria-label="Document Overview"i]' ).click();

			// Click the Navigation block expander, we need to use force because it has aria-hidden set to true.
			await page
				.locator(
					`//a[.//span[text()='Navigation']]/span[contains(@class, 'block-editor-list-view__expander')]`
				)
				.click( { force: true } );

			// Find the Page list selector inside the navigation block.
			const pageListSelector = await page.locator(
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
