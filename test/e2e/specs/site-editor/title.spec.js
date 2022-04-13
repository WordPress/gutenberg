/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.use( {
	editorTitle: async ( { page, pageUtils, requestUtils }, use ) => {
		await use( new EditorTitle( { page, pageUtils, requestUtils } ) );
	},
} );

test.describe( 'Title', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
		await Promise.all( [
			requestUtils.deleteAllTemplates( 'wp_template' ),
			requestUtils.deleteAllTemplates( 'wp_template_part' ),
		] );
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await Promise.all( [
			requestUtils.deleteAllTemplates( 'wp_template' ),
			requestUtils.deleteAllTemplates( 'wp_template_part' ),
		] );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test( 'displays the selected template name in the title for the index template', async ( {
		editorTitle,
		pageUtils,
	} ) => {
		// Navigate to a template.
		await pageUtils.visitSiteEditor( {
			postId: 'emptytheme//index',
			postType: 'wp_template',
		} );

		// Evaluate the document settings title.
		const actual = await editorTitle.getEditorTitle();

		await expect( actual ).toEqual( 'Editing template: Index' );
	} );

	test( 'displays the selected template name in the title for the header template', async ( {
		editorTitle,
		pageUtils,
	} ) => {
		// Navigate to a template part.
		await pageUtils.visitSiteEditor( {
			postId: 'emptytheme//header',
			postType: 'wp_template_part',
		} );

		// Evaluate the document settings title.
		const actual = await editorTitle.getEditorTitle();

		await expect( actual ).toEqual( 'Editing template part: header' );
	} );

	test( "displays the selected template part's name in the secondary title when a template part is selected from List View", async ( {
		editorTitle,
		page,
		pageUtils,
	} ) => {
		await pageUtils.visitSiteEditor( {
			postId: 'emptytheme//index',
			postType: 'wp_template',
		} );

		// Select the header template part via list view.
		await page.click( 'role=button[name="List View"]' );
		const listView = await page.locator(
			'role=treegrid[name="Block navigation structure"]'
		);
		await listView.locator( 'a >> text="header"' ).click();
		await page.click( 'role=button[name="Close List View Sidebar"]' );

		// Evaluate the document settings secondary title.
		const actual = await editorTitle.getEditorSecondaryTitle();

		await expect( actual ).toEqual( 'header' );
	} );
} );

class EditorTitle {
	constructor( { page } ) {
		this.page = page;
	}

	async getEditorTitle() {
		const title = await this.page.locator(
			'role=region[name="Header"] >> h1'
		);

		return title.textContent();
	}

	async getEditorSecondaryTitle() {
		const secondaryTitle = await this.page.locator(
			'.edit-site-document-actions__secondary-item'
		);

		return secondaryTitle.textContent();
	}
}
