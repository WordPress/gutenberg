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

const getActiveBlockName = async () =>
	page.evaluate(
		() => wp.data.select( 'core/block-editor' ).getSelectedBlock().name
	);

describe( 'Writing Flow', () => {
	beforeEach( async () => {
		await createNewPost();
	} );

	it( 'Should navigate inner blocks with arrow keys', async () => {
		// TODO: The `waitForSelector` calls in this function should ultimately
		// not be necessary for interactions, and exist as a stop-gap solution
		// where rendering delays in slower CPU can cause intermittent failure.

		// Assertions are made both against the active DOM element and the
		// editor state, in order to protect against potential disparities.
		//
		// See: https://github.com/WordPress/gutenberg/issues/18928
		let activeElementText, activeBlockName;

		// Add demo content
		await clickBlockAppender();
		await page.keyboard.type( 'First paragraph' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '/columns' );
		await page.keyboard.press( 'Enter' );
		await page.click( ':focus [aria-label="Two columns; equal split"]' );
		await page.click( ':focus .block-editor-button-block-appender' );
		await page.waitForSelector( ':focus.block-editor-inserter__search' );
		await page.keyboard.type( 'Paragraph' );
		await pressKeyTimes( 'Tab', 3 ); // Tab to paragraph result.
		await page.keyboard.press( 'Enter' ); // Insert paragraph.
		await page.keyboard.type( '1st col' ); // If this text is too long, it may wrap to a new line and cause test failure. That's why we're using "1st" instead of "First" here.

		// TODO: ArrowDown should traverse into the second column. In slower
		// CPUs, it can sometimes remain in the first column paragraph. This
		// is a temporary solution.
		await page.focus( '.wp-block[data-type="core/column"]:nth-child(2)' );
		await page.click( ':focus .block-editor-button-block-appender' );
		await page.waitForSelector( ':focus.block-editor-inserter__search' );
		await page.keyboard.type( 'Paragraph' );
		await pressKeyTimes( 'Tab', 3 ); // Tab to paragraph result.
		await page.keyboard.press( 'Enter' ); // Insert paragraph.
		await page.keyboard.type( '2nd col' ); // If this text is too long, it may wrap to a new line and cause test failure. That's why we're using "2nd" instead of "Second" here.

		// Arrow down from last of layouts exits nested context to default
		// appender of root level.
		await page.keyboard.press( 'ArrowDown' );
		await page.keyboard.type( 'Second paragraph' );

		// Arrow up into nested context focuses last text input
		await page.keyboard.press( 'ArrowUp' );
		activeBlockName = await getActiveBlockName();
		expect( activeBlockName ).toBe( 'core/paragraph' );
		activeElementText = await page.evaluate(
			() => document.activeElement.textContent
		);
		expect( activeElementText ).toBe( '2nd col' );

		// Arrow up in inner blocks should navigate through (1) column wrapper,
		// (2) text fields.
		await page.keyboard.press( 'ArrowUp' );
		activeBlockName = await getActiveBlockName();
		expect( activeBlockName ).toBe( 'core/column' );
		await page.keyboard.press( 'ArrowUp' );
		activeBlockName = await getActiveBlockName();
		expect( activeBlockName ).toBe( 'core/paragraph' );
		activeElementText = await page.evaluate(
			() => document.activeElement.textContent
		);
		expect( activeElementText ).toBe( '1st col' );

		// Arrow up from first text field in nested context focuses column and
		// columns wrappers before escaping out.
		let activeElementBlockType;
		await page.keyboard.press( 'ArrowUp' );
		activeElementBlockType = await page.evaluate( () =>
			document.activeElement.getAttribute( 'data-type' )
		);
		expect( activeElementBlockType ).toBe( 'core/column' );
		activeBlockName = await getActiveBlockName();
		expect( activeBlockName ).toBe( 'core/column' );
		await page.keyboard.press( 'ArrowUp' );
		activeElementBlockType = await page.evaluate( () =>
			document.activeElement.getAttribute( 'data-type' )
		);
		expect( activeElementBlockType ).toBe( 'core/columns' );
		activeBlockName = await getActiveBlockName();
		expect( activeBlockName ).toBe( 'core/columns' );

		// Arrow up from focused (columns) block wrapper exits nested context
		// to prior text input.
		await page.keyboard.press( 'ArrowUp' );
		activeBlockName = await getActiveBlockName();
		expect( activeBlockName ).toBe( 'core/paragraph' );
		activeElementText = await page.evaluate(
			() => document.activeElement.textContent
		);
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
		let isInTitle = await page.evaluate(
			() => !! document.activeElement.closest( '.editor-post-title' )
		);
		expect( isInTitle ).toBe( true );

		// Should remain in title upon modifier + ArrowDown:
		await pressKeyWithModifier( 'primary', 'ArrowDown' );
		isInTitle = await page.evaluate(
			() => !! document.activeElement.closest( '.editor-post-title' )
		);
		expect( isInTitle ).toBe( true );

		// Should navigate into blocks list upon ArrowDown:
		await page.keyboard.press( 'ArrowDown' );
		const isInBlock = await page.evaluate(
			() => !! document.activeElement.closest( '[data-type]' )
		);
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
		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.type( '1' );
		await page.keyboard.press( 'ArrowRight' );
		await page.keyboard.type( '2' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'should navigate contenteditable with padding', async () => {
		await clickBlockAppender();
		await page.keyboard.press( 'Enter' );
		await page.evaluate( () => {
			document.activeElement.style.paddingTop = '100px';
		} );
		await page.keyboard.press( 'ArrowUp' );
		await page.keyboard.type( '1' );
		await page.evaluate( () => {
			document.activeElement.style.paddingBottom = '100px';
		} );
		await page.keyboard.press( 'ArrowDown' );
		await page.keyboard.type( '2' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'should not prematurely multi-select', async () => {
		await clickBlockAppender();
		await page.keyboard.type( '1' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '><<' );
		await pressKeyWithModifier( 'shift', 'Enter' );
		await page.keyboard.type( '<<<' );
		await page.keyboard.down( 'Shift' );
		await pressKeyTimes( 'ArrowLeft', '<<\n<<<'.length );
		await page.keyboard.up( 'Shift' );
		await page.keyboard.press( 'Backspace' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'should merge forwards', async () => {
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '1' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '3' );
		await page.keyboard.press( 'ArrowUp' );
		await page.keyboard.press( 'Delete' );
		await page.keyboard.type( '2' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'should preserve horizontal position when navigating vertically between blocks', async () => {
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'abc' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '23' );
		await page.keyboard.press( 'ArrowUp' );
		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.press( 'ArrowDown' );
		await page.keyboard.type( '1' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'should remember initial vertical position', async () => {
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '1' );
		await page.keyboard.press( 'Enter' );
		await pressKeyWithModifier( 'shift', 'Enter' );
		await page.keyboard.type( '2' );
		await page.keyboard.press( 'ArrowUp' );
		await page.keyboard.press( 'ArrowUp' );
		await page.keyboard.type( 'x' ); // Should be right after "1".

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'should navigate contenteditable with side padding', async () => {
		await clickBlockAppender();
		await page.keyboard.press( 'Enter' );
		await page.evaluate( () => {
			document.activeElement.style.paddingLeft = '100px';
		} );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.press( 'ArrowUp' );
		await page.keyboard.press( 'ArrowUp' );
		await page.keyboard.type( '1' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'should navigate empty paragraphs', async () => {
		await page.keyboard.press( 'Enter' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.type( '1' );
		await page.keyboard.press( 'ArrowRight' );
		await page.keyboard.press( 'ArrowRight' );
		await page.keyboard.type( '3' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'should allow selecting entire list with longer last item', async () => {
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'a' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '* b' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'cd' );
		await pressKeyWithModifier( 'shift', 'ArrowUp' );
		await pressKeyWithModifier( 'shift', 'ArrowUp' );

		// Ensure multi selection is not triggered and selection stays within
		// the list.
		await page.keyboard.press( 'Backspace' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'should not have a dead zone between blocks (lower)', async () => {
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '1' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '2' );
		await page.keyboard.press( 'ArrowUp' );

		// Find a point outside the paragraph between the blocks where it's
		// expected that the sibling inserter would be placed.
		const paragraph = await page.$( '[data-type="core/paragraph"]' );
		const paragraphRect = await paragraph.boundingBox();
		const x = paragraphRect.x + ( 2 * paragraphRect.width ) / 3;
		const y = paragraphRect.y + paragraphRect.height + 1;

		await page.mouse.move( x, y );
		await page.waitForSelector(
			'.block-editor-block-list__insertion-point-inserter'
		);

		const inserter = await page.$(
			'.block-editor-block-list__insertion-point-inserter'
		);
		const inserterRect = await inserter.boundingBox();
		const lowerInserterY = inserterRect.y + ( 2 * inserterRect.height ) / 3;

		await page.mouse.click( x, lowerInserterY );
		await page.keyboard.type( '3' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'should not have a dead zone between blocks (upper)', async () => {
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '1' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '2' );

		// Find a point outside the paragraph between the blocks where it's
		// expected that the sibling inserter would be placed.
		const paragraph = await page.$( '[data-type="core/paragraph"]' );
		const paragraphRect = await paragraph.boundingBox();
		const x = paragraphRect.x + ( 2 * paragraphRect.width ) / 3;
		const y = paragraphRect.y + paragraphRect.height + 1;

		await page.mouse.move( x, y );
		await page.waitForSelector(
			'.block-editor-block-list__insertion-point-inserter'
		);

		const inserter = await page.$(
			'.block-editor-block-list__insertion-point-inserter'
		);
		const inserterRect = await inserter.boundingBox();
		const upperInserterY = inserterRect.y + inserterRect.height / 3;

		await page.mouse.click( x, upperInserterY );
		await page.keyboard.type( '3' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );
} );
