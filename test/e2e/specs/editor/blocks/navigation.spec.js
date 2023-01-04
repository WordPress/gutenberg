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

			// Necessary to wait for the block to be in loaded state else
			// initial rendered state will not be resolved.
			await page.waitForLoadState( 'networkidle' );

			// Check Page List is in the list view.

			// Open the list view.
			await page.click( '[aria-label="Document Overview"i]' );

			const listView = await page.locator(
				`//table[contains(@aria-label,'Block navigation structure')]`
			);

			// Click the Navigation block expander within the List View.
			await listView
				.locator( `//a[.//span[text()='Navigation']]` )
				.locator( '.block-editor-list-view__expander' )
				.click( {
					force: true, // required as element has aria-hidden set to true.);
				} );

			// Find the Page list selector inside the navigation block.
			const pageListSelector = await listView.locator(
				`//a[.//span[text()='Page List']]`
			);

			await expect( pageListSelector ).toBeVisible();

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
