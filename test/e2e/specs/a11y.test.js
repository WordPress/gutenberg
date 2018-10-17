/**
 * External dependencies
 */
import axeCore from 'axe-core';

/**
 * Internal dependencies
 */
import {
	ACCESS_MODIFIER_KEYS,
	newPost,
	pressWithModifier,
} from '../support/utils';

function isCloseButtonFocused() {
	return page.$eval( ':focus', ( focusedElement ) => {
		return focusedElement.getAttribute( 'aria-label' ) === 'Close dialog';
	} );
}

describe( 'a11y', () => {
	beforeEach( async () => {
		await newPost();
	} );

	it( 'passes aXe Javascript Accessibility API checks', async () => {
		const handle = await page.evaluateHandle( `
			// Inject axe source code
			${ axeCore.source }
			// Run axe
			axe.run()
		` );

		// Get the results from `axe.run()`.
		const results = await handle.jsonValue();

		// Destroy the handle & return axe results.
		await handle.dispose();

		expect( results.violations ).toEqual( [] );
	} );

	it( 'tabs header bar', async () => {
		await pressWithModifier( 'Control', '~' );

		await page.keyboard.press( 'Tab' );

		const isFocusedToggle = await page.$eval( ':focus', ( focusedElement ) => {
			return focusedElement.classList.contains( 'editor-inserter__toggle' );
		} );

		expect( isFocusedToggle ).toBe( true );
	} );

	it( 'constrains focus to a modal when tabbing', async () => {
		// Open keyboard help modal.
		await pressWithModifier( ACCESS_MODIFIER_KEYS, 'h' );

		// The close button should not be focused by default; this is a strange UX
		// experience.
		// See: https://github.com/WordPress/gutenberg/issues/9410
		expect( await isCloseButtonFocused() ).toBe( false );

		await page.keyboard.press( 'Tab' );

		// Ensure the Close button of the modal is focused after tabbing.
		expect( await isCloseButtonFocused() ).toBe( true );
	} );

	it( 'returns focus to the first tabbable in a modal after blurring a tabbable', async () => {
		await pressWithModifier( ACCESS_MODIFIER_KEYS, 'h' );

		// Click to move focus to an element after the last tabbable within the
		// modal.
		await page.click( '.components-modal__content *:last-child' );

		await page.keyboard.press( 'Tab' );

		expect( await isCloseButtonFocused() ).toBe( true );
	} );

	it( 'returns focus to the last tabbable in a modal after blurring a tabbable and tabbing in reverse direction', async () => {
		await pressWithModifier( ACCESS_MODIFIER_KEYS, 'h' );

		// Click to move focus to an element before the first tabbable within
		// the modal.
		await page.click( '.components-modal__header-heading' );

		await pressWithModifier( 'Shift', 'Tab' );

		expect( await isCloseButtonFocused() ).toBe( true );
	} );
} );
