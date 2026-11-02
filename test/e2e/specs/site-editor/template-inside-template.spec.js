const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

const isSiteEditorV2 = !! process.env.GUTENBERG_E2E_SITE_EDITOR_V2;

const LAYOUT_CONTENT = `<!-- wp:paragraph --><p>Shared header</p><!-- /wp:paragraph -->
<!-- wp:post-content /-->
<!-- wp:paragraph --><p>Shared footer</p><!-- /wp:paragraph -->`;

const NOT_FOUND_CONTENT = `<!-- wp:heading --><h2 class="wp-block-heading">Nothing here</h2><!-- /wp:heading -->`;

test.describe( 'Template rendered inside another template', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.setGutenbergExperiments( [
			'gutenberg-template-inheritance',
		] );
		await requestUtils.activateTheme( 'emptytheme' );
		await requestUtils.deleteAllTemplates( 'wp_template' );
	} );

	test.beforeEach( async ( { requestUtils } ) => {
		// "Show template" saves the rendering mode in the user's preferences,
		// so it is reset for each test rather than left to leak into the next.
		await requestUtils.resetPreferences();
		await requestUtils.createTemplate( 'wp_template', {
			slug: 'layout',
			title: 'Layout',
			content: LAYOUT_CONTENT,
		} );
		await requestUtils.createTemplate( 'wp_template', {
			slug: '404',
			title: '404',
			content: NOT_FOUND_CONTENT,
			template: 'layout',
		} );
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllTemplates( 'wp_template' );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
		await requestUtils.setGutenbergExperiments( [] );
		await requestUtils.resetPreferences();
	} );

	test( 'renders the template inside the one it names', async ( {
		page,
	} ) => {
		await page.goto( '/a-page-that-does-not-exist/' );

		await expect(
			page.getByRole( 'heading', { name: 'Nothing here' } )
		).toBeVisible();
		await expect( page.getByText( 'Shared header' ) ).toBeVisible();
		await expect( page.getByText( 'Shared footer' ) ).toBeVisible();
	} );

	test( 'shows the template it is rendered inside in the summary', async ( {
		admin,
		page,
	} ) => {
		await admin.visitSiteEditor( {
			postId: 'emptytheme//404',
			postType: 'wp_template',
			canvas: 'edit',
		} );

		// The row shows the value beside its label, and describes the button
		// that opens the control with it.
		await expect(
			page.getByRole( 'button', { name: 'Edit Template' } )
		).toHaveAccessibleDescription( 'Layout' );
	} );

	test( 'renders the template inside it around the blocks being edited', async ( {
		admin,
		editor,
		page,
	} ) => {
		await admin.visitSiteEditor( {
			postId: 'emptytheme//404',
			postType: 'wp_template',
			canvas: 'edit',
		} );

		await page.getByRole( 'button', { name: 'View', exact: true } ).click();
		await page
			.getByRole( 'menuitemcheckbox', { name: 'Show template' } )
			.click();

		// The blocks of the layout template are around the ones being edited.
		await expect(
			editor.canvas.getByText( 'Shared footer' )
		).toBeVisible();

		// The blocks being edited are the editable ones, in the post content
		// block of the layout template.
		const heading = editor.canvas.getByRole( 'document', {
			name: 'Block: Heading',
		} );
		await expect( heading ).toBeVisible();
		await heading.click();
		await page.keyboard.type( '!' );

		await expect(
			editor.canvas.getByRole( 'heading', { name: 'Nothing here!' } )
		).toBeVisible();
	} );

	test( 'renders the template on its own when it names none', async ( {
		admin,
		editor,
		page,
	} ) => {
		await admin.visitSiteEditor( {
			postId: 'emptytheme//404',
			postType: 'wp_template',
			canvas: 'edit',
		} );

		await page.getByRole( 'button', { name: 'Edit Template' } ).click();
		await page.getByRole( 'combobox', { name: 'Template' } ).click();
		await page.getByRole( 'option', { name: 'None' } ).click();
		await page.keyboard.press( 'Escape' );

		await editor.saveSiteEditorEntities();

		await page.goto( '/a-page-that-does-not-exist/' );

		await expect(
			page.getByRole( 'heading', { name: 'Nothing here' } )
		).toBeVisible();
		await expect( page.getByText( 'Shared footer' ) ).toBeHidden();
	} );

	test( 'edits a template that names none once the template of one that does has been shown', async ( {
		admin,
		editor,
		page,
	} ) => {
		await admin.visitSiteEditor( {
			postId: 'emptytheme//404',
			postType: 'wp_template',
			canvas: 'edit',
		} );

		await page.getByRole( 'button', { name: 'View', exact: true } ).click();
		await page
			.getByRole( 'menuitemcheckbox', { name: 'Show template' } )
			.click();
		await page.keyboard.press( 'Escape' );

		/*
		 * Leaving through the back button is a client-side navigation, which
		 * keeps the editor store, and with it the rendering mode, intact. The
		 * layout template names no template to render inside, so it is edited
		 * on its own rather than waiting for one that never arrives.
		 */
		await page
			.getByRole( 'button', {
				name: isSiteEditorV2 ? 'Back' : 'Open Navigation',
			} )
			.click();
		await page
			.locator( '.dataviews-view-grid__card' )
			.getByRole( 'button', { name: 'Layout', exact: true } )
			.click();

		const paragraph = editor.canvas.getByText( 'Shared header' );
		await expect( paragraph ).toBeVisible();
		await paragraph.click();
		await page.keyboard.type( '!' );

		await expect(
			editor.canvas.getByText( 'Shared header!' )
		).toBeVisible();
	} );

	test( 'leaves the blocks of the template around it to that template', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		await requestUtils.createTemplate( 'wp_template', {
			slug: 'shell',
			title: 'Shell',
			content: '<!-- wp:post-title /--><!-- wp:post-content /-->',
		} );
		await requestUtils.createTemplate( 'wp_template', {
			slug: 'search',
			title: 'Search',
			content:
				'<!-- wp:heading --><h2 class="wp-block-heading">Results</h2><!-- /wp:heading -->',
			template: 'shell',
		} );

		await admin.visitSiteEditor( {
			postId: 'emptytheme//search',
			postType: 'wp_template',
			canvas: 'edit',
		} );

		await page.getByRole( 'button', { name: 'View', exact: true } ).click();
		await page
			.getByRole( 'menuitemcheckbox', { name: 'Show template' } )
			.click();
		await page.keyboard.press( 'Escape' );

		// The blocks being edited are the ones in the slot.
		await expect(
			editor.canvas.getByRole( 'document', { name: 'Block: Heading' } )
		).toBeVisible();

		const editingModes = await page.evaluate( () => {
			const { getBlocksByName, getBlockEditingMode } =
				window.wp.data.select( 'core/block-editor' );
			return Object.fromEntries(
				[ 'core/post-title', 'core/post-content' ].map( ( name ) => [
					name,
					getBlockEditingMode( getBlocksByName( name )[ 0 ] ),
				] )
			);
		} );

		expect( editingModes ).toEqual( {
			/*
			 * The title block of the template around it is that template's own,
			 * and the server substitutes the content block alone, so editing it
			 * here would rename the template being edited and change nothing on
			 * the front end.
			 */
			'core/post-title': 'disabled',
			'core/post-content': 'contentOnly',
		} );
	} );
} );
