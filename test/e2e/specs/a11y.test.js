/**
 * Internal dependencies
 */
import '../support/bootstrap';
import { newPost } from '../support/utils';

// Tests
describe( 'a11y', () => {
	beforeAll( async () => {
		await newPost();
	} );

	it( 'tabs header bar', async () => {
		await page.keyboard.down( 'Control' );
		await page.keyboard.press( '~' );
		await page.keyboard.up( 'Control' );

		await page.keyboard.press( 'Tab' );

		const isFocusedToggle = await page.$eval( ':focus', ( focusedElement ) => {
			return focusedElement.classList.contains( 'editor-inserter__toggle' );
		} );

		expect( isFocusedToggle ).toBe( true );
	} );
} );
