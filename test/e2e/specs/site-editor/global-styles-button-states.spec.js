/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Global Styles - Button States', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test.beforeEach( async ( { admin, requestUtils } ) => {
		await requestUtils.deleteAllPosts();
		await admin.visitSiteEditor( {
			postId: 'emptytheme//index',
			postType: 'wp_template',
			canvas: 'edit',
		} );
	} );

	test( 'As a user I want to set button hover background color and see it applied on the frontend', async ( {
		admin,
		editor,
		page,
	} ) => {
		await page
			.getByRole( 'region', { name: 'Editor top bar' } )
			.getByRole( 'button', { name: 'Styles' } )
			.click();

		await page
			.getByRole( 'region', { name: 'Editor settings' } )
			.getByRole( 'button', { name: 'Blocks' } )
			.click();

		await page
			.getByRole( 'button', { name: 'Button', exact: true } )
			.click();

		const stateDropdown = page
			.getByRole( 'region', { name: 'Editor settings' } )
			.getByRole( 'button', { name: /State:/ } );

		await expect( stateDropdown ).toBeVisible();

		await stateDropdown.click();

		await page
			.getByRole( 'menuitem', { name: 'Hover', exact: true } )
			.click();

		await page.getByRole( 'button', { name: 'Background' } ).click();

		await page
			.getByRole( 'option', { name: 'Luminous vivid orange' } )
			.click();

		await page
			.getByRole( 'region', { name: 'Editor top bar' } )
			.getByRole( 'button', { name: 'Save' } )
			.click();

		await page
			.getByRole( 'region', { name: 'Editor publish' } )
			.getByRole( 'button', { name: 'Save', exact: true } )
			.click();

		await expect(
			page.getByRole( 'button', { name: 'Dismiss this notice' } )
		).toBeVisible();

		await admin.createNewPost();

		await editor.insertBlock( { name: 'core/buttons' } );

		const buttonBlock = editor.canvas
			.getByRole( 'document', { name: 'Block: Button' } )
			.getByRole( 'textbox' );

		await buttonBlock.fill( 'Test Button' );

		const postId = await editor.publishPost();

		await page.goto( `/?p=${ postId }` );

		const frontendButton = page.getByText( 'Test Button' );

		await expect( frontendButton ).toBeVisible();

		await frontendButton.hover();

		await expect( frontendButton ).toHaveCSS(
			'background-color',
			'rgb(255, 105, 0)'
		);
	} );
} );
