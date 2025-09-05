/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Site editor url navigation', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test.beforeEach( async ( { requestUtils } ) => {
		await Promise.all( [
			requestUtils.deleteAllPosts(),
			requestUtils.deleteAllTemplates( 'wp_template' ),
			requestUtils.deleteAllTemplates( 'wp_template_part' ),
		] );
	} );

	test( 'Redirection after template creation', async ( {
		admin,
		page,
		requestUtils,
	} ) => {
		await requestUtils.createPost( {
			title: 'Demo',
			content: 'Hello there!',
			status: 'publish',
		} );

		await admin.visitSiteEditor();
		await page.click( 'role=button[name="Templates"]' );
		await page.click( 'role=button[name="Add Template"i]' );
		await page
			.getByRole( 'button', {
				name: 'Single item: Post',
			} )
			.click();
		await page
			.getByRole( 'button', { name: 'For a specific item' } )
			.click();
		await page.getByRole( 'option', { name: 'Demo' } ).click();
		await expect( page ).toHaveURL(
			'/wp-admin/site-editor.php?p=%2Fwp_template%2Femptytheme%2F%2Fsingle-post-demo&canvas=edit'
		);
	} );

	test( 'Redirection after template part creation', async ( {
		admin,
		page,
	} ) => {
		await admin.visitSiteEditor();
		await page.click( 'role=button[name="Patterns"i]' );
		await page.click( 'role=button[name="add pattern"i]' );
		await page
			.getByRole( 'menu', { name: 'add pattern' } )
			.getByRole( 'menuitem', { name: 'add template part' } )
			.click();
		// Fill in a name in the dialog that pops up.
		await page.type( 'role=dialog >> role=textbox[name="Name"i]', 'Demo' );
		await page.keyboard.press( 'Enter' );
		await expect( page ).toHaveURL(
			'/wp-admin/site-editor.php?p=%2Fwp_template_part%2Femptytheme%2F%2Fdemo&canvas=edit'
		);
	} );

	test( 'The Patterns page should keep the previously selected template part category', async ( {
		admin,
		page,
	} ) => {
		await admin.visitSiteEditor();
		const navigation = page.getByRole( 'region', {
			name: 'Navigation',
		} );
		await navigation.getByRole( 'button', { name: 'Patterns' } ).click();
		await navigation.getByRole( 'button', { name: 'General' } ).click();
		await page
			.getByRole( 'region', {
				name: 'Patterns content',
			} )
			.getByText( 'header', { exact: true } )
			.click();
		await expect(
			page.getByRole( 'region', { name: 'Editor content' } )
		).toBeVisible();
		await page.getByRole( 'button', { name: 'Open navigation' } ).click();
		await expect(
			navigation.getByRole( 'button', { name: 'All template parts' } )
		).toBeVisible();
	} );
} );
