/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Block Toolbar', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.describe( 'Contextual Toolbar', () => {
		test( 'should not scroll page', async ( { page, pageUtils } ) => {
			while (
				await page.evaluate( () => {
					const scrollable = window.wp.dom.getScrollContainer(
						document.activeElement
					);
					return ! scrollable || scrollable.scrollTop === 0;
				} )
			) {
				await page.keyboard.press( 'Enter' );
			}

			await page.keyboard.type( 'a' );

			const scrollTopBefore = await page.evaluate(
				() =>
					window.wp.dom.getScrollContainer( document.activeElement )
						.scrollTop
			);
			await pageUtils.pressKeys( 'alt+F10' );
			await expect(
				page
					.getByRole( 'toolbar', { name: 'Block Tools' } )
					.getByRole( 'button', { name: 'Paragraph' } )
			).toBeFocused();

			const scrollTopAfter = await page.evaluate(
				() =>
					window.wp.dom.getScrollContainer( document.activeElement )
						.scrollTop
			);

			expect( scrollTopBefore ).toBe( scrollTopAfter );
		} );

		test( 'navigates into the toolbar by keyboard (Alt+F10)', async ( {
			page,
			pageUtils,
		} ) => {
			// Assumes new post focus starts in title. Create first new
			// block by Enter.
			await page.keyboard.press( 'Enter' );

			// [TEMPORARY]: A new paragraph is not technically a block yet
			// until starting to type within it.
			await page.keyboard.type( 'Example' );

			// Upward.
			await pageUtils.pressKeys( 'alt+F10' );

			await expect(
				page
					.getByRole( 'toolbar', { name: 'Block Tools' } )
					.getByRole( 'button', { name: 'Paragraph' } )
			).toBeFocused();
		} );
	} );
} );
