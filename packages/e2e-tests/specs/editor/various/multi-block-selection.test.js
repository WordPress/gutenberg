/**
 * WordPress dependencies
 */
import {
	clickBlockAppender,
	createNewPost,
	pressKeyWithModifier,
	pressKeyTimes,
	getEditedPostContent,
	clickBlockToolbarButton,
	clickButton,
	clickMenuItem,
	openListView,
	saveDraft,
	transformBlockTo,
} from '@wordpress/e2e-test-utils';

async function getSelectedFlatIndices() {
	return await page.evaluate( () => {
		const indices = [];
		let single;

		Array.from(
			document.querySelectorAll( '.wp-block:not(.editor-post-title)' )
		).forEach( ( node, index ) => {
			if ( node.classList.contains( 'is-selected' ) ) {
				single = index + 1;
			}

			if ( node.classList.contains( 'is-multi-selected' ) ) {
				indices.push( index + 1 );
			}
		} );

		return single !== undefined ? single : indices;
	} );
}

/**
 * Tests if the native selection matches the block selection.
 */
async function testNativeSelection() {
	// Wait for the selection to update and async mode to update classes of
	// deselected blocks.
	await page.evaluate( () => new Promise( window.requestIdleCallback ) );
	await page.evaluate( () => {
		const selection = window.getSelection();
		const elements = Array.from(
			document.querySelectorAll( '.is-multi-selected' )
		);

		if ( ! elements.length ) {
			const element = document.querySelector( '.is-selected' );

			if ( ! element || ! selection.rangeCount ) {
				return;
			}

			const { startContainer, endContainer } = selection.getRangeAt( 0 );

			if ( ! element.contains( startContainer ) ) {
				throw 'expected selection to start in the selected block';
			}

			if ( ! element.contains( endContainer ) ) {
				throw 'expected selection to start in the selected block';
			}

			return;
		}

		if ( ! selection.rangeCount === 1 ) {
			throw 'expected one range';
		}

		if ( selection.isCollapsed ) {
			throw 'expected an uncollapsed selection';
		}

		const firstElement = elements[ 0 ];
		const lastElement = elements[ elements.length - 1 ];
		const { startContainer, endContainer } = selection.getRangeAt( 0 );

		if ( ! firstElement.contains( startContainer ) ) {
			throw 'expected selection to start in the first selected block';
		}

		if ( ! lastElement.contains( endContainer ) ) {
			throw 'expected selection to end in the last selected block';
		}
	} );
}

describe( 'Multi-block selection', () => {
	beforeEach( async () => {
		await createNewPost();
	} );

	it( 'should select with double ctrl+a and speak', async () => {
		await clickBlockAppender();
		await page.keyboard.type( '1' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '2' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '3' );

		// Multiselect via keyboard.
		await pressKeyWithModifier( 'primary', 'a' );
		await pressKeyWithModifier( 'primary', 'a' );

		await testNativeSelection();
		expect( await getSelectedFlatIndices() ).toEqual( [ 1, 2, 3 ] );

		// TODO: It would be great to do this test by spying on `wp.a11y.speak`,
		// but it's very difficult to do that because `wp.a11y` has
		// DOM-dependant side-effect setup code and doesn't seem straightforward
		// to mock. Instead, we check for the DOM node that `wp.a11y.speak()`
		// inserts text into.
		const speakTextContent = await page.$eval(
			'#a11y-speak-assertive',
			( element ) => element.textContent
		);
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
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '3' );
		await page.keyboard.press( 'ArrowUp' );
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
		await testNativeSelection();
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

	it( 'should select and deselect with shift and arrow keys', async () => {
		await clickBlockAppender();
		await page.keyboard.type( '1' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '2' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '3' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '4' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '5' );
		await page.keyboard.press( 'ArrowUp' );
		await page.keyboard.press( 'ArrowUp' );
		await pressKeyWithModifier( 'shift', 'ArrowDown' );

		await testNativeSelection();
		expect( await getSelectedFlatIndices() ).toEqual( [ 3, 4 ] );

		await pressKeyWithModifier( 'shift', 'ArrowDown' );

		await testNativeSelection();
		expect( await getSelectedFlatIndices() ).toEqual( [ 3, 4, 5 ] );

		await pressKeyWithModifier( 'shift', 'ArrowUp' );

		await testNativeSelection();
		expect( await getSelectedFlatIndices() ).toEqual( [ 3, 4 ] );

		await pressKeyWithModifier( 'shift', 'ArrowUp' );

		await testNativeSelection();
		expect( await getSelectedFlatIndices() ).toBe( 3 );

		await pressKeyWithModifier( 'shift', 'ArrowUp' );

		await testNativeSelection();
		expect( await getSelectedFlatIndices() ).toEqual( [ 2, 3 ] );

		await pressKeyWithModifier( 'shift', 'ArrowUp' );

		await testNativeSelection();
		expect( await getSelectedFlatIndices() ).toEqual( [ 1, 2, 3 ] );

		await pressKeyWithModifier( 'shift', 'ArrowDown' );

		await testNativeSelection();
		expect( await getSelectedFlatIndices() ).toEqual( [ 2, 3 ] );

		await pressKeyWithModifier( 'shift', 'ArrowDown' );

		await testNativeSelection();
		expect( await getSelectedFlatIndices() ).toBe( 3 );
	} );

	// Flaky test.
	it.skip( 'should deselect with Escape', async () => {
		await clickBlockAppender();
		await page.keyboard.type( '1' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '2' );

		await pressKeyWithModifier( 'primary', 'a' );
		await pressKeyWithModifier( 'primary', 'a' );

		await testNativeSelection();
		expect( await getSelectedFlatIndices() ).toEqual( [ 1, 2 ] );

		await page.keyboard.press( 'Escape' );

		// Wait for blocks to have updated asynchronously.
		await page.evaluate( () => new Promise( window.requestIdleCallback ) );
		expect( await getSelectedFlatIndices() ).toEqual( [] );
	} );

	it( 'should select with shift + click', async () => {
		await clickBlockAppender();
		await page.keyboard.type( '1' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '2' );
		await page.keyboard.down( 'Shift' );
		await page.click( '[data-type="core/paragraph"]' );
		await page.keyboard.up( 'Shift' );

		await testNativeSelection();
		expect( await getSelectedFlatIndices() ).toEqual( [ 1, 2 ] );

		// Group the blocks and test that multiselection also works for nested
		// blocks. Checks for regressions of
		// https://github.com/WordPress/gutenberg/issues/32056

		await clickBlockToolbarButton( 'Options' );
		await clickMenuItem( 'Group' );
		await page.click( '[data-type="core/paragraph"]' );
		await page.keyboard.down( 'Shift' );
		await page.click( '[data-type="core/paragraph"]:nth-child(2)' );
		await page.keyboard.up( 'Shift' );
		await testNativeSelection();
		expect( await getSelectedFlatIndices() ).toEqual( [ 2, 3 ] );
	} );

	// @see https://github.com/WordPress/gutenberg/issues/34118
	it( 'should properly select a single block even if `shift` was held for the selection', async () => {
		await clickBlockAppender();
		await page.keyboard.type( 'test' );

		await saveDraft();
		await page.reload();
		await page.waitForSelector( '.edit-post-layout' );

		await page.keyboard.down( 'Shift' );
		await page.click( '[data-type="core/paragraph"]', { visible: true } );
		await page.keyboard.up( 'Shift' );

		await pressKeyWithModifier( 'primary', 'a' );
		await page.keyboard.type( 'new content' );
		expect( await getEditedPostContent() ).toMatchInlineSnapshot( `
		"<!-- wp:paragraph -->
		<p>new content</p>
		<!-- /wp:paragraph -->"
	` );
	} );

	it( 'should properly select multiple blocks if selected nested blocks belong to different parent', async () => {
		await clickBlockAppender();
		await page.keyboard.type( 'first' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'group' );
		// Multiselect via keyboard.
		await page.keyboard.down( 'Shift' );
		await page.keyboard.press( 'ArrowUp' );
		await page.keyboard.up( 'Shift' );
		await transformBlockTo( 'Group' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'second' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'group' );
		await page.keyboard.down( 'Shift' );
		await page.keyboard.press( 'ArrowUp' );
		await page.keyboard.up( 'Shift' );
		await transformBlockTo( 'Group' );
		await page.keyboard.press( 'ArrowDown' );

		// Click the first paragraph in the first Group block while pressing `shift` key.
		const firstParagraph = await page.waitForXPath( "//p[text()='first']" );
		await page.keyboard.down( 'Shift' );
		await firstParagraph.click();
		await page.keyboard.up( 'Shift' );

		await page.waitForSelector( '.is-multi-selected' );
		const selectedBlocks = await page.$$( '.is-multi-selected' );
		expect( selectedBlocks ).toHaveLength( 2 );
	} );
	it( 'should properly select part of nested rich text block while holding shift', async () => {
		await clickBlockAppender();
		await page.keyboard.type( 'rich text in group' );
		await transformBlockTo( 'Group' );
		await page.keyboard.press( 'ArrowDown' );

		await page.keyboard.down( 'Shift' );
		const paragraph = await page.$( '[data-type="core/paragraph"]' );
		const { x, y } = await paragraph.boundingBox();
		await page.mouse.move( x + 20, y );
		await page.mouse.down();
		await page.keyboard.up( 'Shift' );
		await page.keyboard.type( 'hi' );
		expect( await getEditedPostContent() ).toMatchInlineSnapshot( `
		"<!-- wp:group -->
		<div class=\\"wp-block-group\\"><!-- wp:paragraph -->
		<p>hih text in group</p>
		<!-- /wp:paragraph --></div>
		<!-- /wp:group -->"
	` );
	} );

	it( 'should select by dragging', async () => {
		await clickBlockAppender();
		await page.keyboard.type( '1' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '2' );
		await page.keyboard.press( 'ArrowUp' );

		const [ paragraph1, paragraph2 ] = await page.$$(
			'[data-type="core/paragraph"]'
		);
		const coord1 = await paragraph1.clickablePoint();
		const coord2 = await paragraph2.clickablePoint();

		await page.mouse.move( coord1.x, coord1.y );
		await page.mouse.down();
		await page.mouse.move( coord2.x, coord2.y, { steps: 10 } );
		await page.mouse.up();

		await testNativeSelection();
		expect( await getSelectedFlatIndices() ).toEqual( [ 1, 2 ] );
	} );

	it( 'should select by dragging into nested block', async () => {
		await clickBlockAppender();
		await page.keyboard.type( '1' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '/group' );
		await page.waitForXPath(
			`//*[contains(@class, "components-autocomplete__result") and contains(@class, "is-selected") and contains(text(), 'Group')]`
		);
		await page.keyboard.press( 'Enter' );

		const groupAppender = await page.waitForSelector(
			'.block-editor-button-block-appender'
		);
		await groupAppender.click();

		const paragraphBlockButton = await page.waitForSelector(
			'.editor-block-list-item-paragraph'
		);
		await paragraphBlockButton.click();

		await page.keyboard.type( '2' );

		const [ paragraph1, paragraph2 ] = await page.$$(
			'[data-type="core/paragraph"]'
		);
		const coord1 = await paragraph1.clickablePoint();
		const coord2 = await paragraph2.clickablePoint();

		await page.mouse.move( coord1.x, coord1.y );
		await page.mouse.down();
		await page.mouse.move( coord2.x, coord2.y, { steps: 10 } );
		await page.mouse.up();

		await testNativeSelection();
		expect( await getSelectedFlatIndices() ).toEqual( [ 1, 2 ] );
	} );

	it( 'should cut and paste', async () => {
		await clickBlockAppender();
		await page.keyboard.type( '1' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '2' );
		await pressKeyWithModifier( 'primary', 'a' );
		await pressKeyWithModifier( 'primary', 'a' );
		await pressKeyWithModifier( 'primary', 'x' );

		expect( await getEditedPostContent() ).toMatchSnapshot();

		await pressKeyWithModifier( 'primary', 'v' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'should copy and paste', async () => {
		await clickBlockAppender();
		await page.keyboard.type( '1' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '2' );
		await pressKeyWithModifier( 'primary', 'a' );
		await pressKeyWithModifier( 'primary', 'a' );
		await pressKeyWithModifier( 'primary', 'c' );

		expect( await getEditedPostContent() ).toMatchSnapshot();

		await page.keyboard.press( 'Backspace' );

		expect( await getEditedPostContent() ).toMatchSnapshot();

		await pressKeyWithModifier( 'primary', 'v' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'should return original focus after failed multi selection attempt', async () => {
		await clickBlockAppender();
		await page.keyboard.type( '1' );
		await page.keyboard.type( '2' );
		await page.keyboard.press( 'ArrowLeft' );

		const [ coord1, coord2 ] = await page.evaluate( () => {
			const selection = window.getSelection();

			if ( ! selection.rangeCount ) {
				return;
			}

			const range = selection.getRangeAt( 0 );
			const rect1 = range.getClientRects()[ 0 ];
			const element = document.querySelector(
				'[data-type="core/paragraph"]'
			);
			const rect2 = element.getBoundingClientRect();

			return [
				{
					x: rect1.x,
					y: rect1.y + rect1.height / 2,
				},
				{
					// Move a bit outside the paragraph.
					x: rect2.x - 5,
					y: rect2.y + rect2.height / 2,
				},
			];
		} );

		await page.mouse.move( coord1.x, coord1.y );
		await page.mouse.down();
		await page.mouse.move( coord2.x, coord2.y, { steps: 10 } );
		await page.mouse.up();

		// Wait for the selection to update.
		await page.evaluate(
			() => new Promise( window.requestAnimationFrame )
		);

		// Only "1" should be deleted.
		await page.keyboard.press( 'Backspace' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'should preserve dragged selection on move', async () => {
		await clickBlockAppender();
		await page.keyboard.type( '1' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '2' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '3' );

		const paragraphs = await page.$$( '[data-type="core/paragraph"]' );
		const coord1 = await paragraphs[ 2 ].clickablePoint();
		const coord2 = await paragraphs[ 1 ].clickablePoint();

		await page.mouse.move( coord1.x, coord1.y );
		await page.mouse.down();
		await page.mouse.move( coord2.x, coord2.y );
		await page.mouse.up();

		await testNativeSelection();
		expect( await getSelectedFlatIndices() ).toEqual( [ 2, 3 ] );

		await clickBlockToolbarButton( 'Move up' );

		await testNativeSelection();
		expect( await getSelectedFlatIndices() ).toEqual( [ 1, 2 ] );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'should clear selection when clicking next to blocks', async () => {
		await clickBlockAppender();
		await page.keyboard.type( '1' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '2' );
		await pressKeyWithModifier( 'shift', 'ArrowUp' );
		await testNativeSelection();
		expect( await getSelectedFlatIndices() ).toEqual( [ 1, 2 ] );
		const paragraph = await page.$( '[data-type="core/paragraph"]' );
		const rect = await paragraph.boundingBox();
		const coord = {
			x: rect.x - 1,
			y: rect.y + rect.height / 2,
		};

		await page.mouse.click( coord.x, coord.y );

		// Wait for blocks to have updated asynchronously.
		await page.evaluate( () => new Promise( window.requestIdleCallback ) );
		await testNativeSelection();
		expect( await getSelectedFlatIndices() ).toEqual( [] );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'should place the caret at the end of last pasted paragraph (paste to empty editor)', async () => {
		await clickBlockAppender();
		await page.keyboard.type( 'first paragraph' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'second paragraph' );
		await pressKeyWithModifier( 'primary', 'a' );
		await pressKeyWithModifier( 'primary', 'a' );
		await pressKeyWithModifier( 'primary', 'c' );
		await page.keyboard.press( 'Backspace' );
		await pressKeyWithModifier( 'primary', 'v' );
		await page.keyboard.press( 'Backspace' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'should place the caret at the end of last pasted paragraph (paste mid-block)', async () => {
		await clickBlockAppender();
		await page.keyboard.type( 'first paragraph' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'second paragraph' );
		await pressKeyWithModifier( 'primary', 'a' );
		await pressKeyWithModifier( 'primary', 'a' );
		await pressKeyWithModifier( 'primary', 'c' );

		await page.keyboard.press( 'ArrowRight' );
		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.press( 'ArrowLeft' );

		await pressKeyWithModifier( 'primary', 'v' );
		await page.keyboard.press( 'Backspace' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'should place the caret at the end of last pasted paragraph (replace)', async () => {
		await clickBlockAppender();
		await page.keyboard.type( 'first paragraph' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'second paragraph' );
		await pressKeyWithModifier( 'primary', 'a' );
		await pressKeyWithModifier( 'primary', 'a' );
		await pressKeyWithModifier( 'primary', 'c' );
		await pressKeyWithModifier( 'primary', 'v' );
		await page.keyboard.press( 'Backspace' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'should set attributes for multiple paragraphs', async () => {
		await clickBlockAppender();
		await page.keyboard.type( '1' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '2' );
		await pressKeyWithModifier( 'primary', 'a' );
		await pressKeyWithModifier( 'primary', 'a' );
		await clickBlockToolbarButton( 'Align' );
		await clickButton( 'Align text center' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'should copy multiple blocks', async () => {
		await clickBlockAppender();
		await page.keyboard.type( '1' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '2' );
		await pressKeyWithModifier( 'primary', 'a' );
		await pressKeyWithModifier( 'primary', 'a' );
		await pressKeyWithModifier( 'primary', 'c' );
		await page.keyboard.press( 'ArrowUp' );
		await pressKeyWithModifier( 'primary', 'v' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	// Previously we would unexpectedly duplicate the block on Enter.
	it( 'should not multi select single block', async () => {
		await clickBlockAppender();
		await page.keyboard.type( '1' );
		await pressKeyWithModifier( 'primary', 'a' );
		await pressKeyWithModifier( 'primary', 'a' );
		await page.keyboard.press( 'Enter' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'should gradually multi-select', async () => {
		await clickBlockAppender();
		await page.keyboard.type( '/columns' );
		await page.keyboard.press( 'Enter' );
		// Select two columns.
		await page.keyboard.press( 'ArrowRight' );
		await page.keyboard.press( 'ArrowRight' );
		await page.keyboard.press( 'Enter' );
		// Navigate to appender.
		await page.keyboard.press( 'ArrowRight' );
		await page.keyboard.press( 'Enter' );
		// Select a paragraph.
		await page.keyboard.press( 'Tab' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '1' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '2' );

		// Confirm correct setup: two columns with two paragraphs in the first.
		expect( await getEditedPostContent() ).toMatchSnapshot();

		await pressKeyWithModifier( 'primary', 'a' );
		await pressKeyWithModifier( 'primary', 'a' );

		await page.waitForSelector(
			'[data-type="core/paragraph"].is-multi-selected'
		);

		await pressKeyWithModifier( 'primary', 'a' );

		await page.waitForSelector(
			'[data-type="core/column"].is-multi-selected'
		);

		await page.keyboard.press( 'Backspace' );

		// Expect both columns to be deleted.
		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'should multi-select from within the list block', async () => {
		await clickBlockAppender();
		// Select a paragraph.
		await page.keyboard.type( '1' );
		await page.keyboard.press( 'Enter' );
		// Add a list
		await page.keyboard.type( '/list' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '1' );

		// Confirm correct setup: a paragraph and a list
		expect( await getEditedPostContent() ).toMatchSnapshot();

		await pressKeyWithModifier( 'primary', 'a' );
		await pressKeyWithModifier( 'primary', 'a' );

		await page.waitForSelector(
			'[data-type="core/paragraph"].is-multi-selected'
		);
	} );

	it( 'should select all from empty selection', async () => {
		await clickBlockAppender();

		await page.keyboard.type( '1' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '2' );

		// Confirm setup.
		expect( await getEditedPostContent() ).toMatchSnapshot();

		// Clear the selected block.
		const paragraph = await page.$( '[data-type="core/paragraph"]' );
		const box = await paragraph.boundingBox();
		await page.mouse.click( box.x - 1, box.y );

		await pressKeyWithModifier( 'primary', 'a' );

		await page.keyboard.press( 'Backspace' );

		// Expect both paragraphs to be deleted.
		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'should select title if the cursor is on title', async () => {
		await clickBlockAppender();

		await page.keyboard.type( '1' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '2' );

		await page.type( '.editor-post-title__input', 'Post title' );

		await pressKeyWithModifier( 'primary', 'a' );
		const selectedText = await page.evaluate( () => {
			return window.getSelection().toString();
		} );
		expect( selectedText ).toEqual( 'Post title' );
	} );

	it( 'should multi-select in the ListView component with shift + click', async () => {
		// Create four blocks.
		await clickBlockAppender();
		await page.keyboard.type( '1' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '2' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '3' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '4' );

		// Open up the list view, and get a reference to each of the list items.
		await openListView();
		const navButtons = await page.$$(
			'.block-editor-list-view-block-select-button'
		);

		// Clicking on the second list item should result in the second block being selected.
		await navButtons[ 1 ].click();
		expect( await getSelectedFlatIndices() ).toEqual( 2 );

		// Shift clicking the fourth list item should result in blocks 2 through 4 being selected.
		await page.keyboard.down( 'Shift' );
		await navButtons[ 3 ].click();
		expect( await getSelectedFlatIndices() ).toEqual( [ 2, 3, 4 ] );

		// With the shift key still held down, clicking the first block should result in
		// the first two blocks being selected.
		await navButtons[ 0 ].click();
		expect( await getSelectedFlatIndices() ).toEqual( [ 1, 2 ] );

		// With the shift key up, clicking the fourth block should result in only that block
		// being selected.
		await page.keyboard.up( 'Shift' );
		await navButtons[ 3 ].click();
		expect( await getSelectedFlatIndices() ).toEqual( 4 );
	} );
} );
