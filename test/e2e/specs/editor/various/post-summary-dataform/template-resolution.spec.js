const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );
const { EXPERIMENTS, openPostSummary } = require( './utils' );

/*
 * Mirrors the '`page_for_posts` setting' tests of
 * `test/e2e/specs/editor/various/template-resolution.spec.js` with the
 * DataForm inspector experiment enabled; delete those tests when the
 * experiment graduates.
 */
async function updateSiteSettings( { pageId, requestUtils } ) {
	return requestUtils.updateSiteSettings( {
		show_on_front: 'page',
		page_on_front: 0,
		page_for_posts: pageId,
	} );
}

test.describe( 'Template resolution (DataForm inspector)', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
	} );

	test.beforeEach( async ( { requestUtils } ) => {
		await requestUtils.setGutenbergExperiments( EXPERIMENTS );
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await Promise.all( [
			requestUtils.setGutenbergExperiments( [] ),
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
			const summary = await openPostSummary( { editor, page } );
			await expect(
				summary.getByRole( 'button', { name: 'Edit Template' } )
			).toHaveAccessibleDescription( 'Single Entries' );
			await updateSiteSettings( { requestUtils, pageId: newPage.id } );
			await page.reload();
			await openPostSummary( { editor, page } );
			await expect(
				summary.getByRole( 'button', { name: 'Edit Template' } )
			).toHaveAccessibleDescription( 'Index' );
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
			const summary = await openPostSummary( { editor, page } );
			await expect(
				summary.getByRole( 'button', { name: 'Edit Template' } )
			).toHaveAccessibleDescription( 'Index' );
		} );
	} );
} );
