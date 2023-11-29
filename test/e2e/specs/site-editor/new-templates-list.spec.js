/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

async function getRows( page ) {
	return page.locator( 'table.dataviews-list-view tbody tr' );
}

async function getTemplateTitles( page ) {
	const rows = await ( await getRows( page ) ).all();
	return Promise.all(
		rows.map( ( row ) => row.locator( 'td' ).nth( 0 ).textContent() )
	);
}

async function goToTemplatesList( admin, page ) {
	await admin.visitSiteEditor();
	await page.getByRole( 'button', { name: 'Templates' } ).click();
	await page.getByRole( 'button', { name: 'Manage all templates' } ).click();
}

async function createTemplate( admin, page ) {
	await admin.visitSiteEditor();
	await page.getByRole( 'button', { name: 'Templates' } ).click();
	await page.getByRole( 'button', { name: 'Add New Template' } ).click();
	await page.locator( 'span', { hasText: 'Date Archives' } ).first().click();
	// Wait a bit for the template to be created.
	await page.getByRole( 'button', { name: 'Close' } ).click();
}

test.describe( 'Templates', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await Promise.all( [
			requestUtils.deleteAllTemplates( 'wp_template' ),
			requestUtils.activateTheme( 'emptytheme' ),
			requestUtils.activatePlugin( 'gutenberg-test-dataviews' ),
		] );
	} );
	test.beforeEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllTemplates( 'wp_template' );
	} );
	test.afterAll( async ( { requestUtils } ) => {
		await Promise.all( [
			requestUtils.activateTheme( 'twentytwentyone' ),
			requestUtils.deactivatePlugin( 'gutenberg-test-dataviews' ),
		] );
	} );
	test.describe( 'Sorting', () => {
		test( 'By title', async ( { admin, page } ) => {
			await goToTemplatesList( admin, page );
			// Descending.
			await page.getByRole( 'button', { name: 'Template' } ).click();
			await page
				.getByRole( 'menuitem', { name: 'Sort descending' } )
				.click();
			// Close the dropdown menu.
			await page.keyboard.press( 'Escape' );
			expect( await getTemplateTitles( page ) ).toEqual( [
				'Tag Archives',
				'Single Entries',
				'Index',
				'Custom',
				'Category Archives',
			] );
			// Ascending.
			await page.getByRole( 'button', { name: 'Template' } ).click();
			await page
				.getByRole( 'menuitem', { name: 'Sort ascending' } )
				.click();
			expect( await getTemplateTitles( page ) ).toEqual( [
				'Category Archives',
				'Custom',
				'Index',
				'Single Entries',
				'Tag Archives',
			] );
		} );
	} );
	test.describe( 'Filtering', () => {
		test( 'Global search', async ( { admin, page } ) => {
			await goToTemplatesList( admin, page );
			await page
				.locator( '.dataviews-wrapper input[type="search"]' )
				.click();
			await page.keyboard.type( 'tag' );
			await expect( await getRows( page ) ).toHaveCount( 1 );
			expect( await getTemplateTitles( page ) ).toEqual( [
				'Tag Archives',
			] );
			await page.getByRole( 'button', { name: 'Reset filters' } ).click();
			await expect( await getRows( page ) ).toHaveCount( 5 );
		} );
		test( 'Author filter', async ( { admin, page } ) => {
			await createTemplate( admin, page );
			await admin.visitSiteEditor( { path: '/wp_template/all' } );
			await expect( await getRows( page ) ).toHaveCount( 6 );
			await page.getByRole( 'button', { name: 'Add filter' } ).click();
			await page.getByRole( 'menuitem', { name: 'Author' } ).hover();
			await page
				.getByRole( 'menuitemcheckbox', { name: 'admin' } )
				.click();
			await expect( await getRows( page ) ).toHaveCount( 1 );
			expect( await getTemplateTitles( page ) ).toEqual( [
				'Date Archives',
			] );
		} );
		test( 'Multiple filters', async ( { admin, page } ) => {
			await createTemplate( admin, page );
			await admin.visitSiteEditor( { path: '/wp_template/all' } );
			await page
				.locator( '.dataviews-wrapper input[type="search"]' )
				.click();
			await page.keyboard.type( 'archives' );
			await expect( await getRows( page ) ).toHaveCount( 3 );
			await page.getByRole( 'button', { name: 'Add filter' } ).click();
			await page.getByRole( 'menuitem', { name: 'Author' } ).hover();
			await page
				.getByRole( 'menuitemcheckbox', { name: 'Emptytheme' } )
				.click();
			await expect( await getRows( page ) ).toHaveCount( 2 );
		} );
	} );
	test( 'Field visibility', async ( { admin, page } ) => {
		await goToTemplatesList( admin, page );
		await page.getByRole( 'button', { name: 'Description' } ).click();
		await page.getByRole( 'menuitem', { name: 'Hide' } ).click();
		await expect(
			page.getByRole( 'button', { name: 'Description' } )
		).toHaveCount( 0 );
	} );
} );
