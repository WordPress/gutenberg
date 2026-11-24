const {
	test,
	expect,
	Editor,
} = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Page List block', () => {
	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllPages();
	} );

	test( 'lists the published Privacy Policy page for an editor', async ( {
		admin,
		page,
		browser,
		requestUtils,
	} ) => {
		const privacyPage = await requestUtils.createPage( {
			title: 'Published Privacy Policy',
			status: 'publish',
		} );
		await requestUtils.createPage( {
			title: 'Another published page',
			status: 'publish',
		} );
		await admin.visitAdminPage( 'options-privacy.php' );
		const privacyPageSelect = page.getByRole( 'combobox' );
		const previousPrivacyPage = await privacyPageSelect.inputValue();
		await privacyPageSelect.selectOption( String( privacyPage.id ) );
		await page.getByRole( 'button', { name: 'Use This Page' } ).click();

		const context = await browser.newContext( {
			baseURL: requestUtils.baseURL,
			storageState: { cookies: [], origins: [] },
		} );
		let user;
		try {
			user = await requestUtils.createUser( {
				username: 'pagelisteditor',
				email: 'pagelisteditor@example.com',
				password: 'pagelisteditorpassword',
				roles: [ 'editor' ],
			} );
			const editorPage = await context.newPage();
			await editorPage.goto( '/wp-login.php' );
			await editorPage
				.getByLabel( 'Username or Email Address' )
				.fill( 'pagelisteditor' );
			await editorPage
				.getByLabel( 'Password', { exact: true } )
				.fill( 'pagelisteditorpassword' );
			await editorPage.getByRole( 'button', { name: 'Log In' } ).click();
			await editorPage.waitForURL( '**/wp-admin/**' );
			await editorPage.goto( '/wp-admin/post-new.php' );
			const editor = new Editor( { page: editorPage } );
			await editor.setPreferences( 'core/edit-post', {
				welcomeGuide: false,
			} );
			await editor.insertBlock( { name: 'core/page-list' } );
			const pageList = editor.canvas.getByRole( 'document', {
				name: 'Block: Page List',
				exact: true,
			} );
			await expect(
				pageList.getByText( 'Published Privacy Policy', {
					exact: true,
				} )
			).toBeVisible();
			await expect(
				pageList.getByText( 'Another published page', { exact: true } )
			).toBeVisible();
		} finally {
			await context.close();
			await admin.visitAdminPage( 'options-privacy.php' );
			await privacyPageSelect.selectOption( previousPrivacyPage );
			await page.getByRole( 'button', { name: 'Use This Page' } ).click();
			if ( user ) {
				await requestUtils.rest( {
					method: 'DELETE',
					path: `/wp/v2/users/${ user.id }`,
					params: { force: true, reassign: 1 },
				} );
			}
		}
	} );

	test( 'renders HTML formatting and entities in page titles', async ( {
		editor,
		admin,
		requestUtils,
	} ) => {
		// Create a page with both HTML formatting and entities in the title
		await requestUtils.createPage( {
			title: '<strong>Bold &"qwerty"—</strong>',
			status: 'publish',
		} );

		// Insert Page List block directly
		await admin.createNewPost();
		await editor.insertBlock( { name: 'core/page-list' } );

		// Wait for Page List block to be visible
		const pageListBlock = editor.canvas.getByRole( 'document', {
			name: 'Block: Page List',
		} );

		await expect( pageListBlock ).toBeVisible( {
			// Wait for the Page List block API request to resolve.
			timeout: 10000,
		} );

		// Locate the page list item
		const pageItems = pageListBlock.locator( 'li' );

		// Wait for Page List to load pages
		await pageItems.first().waitFor( { state: 'visible' } );

		// Find the link element - try to find by text content
		const links = pageListBlock.locator( 'a' );
		const linkCount = await links.count();
		expect( linkCount ).toBeGreaterThan( 0 );

		// Find the link that contains our test page title
		let link = null;
		for ( let i = 0; i < linkCount; i++ ) {
			const currentLink = links.nth( i );
			const text = await currentLink.textContent();
			if (
				text &&
				( text.includes( 'qwerty' ) || text.includes( 'Bold' ) )
			) {
				link = currentLink;
				break;
			}
		}

		expect( link ).not.toBeNull();
		await expect( link ).toBeVisible();

		// Verify text content shows decoded text (not raw HTML or entity codes)
		const textContent = await link.textContent();
		expect( textContent ).toContain( 'Bold' );
		expect( textContent ).toContain( 'qwerty' );
		// Verify HTML tags are not shown as raw markup
		expect( textContent ).not.toContain( '<strong>' );
		expect( textContent ).not.toContain( '</strong>' );
		// Verify entity codes are not shown as raw codes
		expect( textContent ).not.toContain( '&amp;' );
		expect( textContent ).not.toContain( '&quot;' );
		expect( textContent ).not.toContain( '&mdash;' );

		// Verify HTML is rendered (check for strong tag)
		const strongElement = link.locator( 'css=strong' );
		await expect( strongElement ).toBeVisible();
		await expect( strongElement ).toContainText( 'Bold' );
		await expect( strongElement ).toContainText( 'qwerty' );

		// Verify innerHTML contains the strong tag (not escaped)
		const innerHTML = await link.innerHTML();
		expect( innerHTML ).toContain( '<strong>' );
		expect( innerHTML ).toContain( '</strong>' );
		// Ensure it's not showing raw HTML as text
		expect( innerHTML ).not.toContain( '&lt;strong&gt;' );
		expect( innerHTML ).not.toContain( '&lt;/strong&gt;' );
	} );
} );
