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
			// TODO:
			// Check the list view.

			await editor.publishPost();

			// Check the content.
			const content = await editor.getEditedPostContent();
			expect( content ).toBe(
				`<!-- wp:navigation -->
<!-- wp:page-list /-->
<!-- /wp:navigation -->`
			);
		} );

		test( 'default to my only existing menu', async () => {} );
		test( 'default to my most recently created menu', async () => {} );
		test( 'default to the only existing classic menu if there are no block menus', async () => {} );
	}
);
