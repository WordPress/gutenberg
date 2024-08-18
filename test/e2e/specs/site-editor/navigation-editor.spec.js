/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Editing Navigation Menus', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllMenus();
	} );

	test( 'it should lock the root Navigation block in the editor', async ( {
		admin,
		page,
		pageUtils,
		requestUtils,
		editor,
	} ) => {
		await test.step( 'Check Navigation block is present and locked', async () => {
			// Create a Navigation Menu called "Primary Menu" using the REST API helpers.
			const createdMenu = await requestUtils.createNavigationMenu( {
				title: 'Primary Menu',
				content:
					'<!-- wp:navigation-link {"label":"WordPress","type":"custom","url":"http://www.wordpress.org/","kind":"custom"} /-->',
			} );

			// Add another so we get a list of Navigation menus in the editor.
			await requestUtils.createNavigationMenu( {
				title: 'Another One',
				content:
					'<!-- wp:navigation-link {"label":"Another Item","type":"custom","url":"http://www.wordpress.org/","kind":"custom"} /-->',
			} );

			await admin.visitSiteEditor( {
				postId: createdMenu?.id,
				postType: 'wp_navigation',
				canvas: 'edit',
			} );

			// Open List View.
			await pageUtils.pressKeys( 'access+o' );

			const listView = page
				.getByRole( 'region', {
					name: 'Document Overview',
				} )
				.getByRole( 'treegrid', {
					name: 'Block navigation structure',
				} );

			await expect( listView ).toBeVisible();

			const navBlockNode = listView.getByRole( 'link', {
				name: 'Navigation',
				exact: true,
			} );

			// The Navigation block should be present.
			await expect( navBlockNode ).toBeVisible();

			// The Navigation block description should contain the locked state information.
			await expect( navBlockNode ).toHaveAccessibleDescription(
				/This block is locked./
			);

			// The block should have no options menu.
			await expect(
				navBlockNode
					.locator( '..' ) // parent selector.
					.getByRole( 'button', {
						name: 'Options',
					} )
			).toBeHidden();

			// Select the Navigation block.
			await navBlockNode.click();
		} );

		await test.step( 'Check Navigation block has no controls other than editable list view', async () => {
			// Open the document settings sidebar
			await editor.openDocumentSettingsSidebar();

			const sidebar = page.getByRole( 'region', {
				name: 'Editor settings',
			} );

			await expect( sidebar ).toBeVisible();

			// Check that the `Menu` control is visible.
			// This is effectively the contents of the "List View" tab.
			await expect(
				sidebar.getByRole( 'heading', { name: 'Menu', exact: true } )
			).toBeVisible();

			// Check the standard tabs are not present.
			await expect(
				sidebar.getByRole( 'tab', { name: 'Document Overview' } )
			).toBeHidden();
			await expect(
				sidebar.getByRole( 'tab', { name: 'Settings' } )
			).toBeHidden();
			await expect(
				sidebar.getByRole( 'tab', { name: 'Styles' } )
			).toBeHidden();
		} );
	} );
} );
