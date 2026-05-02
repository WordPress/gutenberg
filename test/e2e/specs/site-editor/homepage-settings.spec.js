/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

const getPageRowByTitle = ( page, title ) =>
	page.getByRole( 'row' ).filter( {
		has: page.getByRole( 'gridcell' ).getByLabel( title, { exact: true } ),
	} );

test.describe( 'Homepage Settings via Editor', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
		await requestUtils.updateSiteSettings( {
			show_on_front: 'posts',
			page_on_front: 0,
			page_for_posts: 0,
		} );
		await requestUtils.deleteAllPages();
		await requestUtils.createPage( {
			title: 'Homepage',
			status: 'publish',
		} );
		await requestUtils.createPage( {
			title: 'Sample page',
			status: 'publish',
		} );
		await requestUtils.createPage( {
			title: 'Draft page',
			status: 'draft',
		} );
	} );

	test.beforeEach( async ( { admin, page } ) => {
		await admin.visitSiteEditor();
		await page.getByRole( 'button', { name: 'Pages' } ).click();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.updateSiteSettings( {
			show_on_front: 'posts',
			page_on_front: 0,
			page_for_posts: 0,
		} );
		await requestUtils.deleteAllPages();
	} );

	test( 'should not show "Set as homepage" and "Set as posts page" action on pages with `draft` status', async ( {
		page,
	} ) => {
		const draftPageRow = getPageRowByTitle( page, 'Draft page' );
		await draftPageRow.hover();
		await draftPageRow
			.getByRole( 'button', {
				name: 'Actions',
			} )
			.click();
		await expect(
			page.getByRole( 'menuitem', { name: 'Set as homepage' } )
		).toBeHidden();
		await expect(
			page.getByRole( 'menuitem', { name: 'Set as posts page' } )
		).toBeHidden();
	} );

	test( 'should show correct homepage actions based on current homepage or posts page', async ( {
		page,
	} ) => {
		const homepageRow = getPageRowByTitle( page, 'Homepage' );
		await homepageRow.click();
		await homepageRow
			.getByRole( 'button', {
				name: 'Actions',
			} )
			.click();
		await page.getByRole( 'menuitem', { name: 'Set as homepage' } ).click();
		await page.getByRole( 'button', { name: 'Set homepage' } ).click();
		await expect(
			page.getByRole( 'menuitem', { name: 'Set as homepage' } )
		).toBeHidden();
		await expect(
			page.getByRole( 'menuitem', { name: 'Set as posts page' } )
		).toBeHidden();

		const samplePageRow = getPageRowByTitle( page, 'Sample page' );
		// eslint-disable-next-line playwright/no-force-option
		await samplePageRow.click( { force: true } );
		await samplePageRow
			.getByRole( 'button', {
				name: 'Actions',
			} )
			.click();
		await page
			.getByRole( 'menuitem', { name: 'Set as posts page' } )
			.click();
		await page.getByRole( 'button', { name: 'Set posts page' } ).click();
		await expect(
			page.getByRole( 'menuitem', { name: 'Set as homepage' } )
		).toBeHidden();
		await expect(
			page.getByRole( 'menuitem', { name: 'Set as posts page' } )
		).toBeHidden();
	} );
} );
