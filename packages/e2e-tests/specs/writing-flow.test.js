/**
 * WordPress dependencies
 */
import {
	clickBlockAppender,
	getEditedPostContent,
	createNewPost,
	pressKeyTimes,
	pressKeyWithModifier,
	insertBlock,
} from '@wordpress/e2e-test-utils';

describe( 'adding blocks', () => {
	beforeEach( async () => {
		await createNewPost();
	} );

	it( 'Should navigate inner blocks with arrow keys', async () => {
		let activeElementText;

		// Add demo content
		await clickBlockAppender();
		await page.keyboard.type( 'First paragraph' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '/columns' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'First col' );

		// Arrow down should navigate through layouts in columns block (to
		// its default appender). Two key presses are required since the first
		// will land user on the Column wrapper block.
		await page.keyboard.press( 'ArrowDown' );
		await page.keyboard.press( 'ArrowDown' );
		await page.keyboard.type( 'Second col' );

		// Arrow down from last of layouts exits nested context to default
		// appender of root level.
		await page.keyboard.press( 'ArrowDown' );
		await page.keyboard.type( 'Second paragraph' );

		// Arrow up into nested context focuses last text input
		await page.keyboard.press( 'ArrowUp' );
		activeElementText = await page.evaluate( () => document.activeElement.textContent );
		expect( activeElementText ).toBe( 'Second col' );

		// Arrow up in inner blocks should navigate through (1) column wrapper,
		// (2) text fields.
		await page.keyboard.press( 'ArrowUp' );
		await page.keyboard.press( 'ArrowUp' );
		activeElementText = await page.evaluate( () => document.activeElement.textContent );
		expect( activeElementText ).toBe( 'First col' );

		// Arrow up from first text field in nested context focuses column and
		// columns wrappers before escaping out.
		let activeElementBlockType;
		await page.keyboard.press( 'ArrowUp' );
		activeElementBlockType = await page.evaluate( () => (
			document.activeElement.getAttribute( 'data-type' )
		) );
		expect( activeElementBlockType ).toBe( 'core/column' );
		await page.keyboard.press( 'ArrowUp' );
		activeElementBlockType = await page.evaluate( () => (
			document.activeElement.getAttribute( 'data-type' )
		) );
		expect( activeElementBlockType ).toBe( 'core/columns' );

		// Arrow up from focused (columns) block wrapper exits nested context
		// to prior text input.
		await page.keyboard.press( 'ArrowUp' );
		activeElementText = await page.evaluate( () => document.activeElement.textContent );
		expect( activeElementText ).toBe( 'First paragraph' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'should navigate around inline boundaries', async () => {
		// Add demo content
		await clickBlockAppender();
		await page.keyboard.type( 'First' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'Second' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'Third' );

		// Navigate to second paragraph
		await pressKeyTimes( 'ArrowLeft', 6 );

		// Bold second paragraph text
		await page.keyboard.down( 'Shift' );
		await pressKeyTimes( 'ArrowLeft', 6 );
		await page.keyboard.up( 'Shift' );
		await pressKeyWithModifier( 'primary', 'b' );

		// Arrow left from selected bold should collapse to before the inline
		// boundary. Arrow once more to traverse into first paragraph.
		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.type( 'After' );

		// Arrow right from end of first should traverse to second, *BEFORE*
		// the bolded text. Another press should move within inline boundary.
		await pressKeyTimes( 'ArrowRight', 2 );
		await page.keyboard.type( 'Inside' );

		// Arrow left from end of beginning of inline boundary should move to
		// the outside of the inline boundary.
		await pressKeyTimes( 'ArrowLeft', 6 );
		await page.keyboard.press( 'ArrowLeft' ); // Separate for emphasis.
		await page.keyboard.type( 'Before' );

		// Likewise, test at the end of the inline boundary for same effect.
		await page.keyboard.press( 'ArrowRight' ); // Move inside
		await pressKeyTimes( 'ArrowRight', 12 );
		await page.keyboard.type( 'Inside' );
		await page.keyboard.press( 'ArrowRight' );

		// Edge case: Verify that workaround to test for ZWSP at beginning of
		// focus node does not take effect when on the right edge of inline
		// boundary (thus preventing traversing to the next block by arrow).
		await page.keyboard.press( 'ArrowRight' );
		await page.keyboard.press( 'ArrowLeft' );

		// Should be after the inline boundary again.
		await page.keyboard.type( 'After' );

		// Finally, ensure that ArrowRight from end of unbolded text moves to
		// the last paragraph
		await page.keyboard.press( 'ArrowRight' );
		await page.keyboard.type( 'Before' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'should navigate around nested inline boundaries', async () => {
		await clickBlockAppender();
		await pressKeyWithModifier( 'primary', 'b' );
		await page.keyboard.type( '1 2' );
		await page.keyboard.down( 'Shift' );
		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.up( 'Shift' );
		await pressKeyWithModifier( 'primary', 'i' );
		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.down( 'Shift' );
		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.up( 'Shift' );
		await pressKeyWithModifier( 'primary', 'i' );
		await page.keyboard.press( 'ArrowLeft' );

		expect( await getEditedPostContent() ).toMatchSnapshot();

		await page.keyboard.type( 'a' );
		await page.keyboard.press( 'ArrowRight' );
		await page.keyboard.type( 'b' );
		await page.keyboard.press( 'ArrowRight' );
		await page.keyboard.type( 'c' );
		await page.keyboard.press( 'ArrowRight' );
		await page.keyboard.type( 'd' );
		await page.keyboard.press( 'ArrowRight' );
		await page.keyboard.type( 'e' );
		await page.keyboard.press( 'ArrowRight' );
		await page.keyboard.type( 'f' );
		await page.keyboard.press( 'ArrowRight' );
		await page.keyboard.type( 'g' );
		await page.keyboard.press( 'ArrowRight' );
		await page.keyboard.type( 'h' );
		await page.keyboard.press( 'ArrowRight' );
		await page.keyboard.type( 'i' );
		await page.keyboard.press( 'ArrowRight' );
		await page.keyboard.type( 'j' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'should insert line break at end', async () => {
		await clickBlockAppender();
		await page.keyboard.type( 'a' );
		await pressKeyWithModifier( 'shift', 'Enter' );
		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'should insert line break at end and continue writing', async () => {
		await clickBlockAppender();
		await page.keyboard.type( 'a' );
		await pressKeyWithModifier( 'shift', 'Enter' );
		await page.keyboard.type( 'b' );
		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'should insert line break mid text', async () => {
		await clickBlockAppender();
		await page.keyboard.type( 'ab' );
		await page.keyboard.press( 'ArrowLeft' );
		await pressKeyWithModifier( 'shift', 'Enter' );
		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'should insert line break at start', async () => {
		await clickBlockAppender();
		await page.keyboard.type( 'a' );
		await page.keyboard.press( 'ArrowLeft' );
		await pressKeyWithModifier( 'shift', 'Enter' );
		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'should insert line break in empty container', async () => {
		await clickBlockAppender();
		await pressKeyWithModifier( 'shift', 'Enter' );
		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'should not create extra line breaks in multiline value', async () => {
		await insertBlock( 'Quote' );
		await page.keyboard.type( 'a' );
		await page.keyboard.press( 'Backspace' );
		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'should navigate native inputs vertically, not horizontally', async () => {
		// See: https://github.com/WordPress/gutenberg/issues/9626

		// Title is within the editor's writing flow, and is a <textarea>
		await page.click( '.editor-post-title' );

		// Should remain in title upon ArrowRight:
		await page.keyboard.press( 'ArrowRight' );
		let isInTitle = await page.evaluate( () => (
			!! document.activeElement.closest( '.editor-post-title' )
		) );
		expect( isInTitle ).toBe( true );

		// Should remain in title upon modifier + ArrowDown:
		await pressKeyWithModifier( 'primary', 'ArrowDown' );
		isInTitle = await page.evaluate( () => (
			!! document.activeElement.closest( '.editor-post-title' )
		) );
		expect( isInTitle ).toBe( true );

		// Should navigate into blocks list upon ArrowDown:
		await page.keyboard.press( 'ArrowDown' );
		const isInBlock = await page.evaluate( () => (
			!! document.activeElement.closest( '[data-type]' )
		) );
		expect( isInBlock ).toBe( true );
	} );

	it( 'should not delete surrounding space when deleting a word with Backspace', async () => {
		await clickBlockAppender();
		await page.keyboard.type( '1 2 3' );
		await pressKeyTimes( 'ArrowLeft', ' 3'.length );
		await page.keyboard.press( 'Backspace' );

		expect( await getEditedPostContent() ).toMatchSnapshot();

		await page.keyboard.type( '2' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'should not delete surrounding space when deleting a word with Alt+Backspace', async () => {
		await clickBlockAppender();
		await page.keyboard.type( 'alpha beta gamma' );
		await pressKeyTimes( 'ArrowLeft', ' gamma'.length );

		if ( process.platform === 'darwin' ) {
			await pressKeyWithModifier( 'alt', 'Backspace' );
		} else {
			await pressKeyWithModifier( 'primary', 'Backspace' );
		}

		expect( await getEditedPostContent() ).toMatchSnapshot();

		await page.keyboard.type( 'beta' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'should not delete surrounding space when deleting a selected word', async () => {
		await clickBlockAppender();
		await page.keyboard.type( 'alpha beta gamma' );
		await pressKeyTimes( 'ArrowLeft', ' gamma'.length );
		await page.keyboard.down( 'Shift' );
		await pressKeyTimes( 'ArrowLeft', 'beta'.length );
		await page.keyboard.up( 'Shift' );
		await page.keyboard.press( 'Backspace' );

		expect( await getEditedPostContent() ).toMatchSnapshot();

		await page.keyboard.type( 'beta' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'should create valid paragraph blocks when rapidly pressing Enter', async () => {
		await clickBlockAppender();
		await pressKeyTimes( 'Enter', 10 );

		// Check that none of the paragraph blocks have <br> in them.
		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'should navigate empty paragraph', async () => {
		await clickBlockAppender();
		await page.keyboard.press( 'Enter' );
		await page.waitForFunction( () => document.activeElement.isContentEditable );
		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.type( '1' );
		await page.keyboard.press( 'ArrowRight' );
		await page.keyboard.type( '2' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );
} );
