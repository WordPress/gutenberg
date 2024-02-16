/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.use( {
	BlockToolbarUtils: async ( { editor, page, pageUtils }, use ) => {
		await use( new BlockToolbarUtils( { editor, page, pageUtils } ) );
	},
} );

test.describe( 'Block Toolbar', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
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
			BlockToolbarUtils,
			editor,
			page,
			pageUtils,
		} ) => {
			// Test navigating to block toolbar
			await editor.insertBlock( { name: 'core/paragraph' } );
			await page.keyboard.type( 'Paragraph' );
			await BlockToolbarUtils.focusBlockToolbar();
			await BlockToolbarUtils.expectLabelToHaveFocus( 'Paragraph' );
			// // Navigate to Align Text
			await page.keyboard.press( 'ArrowRight' );
			await BlockToolbarUtils.expectLabelToHaveFocus( 'Align text' );
			// // Open the dropdown
			await page.keyboard.press( 'Enter' );
			await BlockToolbarUtils.expectLabelToHaveFocus( 'Align text left' );
			await page.keyboard.press( 'ArrowDown' );
			await BlockToolbarUtils.expectLabelToHaveFocus(
				'Align text center'
			);
			await page.keyboard.press( 'Escape' );
			await BlockToolbarUtils.expectLabelToHaveFocus( 'Align text' );

			// Navigate to the Bold item. Testing items via the fills within the block toolbar are especially important
			await page.keyboard.press( 'ArrowRight' );
			await BlockToolbarUtils.expectLabelToHaveFocus( 'Bold' );

			await BlockToolbarUtils.focusBlock();
			await BlockToolbarUtils.expectLabelToHaveFocus(
				'Block: Paragraph'
			);

			await BlockToolbarUtils.focusBlockToolbar();
			await BlockToolbarUtils.expectLabelToHaveFocus( 'Bold' );

			await BlockToolbarUtils.focusBlock();

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
			await BlockToolbarUtils.focusBlockToolbar();
			await BlockToolbarUtils.expectLabelToHaveFocus( 'Bold' );
			await page.keyboard.press( 'Enter' );
			// Should focus the selected text again
			expect(
				await editor.canvas
					.locator( ':root' )
					.evaluate( () => window.getSelection().toString() )
			).toBe( 'raph' );
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
				.getByRole( 'button', { name: 'Paragraph' } )
		).toBeFocused();
	} );

	// If this test breaks, it's likely that a new div has been added to wrap the top toolbar, which will need an additional
	// overflow-x property set to allow the block toolbar to scroll.
	test( 'Block toolbar will scroll to reveal hidden buttons with fixed toolbar', async ( {
		editor,
		BlockToolbarUtils,
		page,
		pageUtils,
	} ) => {
		/* eslint-disable playwright/expect-expect */
		/* eslint-disable playwright/no-wait-for-timeout */
		// Set the fixed toolbar
		await editor.setIsFixedToolbar( true );
		// Insert a block with a lot of tool buttons
		await editor.insertBlock( { name: 'core/buttons' } );
		// Set the locators we'll need to check for visibility
		const blockButton = page.getByRole( 'button', {
			name: 'Button',
			exact: true,
		} );

		const blockToolbar = page.getByRole( 'toolbar', {
			name: 'Block tools',
		} );

		// Test: Top Toolbar can scroll to reveal hidden block tools.
		await pageUtils.setBrowserViewport( { width: 960, height: 700 } );

		// Test: Block toolbar can scroll on top toolbar mode
		await BlockToolbarUtils.testScrollable( blockToolbar, blockButton );

		// Test: Fixed toolbar can scroll.

		// Make the viewport very small to force the fixed to bottom toolbar overflow
		await pageUtils.setBrowserViewport( { width: 400, height: 700 } );

		await BlockToolbarUtils.testScrollable( blockToolbar, blockButton );

		// Test cleanup
		await editor.setIsFixedToolbar( false );
		await pageUtils.setBrowserViewport( 'large' );
		/* eslint-enable playwright/expect-expect */
		/* eslint-enable playwright/no-wait-for-timeout */
	} );

	test( 'Tab order of the block toolbar aligns with visual order', async ( {
		editor,
		BlockToolbarUtils,
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
		await BlockToolbarUtils.expectLabelToHaveFocus( 'Block: Paragraph' );

		// set the screen size to mobile
		await pageUtils.setBrowserViewport( 'small' );

		// TEST: Small screen toolbar without fixed toolbar setting should be the first tabstop before the editor
		await pageUtils.pressKeys( 'shift+Tab' );
		// check focus is within the block toolbar
		await expect( blockToolbarParagraphButton ).toBeFocused();
		await pageUtils.pressKeys( 'Tab' );
		// check focus is on the block
		await BlockToolbarUtils.expectLabelToHaveFocus( 'Block: Paragraph' );
		// TEST: Fixed toolbar should be within the header dom
		// Changed to Fixed top toolbar setting and large viewport to test fixed toolbar
		await pageUtils.setBrowserViewport( 'large' );
		await editor.setIsFixedToolbar( true );
		// shift + tab
		await pageUtils.pressKeys( 'shift+Tab' );

		// Options button is the last one in the top toolbar, the first item outside of the editor canvas, so it should get focused.
		await BlockToolbarUtils.expectLabelToHaveFocus( 'Options' );

		await pageUtils.pressKeys( 'Tab' );
		// check focus is on the block
		await BlockToolbarUtils.expectLabelToHaveFocus( 'Block: Paragraph' );
		// Move to block, alt + f10
		await pageUtils.pressKeys( 'alt+F10' );
		// check focus in block toolbar
		await expect( blockToolbarParagraphButton ).toBeFocused();
		// escape back to block
		await pageUtils.pressKeys( 'Escape' );
		// check block focus
		await BlockToolbarUtils.expectLabelToHaveFocus( 'Block: Paragraph' );

		// TEST: Small screen toolbar with fixed toolbar setting should be the first tabstop before the editor. Even though the fixed toolbar setting is on, it should not render within the header since it's visually after it.
		await pageUtils.setBrowserViewport( 'small' );
		await pageUtils.pressKeys( 'shift+Tab' );
		// check focus is within the block toolbar
		await expect( blockToolbarParagraphButton ).toBeFocused();
		await pageUtils.pressKeys( 'Tab' );
		// check focus is on the block
		await BlockToolbarUtils.expectLabelToHaveFocus( 'Block: Paragraph' );

		// Test cleanup
		await editor.setIsFixedToolbar( false );
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

class BlockToolbarUtils {
	constructor( { editor, page, pageUtils } ) {
		this.editor = editor;
		this.page = page;
		this.pageUtils = pageUtils;
	}

	async focusBlockToolbar() {
		await this.pageUtils.pressKeys( 'alt+F10' );
	}

	async focusBlock() {
		await this.pageUtils.pressKeys( 'Escape' );
	}

	async expectLabelToHaveFocus( label ) {
		const ariaLabel = await this.page.evaluate( () => {
			const { activeElement } =
				document.activeElement.contentDocument ?? document;
			return (
				activeElement.getAttribute( 'aria-label' ) ||
				activeElement.innerText
			);
		} );

		expect( ariaLabel ).toBe( label );
	}

	async testScrollable( scrollableElement, elementToTest ) {
		// We can't use `not.toBeVisible()` here since Playwright's definition of visible or not visible is not the same
		// as being human visible. It will pass if the element is off screen, but not human visible. Instead, we check the x
		// position of the element. It should change as we scroll. But we also can't programmatically use scroll, as it will
		// allow a scroll even if the element is not scrollable. So we use the mouse wheel event to scroll the element.
		const initialBox = await elementToTest.boundingBox();

		// Scroll the block toolbar to the right to reveal the hidden block tools
		await scrollableElement.hover();
		await this.page.mouse.wheel( 60, 0 );
		// Wait for the scroll to complete. Playwright doesn't wait for the scroll from the mouse event to complete before returning.
		await this.editor.page.waitForTimeout( 500 );

		let currentBox = await elementToTest.boundingBox();

		// The x position of the button should now be 60px lower.
		expect( currentBox.x ).toEqual( initialBox.x - 60 );

		// Scroll the block toolbar back to the left to hide the block tools again
		await this.page.mouse.wheel( -60, 0 );
		// Wait for the scroll to complete. Playwright doesn't wait for the scroll from the mouse event to complete before returning.
		await this.editor.page.waitForTimeout( 500 );

		currentBox = await elementToTest.boundingBox();

		// The x positions should return to their initial values
		expect( initialBox.x ).toEqual( currentBox.x );
	}
}
