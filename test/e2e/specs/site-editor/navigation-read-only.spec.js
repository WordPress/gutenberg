/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

const PERMISSIONS_PLUGIN =
	'gutenberg-test-site-editor-read-only-navigation-permissions';
const SITE_EDITOR_USER = 'site-editor-user-with-navigation-write-denied';
const SITE_EDITOR_USER_PASSWORD = 'password';

test.describe( 'Navigation block for a Site Editor user with Navigation Menu writes explicitly denied', () => {
	test.use( { storageState: { cookies: [], origins: [] } } );

	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
		await requestUtils.activatePlugin( PERMISSIONS_PLUGIN );
	} );

	test.beforeEach( async ( { requestUtils } ) => {
		await Promise.all( [
			requestUtils.deleteAllMenus(),
			requestUtils.deleteAllTemplates( 'wp_template' ),
			requestUtils.deleteAllUsers(),
		] );
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await Promise.all( [
			requestUtils.deleteAllMenus(),
			requestUtils.deleteAllTemplates( 'wp_template' ),
			requestUtils.deleteAllUsers(),
		] );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deactivatePlugin( PERMISSIONS_PLUGIN );
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test( 'can access the Site Editor canvas, switch published menus, and save block styles without mutating menus', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		await requestUtils.createUser( {
			username: SITE_EDITOR_USER,
			email: `${ SITE_EDITOR_USER }@example.com`,
			password: SITE_EDITOR_USER_PASSWORD,
			roles: [ 'administrator' ],
		} );

		const firstMenu = await requestUtils.createNavigationMenu( {
			title: 'Site Editor Read-only Menu One',
			content:
				'<!-- wp:navigation-link {"label":"First site editor menu link","type":"custom","url":"#first-site-editor-menu-link","kind":"custom"} /-->',
		} );
		const secondMenu = await requestUtils.createNavigationMenu( {
			title: 'Site Editor Read-only Menu Two',
			content:
				'<!-- wp:navigation-link {"label":"Second site editor menu link","type":"custom","url":"#second-site-editor-menu-link","kind":"custom"} /-->',
		} );
		const template = await requestUtils.createTemplate( 'wp_template', {
			slug: 'navigation-read-only-capabilities',
			title: 'Navigation read-only capabilities',
			content: `<!-- wp:navigation {"ref":${ firstMenu.id }} /-->`,
		} );

		const getMenu = ( menuId ) =>
			requestUtils.rest( {
				path: `/wp/v2/navigation/${ menuId }`,
				params: { context: 'edit' },
			} );
		const [ firstMenuBefore, secondMenuBefore ] = await Promise.all( [
			getMenu( firstMenu.id ),
			getMenu( secondMenu.id ),
		] );

		const failedNavigationRequests = [];
		page.on( 'response', ( response ) => {
			if (
				response.url().includes( '/wp/v2/navigation' ) &&
				! response.ok()
			) {
				failedNavigationRequests.push( {
					method: response.request().method(),
					status: response.status(),
					url: response.url(),
				} );
			}
		} );

		await page.goto( '/wp-login.php' );
		await page
			.getByLabel( 'Username or Email Address' )
			.fill( SITE_EDITOR_USER );
		await page
			.getByRole( 'textbox', { name: 'Password' } )
			.fill( SITE_EDITOR_USER_PASSWORD );
		await page.getByRole( 'button', { name: 'Log In' } ).click();
		await page.waitForURL( /wp-admin/ );

		await admin.visitSiteEditor( {
			postId: template.id,
			postType: 'wp_template',
			canvas: 'edit',
		} );
		await expect(
			page.getByRole( 'region', { name: 'Editor top bar' } )
		).toBeVisible();

		const navigationBlock = editor.canvas.getByRole( 'document', {
			name: 'Block: Navigation',
		} );
		await expect(
			navigationBlock.getByRole( 'link', {
				name: 'First site editor menu link',
			} )
		).toBeVisible();
		await expect(
			navigationBlock.getByRole( 'textbox', {
				name: 'Navigation link text',
			} )
		).toHaveCount( 0 );

		await navigationBlock.click();
		await editor.openDocumentSettingsSidebar();
		await page.getByRole( 'tab', { name: 'List View' } ).click();

		const listViewPanel = page.getByRole( 'tabpanel', {
			name: 'List View',
		} );
		await expect(
			listViewPanel.getByText(
				'You can view this Menu, but you do not have permission to edit it.'
			)
		).toBeVisible();
		await expect(
			listViewPanel.getByRole( 'button', { name: 'Add block' } )
		).toHaveCount( 0 );

		await listViewPanel
			.getByRole( 'button', { name: 'Site Editor Read-only Menu One' } )
			.click();
		await expect(
			page.getByRole( 'group', { name: 'Tools' } )
		).toBeVisible();
		await expect(
			page.getByRole( 'menuitem', { name: 'Create new Menu' } )
		).toHaveAttribute( 'aria-disabled', 'true' );
		await page
			.getByRole( 'menuitemradio', {
				name: 'Site Editor Read-only Menu Two',
			} )
			.click();

		await expect(
			navigationBlock.getByRole( 'link', {
				name: 'Second site editor menu link',
			} )
		).toBeVisible();

		await navigationBlock.click();
		await page
			.getByRole( 'toolbar', { name: 'Block tools' } )
			.getByRole( 'button', { name: 'Change items justification' } )
			.click();
		await page
			.getByRole( 'menuitem', { name: 'Justify items right' } )
			.click();
		await expect( navigationBlock ).toHaveClass( /items-justified-right/ );

		await editor.saveSiteEditorEntities( {
			isOnlyCurrentEntityDirty: true,
		} );
		await admin.visitSiteEditor( {
			postId: template.id,
			postType: 'wp_template',
			canvas: 'edit',
		} );
		await expect(
			navigationBlock.getByRole( 'link', {
				name: 'Second site editor menu link',
			} )
		).toBeVisible();
		await expect( navigationBlock ).toHaveClass( /items-justified-right/ );

		const [ firstMenuAfter, secondMenuAfter ] = await Promise.all( [
			getMenu( firstMenu.id ),
			getMenu( secondMenu.id ),
		] );
		for ( const [ before, after ] of [
			[ firstMenuBefore, firstMenuAfter ],
			[ secondMenuBefore, secondMenuAfter ],
		] ) {
			expect( after.title.raw ).toBe( before.title.raw );
			expect( after.content.raw ).toBe( before.content.raw );
			expect( after.status ).toBe( before.status );
			expect( after.modified_gmt ).toBe( before.modified_gmt );
		}

		expect( failedNavigationRequests ).toEqual( [] );
	} );
} );
