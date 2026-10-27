const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

const META_KEY = 'wp_navigation_auto_add_pages';

async function enableShowTemplate( page ) {
	await page
		.getByRole( 'region', { name: 'Editor top bar' } )
		.getByRole( 'button', { name: 'View', exact: true } )
		.click();

	const showTemplateButton = page.getByRole( 'menuitemcheckbox', {
		name: 'Show template',
	} );
	const isChecked = await showTemplateButton.getAttribute( 'aria-checked' );
	if ( isChecked !== 'true' ) {
		await showTemplateButton.click();
	} else {
		await page.keyboard.press( 'Escape' );
	}
}

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

	test( 'a navigation block in the editor shows the new link once the page is published', async ( {
		admin,
		editor,
		requestUtils,
	} ) => {
		const menu = await requestUtils.createNavigationMenu( {
			title: 'Main menu',
			content:
				'<!-- wp:navigation-link {"label":"Home","url":"https://example.com","kind":"custom"} /-->',
			meta: { [ META_KEY ]: true },
		} );

		await admin.createNewPost( {
			postType: 'page',
			title: 'Auto added page',
		} );
		await editor.insertBlock( {
			name: 'core/navigation',
			attributes: { ref: menu.id },
		} );

		const navigationBlock = editor.canvas.getByRole( 'document', {
			name: 'Block: Navigation',
		} );
		await expect( navigationBlock ).toContainText( 'Home' );

		await editor.publishPost();

		// The server appended the link; the block must pick it up without a
		// reload.
		await expect(
			navigationBlock.getByRole( 'document', {
				name: 'Block: Page Link',
			} )
		).toContainText( 'Auto added page', { timeout: 10000 } );
	} );

	test( 'a child page is nested under the link to its parent', async ( {
		admin,
		editor,
		requestUtils,
	} ) => {
		const parent = await requestUtils.createPage( {
			title: 'Parent page',
			status: 'publish',
		} );
		const menu = await requestUtils.createNavigationMenu( {
			title: 'Main menu',
			content: `<!-- wp:navigation-link {"label":"Parent page","type":"page","kind":"post-type","id":${ parent.id },"url":"${ parent.link }"} /-->`,
			meta: { [ META_KEY ]: true },
		} );
		const child = await requestUtils.rest( {
			method: 'POST',
			path: '/wp/v2/pages',
			data: {
				title: 'Child page',
				status: 'draft',
				parent: parent.id,
			},
		} );

		await admin.editPost( child.id );
		await editor.insertBlock( {
			name: 'core/navigation',
			attributes: { ref: menu.id },
		} );

		const navigationBlock = editor.canvas.getByRole( 'document', {
			name: 'Block: Navigation',
		} );
		await expect(
			navigationBlock.getByRole( 'document', {
				name: 'Block: Page Link',
			} )
		).toContainText( 'Parent page' );

		await editor.publishPost();

		// The server turned the parent link into a submenu holding the child;
		// the block must pick it up without a reload.
		const submenu = navigationBlock.getByRole( 'document', {
			name: 'Block: Submenu',
		} );
		await expect( submenu ).toContainText( 'Parent page', {
			timeout: 10000,
		} );

		// The submenu only shows its items while it is being edited, so check
		// the block tree for the child instead.
		const menuBlocks = await editor.getBlocks( {
			clientId: await navigationBlock.getAttribute( 'data-block' ),
		} );
		expect( menuBlocks ).toMatchObject( [
			{
				name: 'core/navigation-submenu',
				attributes: { label: 'Parent page', id: parent.id },
				innerBlocks: [
					{
						name: 'core/navigation-link',
						attributes: { label: 'Child page', id: child.id },
						innerBlocks: [],
					},
				],
			},
		] );
	} );

	test( 'a page created from the navigation appender is not added twice', async ( {
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

		const navigationBlock = editor.canvas.getByRole( 'document', {
			name: 'Block: Navigation',
		} );
		await expect( navigationBlock ).toContainText( 'Home' );

		// Create the page from the appender's link UI, published (the default).
		await navigationBlock.getByLabel( 'Add page' ).first().click();
		await page
			.getByRole( 'combobox', { name: 'Search or type URL' } )
			.fill( 'Created page' );
		await page.getByRole( 'button', { name: 'Create page' } ).click();
		await expect(
			page.getByRole( 'textbox', { name: 'Title' } )
		).toHaveValue( 'Created page' );
		await expect(
			page.getByRole( 'checkbox', { name: 'Publish' } )
		).toBeChecked();
		await page.getByRole( 'button', { name: 'Create page' } ).click();
		await expect(
			page.getByRole( 'link', {
				name: 'Created page (opens in a new tab)',
			} )
		).toBeVisible();
		await page.keyboard.press( 'Escape' );

		const [ createdPage ] = await requestUtils.rest( {
			path: '/wp/v2/pages',
			params: { search: 'Created page', status: 'publish' },
		} );
		expect( createdPage ).toBeDefined();

		// The menu on the server did not link to the page yet when it was
		// published, so the server appended its own link.
		const appendedMenu = await requestUtils.rest( {
			path: `/wp/v2/navigation/${ menu.id }`,
			params: { context: 'edit' },
		} );
		expect( appendedMenu.content.raw ).toContain(
			`"id":${ createdPage.id }`
		);

		// Meanwhile the link UI inserted its own link, so the block holds a
		// pending edit; the refetched menu must not add a second link.
		const pageLinks = navigationBlock.getByRole( 'document', {
			name: 'Block: Page Link',
		} );
		await expect( pageLinks ).toHaveCount( 1 );
		await expect( pageLinks ).toContainText( 'Created page' );
		// Once the refetched menu, with the server-appended link, has reached
		// the store, the block still shows one link.
		await expect
			.poll( () =>
				page.evaluate(
					( id ) =>
						window.wp.data
							.select( 'core' )
							.getEntityRecord( 'postType', 'wp_navigation', id )
							?.content?.raw ?? '',
					menu.id
				)
			)
			.toContain( `"id":${ createdPage.id }` );
		await expect( pageLinks ).toHaveCount( 1 );

		const topBar = page.getByRole( 'region', { name: 'Editor top bar' } );
		await topBar
			.getByRole( 'button', { name: 'Save', exact: true } )
			.click();
		await page
			.getByRole( 'region', { name: 'Editor publish' } )
			.getByRole( 'button', { name: 'Save', exact: true } )
			.click();

		// The Save button goes away once nothing is left to save.
		await expect(
			topBar.getByRole( 'button', { name: 'Save', exact: true } )
		).toBeHidden();

		// The saved menu links to the page once: the editor's link, not the
		// editor's link plus the server's.
		const savedMenu = await requestUtils.rest( {
			path: `/wp/v2/navigation/${ menu.id }`,
			params: { context: 'edit' },
		} );
		expect( savedMenu.content.raw ).toContain( '"label":"Created page"' );
		expect(
			savedMenu.content.raw.match(
				new RegExp( `"id":${ createdPage.id }\\b`, 'g' )
			)
		).toHaveLength( 1 );
	} );

	test( 'turning the setting off is saved with the post', async ( {
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
		await settings.getByRole( 'tab', { name: 'List View' } ).click();

		// The setting follows the menu's items and their appender, so it
		// reads as part of the menu structure rather than as a block setting.
		await expect(
			settings.locator(
				'xpath=.//*[@role="treegrid"]/following::*[@role="switch"]'
			)
		).toHaveAccessibleName( 'Auto add pages' );
		const toggle = settings.getByRole( 'switch', {
			name: 'Auto add pages',
		} );
		await expect( toggle ).toBeChecked();
		await toggle.click();
		await expect( toggle ).not.toBeChecked();

		// The change is a pending edit to the menu, saved with everything
		// else, so the top bar offers to save and the server is untouched.
		const topBar = page.getByRole( 'region', { name: 'Editor top bar' } );
		await expect(
			topBar.getByRole( 'button', { name: 'Save', exact: true } )
		).toBeVisible();
		const pendingMenu = await requestUtils.rest( {
			path: `/wp/v2/navigation/${ menu.id }`,
			params: { context: 'edit' },
		} );
		expect( pendingMenu.meta[ META_KEY ] ).toBe( true );

		await topBar
			.getByRole( 'button', { name: 'Save', exact: true } )
			.click();
		await page
			.getByRole( 'region', { name: 'Editor publish' } )
			.getByRole( 'button', { name: 'Save', exact: true } )
			.click();

		await expect
			.poll( async () => {
				const savedMenu = await requestUtils.rest( {
					path: `/wp/v2/navigation/${ menu.id }`,
					params: { context: 'edit' },
				} );
				return savedMenu.meta[ META_KEY ];
			} )
			.toBe( false );

		const savedMenu = await requestUtils.rest( {
			path: `/wp/v2/navigation/${ menu.id }`,
			params: { context: 'edit' },
		} );

		await requestUtils.createPage( { title: 'Later', status: 'publish' } );
		const unchangedMenu = await requestUtils.rest( {
			path: `/wp/v2/navigation/${ menu.id }`,
			params: { context: 'edit' },
		} );
		expect( unchangedMenu.content.raw ).toBe( savedMenu.content.raw );
	} );

	test.describe( 'with the template shown', () => {
		test.beforeAll( async ( { requestUtils } ) => {
			await requestUtils.activateTheme( 'emptytheme' );
		} );

		test.afterEach( async ( { requestUtils } ) => {
			await Promise.all( [
				requestUtils.deleteAllTemplates( 'wp_template' ),
				requestUtils.deleteAllTemplates( 'wp_template_part' ),
				requestUtils.resetPreferences(),
			] );
		} );

		test.afterAll( async ( { requestUtils } ) => {
			await requestUtils.activateTheme( 'twentytwentyone' );
		} );

		test( 'a navigation block in the header template part shows the new link once the page is published', async ( {
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
			await requestUtils.createTemplate( 'wp_template_part', {
				slug: 'header',
				title: 'Header',
				content: `<!-- wp:navigation {"ref":${ menu.id },"overlayMenu":"off"} /-->`,
			} );
			await requestUtils.createTemplate( 'wp_template', {
				slug: 'singular',
				title: 'Singular',
				content: [
					'<!-- wp:template-part {"slug":"header","tagName":"header","theme":"emptytheme"} /-->',
					'<!-- wp:post-content {"layout":{"inherit":true}} /-->',
				].join( '\n' ),
			} );
			const draft = await requestUtils.createPage( {
				title: 'Auto added page',
				status: 'draft',
			} );

			await admin.editPost( draft.id );
			await enableShowTemplate( page );

			const navigationBlock = editor.canvas
				.getByRole( 'document', { name: 'Block: Header' } )
				.getByRole( 'document', { name: 'Block: Navigation' } );
			await expect( navigationBlock ).toContainText( 'Home' );

			await editor.publishPost();

			await expect(
				navigationBlock.getByRole( 'document', {
					name: 'Block: Page Link',
				} )
			).toContainText( 'Auto added page', { timeout: 10000 } );

			// The preference save is debounced and outlives the page, so clear
			// it in the session too, or a late flush re-enables Show template
			// for later post editor suites under a block theme.
			await page.evaluate( () => {
				window.wp.data
					.dispatch( 'core/preferences' )
					.set( 'core', 'renderingModes', undefined );
			} );
		} );
	} );
} );
