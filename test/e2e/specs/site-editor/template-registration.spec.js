/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.use( {
	templateRegistrationUtils: async ( { editor, page }, use ) => {
		await use( new TemplateRegistrationUtils( { editor, page } ) );
	},
} );

test.describe( 'Template registration', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
		await requestUtils.activatePlugin(
			'gutenberg-test-template-registration'
		);
	} );
	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deactivatePlugin(
			'gutenberg-test-template-registration'
		);
	} );
	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllTemplates( 'wp_template' );
		await requestUtils.deleteAllPosts();
	} );

	test( 'templates can be registered and edited', async ( {
		admin,
		editor,
		page,
		templateRegistrationUtils,
	} ) => {
		// Verify template is applied to the frontend.
		await page.goto( '/?cat=1' );
		await expect(
			page.getByText( 'This is a plugin-registered template.' )
		).toBeVisible();

		// Verify template is listed in the Site Editor.
		await admin.visitSiteEditor( {
			postType: 'wp_template',
		} );
		await templateRegistrationUtils.searchForTemplate( 'Plugin Template' );
		await expect( page.getByText( 'Plugin Template' ) ).toBeVisible();
		await expect(
			page.getByText( 'A template registered by a plugin.' )
		).toBeVisible();
		await expect( page.getByText( 'AuthorGutenberg' ) ).toBeVisible();

		// Verify the template contents are rendered in the editor.
		await page.getByText( 'Plugin Template' ).click();
		await expect(
			editor.canvas.getByText( 'This is a plugin-registered template.' )
		).toBeVisible();

		// Verify edits persist in the frontend.
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'User-edited template' },
		} );
		await editor.saveSiteEditorEntities( {
			isOnlyCurrentEntityDirty: true,
		} );
		await page.goto( '/?cat=1' );
		await expect( page.getByText( 'User-edited template' ) ).toBeVisible();

		// Verify template can be reset.
		await admin.visitSiteEditor( {
			postType: 'wp_template',
		} );
		const resetNotice = page
			.getByLabel( 'Dismiss this notice' )
			.getByText( `"Plugin Template" reset.` );
		const savedButton = page.getByRole( 'button', {
			name: 'Saved',
		} );
		await templateRegistrationUtils.searchForTemplate( 'Plugin Template' );
		const searchResults = page.getByLabel( 'Actions' );
		await searchResults.first().click();
		await page.getByRole( 'menuitem', { name: 'Reset' } ).click();
		await page.getByRole( 'button', { name: 'Reset' } ).click();

		await expect( resetNotice ).toBeVisible();
		await expect( savedButton ).toBeVisible();
		await page.goto( '/?cat=1' );
		await expect(
			page.getByText( 'Content edited template.' )
		).toBeHidden();
	} );

	test( 'registered templates are available in the Swap template screen', async ( {
		admin,
		editor,
		page,
	} ) => {
		// Create a post.
		await admin.visitAdminPage( '/post-new.php' );
		await page.getByLabel( 'Close', { exact: true } ).click();
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'User-created post.' },
		} );

		// Swap template.
		await page.getByRole( 'button', { name: 'Post' } ).click();
		await page.getByRole( 'button', { name: 'Template options' } ).click();
		await page.getByRole( 'menuitem', { name: 'Swap template' } ).click();
		await page.getByText( 'Plugin Template' ).click();

		// Verify the template is applied.
		const postId = await editor.publishPost();
		await page.goto( `?p=${ postId }` );
		await expect(
			page.getByText( 'This is a plugin-registered template.' )
		).toBeVisible();
	} );

	test( 'themes can override registered templates', async ( {
		admin,
		editor,
		page,
		templateRegistrationUtils,
	} ) => {
		// Create a post.
		await admin.visitAdminPage( '/post-new.php' );
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'User-created post.' },
		} );

		// Swap template.
		await page.getByRole( 'button', { name: 'Post' } ).click();
		await page.getByRole( 'button', { name: 'Template options' } ).click();
		await page.getByRole( 'menuitem', { name: 'Swap template' } ).click();
		await page.getByText( 'Custom', { exact: true } ).click();

		// Verify the theme template is applied.
		const postId = await editor.publishPost();
		await page.goto( `?p=${ postId }` );
		await expect(
			page.getByText( 'Custom template for Posts' )
		).toBeVisible();
		await expect(
			page.getByText(
				'This is a plugin-registered template and overridden by a theme.'
			)
		).toBeHidden();

		// Verify the plugin-registered template doesn't appear in the Site Editor.
		await admin.visitSiteEditor( {
			postType: 'wp_template',
		} );
		await templateRegistrationUtils.searchForTemplate( 'Custom' );
		await expect(
			page.getByText( 'Custom Template (overridden by the theme)' )
		).toBeHidden();
		// Verify the theme template shows the theme name as the author.
		await expect( page.getByText( 'AuthorEmptytheme' ) ).toBeVisible();
	} );

	test( 'templates can be deleted if the registered plugin is deactivated', async ( {
		admin,
		editor,
		page,
		requestUtils,
		templateRegistrationUtils,
	} ) => {
		// Make an edit to the template.
		await admin.visitSiteEditor( {
			postType: 'wp_template',
		} );
		await templateRegistrationUtils.searchForTemplate( 'Plugin Template' );
		await page.getByText( 'Plugin Template' ).click();
		await expect(
			editor.canvas.getByText( 'This is a plugin-registered template.' )
		).toBeVisible();
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'User-customized template' },
		} );
		await editor.saveSiteEditorEntities( {
			isOnlyCurrentEntityDirty: true,
		} );

		// Deactivate plugin.
		await requestUtils.deactivatePlugin(
			'gutenberg-test-template-registration'
		);

		// Verify template can be deleted.
		await admin.visitSiteEditor( {
			postType: 'wp_template',
		} );
		const deletedNotice = page
			.getByLabel( 'Dismiss this notice' )
			.getByText( `"Plugin Template" deleted.` );
		const savedButton = page.getByRole( 'button', {
			name: 'Saved',
		} );
		await templateRegistrationUtils.searchForTemplate( 'Plugin Template' );
		const searchResults = page.getByLabel( 'Actions' );
		await searchResults.first().click();
		await page.getByRole( 'menuitem', { name: 'Delete' } ).click();
		await page.getByRole( 'button', { name: 'Delete' } ).click();

		await expect( deletedNotice ).toBeVisible();
		await expect( savedButton ).toBeVisible();

		// Expect template to no longer appear in the Site Editor.
		await expect( page.getByLabel( 'Actions' ) ).toBeHidden();

		// Reactivate plugin.
		await requestUtils.activatePlugin(
			'gutenberg-test-template-registration'
		);
	} );

	test( 'registered templates can be unregistered', async ( {
		admin,
		page,
		templateRegistrationUtils,
	} ) => {
		await admin.visitSiteEditor( {
			postType: 'wp_template',
		} );
		await templateRegistrationUtils.searchForTemplate(
			'Plugin Unregistered Template'
		);
		await expect(
			page.getByText( 'Plugin Unregistered Template' )
		).toBeHidden();
	} );

	test( 'WP default templates can be overridden by plugins', async ( {
		page,
	} ) => {
		await page.goto( '?page_id=2' );
		await expect(
			page.getByText( 'This is a plugin-registered page template.' )
		).toBeVisible();
	} );

	test( 'user-customized templates cannot be overridden by plugins', async ( {
		admin,
		editor,
		page,
		requestUtils,
		templateRegistrationUtils,
	} ) => {
		await requestUtils.deactivatePlugin(
			'gutenberg-test-template-registration'
		);

		// Create an author template.
		await admin.visitSiteEditor( {
			postType: 'wp_template',
		} );
		await page.getByLabel( 'Add New Template' ).click();
		await page.getByRole( 'button', { name: 'Author Archives' } ).click();
		await page
			.getByRole( 'button', { name: 'Author For a specific item' } )
			.click();
		await page.getByRole( 'option', { name: 'admin' } ).click();
		await expect( page.getByText( 'Choose a pattern' ) ).toBeVisible();
		await page.getByLabel( 'Close', { exact: true } ).click();
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Author template customized by the user.' },
		} );
		await editor.saveSiteEditorEntities( {
			isOnlyCurrentEntityDirty: true,
		} );

		await requestUtils.activatePlugin(
			'gutenberg-test-template-registration'
		);

		// Verify the template edited by the user has priority over the one registered by the theme.
		await page.goto( '?author=1' );
		await expect(
			page.getByText( 'Author template customized by the user.' )
		).toBeVisible();
		await expect(
			page.getByText( 'This is a plugin-registered author template.' )
		).toBeHidden();

		// Verify the template registered by the plugin is not visible in the Site Editor.
		await admin.visitSiteEditor( {
			postType: 'wp_template',
		} );
		await templateRegistrationUtils.searchForTemplate(
			'Plugin Author Template'
		);
		await expect( page.getByText( 'Plugin Author Template' ) ).toBeHidden();

		// Reset the user-modified template.
		const resetNotice = page
			.getByLabel( 'Dismiss this notice' )
			.getByText( `"Author: Admin" reset.` );
		await page.getByPlaceholder( 'Search' ).fill( 'Author: admin' );
		await page.getByRole( 'link', { name: 'Author: Admin' } ).click();
		const actions = page.getByLabel( 'Actions' );
		await actions.first().click();
		await page.getByRole( 'menuitem', { name: 'Reset' } ).click();
		await page.getByRole( 'button', { name: 'Reset' } ).click();

		await expect( resetNotice ).toBeVisible();

		// Verify the template registered by the plugin is applied in the editor...
		await expect(
			editor.canvas.getByText( 'Author template customized by the user.' )
		).toBeHidden();
		await expect(
			editor.canvas.getByText(
				'This is a plugin-registered author template.'
			)
		).toBeVisible();

		// ... and the frontend.
		await page.goto( '?author=1' );
		await expect(
			page.getByText( 'Author template customized by the user.' )
		).toBeHidden();
		await expect(
			page.getByText( 'This is a plugin-registered author template.' )
		).toBeVisible();
	} );
} );

class TemplateRegistrationUtils {
	constructor( { page } ) {
		this.page = page;
	}

	async searchForTemplate( searchTerm ) {
		const searchResults = this.page.getByLabel( 'Actions' );
		await expect
			.poll( async () => await searchResults.count() )
			.toBeGreaterThan( 0 );
		const initialSearchResultsCount = await searchResults.count();
		await this.page.getByPlaceholder( 'Search' ).fill( searchTerm );
		await expect
			.poll( async () => await searchResults.count() )
			.toBeLessThan( initialSearchResultsCount );
	}
}
