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

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllTemplates( 'wp_template' );
		await requestUtils.deleteAllTemplates( 'wp_template_part' );
		await requestUtils.deleteAllPages();
		await requestUtils.deleteAllMenus();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
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
				.filter( { hasText: 'Back' } )
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

		test( 'As a user I want a navigation block inserted into an overlay to keep the flex layout so block spacing applies', async ( {
			admin,
			editor,
			page,
			requestUtils,
		} ) => {
			await createNavigationOverlay( {
				admin,
				editor,
				page,
				requestUtils,
			} );

			await editor.insertBlock( { name: 'core/navigation' } );

			await expect
				.poll( () =>
					page.evaluate(
						() =>
							window.wp.data
								.select( 'core/block-editor' )
								.getSelectedBlock()?.attributes.layout
					)
				)
				.toMatchObject( { type: 'flex', orientation: 'vertical' } );
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
				.filter( { hasText: 'Back' } )
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
				.filter( { hasText: 'Back' } )
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

		test( 'As a user I want to set a hover color on the close button and see it on the frontend', async ( {
			editor,
			page,
		} ) => {
			// A new overlay already has a close button.
			await editor.selectBlocks(
				editor.canvas.locator(
					'[data-type="core/navigation-overlay-close"]'
				)
			);
			await editor.openDocumentSettingsSidebar();

			const settings = page.getByRole( 'region', {
				name: 'Editor settings',
			} );

			await settings
				.getByRole( 'button', { name: 'State: Default' } )
				.click();
			await page
				.getByRole( 'menuitemradio', { name: 'Hover', exact: true } )
				.click();
			await page.keyboard.press( 'Escape' );

			// While a state is selected, the inspector shows only the style
			// panels, without tabs.
			await settings
				.locator( '.components-tools-panel' )
				.filter( {
					has: page.getByRole( 'heading', { name: 'Background' } ),
				} )
				.getByRole( 'button', { name: 'Color', exact: true } )
				.click();
			await page
				.getByRole( 'option', { name: 'Luminous vivid orange' } )
				.click();

			// The color is stored for the hover state only.
			const closeBlockStyle = await page.evaluate(
				() =>
					window.wp.data
						.select( 'core/block-editor' )
						.getSelectedBlock().attributes.style
			);
			expect( closeBlockStyle?.[ ':hover' ]?.color?.background ).toBe(
				'var:preset|color|luminous-vivid-orange'
			);
			expect( closeBlockStyle?.color ).toBeUndefined();

			await page
				.getByRole( 'region', { name: 'Editor top bar' } )
				.getByRole( 'button', { name: 'Back', exact: true } )
				.filter( { hasText: 'Back' } )
				.click();

			await editor.saveSiteEditorEntities();

			await page.goto( '/' );

			await page.getByRole( 'button', { name: 'Open menu' } ).click();

			const closeButton = page.getByRole( 'button', { name: 'Close' } );
			await expect( closeButton ).toHaveCSS(
				'background-color',
				'rgba(0, 0, 0, 0)'
			);

			await closeButton.hover();
			await expect( closeButton ).toHaveCSS(
				'background-color',
				'rgb(255, 105, 0)'
			);
		} );

		test( 'As a site builder, I want to insert a core navigation overlay pattern with CTA and see it on the frontend', async ( {
			page,
			editor,
		} ) => {
			await page.getByRole( 'tab', { name: 'Template Part' } ).click();

			const designTab = page.getByRole( 'button', {
				name: 'Design',
			} );
			await expect( designTab ).toBeVisible();

			await expect( page.getByRole( 'option' ).first() ).toBeVisible();

			const ctaPattern = page.getByRole( 'option', {
				name: /Overlay with site info and CTA/i,
			} );
			await expect( ctaPattern ).toBeVisible();
			await ctaPattern.click();

			const siteTitleBlock = editor.canvas.getByRole( 'document', {
				name: /Block: Site Title/i,
			} );
			await expect( siteTitleBlock ).toBeVisible();

			await page
				.getByRole( 'region', { name: 'Editor top bar' } )
				.getByRole( 'button', { name: 'Back', exact: true } )
				.filter( { hasText: 'Back' } )
				.click();

			await editor.saveSiteEditorEntities();

			await page.goto( '/' );

			const openMenuButton = page.getByRole( 'button', {
				name: 'Open menu',
			} );
			await openMenuButton.click();

			const ctaButton = page.getByText( 'Get started today!' );
			await expect( ctaButton ).toBeVisible();
		} );
	} );
} );
