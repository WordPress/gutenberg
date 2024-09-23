/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Post publish panel', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'should move focus back to the Publish panel toggle button when canceling', async ( {
		editor,
		page,
	} ) => {
		// Add a paragraph block.
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Dummy text' },
		} );

		// Find and click the Publish panel toggle button.
		const publishPanelToggleButton = page.locator(
			'role=region[name="Editor top bar"i] >> role=button[name="Publish"i]'
		);
		await publishPanelToggleButton.click();

		// Click the Cancel button.
		await page.click(
			'role=region[name="Editor publish"i] >> role=button[name="Cancel"i]'
		);

		// Test focus is moved back to the Publish panel toggle button.
		await expect( publishPanelToggleButton ).toBeFocused();
	} );

	test( 'should move focus back to the Publish panel toggle button after publishing and closing the panel', async ( {
		editor,
		page,
	} ) => {
		// Insert a paragraph block.
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Dummy text' },
		} );

		await editor.publishPost();

		// Close the publish panel.
		await page.click(
			'role=region[name="Editor publish"i] >> role=button[name="Close panel"i]'
		);

		// Test focus is moved back to the Publish panel toggle button.
		await expect(
			page.locator(
				'role=region[name="Editor top bar"i] >> role=button[name="Save"i]'
			)
		).toBeFocused();
	} );

	test( 'should move focus to the cancel button in the panel', async ( {
		editor,
		page,
	} ) => {
		await editor.canvas
			.getByRole( 'textbox', { name: 'Add title' } )
			.fill( 'Test Post' );
		await page
			.getByRole( 'region', 'Editor top bar' )
			.getByRole( 'button', { name: 'Publish', exact: true } )
			.click();

		await expect(
			page
				.getByRole( 'region', { name: 'Editor publish' } )
				.locator( ':focus' )
		).toHaveText( 'Cancel' );
	} );

	test( 'should focus on the post list after publishing', async ( {
		editor,
		page,
	} ) => {
		await editor.canvas
			.getByRole( 'textbox', { name: 'Add title' } )
			.fill( 'Test Post' );
		await editor.publishPost();

		await expect(
			page
				.getByRole( 'region', { name: 'Editor publish' } )
				.locator( ':focus' )
		).toHaveText( 'Test Post' );
	} );

	test( 'should retain focus within the panel', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.canvas
			.getByRole( 'textbox', { name: 'Add title' } )
			.fill( 'Test Post' );
		await page
			.getByRole( 'region', 'Editor top bar' )
			.getByRole( 'button', { name: 'Publish', exact: true } )
			.click();
		await pageUtils.pressKeys( 'shift+Tab' );

		await expect(
			page.getByRole( 'checkbox', {
				name: 'Always show pre-publish checks.',
			} )
		).toBeFocused();
	} );
} );
