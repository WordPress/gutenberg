const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Canvas as a single tab stop', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	async function hasTextSelection( page ) {
		return page.evaluate( () => {
			const { getSelectionStart } =
				window.wp.data.select( 'core/block-editor' );
			return getSelectionStart().attributeKey !== undefined;
		} );
	}

	test( 'Escape steps out onto the canvas stop and Enter goes back in', async ( {
		editor,
		page,
	} ) => {
		await editor.openDocumentSettingsSidebar();
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'First' },
		} );
		await editor.canvas.getByText( 'First' ).click();
		await expect.poll( () => hasTextSelection( page ) ).toBe( true );

		await page.keyboard.press( 'Escape' );
		const stopBefore = page
			.getByRole( 'button', { name: 'Editor canvas' } )
			.first();
		await expect( stopBefore ).toBeFocused();
		// The focused stop shows its hint badge.
		await expect(
			page.getByText( 'Press Enter to edit the document' ).first()
		).toBeVisible();

		// The block selection is left as it is.
		await expect
			.poll( editor.getBlocks )
			.toMatchObject( [
				{ name: 'core/paragraph', attributes: { content: 'First' } },
			] );

		// Tab from the stop skips the whole canvas onwards.
		await page.keyboard.press( 'Tab' );
		await expect
			.poll( () =>
				page.evaluate( () =>
					Boolean(
						document.activeElement.closest(
							'[aria-label="Editor settings"]'
						)
					)
				)
			)
			.toBe( true );

		// Shift+Tab from the sidebar lands back on the stop, and another
		// Shift+Tab skips the whole canvas backwards, onto the block toolbar
		// floating over it.
		await page.keyboard.press( 'Shift+Tab' );
		await expect( stopBefore ).toBeFocused();
		await page.keyboard.press( 'Shift+Tab' );
		await expect
			.poll( () =>
				page.evaluate( () =>
					Boolean(
						document.activeElement.closest(
							'[aria-label="Block tools"]'
						)
					)
				)
			)
			.toBe( true );

		// Enter on the stop goes back to where focus left the canvas.
		await page.keyboard.press( 'Tab' );
		await expect( stopBefore ).toBeFocused();
		await page.keyboard.press( 'Enter' );
		await expect(
			editor.canvas.getByRole( 'document', {
				name: 'Block: Paragraph',
			} )
		).toBeFocused();
		await expect.poll( () => hasTextSelection( page ) ).toBe( true );
	} );

	test( 'Escape on the stop goes back in too', async ( { editor, page } ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'First' },
		} );
		await editor.canvas.getByText( 'First' ).click();

		await page.keyboard.press( 'Escape' );
		await expect(
			page.getByRole( 'button', { name: 'Editor canvas' } ).first()
		).toBeFocused();

		await page.keyboard.press( 'Escape' );
		await expect(
			editor.canvas.getByRole( 'document', {
				name: 'Block: Paragraph',
			} )
		).toBeFocused();
	} );
} );
