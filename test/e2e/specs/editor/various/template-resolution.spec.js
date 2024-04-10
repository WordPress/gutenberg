/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

async function updateSiteSettings( { pageId, requestUtils } ) {
	return requestUtils.updateSiteSettings( {
		show_on_front: 'page',
		page_on_front: 0,
		page_for_posts: pageId,
	} );
}

test.describe( 'Template resolution', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
	} );
	test.afterEach( async ( { requestUtils } ) => {
		await Promise.all( [
			requestUtils.deleteAllPages(),
			requestUtils.updateSiteSettings( {
				show_on_front: 'posts',
				page_on_front: 0,
				page_for_posts: 0,
			} ),
		] );
	} );
	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );
	test( 'Site editor proper front page template resolution when we have only set posts page in settings', async ( {
		page,
		admin,
		requestUtils,
	} ) => {
		const newPage = await requestUtils.createPage( {
			title: 'Posts Page',
			status: 'publish',
		} );
		await updateSiteSettings( { requestUtils, pageId: newPage.id } );
		await admin.visitSiteEditor();
		await expect( page.locator( '.edit-site-canvas-loader' ) ).toHaveCount(
			0
		);
	} );
	test.describe( '`page_for_posts` setting', () => {
		test( 'Post editor proper template resolution', async ( {
			page,
			admin,
			editor,
			requestUtils,
		} ) => {
			const newPage = await requestUtils.createPage( {
				title: 'Posts Page',
				status: 'publish',
			} );
			await admin.editPost( newPage.id );
			await editor.openDocumentSettingsSidebar();
			await expect(
				page.getByRole( 'button', { name: 'Template options' } )
			).toHaveText( 'Single Entries' );
			await updateSiteSettings( { requestUtils, pageId: newPage.id } );
			await page.reload();
			await expect(
				page.getByRole( 'button', { name: 'Template options' } )
			).toHaveText( 'Index' );
		} );
		test( 'Site editor proper template resolution', async ( {
			page,
			editor,
			admin,
			requestUtils,
		} ) => {
			const newPage = await requestUtils.createPage( {
				title: 'Posts Page',
				status: 'publish',
			} );
			await updateSiteSettings( { requestUtils, pageId: newPage.id } );
			await admin.visitSiteEditor( {
				postId: newPage.id,
				postType: 'page',
				canvas: 'edit',
			} );
			await editor.openDocumentSettingsSidebar();
			await expect(
				page.getByRole( 'button', { name: 'Template options' } )
			).toHaveText( 'Index' );
		} );
	} );
} );
