/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Site Editor Inserter', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await Promise.all( [
			requestUtils.activateTheme( 'emptytheme' ),
			requestUtils.deleteAllTemplates( 'wp_template' ),
			requestUtils.deleteAllTemplates( 'wp_template_part' ),
		] );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test.beforeEach( async ( { admin, editor } ) => {
		await admin.visitSiteEditor();
		await editor.canvas.locator( 'body' ).click();
	} );

	test( 'inserter toggle button should toggle global inserter', async ( {
		page,
	} ) => {
		await page.click( 'role=button[name="Toggle block inserter"i]' );

		// Visibility check
		await expect(
			page.locator(
				'role=searchbox[name="Search for blocks and patterns"i]'
			)
		).toBeVisible();
		await page.click( 'role=button[name="Toggle block inserter"i]' );
		//Hidden State check
		await expect(
			page.locator(
				'role=searchbox[name="Search for blocks and patterns"i]'
			)
		).toBeHidden();
	} );

	// A test for https://github.com/WordPress/gutenberg/issues/43090.
	test( 'should close the inserter when clicking on the toggle button', async ( {
		page,
		editor,
	} ) => {
		const inserterButton = page.getByRole( 'button', {
			name: 'Toggle block inserter',
		} );
		const blockLibrary = page.getByRole( 'region', {
			name: 'Block Library',
		} );

		const beforeBlocks = await editor.getBlocks();

		await inserterButton.click();
		await blockLibrary.getByRole( 'tab', { name: 'Blocks' } ).click();
		await blockLibrary.getByRole( 'option', { name: 'Buttons' } ).click();

		await expect
			.poll( editor.getBlocks )
			.toMatchObject( [ ...beforeBlocks, { name: 'core/buttons' } ] );

		await inserterButton.click();

		await expect( blockLibrary ).toBeHidden();
	} );
} );
