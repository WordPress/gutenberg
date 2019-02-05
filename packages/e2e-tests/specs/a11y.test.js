/**
 * WordPress dependencies
 */
import {
	createNewPost,
	pressKeyWithModifier,
} from '@wordpress/e2e-test-utils';

function isCloseButtonFocused() {
	return page.$eval( ':focus', ( focusedElement ) => {
		return focusedElement.getAttribute( 'aria-label' ) === 'Close dialog';
	} );
}

describe( 'a11y', () => {
	beforeEach( async () => {
		await createNewPost();
	} );

	it( 'tabs header bar', async () => {
		await pressKeyWithModifier( 'ctrl', '~' );

		await page.keyboard.press( 'Tab' );

		const isFocusedToggle = await page.$eval( ':focus', ( focusedElement ) => {
			return focusedElement.classList.contains( 'editor-inserter__toggle' );
		} );

		expect( isFocusedToggle ).toBe( true );
	} );

	it( 'constrains focus to a modal when tabbing', async () => {
		// Open keyboard help modal.
		await pressKeyWithModifier( 'access', 'h' );

		// The close button should not be focused by default; this is a strange UX
		// experience.
		// See: https://github.com/WordPress/gutenberg/issues/9410
		expect( await isCloseButtonFocused() ).toBe( false );

		await page.keyboard.press( 'Tab' );

		// Ensure the Close button of the modal is focused after tabbing.
		expect( await isCloseButtonFocused() ).toBe( true );
	} );

	it( 'returns focus to the first tabbable in a modal after blurring a tabbable', async () => {
		await pressKeyWithModifier( 'access', 'h' );

		// Click to move focus to an element after the last tabbable within the
		// modal.
		await page.click( '.components-modal__content *:last-child' );

		await page.keyboard.press( 'Tab' );

		expect( await isCloseButtonFocused() ).toBe( true );
	} );

	it( 'returns focus to the last tabbable in a modal after blurring a tabbable and tabbing in reverse direction', async () => {
		await pressKeyWithModifier( 'access', 'h' );

		// Click to move focus to an element before the first tabbable within
		// the modal.
		await page.click( '.components-modal__header-heading' );

		await pressKeyWithModifier( 'shift', 'Tab' );

		expect( await isCloseButtonFocused() ).toBe( true );
	} );
} );
