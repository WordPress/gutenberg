/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

// This tests are not together with the remaining sidebar tests,
// because we need to publish/save a post, to correctly test the permalink row.
// The sidebar test suit enforces that focus is never lost, but during save operations
// the focus is lost and a new element is focused once the save is completed.
test.describe( 'Sidebar Permalink', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activatePlugin( 'gutenberg-test-custom-post-types' );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deactivatePlugin(
			'gutenberg-test-custom-post-types'
		);
	} );

	test( 'should not render URL when post is publicly queryable but not public', async ( {
		admin,
		editor,
		page,
	} ) => {
		await admin.createNewPost( { postType: 'public_q_not_public' } );
		await editor.openDocumentSettingsSidebar();
		await editor.canvas
			.getByRole( 'textbox', { name: 'Add title' } )
			.fill( 'aaaaa' );
		await editor.publishPost();
		// Start editing again.
		await editor.canvas
			.getByRole( 'textbox', { name: 'Add title' } )
			.fill( 'aaaa (Updated)' );
		await expect(
			page.getByRole( 'button', { name: 'Change link' } )
		).toBeHidden();
	} );

	test( 'should not render URL when post is public but not publicly queryable', async ( {
		admin,
		editor,
		page,
	} ) => {
		await admin.createNewPost( { postType: 'not_public_q_public' } );
		await editor.openDocumentSettingsSidebar();
		await editor.canvas
			.getByRole( 'textbox', { name: 'Add title' } )
			.fill( 'aaaaa' );
		await editor.publishPost();
		// Start editing again.
		await editor.canvas
			.getByRole( 'textbox', { name: 'Add title' } )
			.fill( 'aaaa (Updated)' );
		await expect(
			page.getByRole( 'button', { name: 'Change link' } )
		).toBeHidden();
	} );

	test( 'should render URL when post is public and publicly queryable', async ( {
		admin,
		editor,
		page,
	} ) => {
		await admin.createNewPost( { postType: 'public_q_public' } );
		await editor.openDocumentSettingsSidebar();
		await editor.canvas
			.getByRole( 'textbox', { name: 'Add title' } )
			.fill( 'aaaaa' );
		await editor.publishPost();

		// Start editing again.
		await editor.canvas
			.getByRole( 'textbox', { name: 'Add title' } )
			.fill( 'aaaa (Updated)' );
		await expect(
			page.getByRole( 'button', { name: 'Change link' } )
		).toBeVisible();
	} );
} );
