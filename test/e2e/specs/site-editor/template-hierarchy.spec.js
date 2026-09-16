const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Template hierarchy', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyfour' );
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.updateSiteSettings( {
			show_on_front: 'posts',
			page_on_front: 0,
			page_for_posts: 0,
		} );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await Promise.all( [
			requestUtils.activateTheme( 'twentytwentyone' ),
			requestUtils.deleteAllPages(),
		] );
	} );

	test( 'shows correct template with page on front option', async ( {
		admin,
		editor,
		requestUtils,
	} ) => {
		const newPage = await requestUtils.createPage( {
			title: 'Page on Front',
			status: 'publish',
			content:
				'<!-- wp:paragraph --><p>This is a page on front</p><!-- /wp:paragraph -->',
		} );
		await requestUtils.updateSiteSettings( {
			show_on_front: 'page',
			page_on_front: newPage.id,
			page_for_posts: 0,
		} );

		// Both site editors preview the resolved front page on their home
		// screen, so the resolution is verified without opening the editor.
		await admin.visitSiteEditor();
		await expect(
			editor.canvas.getByText( 'This is a page on front' )
		).toBeVisible();
	} );
} );
