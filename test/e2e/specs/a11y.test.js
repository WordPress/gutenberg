/**
 * Internal dependencies
 */
import { newPost, pressWithModifier } from '../support/utils';

describe( 'a11y', () => {
	beforeAll( async () => {
		await newPost();
	} );

	it( 'tabs header bar', async () => {
		await pressWithModifier( 'Control', '~' );

		await page.keyboard.press( 'Tab' );

		const isFocusedToggle = await page.$eval( ':focus', ( focusedElement ) => {
			return focusedElement.classList.contains( 'editor-inserter__toggle' );
		} );

		expect( isFocusedToggle ).toBe( true );
	} );
} );
