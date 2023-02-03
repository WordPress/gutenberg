/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

/**
 * Internal dependencies
 */
const menuItemsFixture = require( './fixtures/menu-items-request-fixture.js' );

test.use( {
	navBlockUtils: async ( { page, requestUtils }, use ) => {
		await use( new NavigationBlockUtils( { page, requestUtils } ) );
	},
} );

test.describe(
	'As a user I want the navigation block to fallback to the best possible default',
	() => {
		test.beforeAll( async ( { requestUtils } ) => {
			await requestUtils.activateTheme( 'emptytheme' );
		} );

		test.beforeEach( async ( { admin, requestUtils } ) => {
			await Promise.all( [
				requestUtils.deleteAllPosts(),
				requestUtils.deleteAllPosts( 'pages' ),
				requestUtils.deleteAllPosts( 'navigation' ),
				requestUtils.deleteAllMenus(),
				admin.createNewPost(),
			] );
		} );

		test.afterAll( async ( { requestUtils } ) => {
			await Promise.all( [
				requestUtils.deleteAllPosts(),
				requestUtils.deleteAllPosts( 'pages' ),
				requestUtils.deleteAllPosts( 'navigation' ),
				requestUtils.deleteAllMenus(),
				requestUtils.activateTheme( 'twentytwentyone' ),
			] );
		} );

		test.afterEach( async ( { requestUtils } ) => {
			await requestUtils.deleteAllPosts();
		} );

		test( 'default to a list of pages if there are no menus', async ( {
			editor,
		} ) => {
			await editor.insertBlock( { name: 'core/navigation' } );

			const pageListBlock = editor.canvas.getByRole( 'document', {
				name: 'Block: Page List',
			} );

			await expect( pageListBlock ).toBeVisible( {
				// Wait for the Nav and Page List block API requests to resolve.
				// Note: avoid waiting on network requests as these are not perceivable
				// to the user.
				// See: https://github.com/WordPress/gutenberg/pull/45070#issuecomment-1373712007.
				timeout: 10000,
			} );

			// Check the markup of the block is correct.
			await editor.publishPost();
			const content = await editor.getEditedPostContent();
			expect( content ).toBe(
				`<!-- wp:navigation -->
<!-- wp:page-list /-->
<!-- /wp:navigation -->`
			);
		} );

		test( 'default to my most recently created menu', async ( {
			editor,
			requestUtils,
		} ) => {
			//Create a menu
			await requestUtils.createMenu(
				{ name: 'Test Menu 1' },
				menuItemsFixture
			);
			//insert navigation block
			//check the markup of the block
			//check the block in the list view?
			//check the block in the frontend?
			await editor.page.pause();
		} );
	}
);

class NavigationBlockUtils {
	constructor( { editor, page, requestUtils } ) {
		this.editor = editor;
		this.page = page;
		this.requestUtils = requestUtils;
	}

	/**
	 * Create a navigation menu
	 *
	 * @param {Object} menuData navigation menu post data.
	 * @return {string} Menu content.
	 */
	async createNavigationMenu( menuData ) {
		return this.requestUtils.rest( {
			method: 'POST',
			path: `/wp/v2/navigation/`,
			data: {
				status: 'publish',
				...menuData,
			},
		} );
	}
}
