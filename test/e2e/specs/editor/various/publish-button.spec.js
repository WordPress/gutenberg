/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Post publish button', () => {
	test.beforeEach( async ( { admin, page } ) => {
		await admin.createNewPost();
		await page.evaluate( () => {
			window.wp.data.dispatch( 'core/editor' ).disablePublishSidebar();
		} );
	} );

	test.afterEach( async ( { page } ) => {
		await page.evaluate( () => {
			window.wp.data.dispatch( 'core/editor' ).enablePublishSidebar();
		} );
	} );

	test( 'should be disabled when post is not saveable', async ( {
		page,
	} ) => {
		await expect(
			page
				.getByRole( 'region', { name: 'Editor top bar' } )
				.getByRole( 'button', { name: 'Publish' } )
		).toBeDisabled();
	} );

	test( 'should be disabled when post is being saved', async ( {
		editor,
		page,
	} ) => {
		await editor.canvas.type(
			'role=textbox[name="Add title"i]',
			'Test post'
		);

		const topBar = page.getByRole( 'region', { name: 'Editor top bar' } );
		await expect(
			topBar.getByRole( 'button', { name: 'Publish' } )
		).toBeEnabled();

		await topBar.getByRole( 'button', { name: 'Save draft' } ).click();
		await expect(
			topBar.getByRole( 'button', { name: 'Publish' } )
		).toBeDisabled();
	} );

	test( 'should be disabled when metabox is being saved', async ( {
		editor,
		page,
	} ) => {
		await editor.canvas.type(
			'role=textbox[name="Add title"i]',
			'Test post'
		);

		const topBar = page.getByRole( 'region', { name: 'Editor top bar' } );
		await expect(
			topBar.getByRole( 'button', { name: 'Publish' } )
		).toBeEnabled();

		await page.evaluate( () => {
			window.wp.data.dispatch( 'core/edit-post' ).requestMetaBoxUpdates();
		} );

		await expect(
			topBar.getByRole( 'button', { name: 'Publish' } )
		).toBeDisabled();
	} );
} );
