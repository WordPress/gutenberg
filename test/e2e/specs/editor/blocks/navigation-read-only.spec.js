/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

const EDITOR_USERNAME = 'navigation-read-only-editor';
const EDITOR_PASSWORD = 'password';

test.describe( 'Navigation block for a default Editor without Navigation Menu write capabilities', () => {
	test.use( { storageState: { cookies: [], origins: [] } } );

	const resetTestData = async ( requestUtils ) => {
		await requestUtils.deleteAllPosts();
		await requestUtils.deleteAllMenus();
		await requestUtils.deleteAllUsers();
	};

	test.beforeEach( async ( { requestUtils } ) => {
		await resetTestData( requestUtils );
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await resetTestData( requestUtils );
	} );

	test( 'can view and switch published menus while create, update, and delete permissions are false', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		await requestUtils.createUser( {
			username: EDITOR_USERNAME,
			email: `${ EDITOR_USERNAME }@example.com`,
			password: EDITOR_PASSWORD,
			roles: [ 'editor' ],
		} );

		const firstMenu = await requestUtils.createNavigationMenu( {
			title: 'Read-only Menu One',
			content:
				'<!-- wp:navigation-link {"label":"First menu link","type":"custom","url":"#first-menu-link","kind":"custom"} /-->',
		} );
		const secondMenu = await requestUtils.createNavigationMenu( {
			title: 'Read-only Menu Two',
			content:
				'<!-- wp:navigation-link {"label":"Second menu link","type":"custom","url":"#second-menu-link","kind":"custom"} /-->',
		} );
		const post = await requestUtils.createPost( {
			title: 'Read-only Navigation Menu test',
			content: `<!-- wp:navigation {"ref":${ firstMenu.id }} /-->`,
			status: 'publish',
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
			.fill( EDITOR_USERNAME );
		await page
			.getByRole( 'textbox', { name: 'Password' } )
			.fill( EDITOR_PASSWORD );
		await page.getByRole( 'button', { name: 'Log In' } ).click();
		await page.waitForURL( /wp-admin/ );

		await admin.editPost( post.id );
		await expect
			.poll( () =>
				page.evaluate( async ( menuId ) => {
					const entity = {
						kind: 'postType',
						name: 'wp_navigation',
					};
					const { canUser } = window.wp.data.resolveSelect( 'core' );

					return {
						create: await canUser( 'create', entity ),
						update: await canUser( 'update', {
							...entity,
							id: menuId,
						} ),
						delete: await canUser( 'delete', {
							...entity,
							id: menuId,
						} ),
					};
				}, firstMenu.id )
			)
			.toEqual( { create: false, update: false, delete: false } );

		const navigationBlock = editor.canvas.getByRole( 'document', {
			name: 'Block: Navigation',
		} );
		await expect(
			navigationBlock.getByRole( 'link', { name: 'First menu link' } )
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
			.getByRole( 'button', { name: 'Read-only Menu One' } )
			.click();
		await expect(
			page.getByRole( 'group', { name: 'Tools' } )
		).toBeVisible();
		await expect(
			page.getByRole( 'menuitem', { name: 'Create new Menu' } )
		).toHaveAttribute( 'aria-disabled', 'true' );
		await page
			.getByRole( 'menuitemradio', {
				name: 'Read-only Menu Two',
			} )
			.click();

		await expect(
			navigationBlock.getByRole( 'link', { name: 'Second menu link' } )
		).toBeVisible();
		await expect(
			navigationBlock.getByRole( 'link', { name: 'First menu link' } )
		).toHaveCount( 0 );

		await navigationBlock.click();
		await page
			.getByRole( 'toolbar', { name: 'Block tools' } )
			.getByRole( 'button', { name: 'Change items justification' } )
			.click();
		await page
			.getByRole( 'menuitem', { name: 'Justify items right' } )
			.click();

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/navigation',
				attributes: {
					ref: secondMenu.id,
					layout: { justifyContent: 'right' },
				},
			},
		] );

		const saveButton = page
			.getByRole( 'region', { name: 'Editor top bar' } )
			.getByRole( 'button', { name: 'Save', exact: true } );
		await saveButton.click();
		await page
			.getByRole( 'button', { name: 'Dismiss this notice' } )
			.filter( { hasText: 'updated' } )
			.waitFor();

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
