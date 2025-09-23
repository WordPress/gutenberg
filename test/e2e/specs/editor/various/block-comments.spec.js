/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Block Comments', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.setGutenbergExperiments( [
			'gutenberg-block-comment',
		] );
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await Promise.all( [
			requestUtils.deleteAllComments( 'block_comment' ),
			requestUtils.setGutenbergExperiments( [] ),
		] );
	} );

	test( 'can pin and unpin comments sidebar', async ( { page } ) => {
		const topBarButton = page
			.getByRole( 'region', { name: 'Editor top bar' } )
			.getByRole( 'button', { name: 'Comments', exact: true } );
		await topBarButton.click();

		await page
			.getByRole( 'button', { name: 'Unpin from toolbar' } )
			.click();
		await expect( topBarButton ).toBeHidden();
		await page.getByRole( 'button', { name: 'Pin to toolbar' } ).click();
		await expect( topBarButton ).toBeVisible();
	} );

	test( 'can add a comment to a block', async ( { editor, page } ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: {
				content: 'Testing block comments',
			},
		} );
		await editor.clickBlockOptionsMenuItem( 'Comment' );
		await page
			.getByRole( 'textbox', { name: 'Comment' } )
			.fill( 'Test comment' );
		await page
			.getByRole( 'region', { name: 'Editor settings' } )
			.getByRole( 'button', { name: 'Comment', exact: true } )
			.click();

		// Currently, the class locator is the easiest way to find the comment text.
		await expect(
			page.locator( '.editor-collab-sidebar-panel__user-comment' )
		).toHaveText( 'Test comment' );
	} );

	test( 'can reply to a block comment', async ( { editor, page } ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: {
				content: 'Testing block comments',
			},
		} );
		const commentForm = page.getByRole( 'textbox', { name: 'Comment' } );
		const commentText = page
			.locator( '.editor-collab-sidebar-panel__user-comment' )
			.last();

		await editor.clickBlockOptionsMenuItem( 'Comment' );

		await commentForm.fill( 'Test comment' );
		await page
			.getByRole( 'region', { name: 'Editor settings' } )
			.getByRole( 'button', { name: 'Comment', exact: true } )
			.click();
		await expect( commentText ).toHaveText( 'Test comment' );

		await commentForm.fill( 'Test reply' );
		await page
			.getByRole( 'region', { name: 'Editor settings' } )
			.getByRole( 'button', { name: 'Reply', exact: true } )
			.click();
		await expect( commentText ).toHaveText( 'Test reply' );
	} );

	test( 'can edit a block comment', async ( { editor, page } ) => {
		await editor.insertBlock( {
			name: 'core/heading',
			attributes: {
				content: 'Testing block comments',
			},
		} );
		await editor.clickBlockOptionsMenuItem( 'Comment' );
		await page
			.getByRole( 'textbox', { name: 'Comment' } )
			.fill( 'Test comment before edit.' );
		await page
			.getByRole( 'region', { name: 'Editor settings' } )
			.getByRole( 'button', { name: 'Comment', exact: true } )
			.click();
		await page.getByRole( 'button', { name: 'Select an action' } ).click();
		await page.getByRole( 'menuitem', { name: 'Edit' } ).click();
		await page
			.getByRole( 'textbox', { name: 'Comment' } )
			.first()
			.fill( 'Test comment after edit.' );
		await page
			.getByRole( 'region', { name: 'Editor settings' } )
			.getByRole( 'button', { name: 'Update', exact: true } )
			.click();

		await expect(
			page.locator( '.editor-collab-sidebar-panel__user-comment' )
		).toHaveText( 'Test comment after edit.' );
	} );

	test( 'can delete a block comment', async ( { editor, page } ) => {
		await editor.insertBlock( {
			name: 'core/heading',
			attributes: {
				content: 'Testing block comments',
			},
		} );
		await editor.clickBlockOptionsMenuItem( 'Comment' );
		await page
			.getByRole( 'textbox', { name: 'Comment' } )
			.fill( 'Test comment to delete.' );
		await page
			.getByRole( 'region', { name: 'Editor settings' } )
			.getByRole( 'button', { name: 'Comment', exact: true } )
			.click();
		await page.getByRole( 'button', { name: 'Select an action' } ).click();
		await page.getByRole( 'menuitem', { name: 'Delete' } ).click();
		await page
			.getByRole( 'dialog' )
			.getByRole( 'button', { name: 'Delete' } )
			.click();

		await expect(
			page.locator( '.editor-collab-sidebar-panel__user-comment' )
		).toBeHidden();
	} );

	test( 'can resolve and reopen a block comment', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/heading',
			attributes: {
				content: 'Testing block comments',
			},
		} );
		await editor.clickBlockOptionsMenuItem( 'Comment' );
		await page
			.getByRole( 'textbox', { name: 'Comment' } )
			.fill( 'Test comment to resolve.' );
		await page
			.getByRole( 'region', { name: 'Editor settings' } )
			.getByRole( 'button', { name: 'Comment', exact: true } )
			.click();

		const resolveButton = page.getByRole( 'button', { name: 'Resolve' } );
		await resolveButton.click();
		await expect( resolveButton ).toBeDisabled();

		await page.getByRole( 'button', { name: 'Select an action' } ).click();
		await page.getByRole( 'menuitem', { name: 'Reopen' } ).click();
		await expect( resolveButton ).toBeEnabled();
	} );
} );
