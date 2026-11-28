import { test, expect } from '@wordpress/e2e-test-utils-playwright';

// Whether the run targets the extensible site editor (v2), which lives at
// `admin.php?page=site-editor-v2` and routes via the `p` query param.
const isSiteEditorV2 = !! process.env.GUTENBERG_E2E_SITE_EDITOR_V2;

test.describe( 'Home preview', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.updateSiteSettings( {
			show_on_front: 'posts',
			page_on_front: 0,
		} );
		await requestUtils.deleteAllPages();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test( 'opens the template that shows the front page for editing', async ( {
		admin,
		page,
	} ) => {
		await admin.visitSiteEditor();

		const editButton = page.getByRole( 'button', {
			name: 'Edit',
			exact: true,
		} );
		await editButton.click();

		await expect( page ).toHaveURL(
			isSiteEditorV2
				? /[?&]p=%2Ftypes%2Fwp_template%2Fedit%2F/
				: /[?&]canvas=edit(&|$)/
		);
		await expect( editButton ).toBeHidden();
	} );

	test( 'opens a static front page for editing', async ( {
		admin,
		page,
		requestUtils,
	} ) => {
		const frontPage = await requestUtils.createPage( {
			title: 'Front page',
			status: 'publish',
		} );
		await requestUtils.updateSiteSettings( {
			show_on_front: 'page',
			page_on_front: frontPage.id,
		} );

		await admin.visitSiteEditor();

		const editButton = page.getByRole( 'button', {
			name: 'Edit',
			exact: true,
		} );
		await editButton.click();

		await expect( page ).toHaveURL(
			isSiteEditorV2
				? new RegExp(
						`[?&]p=%2Ftypes%2Fpage%2Fedit%2F${ frontPage.id }(&|$)`
					)
				: /[?&]canvas=edit(&|$)/
		);
		await expect( editButton ).toBeHidden();
	} );

	// The classic site editor has no equivalent of a route that names a post
	// type but no post.
	test( 'does not open the home page from a route that names only a post type', async ( {
		admin,
		page,
		requestUtils,
	} ) => {
		test.skip(
			! isSiteEditorV2,
			'Only the extensible site editor routes a canvas by post type alone.'
		);

		// With no menus, the navigation route names the post type but no post.
		await requestUtils.deleteAllMenus();
		await admin.visitSiteEditor( { postType: 'wp_navigation' } );

		await expect(
			page.getByRole( 'button', { name: 'Add New', exact: true } )
		).toBeVisible();

		// Wait for the canvas to finish loading before asserting that nothing
		// is there to click. Had the home page been resolved, its overlay
		// would only appear once the editor had loaded, so asserting earlier
		// would pass even if it were.
		await expect( page.locator( '.components-spinner' ) ).toHaveCount( 0 );

		await expect(
			page.getByRole( 'button', { name: 'Edit', exact: true } )
		).toHaveCount( 0 );
	} );
} );
