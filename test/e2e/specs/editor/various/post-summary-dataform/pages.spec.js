const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );
const { EXPERIMENTS, openPostSummary } = require( './utils' );

/*
 * Mirrors the 'swap template and reset to default' and 'change template
 * options should respect the declared `postTypes`' tests of
 * `test/e2e/specs/site-editor/pages.spec.js` with the DataForm inspector
 * experiment enabled; delete those tests when the experiment graduates.
 */
/**
 * Activates a theme, retrying on the transient "socket hang up"
 * (ECONNRESET) connection error that intermittently occurs in CI.
 *
 * See https://github.com/WordPress/gutenberg/issues/74483.
 *
 * @param {Object} requestUtils Playwright request utils.
 * @param {string} themeSlug    Theme slug to activate.
 */
async function activateThemeWithRetry( requestUtils, themeSlug ) {
	const maxAttempts = 3;
	for ( let attempt = 1; attempt <= maxAttempts; attempt++ ) {
		try {
			await requestUtils.activateTheme( themeSlug );
			return;
		} catch ( error ) {
			const isTransient = /socket hang up|ECONNRESET/i.test(
				error?.message ?? ''
			);
			if ( ! isTransient || attempt === maxAttempts ) {
				throw error;
			}
		}
	}
}

async function draftNewPage( page ) {
	await page.getByRole( 'button', { name: 'Pages' } ).click();
	await page.getByRole( 'button', { name: 'Add page' } ).click();
	await page
		.getByRole( 'dialog', { name: 'Draft new: page' } )
		.getByRole( 'textbox', { name: 'title' } )
		.fill( 'Test Page' );
	await page.keyboard.press( 'Enter' );
	await expect(
		page
			.getByRole( 'button', { name: 'Dismiss this notice' } )
			.getByText( '"Test Page" successfully created.' )
	).toBeVisible();
}

test.describe( 'Pages (DataForm inspector)', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await activateThemeWithRetry( requestUtils, 'emptytheme' );
		await Promise.all( [
			requestUtils.deleteAllTemplates( 'wp_template' ),
			requestUtils.deleteAllPages(),
		] );
	} );

	test.beforeEach( async ( { requestUtils, admin } ) => {
		await Promise.all( [
			requestUtils.setGutenbergExperiments( EXPERIMENTS ),
			requestUtils.deleteAllTemplates( 'wp_template' ),
			requestUtils.deleteAllPages(),
		] );
		await admin.visitSiteEditor();
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.setGutenbergExperiments( [] );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await activateThemeWithRetry( requestUtils, 'twentytwentyone' );
		await Promise.all( [
			requestUtils.deleteAllTemplates( 'wp_template' ),
			requestUtils.deleteAllPages(),
		] );
	} );

	test( 'swap template and reset to default', async ( {
		admin,
		page,
		editor,
	} ) => {
		// Create a custom template first.
		const templateName = 'demo';
		await page.getByRole( 'button', { name: 'Templates' } ).click();
		await page.getByRole( 'button', { name: 'Add template' } ).click();
		await page
			.getByRole( 'button', {
				name: 'A custom template can be manually applied to any post or page.',
			} )
			.click();
		// Fill the template title and submit.
		await page
			.getByRole( 'dialog', { name: 'Create custom template' } )
			.getByRole( 'textbox', { name: 'Name' } )
			.fill( templateName );
		await page.keyboard.press( 'Enter' );
		await page
			.locator( '.block-editor-block-patterns-list__list-item' )
			.click();
		await editor.saveSiteEditorEntities( {
			isOnlyCurrentEntityDirty: true,
		} );
		await admin.visitSiteEditor();

		// Create new page that has the default template so as to swap it.
		await draftNewPage( page );
		const summary = await openPostSummary( { editor, page } );
		const templateButton = summary.getByRole( 'button', {
			name: 'Edit Template',
		} );
		await expect( templateButton ).toHaveAccessibleDescription(
			'Single Entries'
		);
		await templateButton.click();
		const templateSelect = page.getByRole( 'combobox', {
			name: 'Template',
		} );
		// Empty theme's custom template with `postTypes: ['post']`, should not be suggested.
		await expect( templateSelect.getByRole( 'option' ) ).toHaveText( [
			'Single Entries',
			templateName,
		] );
		await templateSelect.selectOption( { label: templateName } );
		await page.keyboard.press( 'Escape' );
		await expect( templateButton ).toHaveAccessibleDescription(
			templateName
		);
		await editor.saveSiteEditorEntities( {
			isOnlyCurrentEntityDirty: true,
		} );

		// Now reset, and apply the default template back.
		await templateButton.click();
		await templateSelect.selectOption( { label: 'Single Entries' } );
		await page.keyboard.press( 'Escape' );
		await expect( templateButton ).toHaveAccessibleDescription(
			'Single Entries'
		);
	} );

	test( 'change template options should respect the declared `postTypes`', async ( {
		page,
		editor,
	} ) => {
		await draftNewPage( page );
		const summary = await openPostSummary( { editor, page } );
		await summary.getByRole( 'button', { name: 'Edit Template' } ).click();
		// Empty theme has only one custom template with `postTypes: ['post']`,
		// so it should not be suggested.
		await expect(
			page
				.getByRole( 'combobox', { name: 'Template' } )
				.getByRole( 'option' )
		).toHaveText( [ 'Single Entries' ] );
	} );
} );
