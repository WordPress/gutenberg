/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.use( {
	navBlockUtils: async ( { editor, page, requestUtils }, use ) => {
		await use( new NavigationBlockUtils( { editor, page, requestUtils } ) );
	},
} );

test.describe(
	'As a user I want the navigation block to fallback to the best possible default',
	() => {
		test.beforeAll( async ( { requestUtils } ) => {
			//TT3 is preferable to emptytheme because it already has the navigation block on its templates.
			await requestUtils.activateTheme( 'twentytwentythree' );
		} );

		test.beforeEach( async ( { requestUtils } ) => {
			await Promise.all( [ requestUtils.deleteAllMenus() ] );
		} );

		test.afterAll( async ( { requestUtils } ) => {
			await Promise.all( [
				requestUtils.deleteAllMenus(),
				requestUtils.activateTheme( 'twentytwentyone' ),
			] );
		} );

		test.afterEach( async ( { requestUtils } ) => {
			await requestUtils.deleteAllPosts();
		} );

		test( 'default to a list of pages if there are no menus', async ( {
			admin,
			editor,
		} ) => {
			await admin.createNewPost();
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
			admin,
			editor,
			page,
			requestUtils,
			navBlockUtils,
		} ) => {
			await admin.createNewPost();
			const createdMenu = await requestUtils.createNavigationMenu( {
				title: 'Test Menu 1',
				content:
					'<!-- wp:navigation-link {"label":"WordPress","type":"custom","url":"http://www.wordpress.org/","kind":"custom","isTopLevelLink":true} /-->',
			} );

			await editor.insertBlock( { name: 'core/navigation' } );

			// Check the block in the canvas.
			await navBlockUtils.selectNavigationItemOnCanvas( 'WordPress' );

			// Check the markup of the block is correct.
			await editor.publishPost();
			await expect.poll( editor.getBlocks ).toMatchObject( [
				{
					name: 'core/navigation',
					attributes: { ref: createdMenu.id },
				},
			] );
			await page.locator( 'role=button[name="Close panel"i]' ).click();

			// Check the block in the frontend.
			await navBlockUtils.selectNavigationItemOnFrontend( 'WordPress' );
		} );

		test( 'default to the only existing classic menu if there are no block menus', async ( {
			admin,
			editor,
			requestUtils,
			navBlockUtils,
		} ) => {
			// Create a classic menu.
			await requestUtils.createClassicMenu( 'Test Classic 1' );
			await admin.createNewPost();

			await editor.insertBlock( { name: 'core/navigation' } );
			// We need to check the canvas after inserting the navigation block to be able to target the block.
			await expect.poll( editor.getBlocks ).toMatchObject( [
				{
					name: 'core/navigation',
				},
			] );

			// Check the block in the canvas.
			await editor.page.pause();
			await navBlockUtils.selectNavigationItemOnCanvas( 'Custom link' );

			// Check the block in the frontend.
			await navBlockUtils.selectNavigationItemOnFrontend( 'Custom link' );
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

	async selectNavigationItemOnCanvas( name ) {
		await expect(
			this.editor.canvas.locator(
				`role=textbox[name="Navigation link text"i] >> text="${ name }"`
			)
		).toBeVisible();
	}

	async selectNavigationItemOnFrontend( name ) {
		await this.page.goto( '/' );
		await this.editor.page.pause();
		await expect(
			this.page.locator(
				`role=navigation >> role=link[name="${ name }"i]`
			)
		).toBeVisible();
	}
}
