/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Site editor block removal prompt', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.visitSiteEditor( {
			postId: 'emptytheme//index',
			postType: 'wp_template',
			canvas: 'edit',
		} );
	} );

	test( 'should appear when attempting to remove Query Block', async ( {
		page,
	} ) => {
		// Open and focus List View
		const topBar = page.getByRole( 'region', { name: 'Editor top bar' } );
		await topBar
			.getByRole( 'button', { name: 'Document Overview' } )
			.click();

		// Select and try to remove Query Loop block
		const listView = page.getByRole( 'region', {
			name: 'Document Overview',
		} );
		await listView.getByRole( 'link', { name: 'Query Loop' } ).click();
		await page.keyboard.press( 'Backspace' );

		// Expect the block removal prompt to have appeared
		await expect(
			page.getByText(
				'Some of the deleted blocks will stop your post or page content from displaying on this template. It is not recommended.'
			)
		).toBeVisible();
	} );

	test( 'should appear when attempting to remove Post Template Block', async ( {
		page,
	} ) => {
		// Open and focus List View
		const topBar = page.getByRole( 'region', { name: 'Editor top bar' } );
		await topBar
			.getByRole( 'button', { name: 'Document Overview' } )
			.click();

		// Select and open child blocks of Query Loop block
		const listView = page.getByRole( 'region', {
			name: 'Document Overview',
		} );
		await listView.getByRole( 'link', { name: 'Query Loop' } ).click();
		await page.keyboard.press( 'ArrowRight' );

		// Select and try to remove Post Template block
		await listView.getByRole( 'link', { name: 'Post Template' } ).click();
		await page.keyboard.press( 'Backspace' );

		// Expect the block removal prompt to have appeared
		await expect(
			page.getByText(
				'Some of the deleted blocks will stop your post or page content from displaying on this template. It is not recommended.'
			)
		).toBeVisible();
	} );

	test( 'should not appear when attempting to remove something else', async ( {
		editor,
		page,
	} ) => {
		// Open and focus List View
		const topBar = page.getByRole( 'region', { name: 'Editor top bar' } );
		await topBar
			.getByRole( 'button', { name: 'Document Overview' } )
			.click();

		// Select Query Loop list item
		const listView = page.getByRole( 'region', {
			name: 'Document Overview',
		} );
		await listView.getByRole( 'link', { name: 'Query Loop' } ).click();

		// Reveal its inner blocks in the list view
		await page.keyboard.press( 'ArrowRight' );

		// Select its Post Template inner block
		await listView.getByRole( 'link', { name: 'Post Template' } ).click();

		// Reveal its inner blocks in the list view
		await page.keyboard.press( 'ArrowRight' );

		// Select and remove its Title inner block
		await listView.getByRole( 'link', { name: 'Title' } ).click();
		await page.keyboard.press( 'Backspace' );

		// Expect the block to have been removed with no prompt
		await expect(
			editor.canvas.getByRole( 'document', {
				name: 'Block: Title',
			} )
		).toBeHidden();
	} );
} );
