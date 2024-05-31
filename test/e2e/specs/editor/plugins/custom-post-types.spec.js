/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Test Custom Post Types', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activatePlugin( 'gutenberg-test-custom-post-types' );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deactivatePlugin(
			'gutenberg-test-custom-post-types'
		);
	} );

	test( 'should be able to create an hierarchical post without title support', async ( {
		admin,
		editor,
		page,
	} ) => {
		await admin.createNewPost( { postType: 'hierar-no-title' } );
		await editor.canvas
			.locator( 'role=button[name="Add default block"i]' )
			.click();
		await page.keyboard.type( 'Parent Post' );
		await editor.publishPost();

		// Create a post that is a child of the previously created post.
		await admin.createNewPost( { postType: 'hierar-no-title' } );
		await editor.openDocumentSettingsSidebar();
		await page
			.getByRole( 'region', { name: 'Editor settings' } )
			.getByRole( 'tab', {
				name: 'Hierarchical No Title',
			} )
			.click();

		await page.locator( '.editor-post-parent__panel-toggle' ).click();

		const parentPageLocator = page.getByRole( 'combobox', {
			name: 'Parent',
		} );

		await parentPageLocator.click();
		await page.getByRole( 'listbox' ).getByRole( 'option' ).first().click();
		const parentPage = await parentPageLocator.inputValue();

		await editor.canvas
			.locator( 'role=button[name="Add default block"i]' )
			.click();
		await page.keyboard.type( 'Child Post' );
		await editor.publishPost();
		await page.reload();

		await page.locator( '.editor-post-parent__panel-toggle' ).click();

		// Confirm parent page selection matches after reloading.
		await expect( parentPageLocator ).toHaveValue( parentPage );
	} );

	test( 'should create a cpt with a legacy block in its template without WSOD', async ( {
		admin,
		editor,
		page,
	} ) => {
		await admin.createNewPost( { postType: 'leg_block_in_tpl' } );
		await editor.insertBlock( { name: 'core/paragraph' } );
		await page.keyboard.type( 'Hello there' );

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/embed',
				attributes: { providerNameSlug: 'wordpress-tv' },
			},
			{
				name: 'core/paragraph',
				attributes: { content: 'Hello there' },
			},
		] );

		await editor.publishPost();
	} );
} );
