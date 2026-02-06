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

	test( 'should show confirmation checkbox and disabled Delete button when removing Post Content block', async ( {
		admin,
		page,
	} ) => {
		// Navigate to the singular template which contains a Post Content block.
		await admin.visitSiteEditor( {
			postId: 'emptytheme//singular',
			postType: 'wp_template',
			canvas: 'edit',
		} );

		// Open and focus List View.
		await page
			.getByRole( 'region', { name: 'Editor top bar' } )
			.getByRole( 'button', { name: 'Document Overview' } )
			.click();

		// The singular template has Post Content at the top level.
		const listView = page.getByRole( 'region', {
			name: 'Document Overview',
		} );
		await listView.getByRole( 'link', { name: 'Content' } ).click();
		await page.keyboard.press( 'Backspace' );

		// Verify the modal appears with the confirmation checkbox.
		const dialog = page.getByRole( 'dialog' );
		await expect( dialog ).toBeVisible();

		const checkbox = dialog.getByRole( 'checkbox', {
			name: 'I understand the consequences',
		} );
		await expect( checkbox ).toBeVisible();

		// The Delete button should be disabled before the checkbox is checked.
		const deleteButton = dialog.getByRole( 'button', {
			name: 'Delete',
		} );
		await expect( deleteButton ).toBeDisabled();

		// Check the confirmation checkbox.
		await checkbox.click();

		// The Delete button should now be enabled.
		await expect( deleteButton ).toBeEnabled();
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
