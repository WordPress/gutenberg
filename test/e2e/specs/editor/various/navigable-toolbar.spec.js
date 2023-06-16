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
	} );
} );
