/**
 * WordPress dependencies
 */
import {
	clickBlockAppender,
	clickBlockToolbarButton,
	getEditedPostContent,
	createNewPost,
	pressKeyTimes,
	transformBlockTo,
	pressKeyWithModifier,
	insertBlock,
	showBlockToolbar,
} from '@wordpress/e2e-test-utils';

describe( 'List', () => {
	beforeEach( async () => {
		await createNewPost();
	} );

	it( 'can be created by using an asterisk at the start of a paragraph block', async () => {
		// Create a block with some text that will trigger a list creation.
		await clickBlockAppender();
		await page.keyboard.type( '* A list item' );

		// Create a second list item.
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'Another list item' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'can be created by typing an asterisk in front of text of a paragraph block', async () => {
		// Create a list with the slash block shortcut.
		await clickBlockAppender();
		await page.keyboard.type( 'test' );
		await pressKeyTimes( 'ArrowLeft', 4 );
		await page.keyboard.type( '* ' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'can be created by using a number at the start of a paragraph block', async () => {
		// Create a block with some text that will trigger a list creation.
		await clickBlockAppender();
		await page.keyboard.type( '1) A list item' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'can undo asterisk transform', async () => {
		await clickBlockAppender();
		await page.keyboard.type( '1. ' );
		await pressKeyWithModifier( 'primary', 'z' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'should undo asterisk transform with backspace', async () => {
		await clickBlockAppender();
		await page.keyboard.type( '* ' );
		await page.keyboard.press( 'Backspace' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'should undo asterisk transform with backspace after selection changes', async () => {
		await clickBlockAppender();
		await page.keyboard.type( '* ' );
		await page.evaluate( () => new Promise( window.requestIdleCallback ) );
		await page.keyboard.press( 'Backspace' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'should undo asterisk transform with backspace setting isTyping state', async () => {
		await clickBlockAppender();
		await page.keyboard.type( '* ' );
		await showBlockToolbar();
		await page.keyboard.press( 'Backspace' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'should undo asterisk transform with backspace after selection changes without requestIdleCallback', async () => {
		await clickBlockAppender();
		await page.evaluate( () => delete window.requestIdleCallback );
		await page.keyboard.type( '* ' );
		await new Promise( ( resolve ) => setTimeout( resolve, 100 ) );
		await page.keyboard.press( 'Backspace' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'should undo asterisk transform with escape', async () => {
		await clickBlockAppender();
		await page.keyboard.type( '* ' );
		await page.keyboard.press( 'Escape' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'should not undo asterisk transform with backspace after typing', async () => {
		await clickBlockAppender();
		await page.keyboard.type( '* a' );
		await page.keyboard.press( 'Backspace' );
		await page.keyboard.press( 'Backspace' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'should not undo asterisk transform with backspace after selection change', async () => {
		await clickBlockAppender();
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '* ' );
		await page.evaluate( () => new Promise( window.requestIdleCallback ) );
		await page.keyboard.press( 'ArrowUp' );
		await page.keyboard.press( 'ArrowDown' );
		await page.keyboard.press( 'Backspace' );

		// Expect list to be deleted.
		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'can be created by typing "/list"', async () => {
		// Create a list with the slash block shortcut.
		await clickBlockAppender();
		await page.keyboard.type( '/list' );
		await page.waitForXPath(
			`//*[contains(@class, "components-autocomplete__result") and contains(@class, "is-selected") and contains(text(), 'List')]`
		);
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'I’m a list' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'can be created by converting a paragraph', async () => {
		await clickBlockAppender();
		await page.keyboard.type( 'test' );
		await transformBlockTo( 'List' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'can be created by converting multiple paragraphs', async () => {
		await clickBlockAppender();
		await page.keyboard.type( 'one' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'two' );
		await page.keyboard.down( 'Shift' );
		await page.click( '[data-type="core/paragraph"]' );
		await page.keyboard.up( 'Shift' );
		await transformBlockTo( 'List' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'can be created by converting a paragraph with line breaks', async () => {
		await clickBlockAppender();
		await page.keyboard.type( 'one' );
		await pressKeyWithModifier( 'shift', 'Enter' );
		await page.keyboard.type( 'two' );
		await transformBlockTo( 'List' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'should not transform lines in block when transforming multiple blocks', async () => {
		await clickBlockAppender();
		await page.keyboard.type( 'one' );
		await pressKeyWithModifier( 'shift', 'Enter' );
		await page.keyboard.type( '...' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'two' );
		await page.keyboard.down( 'Shift' );
		await page.click( '[data-type="core/paragraph"]' );
		await page.keyboard.up( 'Shift' );
		await transformBlockTo( 'List' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'can be converted to paragraphs', async () => {
		await insertBlock( 'List' );
		await page.keyboard.type( 'one' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'two' );
		await transformBlockTo( 'Paragraph' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'can be converted when nested to paragraphs', async () => {
		await insertBlock( 'List' );
		await page.keyboard.type( 'one' );
		await page.keyboard.press( 'Enter' );
		await clickBlockToolbarButton( 'Indent' );
		await page.keyboard.type( 'two' );
		await transformBlockTo( 'Paragraph' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'can be created by converting a quote', async () => {
		await insertBlock( 'Quote' );
		await page.keyboard.type( 'one' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'two' );
		await transformBlockTo( 'List' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'can be converted to a quote', async () => {
		await insertBlock( 'List' );
		await page.keyboard.type( 'one' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'two' );
		await transformBlockTo( 'Quote' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'should create paragraph on split at end and merge back with content', async () => {
		await insertBlock( 'List' );
		await page.keyboard.type( 'one' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.press( 'Enter' );

		expect( await getEditedPostContent() ).toMatchSnapshot();

		await page.keyboard.type( 'two' );
		await pressKeyTimes( 'ArrowLeft', 'two'.length );
		await page.keyboard.press( 'Backspace' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'should split into two with paragraph and merge lists', async () => {
		await insertBlock( 'List' );
		await page.keyboard.type( 'one' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'two' );
		await page.keyboard.press( 'ArrowUp' );
		await page.keyboard.press( 'Enter' );

		expect( await getEditedPostContent() ).toMatchSnapshot();

		await page.keyboard.press( 'Enter' );

		expect( await getEditedPostContent() ).toMatchSnapshot();

		// Should remove paragraph without creating empty list item.
		await page.keyboard.press( 'Backspace' );

		// Should merge lists into one.
		await page.keyboard.press( 'ArrowDown' );
		await pressKeyTimes( 'ArrowLeft', 'two'.length );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'should split into two ordered lists with paragraph', async () => {
		await clickBlockAppender();
		await page.keyboard.type( '1. one' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'two' );
		await page.keyboard.press( 'ArrowUp' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.press( 'Enter' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'should split indented list item', async () => {
		await insertBlock( 'List' );
		await page.keyboard.type( 'one' );
		await page.keyboard.press( 'Enter' );
		await clickBlockToolbarButton( 'Indent' );
		await page.keyboard.type( 'two' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'three' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'should be immeadiately saved on indentation', async () => {
		await insertBlock( 'List' );
		await page.keyboard.type( 'one' );
		await page.keyboard.press( 'Enter' );
		await pressKeyWithModifier( 'primary', 'm' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'should change the base list type', async () => {
		await insertBlock( 'List' );
		const button = await page.waitForSelector(
			'button[aria-label="Ordered"]'
		);
		await button.click();

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'should change the indented list type', async () => {
		await insertBlock( 'List' );
		await page.keyboard.type( 'a' );
		await page.keyboard.press( 'Enter' );
		await pressKeyWithModifier( 'primary', 'm' );
		await page.keyboard.type( '1' );

		await clickBlockToolbarButton( 'Ordered' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'should indent and outdent level 1', async () => {
		await insertBlock( 'List' );
		await page.keyboard.type( 'a' );
		await page.keyboard.press( 'Enter' );
		await pressKeyWithModifier( 'primary', 'm' );
		await page.keyboard.type( '1' );

		expect( await getEditedPostContent() ).toMatchSnapshot();

		await pressKeyWithModifier( 'primaryShift', 'm' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'should indent and outdent level 2', async () => {
		await insertBlock( 'List' );
		await page.keyboard.type( 'a' );
		await page.keyboard.press( 'Enter' );
		await pressKeyWithModifier( 'primary', 'm' );
		await page.keyboard.type( '1' );
		await page.keyboard.press( 'Enter' );
		await pressKeyWithModifier( 'primary', 'm' );
		await page.keyboard.type( 'i' );

		expect( await getEditedPostContent() ).toMatchSnapshot();

		await pressKeyWithModifier( 'primaryShift', 'm' );

		expect( await getEditedPostContent() ).toMatchSnapshot();

		await pressKeyWithModifier( 'primaryShift', 'm' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'should outdent with children', async () => {
		await insertBlock( 'List' );
		await page.keyboard.type( 'a' );
		await page.keyboard.press( 'Enter' );
		await pressKeyWithModifier( 'primary', 'm' );
		await page.keyboard.type( 'b' );
		await page.keyboard.press( 'Enter' );
		await pressKeyWithModifier( 'primary', 'm' );
		await page.keyboard.type( 'c' );

		expect( await getEditedPostContent() ).toMatchSnapshot();

		await page.keyboard.press( 'ArrowUp' );
		await pressKeyWithModifier( 'primaryShift', 'm' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'should insert a line break on shift+enter', async () => {
		await insertBlock( 'List' );
		await page.keyboard.type( 'a' );
		await pressKeyWithModifier( 'shift', 'Enter' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'should insert a line break on shift+enter in a non trailing list item', async () => {
		await insertBlock( 'List' );
		await page.keyboard.type( 'a' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'b' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'c' );
		await page.keyboard.press( 'ArrowUp' );
		await pressKeyWithModifier( 'shift', 'Enter' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'should create and remove indented list with keyboard only', async () => {
		await clickBlockAppender();

		await page.keyboard.type( '* 1' ); // Should be at level 0.
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( ' a' ); // Should be at level 1.
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( ' i' ); // Should be at level 2.

		expect( await getEditedPostContent() ).toMatchSnapshot();

		await page.keyboard.press( 'Backspace' );
		await page.keyboard.press( 'Backspace' ); // Should be at level 1.

		expect( await getEditedPostContent() ).toMatchSnapshot();

		await page.keyboard.press( 'Backspace' ); // Should be at level 0.

		expect( await getEditedPostContent() ).toMatchSnapshot();

		await page.keyboard.press( 'Backspace' ); // Should be at level 1.

		expect( await getEditedPostContent() ).toMatchSnapshot();

		await page.keyboard.press( 'Backspace' );
		await page.keyboard.press( 'Backspace' ); // Should be at level 0.

		expect( await getEditedPostContent() ).toMatchSnapshot();

		await page.keyboard.press( 'Backspace' ); // Should be at level 0.

		expect( await getEditedPostContent() ).toMatchSnapshot();

		await page.keyboard.press( 'Backspace' );
		await page.keyboard.press( 'Backspace' ); // Should remove list.

		expect( await getEditedPostContent() ).toMatchSnapshot();

		// That's 9 key presses to create the list, and 9 key presses to remove
		// the list. ;)
	} );

	it( 'should place the caret in the right place with nested list', async () => {
		await clickBlockAppender();
		await page.keyboard.type( '* 1' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( ' a' );
		await page.keyboard.press( 'ArrowUp' );
		await page.keyboard.press( 'Enter' );
		// The caret should land in the second item.
		await page.keyboard.type( '2' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'should not indent list on space with modifier', async () => {
		await clickBlockAppender();

		await page.keyboard.type( '* 1' );
		await page.keyboard.press( 'Enter' );
		await pressKeyWithModifier( 'shift', 'Space' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'should only convert to list when shortcut ends with space', async () => {
		await clickBlockAppender();

		// Tests the shortcut with a non breaking space.
		await page.keyboard.type( '* ' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'should preserve indentation after merging backward and forward', async () => {
		await clickBlockAppender();

		// Tests the shortcut with a non breaking space.
		await page.keyboard.type( '* 1' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.press( 'Space' );
		await page.keyboard.type( '2' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '3' );

		// Create a new paragraph.
		await page.keyboard.press( 'Enter' );
		await page.keyboard.press( 'Enter' );

		// Merge the pragraph back. No list items should be joined.
		await page.keyboard.press( 'Backspace' );

		expect( await getEditedPostContent() ).toMatchSnapshot();

		// Again create a new paragraph.
		await page.keyboard.press( 'Enter' );

		// Move to the end of the list.
		await page.keyboard.press( 'ArrowLeft' );

		// Merge forward. No list items should be joined.
		await page.keyboard.press( 'Delete' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'first empty list item is graciously removed', async () => {
		await clickBlockAppender();
		await page.keyboard.type( '* 1' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '2' );
		await page.keyboard.press( 'ArrowUp' );
		await page.keyboard.press( 'Backspace' );
		await page.keyboard.press( 'Backspace' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'should not change the contents when you change the list type to Ordered', async () => {
		await clickBlockAppender();
		await page.keyboard.type( '* 1' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '2' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '3' );
		await clickBlockToolbarButton( 'Ordered' );

		const content = await page.$eval(
			'.wp-block-list',
			( el ) => el.innerHTML
		);
		expect( content ).toMatchSnapshot();
	} );

	it( 'should not change the contents when you change the list type to Unordered', async () => {
		await clickBlockAppender();
		await page.keyboard.type( '1. a' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'b' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'c' );
		await clickBlockToolbarButton( 'Unordered' );

		const content = await page.$eval(
			'.wp-block-list',
			( el ) => el.innerHTML
		);
		expect( content ).toMatchSnapshot();
	} );
} );
