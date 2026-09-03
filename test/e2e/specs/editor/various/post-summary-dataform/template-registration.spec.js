const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );
const { EXPERIMENTS, openPostSummary } = require( './utils' );

/*
 * Mirrors the 'registered templates are available in the Change template
 * screen' and 'themes can override registered templates' tests of
 * `test/e2e/specs/site-editor/template-registration.spec.js` with the
 * DataForm inspector experiment enabled; delete those tests when the
 * experiment graduates.
 */
test.use( {
	blockTemplateRegistrationUtils: async ( { editor, page }, use ) => {
		await use( new BlockTemplateRegistrationUtils( { editor, page } ) );
	},
} );

test.describe( 'Block template registration (DataForm inspector)', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
		await requestUtils.activatePlugin(
			'gutenberg-test-block-template-registration'
		);
	} );

	test.beforeEach( async ( { requestUtils } ) => {
		await requestUtils.setGutenbergExperiments( EXPERIMENTS );
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.setGutenbergExperiments( [] );
		await requestUtils.deleteAllTemplates( 'wp_template' );
		await requestUtils.deleteAllPosts();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
		await requestUtils.deactivatePlugin(
			'gutenberg-test-block-template-registration'
		);
	} );

	test( 'registered templates are available in the Change template screen', async ( {
		admin,
		editor,
		page,
	} ) => {
		// Create a post.
		await admin.createNewPost();
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'User-created post.' },
		} );

		// Change template.
		const summary = await openPostSummary( { editor, page, tab: 'Post' } );
		await summary.getByRole( 'button', { name: 'Edit Template' } ).click();
		await page
			.getByRole( 'combobox', { name: 'Template' } )
			.selectOption( { label: 'Plugin Template' } );
		await page.keyboard.press( 'Escape' );

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
		blockTemplateRegistrationUtils,
	} ) => {
		// Create a post.
		await admin.createNewPost();
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'User-created post.' },
		} );

		// Change template.
		const summary = await openPostSummary( { editor, page, tab: 'Post' } );
		await summary.getByRole( 'button', { name: 'Edit Template' } ).click();
		await page
			.getByRole( 'combobox', { name: 'Template' } )
			.selectOption( { label: 'Custom' } );
		await page.keyboard.press( 'Escape' );

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
		await blockTemplateRegistrationUtils.searchForTemplate( 'Custom' );
		await expect(
			page.getByText( 'Custom Template (overridden by the theme)' )
		).toBeHidden();
		// Verify the template description fall backs to the plugin registered description.
		await expect(
			page.getByText(
				'A custom template registered by a plugin and overridden by a theme.'
			)
		).toBeVisible();
		// Verify the theme template shows the theme name as the author.
		await expect( page.getByText( 'AuthorEmptytheme' ) ).toBeVisible();
	} );
} );

class BlockTemplateRegistrationUtils {
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
			.toBeLessThanOrEqual( initialSearchResultsCount );
		await expect
			.poll( async () => this.page.url() )
			.toContain( `search=${ encodeURIComponent( searchTerm ) }` );
	}
}
