const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Page List block', () => {
	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllPages();
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

	test.describe( 'for users who cannot edit every page', () => {
		const author = {
			username: 'pagelistauthor',
			email: 'pagelistauthor@example.com',
			password: 'pagelistauthorpassword',
		};

		test.beforeAll( async ( { requestUtils } ) => {
			await requestUtils.createUser( { ...author, roles: [ 'author' ] } );
		} );

		test.afterAll( async ( { requestUtils } ) => {
			await requestUtils.deleteAllUsers();
		} );

		test( 'lists published pages for an author', async ( {
			browser,
			requestUtils,
		} ) => {
			// An author can view published pages but cannot edit any of them, so
			// the REST API refuses an `edit` context request for pages.
			await requestUtils.createPage( {
				title: 'Page visible to authors',
				status: 'publish',
			} );

			const context = await browser.newContext( {
				baseURL: requestUtils.baseURL,
				storageState: { cookies: [], origins: [] },
			} );
			const page = await context.newPage();
			await page.goto( '/wp-login.php' );
			await page
				.getByLabel( 'Username or Email Address' )
				.fill( author.username );
			await page
				.getByLabel( 'Password', { exact: true } )
				.fill( author.password );
			await page.getByRole( 'button', { name: 'Log In' } ).click();
			await page.waitForURL( '**/wp-admin/**' );

			await page.goto( '/wp-admin/post-new.php' );
			await page.waitForFunction( () => !! window.wp?.blocks );
			await page.evaluate( () => {
				window.wp.data
					.dispatch( 'core/preferences' )
					.set( 'core/edit-post', 'welcomeGuide', false );
				window.wp.data
					.dispatch( 'core/block-editor' )
					.insertBlocks(
						window.wp.blocks.createBlock( 'core/page-list' )
					);
			} );

			const pageListBlock = page
				.frameLocator( '[name=editor-canvas]' )
				.getByRole( 'document', { name: 'Block: Page List' } );

			await expect(
				pageListBlock
					.locator( 'li' )
					.filter( { hasText: 'Page visible to authors' } )
			).toBeVisible();
			await expect( pageListBlock ).not.toContainText(
				'Cannot retrieve Pages'
			);

			await context.close();
		} );
	} );
} );
