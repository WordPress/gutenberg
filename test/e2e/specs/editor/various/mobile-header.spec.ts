import { test, expect } from '@wordpress/e2e-test-utils-playwright';

test.describe( 'Editor header on a phone', () => {
	test.beforeEach( async ( { admin, page } ) => {
		await page.setViewportSize( { width: 375, height: 667 } );
		await admin.createNewPost();
	} );

	test( 'shows undo and redo, and previews from the options menu', async ( {
		editor,
		page,
	} ) => {
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
			toolbar.getByRole( 'button', {
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
} );
