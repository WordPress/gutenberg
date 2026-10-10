const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

const META_KEY = 'wp_navigation_auto_add_pages';

test.describe( 'Navigation block: Auto add pages', () => {
	test.beforeEach( async ( { requestUtils } ) => {
		await Promise.all( [
			requestUtils.deleteAllPages(),
			requestUtils.deleteAllMenus(),
		] );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await Promise.all( [
			requestUtils.deleteAllPages(),
			requestUtils.deleteAllMenus(),
		] );
	} );

	test( 'the default menu links to the published pages and picks up new ones', async ( {
		admin,
		editor,
		requestUtils,
	} ) => {
		await requestUtils.createPage( { title: 'About', status: 'publish' } );

		await admin.createNewPost();
		await editor.insertBlock( { name: 'core/navigation' } );

		const navigationBlock = editor.canvas.getByRole( 'document', {
			name: 'Block: Navigation',
		} );
		await expect(
			navigationBlock.getByRole( 'document', {
				name: 'Block: Page Link',
			} )
		).toContainText( 'About', {
			// Wait for the menu and the fallback request to resolve.
			timeout: 10000,
		} );
		await expect(
			navigationBlock.getByRole( 'document', {
				name: 'Block: Page List',
			} )
		).toBeHidden();

		const [ menu ] = await requestUtils.getNavigationMenus( {
			status: 'publish',
		} );
		expect( menu.meta[ META_KEY ] ).toBe( true );

		const contact = await requestUtils.createPage( {
			title: 'Contact',
			status: 'publish',
		} );
		const updatedMenu = await requestUtils.rest( {
			path: `/wp/v2/navigation/${ menu.id }`,
			params: { context: 'edit' },
		} );
		expect( updatedMenu.content.raw ).toContain( `"id":${ contact.id }` );
	} );

	test( 'the setting can be turned off from the block settings', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		const menu = await requestUtils.createNavigationMenu( {
			title: 'Main menu',
			content:
				'<!-- wp:navigation-link {"label":"Home","url":"https://example.com","kind":"custom"} /-->',
			meta: { [ META_KEY ]: true },
		} );

		await admin.createNewPost();
		await editor.insertBlock( {
			name: 'core/navigation',
			attributes: { ref: menu.id },
		} );
		await editor.openDocumentSettingsSidebar();
		const settings = page.getByRole( 'region', {
			name: 'Editor settings',
		} );
		await settings.getByRole( 'tab', { name: 'Settings' } ).click();

		const toggle = settings.getByRole( 'switch', {
			name: 'Auto add pages',
		} );
		await expect( toggle ).toBeChecked();
		await toggle.click();
		await expect( toggle ).not.toBeChecked();

		// Saving the post also saves the menu.
		await editor.publishPost();

		const savedMenu = await requestUtils.rest( {
			path: `/wp/v2/navigation/${ menu.id }`,
			params: { context: 'edit' },
		} );
		expect( savedMenu.meta[ META_KEY ] ).toBe( false );

		await requestUtils.createPage( { title: 'Later', status: 'publish' } );
		const unchangedMenu = await requestUtils.rest( {
			path: `/wp/v2/navigation/${ menu.id }`,
			params: { context: 'edit' },
		} );
		expect( unchangedMenu.content.raw ).toBe( savedMenu.content.raw );
	} );
} );
