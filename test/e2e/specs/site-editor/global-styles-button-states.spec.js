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

		await page
			.getByRole( 'button', { name: 'Color options', exact: true } )
			.click();

		await page.getByRole( 'button', { name: 'Background' } ).click();

		const backgroundColorButton = page
			.getByRole( 'button', { name: 'Color: Orange' } )
			.first();

		await backgroundColorButton.click();

		await page
			.getByRole( 'region', { name: 'Editor top bar' } )
			.getByRole( 'button', { name: 'Save' } )
			.click();

		await page
			.getByRole( 'region', { name: 'Save panel' } )
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

		await editor.publishPost();

		const postId = await editor.getPostId();

		await page.goto( `/?p=${ postId }` );

		const frontendButton = page.getByRole( 'link', {
			name: 'Test Button',
		} );

		await expect( frontendButton ).toBeVisible();

		await frontendButton.hover();

		await expect( frontendButton ).toHaveCSS(
			'background-color',
			'rgb(255, 165, 0)'
		);
	} );
} );
