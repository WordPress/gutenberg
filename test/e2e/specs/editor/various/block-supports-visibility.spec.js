/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Block Visibility Breakpoints', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'allows hiding blocks on all breakpoints via context menu', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		// Insert a paragraph block.
		await editor.insertBlock( { name: 'core/paragraph' } );
		await page.keyboard.type( 'Test paragraph' );

		// Select the block via keyboard.
		await pageUtils.pressKeys( 'primary+a' );

		// Open the block options menu and click Hide/Show.
		await editor.clickBlockOptionsMenuItem( 'Hide' );

		const hideMenuItem = page.getByRole( 'menuitem', {
			name: 'Hide',
			includeHidden: true, // the option is hidden behind modal but assertion is still valid.
		} );

		await expect( hideMenuItem ).toHaveAttribute( 'aria-expanded', 'true' );

		const visibilityModal = page.getByRole( 'dialog', {
			name: 'Hide Paragraph',
		} );

		// Check the Modal is visible.
		await expect( visibilityModal ).toBeVisible();

		// Check all three breakpoint checkboxes (mobile, tablet, desktop).
		await visibilityModal
			.getByRole( 'checkbox', { name: 'Hide on desktop' } )
			.check();
		await visibilityModal
			.getByRole( 'checkbox', { name: 'Hide on tablet' } )
			.check();
		await visibilityModal
			.getByRole( 'checkbox', { name: 'Hide on mobile' } )
			.check();

		// Click Apply button.
		const applyButton = visibilityModal.getByRole( 'button', {
			name: 'Apply',
			type: 'submit',
		} );
		await applyButton.click();

		// Modal should close.
		await expect( visibilityModal ).toBeHidden();

		// Check that the block has the correct visibility attributes.
		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: {
					metadata: {
						blockVisibilityBreakpoints: {
							mobile: true,
							tablet: true,
							desktop: true,
						},
					},
				},
			},
		] );
	} );

	test( 'allows hiding blocks on specific breakpoints', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		// Insert a paragraph block.
		await editor.insertBlock( { name: 'core/paragraph' } );
		await page.keyboard.type( 'Test paragraph' );

		// Select the block.
		await pageUtils.pressKeys( 'primary+a' );

		// Open the visibility modal.
		await editor.clickBlockOptionsMenuItem( 'Hide' );

		const visibilityModal = page.getByRole( 'dialog', {
			name: 'Hide Paragraph',
		} );

		await expect( visibilityModal ).toBeVisible();

		// Check only mobile and tablet.
		await visibilityModal
			.getByRole( 'checkbox', { name: 'Hide on mobile' } )
			.check();
		await visibilityModal
			.getByRole( 'checkbox', { name: 'Hide on tablet' } )
			.check();

		// Apply changes.
		await visibilityModal
			.getByRole( 'button', { name: 'Apply', type: 'submit' } )
			.click();

		await expect( visibilityModal ).toBeHidden();

		// Verify attributes.
		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: {
					metadata: {
						blockVisibilityBreakpoints: {
							mobile: true,
							tablet: true,
							desktop: false,
						},
					},
				},
			},
		] );
	} );

	test( 'allows hiding block everywhere (blockVisibility: false)', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		// Insert a paragraph block.
		await editor.insertBlock( { name: 'core/paragraph' } );
		await page.keyboard.type( 'Test paragraph' );

		// Select the block.
		await pageUtils.pressKeys( 'primary+a' );

		// Open the visibility modal.
		await editor.clickBlockOptionsMenuItem( 'Hide' );

		const visibilityModal = page.getByRole( 'dialog', {
			name: 'Hide Paragraph',
		} );

		await expect( visibilityModal ).toBeVisible();

		// Check "Hide from published document".
		await visibilityModal
			.getByRole( 'checkbox', { name: 'Hide from published document' } )
			.check();

		// Apply changes.
		await visibilityModal
			.getByRole( 'button', { name: 'Apply', type: 'submit' } )
			.click();

		await expect( visibilityModal ).toBeHidden();

		// Verify attributes - blockVisibility should be false and all breakpoints should be true.
		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: {
					metadata: {
						blockVisibility: false,
						blockVisibilityBreakpoints: {
							mobile: true,
							tablet: true,
							desktop: true,
						},
					},
				},
			},
		] );
	} );

	test( 'cancelling modal does not apply changes', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		// Insert a paragraph block.
		await editor.insertBlock( { name: 'core/paragraph' } );
		await page.keyboard.type( 'Test paragraph' );

		// Select the block.
		await pageUtils.pressKeys( 'primary+a' );

		// Open the visibility modal.
		await editor.clickBlockOptionsMenuItem( 'Hide' );

		const visibilityModal = page.getByRole( 'dialog', {
			name: 'Hide Paragraph',
		} );

		await expect( visibilityModal ).toBeVisible();

		// Check some checkboxes.
		await visibilityModal
			.getByRole( 'checkbox', { name: 'Hide on mobile' } )
			.check();
		await visibilityModal
			.getByRole( 'checkbox', { name: 'Hide on desktop' } )
			.check();

		// Click Cancel button instead of Apply.
		await visibilityModal.getByRole( 'button', { name: 'Cancel' } ).click();

		await expect( visibilityModal ).toBeHidden();

		// Verify attributes remain unchanged (no visibility settings).
		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: expect.not.objectContaining( {
					metadata: expect.objectContaining( {
						blockVisibility: expect.anything(),
						blockVisibilityBreakpoints: expect.anything(),
					} ),
				} ),
			},
		] );
	} );

	test( 'can reopen modal to modify visibility settings', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		// Insert a paragraph block.
		await editor.insertBlock( { name: 'core/paragraph' } );
		await page.keyboard.type( 'Test paragraph' );

		// Select the block.
		await pageUtils.pressKeys( 'primary+a' );

		// Hide the block on mobile.
		await editor.clickBlockOptionsMenuItem( 'Hide' );

		const visibilityModal = page.getByRole( 'dialog', {
			name: 'Hide Paragraph',
		} );

		await visibilityModal
			.getByRole( 'checkbox', { name: 'Hide on mobile' } )
			.check();
		await visibilityModal
			.getByRole( 'button', { name: 'Apply', type: 'submit' } )
			.click();

		// Verify mobile visibility was set.
		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: {
					metadata: {
						blockVisibilityBreakpoints: {
							mobile: true,
						},
					},
				},
			},
		] );

		// Reopen the modal to modify settings using keyboard shortcut.
		// Re-select the block first to ensure it's active.
		await pageUtils.pressKeys( 'primary+a' );
		// Use keyboard shortcut to reopen the modal.
		await pageUtils.pressKeys( 'primary+shift+h' );

		await expect( visibilityModal ).toBeVisible();

		// The mobile checkbox should still be checked.
		const mobileCheckbox = visibilityModal.getByRole( 'checkbox', {
			name: 'Hide on mobile',
		} );
		await expect( mobileCheckbox ).toBeChecked();

		// Now also hide on desktop.
		await visibilityModal
			.getByRole( 'checkbox', { name: 'Hide on desktop' } )
			.check();
		await visibilityModal
			.getByRole( 'button', { name: 'Apply', type: 'submit' } )
			.click();

		// Verify both mobile and desktop are now set.
		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: {
					metadata: {
						blockVisibilityBreakpoints: {
							mobile: true,
							desktop: true,
						},
					},
				},
			},
		] );
	} );

	test( 'works with keyboard shortcut', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		// Insert a paragraph block.
		await editor.insertBlock( { name: 'core/paragraph' } );
		await page.keyboard.type( 'Test paragraph' );

		// Select the block.
		await pageUtils.pressKeys( 'primary+a' );

		// Trigger visibility modal with keyboard shortcut (Cmd+Shift+H).
		await pageUtils.pressKeys( 'primary+shift+h' );

		const visibilityModal = page.getByRole( 'dialog', {
			name: 'Hide Paragraph',
		} );

		await expect( visibilityModal ).toBeVisible();

		// Hide on mobile.
		await visibilityModal
			.getByRole( 'checkbox', { name: 'Hide on mobile' } )
			.check();

		await visibilityModal
			.getByRole( 'button', { name: 'Apply', type: 'submit' } )
			.click();

		await expect( visibilityModal ).toBeHidden();

		// Verify attributes.
		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: {
					metadata: {
						blockVisibilityBreakpoints: {
							mobile: true,
						},
					},
				},
			},
		] );
	} );
} );
