const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

// Whether the run targets the extensible site editor (v2). Its pages screen
// defaults to a plain table (title rendered as a link), the classic one to
// the list layout (a grid whose cells label the items).
const isSiteEditorV2 = !! process.env.GUTENBERG_E2E_SITE_EDITOR_V2;

const getPageRow = ( page, title ) =>
	page.getByRole( 'row' ).filter( {
		has: isSiteEditorV2
			? page.getByRole( 'link', { name: title, exact: true } )
			: page.getByRole( 'gridcell' ).getByLabel( title ),
	} );

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

	test.beforeEach( async ( { admin } ) => {
		await admin.visitSiteEditor( { postType: 'page' } );
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
		const draftPageRow = getPageRow( page, 'Draft page' );
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
		const homePageRow = getPageRow( page, 'Homepage' );
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
		await expect(
			page.getByRole( 'menu', { name: 'Actions' } )
		).toBeVisible();
		await expect(
			page.getByRole( 'menuitem', { name: 'Set as homepage' } )
		).toBeHidden();
		await expect(
			page.getByRole( 'menuitem', { name: 'Set as posts page' } )
		).toBeHidden();
		await page.keyboard.press( 'Escape' );
		await expect(
			page.getByRole( 'menu', { name: 'Actions' } )
		).toBeHidden();

		const postsPageRow = getPageRow( page, 'Posts page' );
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
		await expect(
			page.getByRole( 'menu', { name: 'Actions' } )
		).toBeVisible();
		await expect(
			page.getByRole( 'menuitem', { name: 'Set as homepage' } )
		).toBeHidden();
		await expect(
			page.getByRole( 'menuitem', { name: 'Set as posts page' } )
		).toBeHidden();
		await page.keyboard.press( 'Escape' );
		await expect(
			page.getByRole( 'menu', { name: 'Actions' } )
		).toBeHidden();
	} );
} );
