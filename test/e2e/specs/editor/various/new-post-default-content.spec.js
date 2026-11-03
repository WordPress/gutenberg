const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );
const { openPostSummary } = require( './post-summary/utils' );

test.describe( 'new editor filtered state', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activatePlugin(
			'gutenberg-test-plugin-default-post-content'
		);
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deactivatePlugin(
			'gutenberg-test-plugin-default-post-content'
		);
		await requestUtils.deleteAllPosts();
	} );

	test( 'should respect default content', async ( { editor, page } ) => {
		const summary = await openPostSummary( { editor, page } );
		// Assert they match what the plugin set.
		await expect(
			editor.canvas.locator( 'role=textbox[name="Add title"i]' )
		).toHaveText( 'My default title' );
		await expect
			.poll( editor.getEditedPostContent )
			.toBe( 'My default content' );
		await summary.getByRole( 'button', { name: 'Edit Excerpt' } ).click();
		await expect(
			page.getByRole( 'textbox', { name: 'Excerpt' } )
		).toHaveValue( 'My default excerpt' );
	} );
} );
