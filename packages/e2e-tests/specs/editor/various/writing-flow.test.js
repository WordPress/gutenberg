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
	clickBlockToolbarButton,
} from '@wordpress/e2e-test-utils';

const getActiveBlockName = async () =>
	page.evaluate(
		() => wp.data.select( 'core/block-editor' ).getSelectedBlock()?.name
	);

const addParagraphsAndColumnsDemo = async () => {
	// Add demo content
	await clickBlockAppender();
	await page.keyboard.type( 'First paragraph' );
	await page.keyboard.press( 'Enter' );
	await page.keyboard.type( '/columns' );
	await page.waitForXPath(
		`//*[contains(@class, "components-autocomplete__result") and contains(@class, "is-selected") and contains(text(), 'Columns')]`
	);
	await page.keyboard.press( 'Enter' );
	await page.click( ':focus [aria-label="Two columns; equal split"]' );
	await page.click( ':focus .block-editor-button-block-appender' );
	await page.waitForSelector( '.block-editor-inserter__search input:focus' );
	await page.keyboard.type( 'Paragraph' );
	await pressKeyTimes( 'Tab', 2 ); // Tab to paragraph result.
	await page.keyboard.press( 'Enter' ); // Insert paragraph.
	await page.keyboard.type( '1st col' ); // If this text is too long, it may wrap to a new line and cause test failure. That's why we're using "1st" instead of "First" here.

	// TODO: ArrowDown should traverse into the second column. In slower
	// CPUs, it can sometimes remain in the first column paragraph. This
	// is a temporary solution.
	await page.focus( '.wp-block[data-type="core/column"]:nth-child(2)' );
	await page.click( ':focus .block-editor-button-block-appender' );
	await page.waitForSelector( '.block-editor-inserter__search input:focus' );
	await page.keyboard.type( 'Paragraph' );
	await pressKeyTimes( 'Tab', 2 ); // Tab to paragraph result.
	await page.keyboard.press( 'Enter' ); // Insert paragraph.
	await page.keyboard.type( '2nd col' ); // If this text is too long, it may wrap to a new line and cause test failure. That's why we're using "2nd" instead of "Second" here.

	await page.keyboard.press( 'Escape' ); // Enter navigation mode
	await page.keyboard.press( 'ArrowLeft' ); // move to the column block
	await page.keyboard.press( 'ArrowLeft' ); // move to the columns block
	await page.keyboard.press( 'Enter' ); // Enter edit mode with the columns block selected
	await page.keyboard.press( 'Enter' ); // Creates a paragraph after the columns block.
	await page.keyboard.type( 'Second paragraph' );
};

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
		await addParagraphsAndColumnsDemo();

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
		const activeElementBlockType = await page.evaluate( () =>
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

	it( 'Should navigate between inner and root blocks in navigation mode', async () => {
		// In navigation mode the active element is the block name button, so we can't easily check the block content.
		let activeBlockName;

		// Add demo content
		await addParagraphsAndColumnsDemo();

		// Switch to navigation mode
		await page.keyboard.press( 'Escape' );
		// Arrow up to Columns block
		await page.keyboard.press( 'ArrowUp' );
		activeBlockName = await getActiveBlockName();
		expect( activeBlockName ).toBe( 'core/columns' );
		// Arrow right into Column block
		await page.keyboard.press( 'ArrowRight' );
		activeBlockName = await getActiveBlockName();
		expect( activeBlockName ).toBe( 'core/column' );
		// Arrow down to reach second Column block
		await page.keyboard.press( 'ArrowDown' );
		// Arrow right again into Paragraph block
		await page.keyboard.press( 'ArrowRight' );
		activeBlockName = await getActiveBlockName();
		expect( activeBlockName ).toBe( 'core/paragraph' );
		// Arrow left back to Column block
		await page.keyboard.press( 'ArrowLeft' );
		activeBlockName = await getActiveBlockName();
		expect( activeBlockName ).toBe( 'core/column' );
		// Arrow left back to Columns block
		await page.keyboard.press( 'ArrowLeft' );
		activeBlockName = await getActiveBlockName();
		expect( activeBlockName ).toBe( 'core/columns' );
		// Arrow up to first paragraph
		await page.keyboard.press( 'ArrowUp' );
		activeBlockName = await getActiveBlockName();
		expect( activeBlockName ).toBe( 'core/paragraph' );
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

		await insertBlock( 'Shortcode' );
		await insertBlock( 'Paragraph' );
		await await page.click( '.wp-block-shortcode' );

		// Should remain in title upon ArrowRight:
		await page.keyboard.press( 'ArrowRight' );
		let isInShortcodeBlock = await page.evaluate(
			() => !! document.activeElement.closest( '.wp-block-shortcode' )
		);
		expect( isInShortcodeBlock ).toBe( true );

		// Should remain in title upon modifier + ArrowDown:
		await pressKeyWithModifier( 'primary', 'ArrowDown' );
		isInShortcodeBlock = await page.evaluate(
			() => !! document.activeElement.closest( '.wp-block-shortcode' )
		);
		expect( isInShortcodeBlock ).toBe( true );

		// Should navigate to the next block.
		await page.keyboard.press( 'ArrowDown' );
		const isInParagraphBlock = await page.evaluate(
			() => !! document.activeElement.closest( '.wp-block-paragraph' )
		);
		expect( isInParagraphBlock ).toBe( true );
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

	it( 'should navigate contenteditable with normal line height', async () => {
		await clickBlockAppender();
		await page.keyboard.press( 'Enter' );
		await page.evaluate( () => {
			document.activeElement.style.lineHeight = 'normal';
		} );
		await page.keyboard.press( 'ArrowUp' );
		await page.keyboard.type( '1' );

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

	it( 'should merge paragraphs', async () => {
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '1' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '2' );
		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.press( 'Backspace' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'should merge and then split paragraphs', async () => {
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'abc' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '123' );
		await page.keyboard.press( 'ArrowUp' );
		await page.keyboard.press( 'Delete' );
		await page.keyboard.press( 'Enter' );

		expect( await getEditedPostContent() ).toMatchInlineSnapshot( `
		"<!-- wp:paragraph -->
		<p>abc</p>
		<!-- /wp:paragraph -->

		<!-- wp:paragraph -->
		<p>123</p>
		<!-- /wp:paragraph -->"
	` );
	} );

	it( 'should merge and then soft line break', async () => {
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '1' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '2' );
		await page.keyboard.press( 'ArrowUp' );
		await page.keyboard.press( 'Delete' );
		await page.keyboard.down( 'Shift' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.up( 'Shift' );

		expect( await getEditedPostContent() ).toMatchInlineSnapshot( `
		"<!-- wp:paragraph -->
		<p>1<br>2</p>
		<!-- /wp:paragraph -->"
	` );
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

	it( 'should merge forwards properly on multiple triggers', async () => {
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '1' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '2' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '3' );
		await pressKeyTimes( 'ArrowUp', 2 );
		await pressKeyTimes( 'Delete', 2 );
		expect( await getEditedPostContent() ).toMatchInlineSnapshot( `
		"<!-- wp:paragraph -->
		<p>1</p>
		<!-- /wp:paragraph -->

		<!-- wp:paragraph -->
		<p>3</p>
		<!-- /wp:paragraph -->"
	` );
		await page.keyboard.press( 'Delete' );

		expect( await getEditedPostContent() ).toMatchInlineSnapshot( `
		"<!-- wp:paragraph -->
		<p>13</p>
		<!-- /wp:paragraph -->"
	` );
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
			'.block-editor-block-list__insertion-point'
		);

		const inserter = await page.$(
			'.block-editor-block-list__insertion-point'
		);
		const inserterRect = await inserter.boundingBox();
		const lowerInserterY = inserterRect.y + ( 2 * inserterRect.height ) / 3;

		await page.mouse.click( x, lowerInserterY );
		await page.keyboard.type( '3' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'should not have a dead zone above an aligned block', async () => {
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '1' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '/image' );
		await page.keyboard.press( 'Enter' );
		await clickBlockToolbarButton( 'Align' );
		const wideButton = await page.waitForXPath(
			`//button[contains(@class,'components-dropdown-menu__menu-item')]//span[contains(text(), 'Wide width')]`
		);
		await wideButton.click();

		// Select the previous block.
		await page.keyboard.press( 'ArrowUp' );

		// Confirm correct setup.
		expect( await getEditedPostContent() ).toMatchSnapshot();

		// Find a point outside the paragraph between the blocks where it's
		// expected that the sibling inserter would be placed.
		const paragraph = await page.$( '[data-type="core/paragraph"]' );
		const paragraphRect = await paragraph.boundingBox();
		const x = paragraphRect.x + ( 2 * paragraphRect.width ) / 3;
		const y = paragraphRect.y + paragraphRect.height + 1;

		await page.mouse.move( x, y );
		await page.waitForSelector(
			'.block-editor-block-list__insertion-point'
		);

		const inserter = await page.$(
			'.block-editor-block-list__insertion-point'
		);
		const inserterRect = await inserter.boundingBox();
		const lowerInserterY = inserterRect.y + ( 2 * inserterRect.height ) / 3;

		await page.mouse.click( x, lowerInserterY );

		const type = await page.evaluate( () =>
			document.activeElement.getAttribute( 'data-type' )
		);

		expect( type ).toBe( 'core/image' );
	} );

	it( 'should only consider the content as one tab stop', async () => {
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '/table' );
		await page.keyboard.press( 'Enter' );
		// Move into the placeholder UI.
		await page.keyboard.press( 'ArrowDown' );
		// Tab to the "Create table" button.
		await page.keyboard.press( 'Tab' );
		await page.keyboard.press( 'Tab' );
		// Create the table.
		await page.keyboard.press( 'Space' );
		// Return focus after focus loss. This should be fixed.
		await page.keyboard.press( 'Tab' );
		// Navigate to the second cell.
		await page.keyboard.press( 'ArrowRight' );
		await page.keyboard.type( '2' );
		// Confirm correct setup.
		expect( await getEditedPostContent() ).toMatchSnapshot();
		// The content should only have one tab stop.
		await page.keyboard.press( 'Tab' );
		expect(
			await page.evaluate( () =>
				document.activeElement.getAttribute( 'aria-label' )
			)
		).toBe( 'Post' );
		await pressKeyWithModifier( 'shift', 'Tab' );
		await pressKeyWithModifier( 'shift', 'Tab' );
		expect(
			await page.evaluate( () =>
				document.activeElement.getAttribute( 'aria-label' )
			)
		).toBe( 'Table' );
	} );

	it( 'Should unselect all blocks when hitting double escape', async () => {
		// Add demo content.
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'Random Paragraph' );

		// Select a block.
		let activeBlockName = await getActiveBlockName();
		expect( activeBlockName ).toBe( 'core/paragraph' );

		// First escape enters navigaiton mode.
		await page.keyboard.press( 'Escape' );
		activeBlockName = await getActiveBlockName();
		expect( activeBlockName ).toBe( 'core/paragraph' );

		// Second escape unselects the blocks.
		await page.keyboard.press( 'Escape' );
		activeBlockName = await getActiveBlockName();
		expect( activeBlockName ).toBe( undefined );
	} );
} );
