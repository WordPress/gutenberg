/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'a11y', () => {
	test.beforeEach( async ( { pageUtils } ) => {
		await pageUtils.createNewPost();
	} );

	test( 'tabs header bar', async ( { page } ) => {
		await page.keyboard.press( 'Control+`' );

		await page.keyboard.press( 'Tab' );

		const headerInserterToggle = page.locator(
			'.edit-post-header-toolbar__inserter-toggle'
		);

		await expect( headerInserterToggle ).toBeFocused();
	} );

	test( 'constrains focus to a modal when tabbing', async ( { page } ) => {
		// Open keyboard help modal.
		await page.keyboard.press( 'Control+Alt+H' );

		// The close button should not be focused by default; this is a strange UX
		// experience.
		// See: https://github.com/WordPress/gutenberg/issues/9410
		const closeButton = page.locator( '[aria-label="Close dialog"]' );

		await expect( closeButton ).not.toBeFocused();

		await page.keyboard.press( 'Tab' );

		// Ensure the Close button of the modal is focused after tabbing.
		await expect( closeButton ).toBeFocused();
	} );

	test.skip( 'returns focus to the first tabbable in a modal after blurring a tabbable', async ( {
		page,
	} ) => {
		await page.keyboard.press( 'Control+Alt+H' );

		// Click to move focus to an element after the last tabbable within the
		// modal.
		await page.click( '.components-modal__content *:last-child' );

		await page.keyboard.press( 'Tab' );

		const closeButton = page.locator( '[aria-label="Close dialog"]' );

		await expect( closeButton ).toBeFocused();
	} );

	test( 'returns focus to the last tabbable in a modal after blurring a tabbable and tabbing in reverse direction', async ( {
		page,
	} ) => {
		await page.keyboard.press( 'Control+Alt+H' );

		// Click to move focus to an element before the first tabbable within
		// the modal.
		await page.click( '.components-modal__header-heading' );

		await page.keyboard.press( 'Shift+Tab' );

		const closeButton = page.locator( '[aria-label="Close dialog"]' );

		await expect( closeButton ).toBeFocused();
	} );
} );
