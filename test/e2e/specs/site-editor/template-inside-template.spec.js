const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

const THEME = 'gutenberg-test-themes/template-inheritance';

test.describe( 'Template rendered inside another template', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'template-inheritance' );
		await requestUtils.deleteAllTemplates( 'wp_template' );
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllTemplates( 'wp_template' );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test( 'renders a template of the theme inside the one its theme.json names', async ( {
		page,
	} ) => {
		await page.goto( '/a-page-that-does-not-exist/' );

		await expect(
			page.getByRole( 'heading', { name: 'Nothing here' } )
		).toBeVisible();
		await expect(
			page.getByText( 'Every template shares this footer.' )
		).toBeVisible();
	} );

	test( 'shows the template it is rendered inside in the summary', async ( {
		admin,
		page,
	} ) => {
		await admin.visitSiteEditor( {
			postId: `${ THEME }//404`,
			postType: 'wp_template',
			canvas: 'edit',
		} );

		// The row shows the value beside its label, and describes the button
		// that opens the control with it.
		await expect(
			page.getByRole( 'button', { name: 'Edit Template' } )
		).toHaveAccessibleDescription( 'layout' );
	} );

	test( 'renders the template inside it around the blocks being edited', async ( {
		admin,
		editor,
		page,
	} ) => {
		await admin.visitSiteEditor( {
			postId: `${ THEME }//404`,
			postType: 'wp_template',
			canvas: 'edit',
		} );

		await page.getByRole( 'button', { name: 'View', exact: true } ).click();
		await page
			.getByRole( 'menuitemcheckbox', { name: 'Show template' } )
			.click();

		// The blocks of the layout template are around the ones being edited.
		await expect(
			editor.canvas.getByText( 'Every template shares this footer.' )
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

	test( 'renders the template on its own when the site names no template', async ( {
		admin,
		editor,
		page,
	} ) => {
		await admin.visitSiteEditor( {
			postId: `${ THEME }//404`,
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
		await expect(
			page.getByText( 'Every template shares this footer.' )
		).toBeHidden();
	} );
} );
