/**
 * Internal dependencies
 */
import '../support/bootstrap';
import {
	newPost,
	newDesktopBrowserPage,
	insertBlock,
	getEditedPostContent,
	pressTimes,
	pressWithModifier,
} from '../support/utils';

describe( 'splitting and merging blocks', () => {
	beforeEach( async () => {
		await newDesktopBrowserPage();
		await newPost();
	} );

	it( 'Should split and merge paragraph blocks using Enter and Backspace', async () => {
		// Use regular inserter to add paragraph block and text
		await insertBlock( 'Paragraph' );
		await page.keyboard.type( 'FirstSecond' );

		// Move caret between 'First' and 'Second' and press Enter to split
		// paragraph blocks
		await pressTimes( 'ArrowLeft', 6 );
		await page.keyboard.press( 'Enter' );

		// Assert that there are now two paragraph blocks with correct content
		expect( await getEditedPostContent() ).toMatchSnapshot();

		// Press Backspace to merge paragraph blocks
		await page.keyboard.press( 'Backspace' );

		// Ensure that caret position is correctly placed at the between point.
		await page.keyboard.type( 'Between' );
		expect( await getEditedPostContent() ).toMatchSnapshot();

		await pressTimes( 'Backspace', 7 ); // Delete "Between"

		// Edge case: Without ensuring that the editor still has focus when
		// restoring a bookmark, the caret may be inadvertently moved back to
		// an inline boundary after a split occurs.
		await page.keyboard.press( 'Home' );
		await page.keyboard.down( 'Shift' );
		await pressTimes( 'ArrowRight', 5 );
		await page.keyboard.up( 'Shift' );
		await pressWithModifier( 'mod', 'b' );
		// Collapse selection, still within inline boundary.
		await page.keyboard.press( 'ArrowRight' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'BeforeSecond:' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'Should merge into inline boundary position', async () => {
		// Regression Test: Caret should reset to end of inline boundary when
		// backspacing to delete second paragraph.
		await insertBlock( 'Paragraph' );
		await pressWithModifier( 'mod', 'b' );
		await page.keyboard.type( 'Foo' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.press( 'Backspace' );

		// Replace contents of first paragraph with "Bar".
		await pressTimes( 'Backspace', 3 );
		await page.keyboard.type( 'Bar' );

		expect( await getHTMLFromCodeEditor() ).toMatchSnapshot();
	} );
} );
