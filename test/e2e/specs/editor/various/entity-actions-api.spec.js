const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

const PLUGIN_SLUG = 'gutenberg-test-entity-actions-api';

test.describe( 'Entity actions API', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activatePlugin( PLUGIN_SLUG );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await Promise.all( [
			requestUtils.deactivatePlugin( PLUGIN_SLUG ),
			requestUtils.deleteAllPages(),
			requestUtils.deleteAllPosts(),
		] );
	} );

	test( 'shows the actions registered on the server, with their script module', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		const { id } = await requestUtils.createPage( {
			title: 'Featured Page',
			status: 'publish',
		} );
		await admin.editPost( id );
		await editor.openDocumentSettingsSidebar();
		await page.getByRole( 'button', { name: 'Actions' } ).click();

		const menu = page.getByRole( 'menu', { name: 'Actions' } );
		// A core action, its label from the server.
		await expect(
			menu.getByRole( 'menuitem', { name: 'Rename' } )
		).toBeVisible();
		// The core action the plugin unregisters for pages.
		await expect(
			menu.getByRole( 'menuitem', { name: 'Duplicate' } )
		).toHaveCount( 0 );
		// The module entry no registration names.
		await expect(
			menu.getByRole( 'menuitem', { name: 'Unregistered' } )
		).toHaveCount( 0 );

		await menu.getByRole( 'menuitem', { name: 'Feature' } ).click();
		await expect( page.locator( '.components-snackbar' ) ).toHaveText(
			'Featured: Featured Page'
		);
	} );

	test( 'keeps the core actions of the other post types', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		const { id } = await requestUtils.createPost( {
			title: 'Plain Post',
			status: 'publish',
		} );
		await admin.editPost( id );
		await editor.openDocumentSettingsSidebar();
		await page.getByRole( 'button', { name: 'Actions' } ).click();

		const menu = page.getByRole( 'menu', { name: 'Actions' } );
		await expect(
			menu.getByRole( 'menuitem', { name: 'Duplicate' } )
		).toBeVisible();
		await expect(
			menu.getByRole( 'menuitem', { name: 'Feature' } )
		).toHaveCount( 0 );
	} );
} );
