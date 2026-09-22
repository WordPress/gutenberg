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

	test.describe( 'Submenus', () => {
		// Submenus in a custom overlay are collapsible, so an expanded one has
		// to make room for itself instead of being painted over the items that
		// follow it. See https://github.com/WordPress/gutenberg/issues/83319.
		test( 'As a visitor I want an expanded submenu to push the items after it down', async ( {
			page,
			requestUtils,
		} ) => {
			const menu = await requestUtils.createNavigationMenu( {
				title: 'Nested menu',
				content: `
					<!-- wp:navigation-submenu {"label":"Parent","type":"custom","url":"#parent"} -->
						<!-- wp:navigation-submenu {"label":"Child 1","type":"custom","url":"#child-1"} -->
							<!-- wp:navigation-link {"label":"Grandchild 1","type":"custom","url":"#grandchild-1"} /-->
							<!-- wp:navigation-link {"label":"Grandchild 2","type":"custom","url":"#grandchild-2"} /-->
						<!-- /wp:navigation-submenu -->
						<!-- wp:navigation-link {"label":"Child 2","type":"custom","url":"#child-2"} /-->
					<!-- /wp:navigation-submenu -->
				`,
			} );

			await requestUtils.rest( {
				method: 'POST',
				path: '/wp/v2/template-parts',
				data: {
					slug: 'nested-submenu-overlay',
					title: 'Nested submenu overlay',
					area: 'navigation-overlay',
					status: 'publish',
					content: `<!-- wp:navigation {"ref":${ menu.id },"submenuVisibility":"click"} /-->`,
				},
			} );

			const post = await requestUtils.createPage( {
				title: 'Overlay submenus',
				status: 'publish',
				content: `<!-- wp:navigation {"ref":${ menu.id },"overlayMenu":"always","overlay":"emptytheme//nested-submenu-overlay"} /-->`,
			} );

			await page.goto( post.link );
			await page.getByRole( 'button', { name: 'Open menu' } ).click();

			const overlay = page.locator(
				'.wp-block-navigation__overlay-container'
			);
			await overlay
				.getByRole( 'button', { name: 'Parent submenu' } )
				.click();
			await overlay
				.getByRole( 'button', { name: 'Child 1 submenu' } )
				.click();

			await expect(
				overlay.getByRole( 'link', { name: 'Grandchild 1' } )
			).toBeVisible();

			// The item after the expanded submenu is still the one painted at
			// its own position, rather than sitting underneath the submenu.
			const covered = await overlay
				.getByRole( 'link', { name: 'Child 2', exact: true } )
				.evaluate( ( el ) => {
					const { x, y, width, height } = el.getBoundingClientRect();
					const topMost = document.elementFromPoint(
						x + width / 2,
						y + height / 2
					);
					return el !== topMost && ! el.contains( topMost );
				} );
			expect( covered ).toBe( false );
		} );
	} );
} );
