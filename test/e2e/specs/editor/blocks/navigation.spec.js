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
			const pagesRequest = page
				.waitForRequest( ( response ) => {
					return response.url().includes( 'rest_route=/wp/v2/pages' );
				} )
				.catch( () => {} );

			const menusRequest = page
				.waitForRequest( ( response ) => {
					return response.url().includes( 'rest_route=/wp/v2/menus' );
				} )
				.catch( () => {} );

			await editor.insertBlock( { name: 'core/navigation' } );

			await pagesRequest;
			await menusRequest;

			//await page.waitForTimeout( 10000 );

			const pageListBlock = await page.getByRole( 'document', {
				name: 'Block: Page List',
			} );

			await expect( pageListBlock ).toBeVisible();

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
