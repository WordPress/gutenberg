/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'a11y', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'tabs header bar', async ( { page, pageUtils } ) => {
		await pageUtils.pressKeyWithModifier( 'ctrl', '`' );
		await pageUtils.pressKeyWithModifier( 'ctrl', '`' );
		await pageUtils.pressKeyWithModifier( 'ctrl', '`' );
		await pageUtils.pressKeyWithModifier( 'ctrl', '`' );
		await page.keyboard.press( 'Tab' );

		await expect(
			page.locator( 'role=button[name=/Toggle block inserter/i]' )
		).toBeFocused();
	} );

	test( 'constrains focus to a modal when tabbing', async ( {
		page,
		pageUtils,
	} ) => {
		// Open keyboard help modal.
		await pageUtils.pressKeyWithModifier( 'access', 'h' );

		const closeButton = page.locator(
			'role=dialog[name="Keyboard shortcuts"i] >> role=button[name="Close"i]'
		);
		// The close button should not be focused by default; this is a strange UX
		// experience.
		// See: https://github.com/WordPress/gutenberg/issues/9410
		await expect( closeButton ).not.toBeFocused();

		await page.keyboard.press( 'Tab' );

		// Ensure the Close button of the modal is focused after tabbing.
		await expect( closeButton ).toBeFocused();
	} );

	test( 'returns focus to the first tabbable in a modal after blurring a tabbable', async ( {
		page,
		pageUtils,
	} ) => {
		await pageUtils.pressKeyWithModifier( 'access', 'h' );

		// Click a non-focusable element after the last tabbable within the modal.
		const last = page
			.locator( 'role=dialog[name="Keyboard shortcuts"i] >> div' )
			.last();
		await last.click();

		await page.keyboard.press( 'Tab' );

		await expect(
			page.locator(
				'role=dialog[name="Keyboard shortcuts"i] >> role=button[name="Close"i]'
			)
		).toBeFocused();
	} );

	test( 'returns focus to the last tabbable in a modal after blurring a tabbable and tabbing in reverse direction', async ( {
		page,
		pageUtils,
	} ) => {
		await pageUtils.pressKeyWithModifier( 'access', 'h' );

		// Click a non-focusable element before the first tabbable within the modal.
		await page.click( 'role=heading[name="Keyboard shortcuts"i]' );

		await pageUtils.pressKeyWithModifier( 'shift', 'Tab' );

		await expect(
			page.locator(
				'role=dialog[name="Keyboard shortcuts"i] >> role=button[name="Close"i]'
			)
		).toBeFocused();
	} );
} );
