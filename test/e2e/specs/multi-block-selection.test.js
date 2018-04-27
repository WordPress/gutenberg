/**
 * Internal dependencies
 */
import '../support/bootstrap';
import { newPost, newDesktopBrowserPage } from '../support/utils';

describe( 'Multi-block selection', () => {
	beforeAll( async () => {
		await newDesktopBrowserPage();
		await newPost();
	} );

	it( 'Should select/unselect multiple blocks', async () => {
		const firstBlockSelector = '[data-type="core/paragraph"]';
		const secondBlockSelector = '[data-type="core/image"]';
		const thirdBlockSelector = '[data-type="core/list"]';
		const multiSelectedCssClass = 'is-multi-selected';

		// Creating test blocks
		await page.click( '.editor-default-block-appender' );
		await page.keyboard.type( 'First Paragraph' );
		await page.click( '.edit-post-header [aria-label="Add block"]' );
		await page.keyboard.type( 'Image' );
		await page.keyboard.press( 'Tab' );
		await page.keyboard.press( 'Enter' );
		await page.click( '.edit-post-header [aria-label="Add block"]' );
		await page.keyboard.type( 'List' );
		await page.keyboard.press( 'Tab' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'List Block' );

		const blocks = [ firstBlockSelector, secondBlockSelector, thirdBlockSelector ];
		const expectMultiSelected = ( selectors, areMultiSelected ) => {
			selectors.forEach( async ( selector ) => {
				const className = await page.$eval( selector, ( element ) => element.className );
				if ( areMultiSelected ) {
					expect( className ).toEqual( expect.stringContaining( multiSelectedCssClass ) );
				} else {
					expect( className ).not.toEqual( expect.stringContaining( multiSelectedCssClass ) );
				}
			} );
		};

		// Default: No selection
		expectMultiSelected( blocks, false );

		// Multiselect via Shift + click
		await page.mouse.move( 200, 300 );
		await page.click( firstBlockSelector );
		await page.keyboard.down( 'Shift' );
		await page.click( thirdBlockSelector );
		await page.keyboard.up( 'Shift' );

		// Verify selection
		expectMultiSelected( blocks, true );

		// Unselect
		await page.click( secondBlockSelector );

		// No selection
		expectMultiSelected( blocks, false );

		// Multiselect via keyboard
		await page.click( 'body' );
		await page.keyboard.down( 'Meta' );
		await page.keyboard.press( 'a' );
		await page.keyboard.up( 'Meta' );

		// Verify selection
		expectMultiSelected( blocks, true );

		// Unselect
		await page.keyboard.press( 'Escape' );

		// No selection
		expectMultiSelected( blocks, false );
	} );
} );
