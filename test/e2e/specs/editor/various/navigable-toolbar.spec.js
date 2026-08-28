const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Block Toolbar', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.afterEach( async ( { requestUtils } ) => {
		// Reset preferences via REST so a mid-test failure doesn't leak
		// the fixed-toolbar setting (or any other pref) to other tests.
		await requestUtils.resetPreferences();
	} );

	test.describe( 'Contextual Toolbar', () => {
		test( 'should not scroll page', async ( { page, pageUtils } ) => {
			while (
				await page.evaluate( () => {
					const { activeElement } =
						document.activeElement?.contentDocument ?? document;
					const scrollable =
						window.wp.dom.getScrollContainer( activeElement );
					return ! scrollable || scrollable.scrollTop === 0;
				} )
			) {
				await page.keyboard.press( 'Enter' );
			}

			await page.keyboard.type( 'a' );

			const scrollTopBefore = await page.evaluate( () => {
				const { activeElement } =
					document.activeElement?.contentDocument ?? document;
				window.scrollContainer =
					window.wp.dom.getScrollContainer( activeElement );
				return window.scrollContainer.scrollTop;
			} );

			await pageUtils.pressKeys( 'alt+F10' );
			await expect(
				page
					.getByRole( 'toolbar', { name: 'Block Tools' } )
					.getByRole( 'button', { name: 'Paragraph' } )
			).toBeFocused();

			const scrollTopAfter = await page.evaluate( () => {
				return window.scrollContainer.scrollTop;
			} );
			expect( scrollTopBefore ).toBe( scrollTopAfter );
		} );

		test( 'can navigate to the block toolbar and back to block using the keyboard', async ( {
			editor,
			page,
			pageUtils,
		} ) => {
			// Test navigating to block toolbar
			await editor.insertBlock( { name: 'core/paragraph' } );
			await page.keyboard.type( 'Paragraph' );
			await pageUtils.pressKeys( 'alt+F10' );
			await expect(
				page.getByRole( 'button', { name: 'Paragraph', exact: true } )
			).toBeFocused();
			// // Navigate to Align Text
			await page.keyboard.press( 'ArrowRight' );
			await page.keyboard.press( 'ArrowRight' );
			await expect(
				page.getByRole( 'button', { name: 'Align text', exact: true } )
			).toBeFocused();
			// // Open the dropdown
			await page.keyboard.press( 'Enter' );
			await expect(
				page.getByRole( 'menuitemradio', { name: 'Align text left' } )
			).toBeFocused();
			await page.keyboard.press( 'ArrowDown' );
			await expect(
				page.getByRole( 'menuitemradio', { name: 'Align text center' } )
			).toBeFocused();
			await page.keyboard.press( 'Escape' );
			await expect(
				page.getByRole( 'button', { name: 'Align text', exact: true } )
			).toBeFocused();

			// Navigate to the Bold item. Testing items via the fills within the block toolbar are especially important
			await page.keyboard.press( 'ArrowRight' );
			await expect(
				page.getByRole( 'button', { name: 'Bold', exact: true } )
			).toBeFocused();

			await pageUtils.pressKeys( 'Escape' );
			await expect
				.poll( () =>
					editor.ownsSelection(
						editor.canvas.getByRole( 'document', {
							name: 'Block: Paragraph',
						} )
					)
				)
				.toBe( true );

			await pageUtils.pressKeys( 'alt+F10' );
			await expect(
				page.getByRole( 'button', { name: 'Bold', exact: true } )
			).toBeFocused();

			await pageUtils.pressKeys( 'Escape' );

			// Try selecting text and navigating to block toolbar
			await pageUtils.pressKeys( 'Shift+ArrowLeft', {
				times: 4,
				delay: 50,
			} );
			expect(
				await editor.canvas
					.locator( ':root' )
					.evaluate( () => window.getSelection().toString() )
			).toBe( 'raph' );

			// Go back to the toolbar and apply a formatting option
			await pageUtils.pressKeys( 'alt+F10' );
			await expect(
				page.getByRole( 'button', { name: 'Bold', exact: true } )
			).toBeFocused();
			await page.keyboard.press( 'Enter' );
			// Should focus the selected text again
			expect(
				await editor.canvas
					.locator( ':root' )
					.evaluate( () => window.getSelection().toString() )
			).toBe( 'raph' );
		} );

		// The image placeholder focuses its Upload button, so the block wrapper
		// and the element that last had focus are two different elements.
		test( 'returns focus to the element within the block that had it, not the block wrapper', async ( {
			editor,
			page,
			pageUtils,
		} ) => {
			await editor.insertBlock( { name: 'core/image' } );
			await expect.poll( editor.getFocusOwnerLabel ).toBe( 'Upload' );

			await pageUtils.pressKeys( 'alt+F10' );
			await expect(
				page.getByRole( 'button', { name: 'Image', exact: true } )
			).toBeFocused();

			await pageUtils.pressKeys( 'Escape' );
			await expect.poll( editor.getFocusOwnerLabel ).toBe( 'Upload' );
		} );

		test( 'returns focus to the element within the block that had it when tabbing back into the canvas', async ( {
			editor,
			page,
			pageUtils,
		} ) => {
			await editor.insertBlock( { name: 'core/image' } );
			await expect.poll( editor.getFocusOwnerLabel ).toBe( 'Upload' );

			await pageUtils.pressKeys( 'alt+F10' );
			await expect(
				page.getByRole( 'button', { name: 'Image', exact: true } )
			).toBeFocused();

			await pageUtils.pressKeys( 'Tab' );
			await expect.poll( editor.getFocusOwnerLabel ).toBe( 'Upload' );
		} );

		// Inserting from the global inserter leaves focus in the inserter, so the
		// canvas has never been focused and there is no last focused element to
		// return to. See https://github.com/WordPress/gutenberg/pull/61472.
		test( 'returns focus to the block when the canvas has never been focused', async ( {
			editor,
			page,
			pageUtils,
		} ) => {
			// The contextual toolbar is only rendered once the canvas has been
			// interacted with, so use the fixed toolbar to reach it.
			await editor.setIsFixedToolbar( true );

			const inserterToggle = page
				.getByRole( 'region', { name: 'Editor top bar' } )
				.getByRole( 'button', { name: 'Block Inserter' } );

			await inserterToggle.click();
			await page
				.getByRole( 'region', { name: 'Block Library' } )
				.getByRole( 'searchbox', { name: 'Search' } )
				.fill( 'Separator' );
			await page
				.getByRole( 'listbox', { name: 'Blocks' } )
				.getByRole( 'option', { name: 'Separator', exact: true } )
				.click();
			await expect(
				editor.canvas.getByRole( 'document', {
					name: 'Block: Separator',
				} )
			).toBeVisible();

			// Closing the inserter keeps focus on its toggle, so the canvas is
			// still unfocused.
			await inserterToggle.click();

			await pageUtils.pressKeys( 'alt+F10' );
			await expect(
				page
					.getByRole( 'toolbar', { name: 'Block Tools' } )
					.getByRole( 'button', { name: 'Separator', exact: true } )
			).toBeFocused();

			await pageUtils.pressKeys( 'Escape' );
			await expect
				.poll( editor.getFocusOwnerLabel )
				.toBe( 'Block: Separator' );
		} );
	} );

	test( 'should focus with Shift+Tab', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.insertBlock( { name: 'core/paragraph' } );
		await page.keyboard.type( 'a' );
		await pageUtils.pressKeys( 'shift+Tab' );
		await expect(
			page
				.getByRole( 'toolbar', { name: 'Block Tools' } )
				.getByRole( 'button', { name: 'Paragraph', exact: true } )
		).toBeFocused();
	} );

	// If this test breaks, it's likely that a new div has been added to wrap the top toolbar, which will need an additional
	// overflow-x property set to allow the block toolbar to scroll.
	test( 'Block toolbar will scroll to reveal hidden buttons with fixed toolbar', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.setIsFixedToolbar( true );
		// A block with more tools than fit in a narrow toolbar.
		await editor.insertBlock( { name: 'core/buttons' } );

		const blockToolbar = page.getByRole( 'toolbar', {
			name: 'Block tools',
		} );
		// The last tool in the toolbar, so it is the one the overflow hides.
		const lastTool = blockToolbar.getByRole( 'button', {
			name: 'Options',
			exact: true,
		} );

		// The top toolbar at a narrow viewport, then the toolbar fixed to the
		// bottom of the screen.
		for ( const width of [ 960, 400 ] ) {
			await pageUtils.setBrowserViewport( { width, height: 700 } );
			await expect( lastTool ).not.toBeInViewport();

			// The toolbar has to be scrolled by wheel rather than
			// programmatically, which would scroll it even if it were not
			// scrollable.
			await blockToolbar.hover();
			await page.mouse.wheel( 200, 0 );
			await expect( lastTool ).toBeInViewport();

			await page.mouse.wheel( -200, 0 );
			await expect( lastTool ).not.toBeInViewport();
		}

		// Preferences are saved on a debounce, so a fast test can outrun its own
		// save and have it land after the reset in `afterEach`. Put the setting
		// back instead of relying on that reset.
		await editor.setIsFixedToolbar( false );
		await pageUtils.setBrowserViewport( 'large' );
	} );

	test( 'Tab order of the block toolbar aligns with visual order', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		// On default floating toolbar
		await editor.insertBlock( { name: 'core/paragraph' } );
		await page.keyboard.type( 'Paragraph' );

		// shift + tab
		await pageUtils.pressKeys( 'shift+Tab' );
		// check focus is within the block toolbar
		const blockToolbarParagraphButton = page.getByRole( 'button', {
			name: 'Paragraph',
			exact: true,
		} );
		await expect( blockToolbarParagraphButton ).toBeFocused();
		await pageUtils.pressKeys( 'Tab' );
		// check focus is on the block
		await expect
			.poll( editor.getFocusOwnerLabel )
			.toBe( 'Block: Paragraph' );

		// set the screen size to mobile
		await pageUtils.setBrowserViewport( 'small' );
		// The toolbar remounts when the viewport changes, so wait for it before
		// tabbing. A key press that lands mid-remount moves focus elsewhere.
		await expect( blockToolbarParagraphButton ).toBeVisible();

		// TEST: Small screen toolbar without fixed toolbar setting should be the first tabstop before the editor
		await pageUtils.pressKeys( 'shift+Tab' );
		// check focus is within the block toolbar
		await expect( blockToolbarParagraphButton ).toBeFocused();
		await pageUtils.pressKeys( 'Tab' );
		// check focus is on the block
		await expect
			.poll( editor.getFocusOwnerLabel )
			.toBe( 'Block: Paragraph' );
		// TEST: Fixed toolbar should be within the header dom
		// Changed to Fixed top toolbar setting and large viewport to test fixed toolbar
		await pageUtils.setBrowserViewport( 'large' );
		await editor.setIsFixedToolbar( true );
		// shift + tab
		await pageUtils.pressKeys( 'shift+Tab' );

		// Options button is the last one in the top toolbar, the first item outside of the editor canvas, so it should get focused.
		await expect.poll( editor.getFocusOwnerLabel ).toBe( 'Options' );

		await pageUtils.pressKeys( 'Tab' );
		// check focus is on the block
		await expect
			.poll( editor.getFocusOwnerLabel )
			.toBe( 'Block: Paragraph' );
		// Move to block, alt + f10
		await pageUtils.pressKeys( 'alt+F10' );
		// check focus in block toolbar
		await expect( blockToolbarParagraphButton ).toBeFocused();
		// escape back to block
		await pageUtils.pressKeys( 'Escape' );
		// check block focus
		await expect
			.poll( editor.getFocusOwnerLabel )
			.toBe( 'Block: Paragraph' );

		// TEST: Small screen toolbar with fixed toolbar setting should be the first tabstop before the editor. Even though the fixed toolbar setting is on, it should not render within the header since it's visually after it.
		await pageUtils.setBrowserViewport( 'small' );
		await pageUtils.pressKeys( 'shift+Tab' );
		// check focus is within the block toolbar
		await expect( blockToolbarParagraphButton ).toBeFocused();
		await pageUtils.pressKeys( 'Tab' );
		// check focus is on the block
		await expect
			.poll( editor.getFocusOwnerLabel )
			.toBe( 'Block: Paragraph' );

		await pageUtils.setBrowserViewport( 'large' );
	} );

	test( 'Focus should remain on mover when moving blocks', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		// On default floating toolbar
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Paragraph 1' },
		} );
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Paragraph 2' },
		} );
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Paragraph 3' },
		} );
		await pageUtils.pressKeys( 'shift+Tab' );
		// check focus is within the block toolbar
		const blockToolbarParagraphButton = page.getByRole( 'button', {
			name: 'Paragraph',
			exact: true,
		} );
		await expect( blockToolbarParagraphButton ).toBeFocused();
		// Go to Move Up Button
		await pageUtils.pressKeys( 'ArrowRight' );
		const blockToolbarMoveUpButton = page.getByRole( 'button', {
			name: 'Move up',
			exact: true,
		} );

		// Make sure it's in an acvite state for now
		await expect( blockToolbarMoveUpButton ).toBeEnabled();

		await expect( blockToolbarMoveUpButton ).toBeFocused();
		await pageUtils.pressKeys( 'Enter' );
		await expect( blockToolbarMoveUpButton ).toBeFocused();
		await pageUtils.pressKeys( 'Enter' );
		await expect( blockToolbarMoveUpButton ).toBeFocused();
		await expect( blockToolbarMoveUpButton ).toBeDisabled();

		// Check to make sure focus returns to the Move Up button roving index after all of this
		await pageUtils.pressKeys( 'Tab' );
		// Hide the block toolbar
		await pageUtils.pressKeys( 'ArrowRight' );
		// Check the block toolbar is hidden
		const blockToolbar = page.getByRole( 'toolbar', {
			name: 'Block tools',
		} );
		await expect( blockToolbar ).toBeHidden();
		await pageUtils.pressKeys( 'shift+Tab' );
		// We should be on the Move Up button again
		await expect( blockToolbarMoveUpButton ).toBeFocused();
	} );
} );
