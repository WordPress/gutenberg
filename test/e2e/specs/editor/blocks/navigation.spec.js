/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

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

		test.beforeEach( async ( { admin, navBlockUtils } ) => {
			await Promise.all( [
				navBlockUtils.deleteAllNavigationMenus(),
				admin.createNewPost(),
			] );
		} );

		test.afterAll( async ( { requestUtils, navBlockUtils } ) => {
			await Promise.all( [
				navBlockUtils.deleteAllNavigationMenus(),
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

		test( 'default to my only existing menu', async ( {
			editor,
			navBlockUtils,
		} ) => {
			const createdMenu = await navBlockUtils.createNavigationMenu( {
				title: 'Test Menu 1',
				content:
					'<!-- wp:navigation-link {"label":"WordPress","type":"custom","url":"http://www.wordpress.org/","kind":"custom","isTopLevelLink":true} /-->',
			} );

			await editor.insertBlock( { name: 'core/navigation' } );

			// Check the markup of the block is correct.
			await editor.publishPost();
			const content = await editor.getEditedPostContent();
			expect( content ).toBe(
				`<!-- wp:navigation {"ref":${ createdMenu.id }} /-->`
			);

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

	/**
	 * Delete all navigation menus
	 *
	 */
	async deleteAllNavigationMenus() {
		const menus = await this.requestUtils.rest( {
			path: `/wp/v2/navigation/`,
		} );

		if ( ! menus?.length ) return;

		await this.requestUtils.batchRest(
			menus.map( ( menu ) => ( {
				method: 'DELETE',
				path: `/wp/v2/navigation/${ menu.id }?force=true`,
			} ) )
		);
	}
}
