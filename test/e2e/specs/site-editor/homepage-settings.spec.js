/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Homepage Settings via Editor', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await Promise.all( [ requestUtils.activateTheme( 'emptytheme' ) ] );
		await requestUtils.createPage( {
			title: 'Homepage',
			status: 'publish',
		} );
		await requestUtils.createPage( {
			title: 'Posts page',
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
		await Promise.all( [
			requestUtils.deleteAllPages(),
			requestUtils.updateSiteSettings( {
				show_on_front: 'posts',
				page_on_front: 0,
				page_for_posts: 0,
			} ),
		] );
	} );

	test( 'should not show "Set as homepage" and "Set as posts page" action on pages with `draft` status', async ( {
		page,
	} ) => {
		const draftPage = page
			.getByRole( 'gridcell' )
			.getByLabel( 'Draft page' );
		const draftPageRow = page
			.getByRole( 'row' )
			.filter( { has: draftPage } );
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
		const homePage = page.getByRole( 'gridcell' ).getByLabel( 'Homepage' );
		const homePageRow = page.getByRole( 'row' ).filter( { has: homePage } );
		await homePageRow.click();
		await homePageRow
			.getByRole( 'button', {
				name: 'Actions',
			} )
			.click();
		await page.getByRole( 'menuitem', { name: 'Set as homepage' } ).click();
		await page.getByRole( 'button', { name: 'Set homepage' } ).click();
		await expect( page.getByRole( 'dialog' ) ).toBeHidden();

		await homePageRow.getByRole( 'button', { name: 'Actions' } ).click();
		await expect( page.getByRole( 'menu' ) ).toBeVisible();
		await expect(
			page.getByRole( 'menuitem', { name: 'Set as homepage' } )
		).toBeHidden();
		await expect(
			page.getByRole( 'menuitem', { name: 'Set as posts page' } )
		).toBeHidden();
		await page.keyboard.press( 'Escape' );
		await expect( page.getByRole( 'menu' ) ).toBeHidden();

		const postsPage = page
			.getByRole( 'gridcell' )
			.getByLabel( 'Posts page' );
		const postsPageRow = page
			.getByRole( 'row' )
			.filter( { has: postsPage } );
		await postsPageRow.click();
		await postsPageRow
			.getByRole( 'button', {
				name: 'Actions',
			} )
			.click();
		await page
			.getByRole( 'menuitem', { name: 'Set as posts page' } )
			.click();
		await page.getByRole( 'button', { name: 'Set posts page' } ).click();
		await expect( page.getByRole( 'dialog' ) ).toBeHidden();

		await postsPageRow.getByRole( 'button', { name: 'Actions' } ).click();
		await expect( page.getByRole( 'menu' ) ).toBeVisible();
		await expect(
			page.getByRole( 'menuitem', { name: 'Set as homepage' } )
		).toBeHidden();
		await expect(
			page.getByRole( 'menuitem', { name: 'Set as posts page' } )
		).toBeHidden();
		await page.keyboard.press( 'Escape' );
		await expect( page.getByRole( 'menu' ) ).toBeHidden();
	} );
} );
