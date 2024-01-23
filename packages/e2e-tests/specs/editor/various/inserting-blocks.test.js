/**
 * WordPress dependencies
 */
import {
	closeGlobalBlockInserter,
	createNewPost,
	getEditedPostContent,
	insertBlock,
	pressKeyTimes,
	setBrowserViewport,
} from '@wordpress/e2e-test-utils';

/** @typedef {import('puppeteer-core').ElementHandle} ElementHandle */

describe( 'Inserting blocks', () => {
	beforeEach( async () => {
		await createNewPost();
	} );

	/**
	 * Given a Puppeteer ElementHandle, clicks below its bounding box.
	 *
	 * @param {ElementHandle} elementHandle Element handle.
	 *
	 * @return {Promise} Promise resolving when click occurs.
	 */
	async function clickAtBottom( elementHandle ) {
		const box = await elementHandle.boundingBox();
		const x = box.x + box.width / 2;
		const y = box.y + box.height - 50;
		return page.mouse.click( x, y );
	}

	it.skip( 'Should insert content using the placeholder and the regular inserter', async () => {
		// This ensures the editor is loaded in navigation mode.
		await page.reload();
		await page.waitForSelector( '.edit-post-layout' );

		// Set a tall viewport. The typewriter's intrinsic height can be enough
		// to scroll the page on a shorter viewport, thus obscuring the presence
		// of any potential buggy behavior with the "stretched" click redirect.
		await setBrowserViewport( { width: 960, height: 1400 } );

		// Click below editor to focus last field (block appender)
		await clickAtBottom(
			await page.$( '.interface-interface-skeleton__content' )
		);
		expect(
			await page.waitForSelector( '[data-type="core/paragraph"]' )
		).not.toBeNull();
		await page.keyboard.type( 'Paragraph block' );

		// Using the slash command.
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '/quote' );
		await page.waitForXPath(
			`//*[contains(@class, "components-autocomplete__result") and contains(@class, "is-selected") and contains(text(), 'Quote')]`
		);
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'Quote block' );

		// Arrow down into default appender.
		await page.keyboard.press( 'ArrowDown' );
		await page.keyboard.press( 'ArrowDown' );

		// Focus should be moved to block focus boundary on a block which does
		// not have its own inputs (e.g. image). Proceeding to press enter will
		// append the default block. Pressing backspace on the focused block
		// will remove it.
		await page.keyboard.type( '/image' );
		await page.waitForXPath(
			`//*[contains(@class, "components-autocomplete__result") and contains(@class, "is-selected") and contains(text(), 'Image')]`
		);
		await page.keyboard.press( 'Enter' );
		await page.keyboard.press( 'Enter' );
		expect( await getEditedPostContent() ).toMatchSnapshot();
		await page.keyboard.press( 'Backspace' );
		await page.keyboard.press( 'Backspace' );
		expect( await getEditedPostContent() ).toMatchSnapshot();

		// Using the regular inserter.
		await insertBlock( 'Preformatted' );
		await page.keyboard.type( 'Pre block' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.press( 'Enter' );

		// Verify vertical traversal at offset. This has been buggy in the past
		// where verticality on a blank newline would skip into previous block.
		await page.keyboard.type( 'Foo' );
		await page.keyboard.press( 'ArrowUp' );
		await page.keyboard.press( 'ArrowUp' );
		await pressKeyTimes( 'Delete', 6 );
		await page.keyboard.type( ' text' );

		// Ensure newline preservation in shortcode block.
		// See: https://github.com/WordPress/gutenberg/issues/4456
		await insertBlock( 'Shortcode' );
		await page.keyboard.type( '[myshortcode]With multiple' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'lines preserved[/myshortcode]' );

		// Unselect blocks to avoid conflicts with the inbetween inserter
		await page.click( '.editor-post-title__input' );
		await closeGlobalBlockInserter();

		// Using the between inserter.
		const insertionPoint = await page.$( '[data-type="core/quote"]' );
		const rect = await insertionPoint.boundingBox();
		await page.mouse.move( rect.x + rect.width / 2, rect.y - 10, {
			steps: 10,
		} );
		const lineInserter = await page.waitForSelector(
			'.block-editor-block-list__insertion-point .block-editor-inserter__toggle'
		);
		await lineInserter.click();
		// [TODO]: Search input should be focused immediately. It shouldn't be
		// necessary to have `waitForFunction`.
		await page.waitForFunction(
			() =>
				document.activeElement &&
				document.activeElement.classList.contains(
					'components-search-control__input'
				)
		);
		await page.keyboard.type( 'para' );
		await pressKeyTimes( 'Tab', 2 );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'Second paragraph' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );
} );
