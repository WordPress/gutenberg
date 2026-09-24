const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Templates', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllTemplates( 'wp_template' );
	} );

	test( 'Create a custom template', async ( { admin, page } ) => {
		const templateName = 'demo';
		await admin.visitSiteEditor( { postType: 'wp_template' } );
		await page.getByRole( 'button', { name: 'Add template' } ).click();
		await page
			.getByRole( 'button', {
				name: 'A custom template can be manually applied to any post or page.',
			} )
			.click();
		// Fill the template title and submit.
		const newTemplateDialog = page.locator(
			'role=dialog[name="Create custom template"i]'
		);
		const templateNameInput = newTemplateDialog.locator(
			'role=textbox[name="Name"i]'
		);
		await templateNameInput.fill( templateName );
		await page.keyboard.press( 'Enter' );
		// Close the pattern suggestions dialog.
		await page
			.getByRole( 'dialog', { name: 'Choose a pattern' } )
			.getByRole( 'button', { name: 'Close' } )
			.click();
		await expect(
			page.locator(
				`role=button[name="Dismiss this notice"i] >> text="${ templateName }" successfully created.`
			)
		).toBeVisible();
	} );

	test( 'Persists filter/search when switching layout', async ( {
		page,
		admin,
	} ) => {
		await admin.visitSiteEditor( { postType: 'wp_template' } );

		// Search templates
		await page.getByRole( 'searchbox', { name: 'Search' } ).fill( 'Index' );

		// Switch layout
		await page.getByRole( 'button', { name: 'Layout' } ).click();
		await page.getByRole( 'menuitemradio', { name: 'Table' } ).click();

		// Confirm the table is visible
		await expect( page.getByRole( 'table' ) ).toContainText( 'Index' );

		// The search should still contain the search term
		await expect(
			page.getByRole( 'searchbox', { name: 'Search' } )
		).toHaveValue( 'Index' );
	} );

	test.describe( 'for a theme that provides both single and page', () => {
		test.beforeAll( async ( { requestUtils } ) => {
			await requestUtils.activateTheme( 'twentytwentyfive' );
			await requestUtils.createPost( {
				title: 'A post',
				status: 'publish',
			} );
			await requestUtils.createPage( {
				title: 'A page',
				status: 'publish',
			} );
		} );

		test.afterAll( async ( { requestUtils } ) => {
			await requestUtils.deleteAllPosts();
			await requestUtils.deleteAllPages();
			await requestUtils.activateTheme( 'emptytheme' );
		} );

		// The extensible site editor does not yet filter out the templates a
		// theme already provides, so it offers the choice for both posts and
		// pages. That gap is not what this test covers.
		test( 'Adding a post or a page template goes straight to choosing an item @site-editor-v1-only', async ( {
			admin,
			page,
		} ) => {
			await admin.visitSiteEditor( { postType: 'wp_template' } );
			await page.getByRole( 'button', { name: 'Add template' } ).click();
			const modal = page.getByRole( 'dialog' );
			const specificItemCopy = modal.getByText(
				'This template will be used only for the specific item chosen.'
			);
			const allItems = modal.getByRole( 'button', {
				name: 'For all items',
			} );

			// The theme's `single.html` already covers every post, so the
			// choice between a template for all posts and one for a specific
			// post is not offered, and posts are not listed a second time
			// alongside the template the theme provides.
			await expect(
				modal.getByRole( 'button', { name: 'Single item: Post' } )
			).toBeHidden();
			await modal.getByRole( 'button', { name: 'Single Posts' } ).click();
			await expect( specificItemCopy ).toBeVisible();
			await expect( allItems ).toBeHidden();
			await modal.getByRole( 'button', { name: 'Back' } ).click();

			// `page.html` covers every page, so pages behave the same way.
			await modal.getByRole( 'button', { name: 'Pages' } ).click();
			await expect( specificItemCopy ).toBeVisible();
			await expect( allItems ).toBeHidden();
		} );
	} );
} );
