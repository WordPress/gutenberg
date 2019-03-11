/**
 * WordPress dependencies
 */
import {
	clickBlockAppender,
	insertBlock,
	createNewPost,
	pressKeyWithModifier,
	pressKeyTimes,
	getEditedPostContent,
	selectAllBlocks,
	__unstableSelectAll,
} from '@wordpress/e2e-test-utils';

describe( 'Multi-block selection', () => {
	beforeEach( async () => {
		await createNewPost();
	} );

	it( 'Should select/unselect multiple blocks', async () => {
		const firstBlockSelector = '[data-type="core/paragraph"]';
		const secondBlockSelector = '[data-type="core/image"]';
		const thirdBlockSelector = '[data-type="core/quote"]';
		const multiSelectedCssClass = 'is-multi-selected';

		// Creating test blocks
		await clickBlockAppender();
		await page.keyboard.type( 'First Paragraph' );
		await insertBlock( 'Image' );
		await insertBlock( 'Quote' );
		await page.keyboard.type( 'Quote Block' );

		const blocks = [ firstBlockSelector, secondBlockSelector, thirdBlockSelector ];
		const expectMultiSelected = async ( selectors, areMultiSelected ) => {
			for ( const selector of selectors ) {
				const className = await page.$eval( selector, ( element ) => element.className );
				if ( areMultiSelected ) {
					expect( className ).toEqual( expect.stringContaining( multiSelectedCssClass ) );
				} else {
					expect( className ).not.toEqual( expect.stringContaining( multiSelectedCssClass ) );
				}
			}
		};

		// Default: No selection
		await expectMultiSelected( blocks, false );

		// Multiselect via Shift + click
		await page.mouse.move( 200, 300 );
		await page.click( firstBlockSelector );
		await page.keyboard.down( 'Shift' );
		await page.click( thirdBlockSelector );
		await page.keyboard.up( 'Shift' );

		// Verify selection
		await expectMultiSelected( blocks, true );

		// Unselect
		await page.click( secondBlockSelector );

		// No selection
		await expectMultiSelected( blocks, false );

		// Multiselect via keyboard
		await page.click( 'body' );
		await pressKeyWithModifier( 'primary', 'a' );

		// Verify selection
		await expectMultiSelected( blocks, true );

		// Unselect
		await page.keyboard.press( 'Escape' );

		// No selection
		await expectMultiSelected( blocks, false );

		// Select all via double shortcut.
		await page.click( firstBlockSelector );
		// NOTE: `__unstableSelectAll` is used for cross-platform compatibility
		// alternative to Cmd+A. The second issuance of the key combination is
		// handled internerally by the block editor's KeyboardShortcuts utility
		// and is not subject to the same buggy emulation.
		await __unstableSelectAll();
		await pressKeyWithModifier( 'primary', 'a' );
		await expectMultiSelected( blocks, true );
	} );

	it( 'Should select/unselect multiple blocks using Shift + Arrows', async () => {
		const firstBlockSelector = '[data-type="core/paragraph"]';
		const secondBlockSelector = '[data-type="core/image"]';
		const thirdBlockSelector = '[data-type="core/quote"]';
		const multiSelectedCssClass = 'is-multi-selected';

		// Creating test blocks
		await clickBlockAppender();
		await page.keyboard.type( 'First Paragraph' );
		await insertBlock( 'Image' );
		await insertBlock( 'Quote' );
		await page.keyboard.type( 'Quote Block' );

		const blocks = [ firstBlockSelector, secondBlockSelector, thirdBlockSelector ];
		const expectMultiSelected = async ( selectors, areMultiSelected ) => {
			for ( const selector of selectors ) {
				const className = await page.$eval( selector, ( element ) => element.className );
				if ( areMultiSelected ) {
					expect( className ).toEqual( expect.stringContaining( multiSelectedCssClass ) );
				} else {
					expect( className ).not.toEqual( expect.stringContaining( multiSelectedCssClass ) );
				}
			}
		};

		// Default: No selection
		await expectMultiSelected( blocks, false );

		// Multiselect via Shift + click
		await page.mouse.move( 200, 300 );
		await page.click( firstBlockSelector );
		await page.keyboard.down( 'Shift' );
		await page.keyboard.press( 'ArrowDown' ); // Two blocks selected
		await page.keyboard.press( 'ArrowDown' ); // Three blocks selected
		await page.keyboard.up( 'Shift' );

		// Verify selection
		await expectMultiSelected( blocks, true );
	} );

	it( 'should speak() number of blocks selected with multi-block selection', async () => {
		await clickBlockAppender();
		await page.keyboard.type( 'First Paragraph' );
		await insertBlock( 'Paragraph' );
		await page.keyboard.type( 'Second Paragraph' );
		await insertBlock( 'Paragraph' );
		await page.keyboard.type( 'Third Paragraph' );
		await selectAllBlocks();

		// TODO: It would be great to do this test by spying on `wp.a11y.speak`,
		// but it's very difficult to do that because `wp.a11y` has
		// DOM-dependant side-effect setup code and doesn't seem straightforward
		// to mock. Instead, we check for the DOM node that `wp.a11y.speak()`
		// inserts text into.
		const speakTextContent = await page.$eval( '#a11y-speak-assertive', ( element ) => element.textContent );
		expect( speakTextContent.trim() ).toEqual( '3 blocks selected.' );
	} );

	// See #14448: an incorrect buffer may trigger multi-selection too soon.
	it( 'should only trigger multi-selection when at the end', async () => {
		// Create a paragraph with four lines.
		await clickBlockAppender();
		await page.keyboard.type( '1.' );
		await pressKeyWithModifier( 'shift', 'Enter' );
		await page.keyboard.type( '2.' );
		await pressKeyWithModifier( 'shift', 'Enter' );
		await page.keyboard.type( '3.' );
		await pressKeyWithModifier( 'shift', 'Enter' );
		await page.keyboard.type( '4.' );
		// Create a second block.
		await page.keyboard.press( 'Enter' );
		// Move to the middle of the first line.
		await pressKeyTimes( 'ArrowUp', 4 );
		await page.keyboard.press( 'ArrowRight' );
		// Select mid line one to mid line four.
		await pressKeyWithModifier( 'shift', 'ArrowDown' );
		await pressKeyWithModifier( 'shift', 'ArrowDown' );
		await pressKeyWithModifier( 'shift', 'ArrowDown' );
		// Delete the text to see if the selection was correct.
		await page.keyboard.press( 'Backspace' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'should use selection direction to determine vertical edge', async () => {
		await clickBlockAppender();
		await page.keyboard.type( '1' );
		await pressKeyWithModifier( 'shift', 'Enter' );
		await page.keyboard.type( '2' );

		await pressKeyWithModifier( 'shift', 'ArrowUp' );
		await pressKeyWithModifier( 'shift', 'ArrowDown' );

		// Should type at the end of the paragraph.
		await page.keyboard.type( '.' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'should always expand single line selection', async () => {
		await clickBlockAppender();
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '12' );
		await page.keyboard.press( 'ArrowLeft' );
		await pressKeyWithModifier( 'shift', 'ArrowRight' );
		await pressKeyWithModifier( 'shift', 'ArrowUp' );
		// This delete all blocks.
		await page.keyboard.press( 'Backspace' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'should allow selecting outer edge if there is no sibling block', async () => {
		await clickBlockAppender();
		await page.keyboard.type( '1' );
		await pressKeyWithModifier( 'shift', 'ArrowUp' );
		// This should replace the content.
		await page.keyboard.type( '2' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );
} );
