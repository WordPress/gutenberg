/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

const createNavigationOverlay = async ( {
	admin,
	editor,
	page,
	requestUtils,
	menuContent = `
		<!-- wp:navigation-link {"label":"Link 1","type":"custom","url":"http://www.wordpress.org/"} /-->
	`,
} ) => {
	await requestUtils.createNavigationMenu( {
		title: 'Test Menu',
		content: menuContent,
	} );

	await admin.visitSiteEditor( {
		postId: 'emptytheme//header',
		postType: 'wp_template_part',
		canvas: 'edit',
	} );

	await editor.insertBlock( {
		name: 'core/navigation',
		attributes: { overlayMenu: 'always' },
	} );

	const navigationBlock = editor.canvas
		.locator( '[data-type="core/navigation"]' )
		.last();
	await editor.selectBlocks( navigationBlock );

	await editor.openDocumentSettingsSidebar();

	const settingsTab = page.getByRole( 'tab', {
		name: 'Settings',
	} );
	await settingsTab.click();

	const createOverlayButton = page.getByRole( 'button', {
		name: 'Create overlay',
		exact: true,
	} );
	await createOverlayButton.click();

	await expect(
		page.locator( 'h1' ).filter( { hasText: 'Navigation Overlay' } )
	).toBeVisible( { timeout: 10000 } );
};

test.describe( 'Navigation Overlay Template Part', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllTemplates( 'wp_template' );
		await requestUtils.deleteAllTemplates( 'wp_template_part' );
		await requestUtils.deleteAllPages();
		await requestUtils.deleteAllMenus();
	} );

	test.describe( 'Creation', () => {
		test( 'As a user I want to be able to create a navigation overlay for a specific navigation block', async ( {
			admin,
			editor,
			page,
			pageUtils,
			requestUtils,
		} ) => {
			await createNavigationOverlay( {
				admin,
				editor,
				page,
				requestUtils,
				menuContent: `
					<!-- wp:navigation-link {"label":"Item 1","type":"custom","url":"http://www.wordpress.org/"} /-->
					<!-- wp:navigation-link {"label":"Item 2","type":"custom","url":"http://www.wordpress.org/"} /-->
				`,
			} );

			await page
				.getByRole( 'button', { name: 'Back', exact: true } )
				.click();

			await editor.saveSiteEditorEntities();

			await page.goto( '/' );

			const overlayMenuItem = page.getByRole( 'link', {
				name: 'Item 1',
			} );
			const openMenuButton = page.getByRole( 'button', {
				name: 'Open menu',
			} );

			await expect( overlayMenuItem ).toBeHidden();
			await openMenuButton.click();
			await expect( overlayMenuItem ).toBeVisible();

			await pageUtils.pressKeys( 'Escape' );
			await expect( overlayMenuItem ).toBeHidden();
			await expect( openMenuButton ).toBeFocused();
		} );
	} );

	test.describe( 'Customization', () => {
		test.beforeEach( async ( { admin, editor, page, requestUtils } ) => {
			await createNavigationOverlay( {
				admin,
				editor,
				page,
				requestUtils,
			} );
		} );

		test( 'As a user I want to be able to customize the navigation overlay with styled content', async ( {
			editor,
			page,
		} ) => {
			await editor.insertBlock(
				{
					name: 'core/heading',
					attributes: {
						content: 'Custom Overlay Heading',
						style: {
							color: {
								text: '#ff0000',
								background: '#0000ff',
							},
						},
					},
				},
				{ index: 0 }
			);

			await page
				.getByRole( 'region', { name: 'Editor top bar' } )
				.getByRole( 'button', { name: 'Back', exact: true } )
				.click();

			await editor.saveSiteEditorEntities();

			await page.goto( '/' );

			const openMenuButton = page.getByRole( 'button', {
				name: 'Open menu',
			} );
			await openMenuButton.click();

			const customHeading = page.getByRole( 'heading', {
				name: 'Custom Overlay Heading',
			} );
			await expect( customHeading ).toBeVisible();

			await expect( customHeading ).toHaveCSS(
				'color',
				'rgb(255, 0, 0)'
			);
			await expect( customHeading ).toHaveCSS(
				'background-color',
				'rgb(0, 0, 255)'
			);
		} );

		test( 'As a user I want to be able to add multiple close buttons so that users can close the overlay from different positions', async ( {
			editor,
			page,
		} ) => {
			await editor.insertBlock(
				{
					name: 'core/navigation-overlay-close',
				},
				{ index: 0 }
			);

			await page
				.getByRole( 'region', { name: 'Editor top bar' } )
				.getByRole( 'button', { name: 'Back', exact: true } )
				.click();

			await editor.saveSiteEditorEntities();

			await page.goto( '/' );

			const openMenuButton = page.getByRole( 'button', {
				name: 'Open menu',
			} );
			await openMenuButton.click();

			const closeButtons = page.getByRole( 'button', {
				name: 'Close',
			} );
			await expect( closeButtons ).toHaveCount( 2 );

			await closeButtons.first().click();
			await expect( openMenuButton ).toBeVisible();

			await openMenuButton.click();
			await closeButtons.last().click();
			await expect( openMenuButton ).toBeVisible();
		} );
	} );
} );
