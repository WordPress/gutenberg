const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

// Whether the run targets the extensible site editor (v2), which lives at
// `admin.php?page=site-editor-v2` and routes via the `p` query param.
const isSiteEditorV2 = !! process.env.GUTENBERG_E2E_SITE_EDITOR_V2;

test.describe( 'Site editor url navigation', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
		// Document-Isolation-Policy places the editor in its own agent cluster.
		// Template creation triggers URL/page navigation to pages without the
		// DIP header, creating an agent cluster mismatch that breaks
		// cross-window communication.
		await requestUtils.activatePlugin(
			'gutenberg-test-plugin-disable-client-side-media-processing'
		);
	} );

	test.beforeEach( async ( { requestUtils } ) => {
		await Promise.all( [
			requestUtils.deleteAllPosts(),
			requestUtils.deleteAllTemplates( 'wp_template' ),
			requestUtils.deleteAllTemplates( 'wp_template_part' ),
		] );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
		await requestUtils.deactivatePlugin(
			'gutenberg-test-plugin-disable-client-side-media-processing'
		);
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

		await admin.visitSiteEditor( { postType: 'wp_template' } );
		await page.getByRole( 'button', { name: 'Add Template' } ).click();
		const singleItemPost = page.getByRole( 'button', {
			name: 'Single item: Post',
		} );
		await expect( singleItemPost ).toBeEnabled();
		await singleItemPost.click();
		await page
			.getByRole( 'button', { name: 'For a specific item' } )
			.click();
		await page.getByRole( 'option', { name: 'Demo' } ).click();
		await expect( page ).toHaveURL(
			isSiteEditorV2
				? '/wp-admin/admin.php?page=site-editor-v2&p=%2Ftypes%2Fwp_template%2Fedit%2Femptytheme%252F%252Fsingle-post-demo'
				: '/wp-admin/site-editor.php?p=%2Fwp_template%2Femptytheme%2F%2Fsingle-post-demo&canvas=edit'
		);
	} );

	test( 'Redirection after template part creation', async ( {
		admin,
		page,
	} ) => {
		// Template parts are created from their own page in the extensible
		// site editor, and from the Patterns page in the classic one.
		if ( isSiteEditorV2 ) {
			await admin.visitSiteEditor( { postType: 'wp_template_part' } );
			await page
				.getByRole( 'button', { name: 'Add Template Part' } )
				.click();
		} else {
			await admin.visitSiteEditor();
			await page.getByRole( 'button', { name: 'Patterns' } ).click();
			await page.getByRole( 'button', { name: 'add pattern' } ).click();
			await page
				.getByRole( 'menu', { name: 'add pattern' } )
				.getByRole( 'menuitem', { name: 'add template part' } )
				.click();
		}
		// Fill in a name in the dialog that pops up.
		await page
			.getByRole( 'dialog' )
			.getByRole( 'textbox', { name: 'Name' } )
			.type( 'Demo' );
		await page.keyboard.press( 'Enter' );
		await expect( page ).toHaveURL(
			isSiteEditorV2
				? '/wp-admin/admin.php?page=site-editor-v2&p=%2Ftypes%2Fwp_template_part%2Fedit%2Femptytheme%252F%252Fdemo'
				: '/wp-admin/site-editor.php?p=%2Fwp_template_part%2Femptytheme%2F%2Fdemo&canvas=edit'
		);
	} );

	// The extensible site editor's Patterns page has no category sidebar;
	// template parts live on their own page there.
	test( 'The Patterns page should keep the previously selected template part category @site-editor-v1-only', async ( {
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
				name: 'General',
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
