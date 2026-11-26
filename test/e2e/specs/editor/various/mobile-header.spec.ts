import { test, expect } from '@wordpress/e2e-test-utils-playwright';

test.describe( 'Editor header on a phone', () => {
	test.beforeEach( async ( { page } ) => {
		await page.setViewportSize( { width: 375, height: 667 } );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllPosts();
	} );

	test( 'shows undo and redo, and previews from the options menu', async ( {
		admin,
		editor,
		page,
	} ) => {
		await admin.createNewPost();
		const toolbar = page.getByRole( 'region', {
			name: 'Editor top bar',
			exact: true,
		} );

		await editor.canvas
			.getByRole( 'textbox', { name: 'Add title', exact: true } )
			.fill( 'Title' );

		await expect(
			toolbar.getByRole( 'button', { name: 'Undo', exact: true } )
		).toBeVisible();
		await expect(
			toolbar.getByRole( 'button', { name: 'Redo', exact: true } )
		).toBeVisible();
		await expect(
			toolbar.getByRole( 'link', {
				name: 'Preview (opens in a new tab)',
				exact: true,
			} )
		).toHaveCount( 0 );

		await toolbar
			.getByRole( 'button', { name: 'Options', exact: true } )
			.click();

		await expect(
			page.getByRole( 'menuitem', {
				name: 'Preview (opens in a new tab)',
				exact: true,
			} )
		).toBeVisible();
	} );

	test( 'shows View post in the options menu for a published post', async ( {
		admin,
		page,
		requestUtils,
	} ) => {
		const { id } = await requestUtils.createPost( {
			title: 'Published',
			status: 'publish',
			date_gmt: '2026-01-01T00:00:00',
		} );
		await admin.editPost( id );

		await page
			.getByRole( 'region', { name: 'Editor top bar', exact: true } )
			.getByRole( 'button', { name: 'Options', exact: true } )
			.click();

		await expect(
			page.getByRole( 'menuitem', {
				name: 'View Post (opens in a new tab)',
				exact: true,
			} )
		).toBeVisible();
	} );
} );
