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
		await test.step( 'Manually browse to focus mode for a Navigation Menu', async () => {
			// create a Navigation Menu called "Test Menu" using the REST API helpers
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

			// We could Navigate directly to editing the Navigation Menu but we intentionally do not do this.
			//
			// Why? To provide coverage for a bug that caused the Navigation Editor behaviours to fail
			// only when navigating through the editor screens (rather than going directly to the editor by URL).
			// See: https://github.com/WordPress/gutenberg/pull/56856.
			//
			// Example (what we could do):
			// await admin.visitSiteEditor( {
			// 	postId: createdMenu?.id,
			// 	postType: 'wp_navigation',
			// } );
			//
			await admin.visitSiteEditor();

			const editorSidebar = page.getByRole( 'region', {
				name: 'Navigation',
			} );

			await editorSidebar
				.getByRole( 'button', {
					name: 'Navigation',
				} )
				.click();

			// Wait for list of Navigations to appear.
			await expect(
				editorSidebar.getByRole( 'heading', {
					name: 'Navigation',
					level: 1,
				} )
			).toBeVisible();

			await expect( page ).toHaveURL(
				`wp-admin/site-editor.php?path=%2Fnavigation`
			);

			await editorSidebar
				.getByRole( 'button', {
					name: 'Primary Menu',
				} )
				.click();

			await expect( page ).toHaveURL(
				`wp-admin/site-editor.php?postId=${ createdMenu?.id }&postType=wp_navigation`
			);

			// Wait for list of Navigations to appear.
			await expect(
				editorSidebar.getByRole( 'heading', {
					name: 'Primary Menu',
					level: 1,
				} )
			).toBeVisible();

			// Switch to editing the Navigation Menu
			await editorSidebar
				.getByRole( 'link', {
					name: 'Edit',
				} )
				.click();
		} );

		await test.step( 'Check Navigation block is present and locked', async () => {
			// Open List View.
			await pageUtils.pressKeys( 'access+o' );

			const listView = page
				.getByRole( 'region', {
					name: 'List View',
				} )
				.getByRole( 'treegrid', {
					name: 'Block navigation structure',
				} );

			await expect( listView ).toBeVisible();

			const navBlockNode = listView.getByRole( 'link', {
				name: 'Navigation (locked)',
				exact: true,
			} );

			// The Navigation block should be present and locked.
			await expect( navBlockNode ).toBeVisible();

			// The block should have no options menu.
			await expect(
				listView.getByRole( 'button', {
					name: 'Options for Navigation',
					exact: true,
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
				sidebar.getByRole( 'tab', { name: 'List View' } )
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
