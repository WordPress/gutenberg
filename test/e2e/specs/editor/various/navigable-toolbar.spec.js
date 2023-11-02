/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.use( {
	BlockToolbarUtils: async ( { page, pageUtils }, use ) => {
		await use( new BlockToolbarUtils( { page, pageUtils } ) );
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
} );

class BlockToolbarUtils {
	constructor( { page, pageUtils } ) {
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
}
