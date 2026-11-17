import { test, expect } from '@wordpress/e2e-test-utils-playwright';

// The extensible site editor (v2) renders its sidebar items as links, the
// classic site editor as buttons.
const isSiteEditorV2 = !! process.env.GUTENBERG_E2E_SITE_EDITOR_V2;
const SIDEBAR_ITEM_ROLE = isSiteEditorV2 ? 'link' : 'button';

const PERMISSIONS_PLUGIN =
	'gutenberg-test-site-editor-read-only-navigation-permissions';
const SITE_EDITOR_USER = 'site-editor-user-with-navigation-write-denied';
const SITE_EDITOR_USER_PASSWORD = 'password';
// A copy of the Administrator role, added by the plugin, that stores the
// Navigation Menu capabilities as denied, the way a role editor would.
const READ_ONLY_NAVIGATION_ROLE =
	'gutenberg_test_read_only_navigation_administrator';
const MENU_TITLE = 'Navigation Screen Permissions Menu';
const PERMISSION_MESSAGE =
	'You do not have permission to manage Navigation Menus.';

test.describe( 'Site Editor Navigation screen for a user who cannot manage Navigation Menus', () => {
	test.use( { storageState: { cookies: [], origins: [] } } );

	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
		await requestUtils.activatePlugin( PERMISSIONS_PLUGIN );
	} );

	test.beforeEach( async ( { page, requestUtils } ) => {
		await Promise.all( [
			requestUtils.deleteAllMenus(),
			requestUtils.deleteAllUsers(),
		] );
		await requestUtils.createUser( {
			username: SITE_EDITOR_USER,
			email: `${ SITE_EDITOR_USER }@example.com`,
			password: SITE_EDITOR_USER_PASSWORD,
			roles: [ READ_ONLY_NAVIGATION_ROLE ],
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
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await Promise.all( [
			requestUtils.deleteAllMenus(),
			requestUtils.deleteAllUsers(),
		] );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deactivatePlugin( PERMISSIONS_PLUGIN );
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test( 'hides the Navigation item from the sidebar', async ( {
		admin,
		page,
	} ) => {
		await admin.visitSiteEditor();

		// Wait for the sidebar before checking an item is missing from it.
		await expect(
			page.getByRole( SIDEBAR_ITEM_ROLE, {
				name: 'Patterns',
				exact: true,
			} )
		).toBeVisible();
		await expect(
			page.getByRole( SIDEBAR_ITEM_ROLE, {
				name: 'Navigation',
				exact: true,
			} )
		).toHaveCount( 0 );
	} );

	test( 'explains why the Navigation screen has no menus when visited directly', async ( {
		admin,
		page,
		requestUtils,
	} ) => {
		await requestUtils.createNavigationMenu( {
			title: MENU_TITLE,
			content:
				'<!-- wp:navigation-link {"label":"Permissions menu link","type":"custom","url":"#permissions-menu-link","kind":"custom"} /-->',
		} );

		// Listing drafts needs permission to edit Navigation Menus, so the
		// screen must not request them.
		const failedDraftMenuRequests: { status: number; url: string }[] = [];
		page.on( 'response', ( response ) => {
			const url = decodeURIComponent( response.url() );
			if (
				url.includes( '/wp/v2/navigation' ) &&
				url.includes( 'draft' ) &&
				! response.ok()
			) {
				failedDraftMenuRequests.push( {
					status: response.status(),
					url,
				} );
			}
		} );

		await admin.visitSiteEditor( { path: '/navigation' } );

		await expect( page.getByText( PERMISSION_MESSAGE ) ).toBeVisible();
		await expect(
			page.getByText( 'No Navigation Menus found.' )
		).toHaveCount( 0 );
		await expect( page.getByText( MENU_TITLE ) ).toHaveCount( 0 );
		await expect(
			page.getByRole( 'button', { name: 'Add New' } )
		).toHaveCount( 0 );

		expect( failedDraftMenuRequests ).toEqual( [] );
	} );

	test( 'explains why a Navigation Menu cannot be managed when its screen is visited directly', async ( {
		admin,
		page,
		requestUtils,
	} ) => {
		const menu = await requestUtils.createNavigationMenu( {
			title: MENU_TITLE,
			content:
				'<!-- wp:navigation-link {"label":"Permissions menu link","type":"custom","url":"#permissions-menu-link","kind":"custom"} /-->',
		} );

		// The extensible site editor redirects to the Navigation list, which
		// shows the same message as the classic site editor's menu screen.
		// `visitSiteEditor` would wait for the menu's editor, which the
		// redirect never loads, so visit the route directly.
		if ( isSiteEditorV2 ) {
			await admin.visitAdminPage(
				'admin.php',
				`page=site-editor-v2&p=${ encodeURIComponent(
					`/navigation/edit/${ menu.id }`
				) }`
			);
		} else {
			await admin.visitSiteEditor( {
				postId: menu.id,
				postType: 'wp_navigation',
			} );
		}

		await expect( page.getByText( PERMISSION_MESSAGE ) ).toBeVisible();
		await expect(
			page.getByText( 'Navigation Menu missing.' )
		).toHaveCount( 0 );
		await expect(
			page.getByRole( 'heading', { name: MENU_TITLE } )
		).toHaveCount( 0 );
		await expect(
			page.getByRole( 'button', { name: 'Actions' } )
		).toHaveCount( 0 );
	} );
} );
