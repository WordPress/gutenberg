/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Comments Form', () => {
	let originalCommentStatus;

	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
		await requestUtils.deleteAllTemplates( 'wp_template' );
	} );

	test.beforeEach( async ( { requestUtils } ) => {
		const siteSettings = await requestUtils.getSiteSettings();
		originalCommentStatus = siteSettings.default_comment_status;
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.updateSiteSettings( {
			default_comment_status: originalCommentStatus,
		} );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test( 'placeholder displays in the site editor even when comments are closed by default', async ( {
		admin,
		editor,
	} ) => {
		// Navigate to "Singular" post template
		await admin.visitSiteEditor( {
			postId: 'emptytheme//singular',
			postType: 'wp_template',
			canvas: 'edit',
		} );

		// Insert post comments form
		await editor.insertBlock( { name: 'core/post-comments-form' } );

		// Ensure the placeholder is there
		const postCommentsFormBlock = editor.canvas.locator(
			'role=document[name="Block: Comments Form"i]'
		);
		await expect( postCommentsFormBlock.locator( 'form' ) ).toBeVisible();
	} );
} );
