const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Navigation sidebar - list view editing', () => {
	const navMenuFixture = {
		title: 'Test Navigation Menu',
		content:
			'<!-- wp:navigation-link {"label":"Existing Item","type":"custom","url":"http://www.wordpress.org/","kind":"custom"} /-->',
	};

	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
		await requestUtils.createPage( {
			title: 'Test Page 1',
			status: 'publish',
		} );
		await requestUtils.createPage( {
			title: 'Test Page 2',
			status: 'publish',
		} );
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllMenus();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await Promise.all( [
			requestUtils.deleteAllPages(),
			requestUtils.activateTheme( 'twentytwentyone' ),
		] );
	} );

	test.use( {
		linkControl: async ( { page }, use ) => {
			await use( new LinkControl( { page } ) );
		},
	} );

	test( 'can use appender in site editor sidebar list view', async ( {
		admin,
		page,
		requestUtils,
		linkControl,
	} ) => {
		const createdMenu =
			await requestUtils.createNavigationMenu( navMenuFixture );

		// Visit the site editor in sidebar-browse mode (without canvas: 'edit')
		// so that the sidebar shows the navigation menu's list view.
		await admin.visitSiteEditor( {
			postId: createdMenu?.id,
			postType: 'wp_navigation',
		} );

		const listView = page.getByRole( 'treegrid', {
			name: 'Block navigation structure',
		} );

		await expect( listView ).toBeVisible();

		// Verify the existing item is shown in the sidebar list view.
		await expect(
			listView.getByRole( 'link', { name: 'Existing Item' } )
		).toBeVisible();

		// The appender button should be present to allow adding new items.
		const appender = listView.getByRole( 'button', { name: 'Add page' } );
		await expect( appender ).toBeVisible();

		const linkControlSearch = linkControl.getLinkControlSearch();

		await test.step( 'can add new menu items', async () => {
			await appender.click();

			// The LinkUI popover should open and immediately focus the search input.
			await expect( linkControlSearch ).toBeFocused();

			// Search for and select the page.
			await linkControl.useLinkControlSearch( 'Test Page 2' );

			// The new item should be appended after the existing item.
			await expect(
				listView.getByRole( 'link', { name: 'Test Page 2' } )
			).toBeVisible();
		} );

		await test.step( 'can open and close the Link UI without losing focus', async () => {
			await page.keyboard.press( 'ArrowDown' );
			await expect( appender ).toBeFocused();
			await page.keyboard.press( 'Enter' );
			await expect( linkControlSearch ).toBeFocused();
			await page.keyboard.press( 'Escape' );
			await expect( linkControlSearch ).toBeHidden();
		} );

		await test.step( 'can create a new page', async () => {
			await appender.click();

			// The search input should be focused immediately.
			await expect( linkControl.getLinkControlSearch() ).toBeFocused();

			// Type a new page title that doesn't exist yet.
			await page.keyboard.type( 'Brand New Page', { delay: 50 } );

			// Tab twice to reach the "Create page" button.
			await page.keyboard.press( 'Tab' );
			await page.keyboard.press( 'Tab' );

			const createPageButton = page.getByRole( 'button', {
				name: 'Create page',
			} );
			await expect( createPageButton ).toBeVisible();
			await expect( createPageButton ).toBeFocused();

			// Open the page creation form.
			await page.keyboard.press( 'Enter' );

			// The title field should be pre-populated with the typed text.
			const titleField = page.getByRole( 'textbox', { name: 'Title' } );
			await expect( titleField ).toHaveValue( 'Brand New Page' );

			// The Back button should be focused after entering the creation form.
			const backButton = page.locator( '.link-ui-page-creator__back' );
			await expect( backButton ).toBeFocused();

			// Tab to the title field.
			await page.keyboard.press( 'Tab' );
			await expect( titleField ).toBeFocused();

			// Tab to the Publish checkbox (on by default).
			await page.keyboard.press( 'Tab' );
			const publishCheckbox = page.getByRole( 'checkbox', {
				name: 'Publish',
			} );
			await expect( publishCheckbox ).toBeFocused();
			await expect( publishCheckbox ).toBeChecked();

			// Tab twice more to reach the Create page button.
			await page.keyboard.press( 'Tab' );
			await page.keyboard.press( 'Tab' );
			await expect( createPageButton ).toBeFocused();
			await page.keyboard.press( 'Enter' );

			// The newly created page should appear as a new item in the list view.
			await expect(
				listView.getByRole( 'link', { name: 'Brand New Page' } )
			).toBeVisible();
		} );
	} );

	test( 'does not select blocks in the canvas preview when editing from the sidebar', async ( {
		admin,
		page,
		requestUtils,
		linkControl,
	} ) => {
		const createdMenu =
			await requestUtils.createNavigationMenu( navMenuFixture );

		await admin.visitSiteEditor( {
			postId: createdMenu?.id,
			postType: 'wp_navigation',
		} );

		const listView = page.getByRole( 'treegrid', {
			name: 'Block navigation structure',
		} );
		const canvas = page.frameLocator( 'iframe[name="editor-canvas"]' );
		const blockToolbar = page.getByRole( 'toolbar', {
			name: 'Block tools',
		} );

		await expect( canvas.getByText( 'Existing Item' ) ).toBeVisible();

		// Select an item, then add a new one from the appender. The edit is
		// what carries the sidebar's selection over to the entity.
		await listView.getByRole( 'link', { name: 'Existing Item' } ).click();
		// The click opens the item's settings a moment later, and they move
		// focus after they open. Wait for that focus, so the settings can't
		// take focus from the appender.
		await expect(
			page.getByRole( 'button', { name: 'Settings options' } )
		).toBeFocused();
		await listView.getByRole( 'button', { name: 'Add page' } ).click();
		await linkControl.useLinkControlSearch( 'Test Page 2' );
		await expect(
			listView.getByRole( 'link', { name: 'Test Page 2' } )
		).toBeVisible();

		// The preview picks up the change without adopting the selection.
		await expect( canvas.getByText( 'Test Page 2' ) ).toBeVisible();
		await expect( blockToolbar ).toBeHidden();
		expect(
			await page.evaluate( () =>
				window.wp.data
					.select( 'core/block-editor' )
					.getSelectedBlockClientId()
			)
		).toBeNull();
	} );

	test( 'can edit links from the settings popover', async ( {
		admin,
		page,
		requestUtils,
		linkControl,
	} ) => {
		const createdMenu = await requestUtils.createNavigationMenu( {
			title: 'Test Navigation Menu',
			content:
				'<!-- wp:navigation-link {"label":"Existing Item","type":"custom","url":"http://www.wordpress.org/","kind":"custom"} /-->' +
				'<!-- wp:navigation-submenu {"label":"Submenu Item","type":"custom","url":"http://www.wordpress.org/submenu/","kind":"custom"} -->' +
				'<!-- wp:navigation-link {"label":"Child Item","type":"custom","url":"http://www.wordpress.org/child/","kind":"custom"} /-->' +
				'<!-- /wp:navigation-submenu -->' +
				'<!-- wp:navigation-link {"label":"No URL"} /-->',
		} );

		await admin.visitSiteEditor( {
			postId: createdMenu?.id,
			postType: 'wp_navigation',
		} );

		const listView = page.getByRole( 'treegrid', {
			name: 'Block navigation structure',
		} );
		const labelInput = page.getByRole( 'textbox', { name: 'Text' } );

		await test.step( 'opens when selecting a link', async () => {
			await listView
				.getByRole( 'link', { name: 'Existing Item' } )
				.click();

			await expect(
				page.getByRole( 'heading', { name: 'Settings' } )
			).toBeVisible();
			await expect( labelInput ).toHaveValue( 'Existing Item' );
			await expect(
				page.getByRole( 'checkbox', { name: 'Open in new tab' } )
			).toBeVisible();
			await expect(
				page.getByRole( 'link', { name: 'View' } )
			).toBeVisible();
			// Matches the content-only popover: less common fields are
			// available from the panel menu rather than shown by default.
			await expect(
				page.getByRole( 'textbox', { name: 'Description' } )
			).toBeHidden();
			await expect(
				page.getByRole( 'textbox', { name: 'Rel attribute' } )
			).toBeHidden();
		} );

		await test.step( 'edits the link label', async () => {
			await labelInput.fill( 'Changed Label' );

			await expect(
				listView.getByRole( 'link', { name: 'Changed Label' } )
			).toBeVisible();
			await expect(
				listView.getByRole( 'link', { name: 'Existing Item' } )
			).toBeHidden();
		} );

		await test.step( 'closes with Escape and returns focus to the item', async () => {
			await labelInput.focus();
			await page.keyboard.press( 'Escape' );

			await expect( labelInput ).toBeHidden();
			await expect(
				listView.getByRole( 'link', { name: 'Changed Label' } )
			).toBeFocused();
		} );

		await test.step( 'opens with Enter from the keyboard', async () => {
			// Focus is on the edited item's row after Escape.
			await page.keyboard.press( 'ArrowDown' );
			await expect(
				listView.getByRole( 'link', { name: 'Submenu Item' } )
			).toBeFocused();
			await page.keyboard.press( 'Enter' );

			await expect( labelInput ).toHaveValue( 'Submenu Item' );
		} );

		await test.step( 'edits a submenu label', async () => {
			await labelInput.fill( 'Changed Submenu' );

			await expect(
				listView.getByRole( 'link', { name: 'Changed Submenu' } )
			).toBeVisible();
		} );

		await test.step( 'switches to another item while the popover is open', async () => {
			// Hold the click as a person does. The popover's focus-outside check
			// runs between mouse down and up, before the row's click opens the
			// popover for the new item. An instant click would run it afterward.
			await listView
				.getByRole( 'link', { name: 'No URL' } )
				.click( { delay: 100 } );

			await expect( labelInput ).toHaveValue( 'No URL' );
		} );

		await test.step( 'adds a link to an item that has no URL', async () => {
			// The item is kept; the popover offers to add its link.
			await expect(
				listView.getByRole( 'link', { name: 'No URL' } )
			).toBeVisible();
			const linkPicker = page.getByRole( 'button', {
				name: /^Link to/,
			} );
			await expect( linkPicker ).toHaveText( /Add link/ );
			await linkPicker.click();
			await linkControl.useLinkControlSearch( 'Test Page 1' );

			// The item keeps its label and gains the link.
			await expect( linkPicker ).toHaveText( /Test Page 1/ );
			await expect(
				listView.getByRole( 'link', { name: 'No URL' } )
			).toBeVisible();
		} );
	} );

	test( 'shows the appender for an empty menu', async ( {
		admin,
		page,
		requestUtils,
	} ) => {
		const createdMenu = await requestUtils.createNavigationMenu( {
			title: 'Empty Navigation Menu',
			content: '',
		} );

		await admin.visitSiteEditor( {
			postId: createdMenu?.id,
			postType: 'wp_navigation',
		} );

		const listView = page.getByRole( 'treegrid', {
			name: 'Block navigation structure',
		} );

		await expect(
			page.getByText( 'This Navigation Menu is empty.' )
		).toBeVisible();
		await expect(
			listView.getByRole( 'button', { name: 'Add page' } )
		).toBeVisible();
	} );

	test( 'can add the first item to an empty menu', async ( {
		admin,
		page,
		requestUtils,
		linkControl,
	} ) => {
		const createdMenu = await requestUtils.createNavigationMenu( {
			title: 'Empty Navigation Menu',
			content: '',
		} );

		await admin.visitSiteEditor( {
			postId: createdMenu?.id,
			postType: 'wp_navigation',
		} );

		const listView = page.getByRole( 'treegrid', {
			name: 'Block navigation structure',
		} );

		await listView.getByRole( 'button', { name: 'Add page' } ).click();
		await linkControl.useLinkControlSearch( 'Test Page 1' );

		await expect(
			listView.getByRole( 'link', { name: 'Test Page 1' } )
		).toBeVisible();
		await expect(
			page.getByText( 'This Navigation Menu is empty.' )
		).toBeHidden();
	} );

	test( 'lists the pages of a Page List block', async ( {
		admin,
		page,
		requestUtils,
	} ) => {
		const createdMenu = await requestUtils.createNavigationMenu( {
			title: 'Page List Menu',
			content: '<!-- wp:page-list /-->',
		} );

		await admin.visitSiteEditor( {
			postId: createdMenu?.id,
			postType: 'wp_navigation',
		} );

		const listView = page.getByRole( 'treegrid', {
			name: 'Block navigation structure',
		} );

		await expect(
			listView.getByRole( 'row', { name: 'Test Page 1' } )
		).toBeVisible();
		await expect(
			listView.getByRole( 'row', { name: 'Test Page 2' } )
		).toBeVisible();
	} );

	test( 'can add submenu links from the Options menu', async ( {
		admin,
		page,
		requestUtils,
		linkControl,
	} ) => {
		const createdMenu = await requestUtils.createNavigationMenu( {
			title: 'Add Submenu Menu',
			content:
				'<!-- wp:navigation-link {"label":"Existing Item","type":"custom","url":"https://wordpress.org/1","kind":"custom"} /-->',
		} );

		await admin.visitSiteEditor( {
			postId: createdMenu?.id,
			postType: 'wp_navigation',
		} );

		const listView = page.getByRole( 'treegrid', {
			name: 'Block navigation structure',
		} );
		const row = listView.getByRole( 'row', { name: 'Existing Item' } );

		await test.step( 'a link becomes a submenu holding the new link', async () => {
			await row.hover();
			await row.getByRole( 'button', { name: 'Options' } ).click();
			await page
				.getByRole( 'menuitem', { name: 'Add submenu link' } )
				.click();
			await linkControl.useLinkControlSearch( 'Test Page 1' );
			await expect(
				listView
					.getByRole( 'gridcell', { name: 'Test Page 1' } )
					.filter( { hasText: 'Block 1 of 1, Level 2.' } )
			).toBeVisible();
		} );

		await test.step( 'a submenu gets the new link at its end', async () => {
			await row.hover();
			await row.getByRole( 'button', { name: 'Options' } ).click();
			await page
				.getByRole( 'menuitem', { name: 'Add submenu link' } )
				.click();
			await linkControl.useLinkControlSearch( 'Test Page 2' );
			await expect(
				listView
					.getByRole( 'gridcell', { name: 'Test Page 2' } )
					.filter( { hasText: 'Block 2 of 2, Level 2.' } )
			).toBeVisible();
		} );
	} );

	test( "returns focus to the item's Options after adding a submenu link", async ( {
		admin,
		page,
		requestUtils,
		linkControl,
	} ) => {
		const createdMenu = await requestUtils.createNavigationMenu( {
			title: 'Focus Return Menu',
			content:
				'<!-- wp:navigation-link {"label":"Existing Item","type":"custom","url":"https://wordpress.org/1","kind":"custom"} /-->',
		} );

		await admin.visitSiteEditor( {
			postId: createdMenu?.id,
			postType: 'wp_navigation',
		} );

		const listView = page.getByRole( 'treegrid', {
			name: 'Block navigation structure',
		} );
		const row = listView.getByRole( 'row', { name: 'Existing Item' } );
		const optionsButton = row.getByRole( 'button', { name: 'Options' } );
		const addSubmenuLink = page.getByRole( 'menuitem', {
			name: 'Add submenu link',
		} );

		await test.step( 'when the link search is dismissed', async () => {
			await row.hover();
			await optionsButton.click();
			await addSubmenuLink.click();
			await expect( linkControl.getLinkControlSearch() ).toBeFocused();
			await page.keyboard.press( 'Escape' );
			await expect( optionsButton ).toBeFocused();
		} );

		await test.step( 'when a link is chosen', async () => {
			await page.keyboard.press( 'Enter' );
			await addSubmenuLink.click();
			await linkControl.useLinkControlSearch( 'Test Page 1' );
			await expect(
				listView
					.getByRole( 'gridcell', { name: 'Test Page 1' } )
					.filter( { hasText: 'Block 1 of 1, Level 2.' } )
			).toBeVisible();
			await expect( optionsButton ).toBeFocused();
		} );
	} );

	test( 'adds items to the end of a submenu from the + in its row, and offers none on a link', async ( {
		admin,
		page,
		requestUtils,
		linkControl,
	} ) => {
		const createdMenu = await requestUtils.createNavigationMenu( {
			title: 'Row Appender Menu',
			content:
				'<!-- wp:navigation-link {"label":"Existing Item","type":"custom","url":"https://wordpress.org/1","kind":"custom"} /-->' +
				'<!-- wp:navigation-submenu {"label":"Existing Submenu","type":"custom","url":"https://wordpress.org/2","kind":"custom"} -->' +
				'<!-- wp:navigation-link {"label":"Submenu Item","type":"custom","url":"https://wordpress.org/sub","kind":"custom"} /-->' +
				'<!-- /wp:navigation-submenu -->',
		} );

		await admin.visitSiteEditor( {
			postId: createdMenu?.id,
			postType: 'wp_navigation',
		} );

		const listView = page.getByRole( 'treegrid', {
			name: 'Block navigation structure',
		} );
		await expect(
			listView.getByRole( 'row', { name: 'Existing Item' } )
		).toBeVisible();

		const submenuRow = listView.getByRole( 'row', {
			name: 'Existing Submenu',
		} );
		await submenuRow
			.getByRole( 'button', { name: 'Add to Existing Submenu' } )
			.click();
		await linkControl.useLinkControlSearch( 'Test Page 1' );
		await expect(
			listView
				.getByRole( 'gridcell', { name: 'Test Page 1' } )
				.filter( { hasText: 'Block 2 of 2, Level 2.' } )
		).toBeVisible();

		for ( const name of [
			'Existing Item',
			'Submenu Item',
			'Test Page 1',
		] ) {
			await expect(
				listView
					.getByRole( 'row', { name } )
					.getByRole( 'button', { name: /^Add to / } )
			).toHaveCount( 0 );
		}
	} );

	test( 'adds an item to an empty submenu from the + in its row', async ( {
		admin,
		page,
		requestUtils,
		linkControl,
	} ) => {
		const createdMenu = await requestUtils.createNavigationMenu( {
			title: 'Empty Submenu Menu',
			content:
				'<!-- wp:navigation-link {"label":"Existing Item","type":"custom","url":"https://wordpress.org/1","kind":"custom"} /-->' +
				'<!-- wp:navigation-submenu {"label":"Empty Submenu","type":"custom","url":"https://wordpress.org/2","kind":"custom"} /-->',
		} );

		await admin.visitSiteEditor( {
			postId: createdMenu?.id,
			postType: 'wp_navigation',
		} );

		const listView = page.getByRole( 'treegrid', {
			name: 'Block navigation structure',
		} );
		const addButton = listView
			.getByRole( 'row', { name: 'Empty Submenu' } )
			.getByRole( 'button', { name: 'Add to Empty Submenu' } );

		await expect( addButton ).toBeVisible();
		await addButton.click();
		await linkControl.useLinkControlSearch( 'Test Page 1' );
		await expect(
			listView
				.getByRole( 'gridcell', { name: 'Test Page 1' } )
				.filter( { hasText: 'Block 1 of 1, Level 2.' } )
		).toBeVisible();
	} );

	test( 'offers no + inside a Page List, whose pages cannot be added to', async ( {
		admin,
		page,
		requestUtils,
	} ) => {
		const parentPage = await requestUtils.createPage( {
			title: 'Parent Page',
			status: 'publish',
		} );
		await requestUtils.createPage( {
			title: 'Child Page',
			status: 'publish',
			parent: parentPage.id,
		} );
		const createdMenu = await requestUtils.createNavigationMenu( {
			title: 'Page List Menu',
			content:
				'<!-- wp:page-list /-->' +
				'<!-- wp:navigation-link {"label":"Existing Item","type":"custom","url":"https://wordpress.org/1","kind":"custom"} /-->',
		} );

		await admin.visitSiteEditor( {
			postId: createdMenu?.id,
			postType: 'wp_navigation',
		} );

		const listView = page.getByRole( 'treegrid', {
			name: 'Block navigation structure',
		} );
		await expect(
			listView.getByRole( 'row', { name: 'Child Page' } )
		).toBeVisible();
		await expect(
			listView.getByRole( 'button', { name: /^Add to / } )
		).toHaveCount( 0 );
	} );
} );

class LinkControl {
	constructor( { page } ) {
		this.page = page;
	}

	getLinkControlSearch() {
		return this.page.getByRole( 'combobox', {
			name: 'Search or type URL',
		} );
	}

	async useLinkControlSearch( searchTerm ) {
		await expect( this.getLinkControlSearch() ).toBeFocused();

		await this.page.keyboard.type( searchTerm, { delay: 50 } );

		const searchResults = this.page.getByRole( 'listbox', {
			name: 'Search results',
		} );
		await expect( searchResults ).toBeVisible();

		// Click the matching result directly rather than pressing ArrowDown +
		// Enter. The search is debounced, so the top result can still be a
		// stale suggestion when the list first appears, and Enter would
		// select it.
		await searchResults.getByRole( 'option', { name: searchTerm } ).click();
	}
}
