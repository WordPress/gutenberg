/**
 * Internal dependencies
 */
import '../support/bootstrap';
import { newPost, newDesktopBrowserPage, getHTMLFromCodeEditor } from '../support/utils';

describe( 'adding blocks', () => {
	beforeAll( async () => {
		await newDesktopBrowserPage();
		await newPost();
	} );

	/**
	 * Given a Puppeteer ElementHandle, clicks around the center-right point.
	 *
	 * TEMPORARY: This is a mild hack to work around a bug in the application
	 * which prevents clicking at center of the inserter, due to conflicting
	 * overlap of focused block contextual toolbar.
	 *
	 * @see Puppeteer.ElementHandle#click
	 *
	 * @link https://github.com/WordPress/gutenberg/pull/5658#issuecomment-376943568
	 *
	 * @param {Puppeteer.ElementHandle} elementHandle Element handle.
	 *
	 * @return {Promise} Promise resolving when element clicked.
	 */
	async function clickAtRightish( elementHandle ) {
		await elementHandle._scrollIntoViewIfNeeded();
		const box = await elementHandle._assertBoundingBox();
		const x = box.x + ( box.width * 0.75 );
		const y = box.y + ( box.height / 2 );
		return page.mouse.click( x, y );
	}

	/**
	 * Given a Puppeteer ElementHandle, clicks below its bounding box.
	 *
	 * @param {Puppeteer.ElementHandle} elementHandle Element handle.
	 *
	 * @return {Promise} Promise resolving when click occurs.
	 */
	async function clickBelow( elementHandle ) {
		const box = await elementHandle.boundingBox();
		const x = box.x + ( box.width / 2 );
		const y = box.y + box.height + 1;
		return page.mouse.click( x, y );
	}

	it( 'Should insert content using the placeholder and the regular inserter', async () => {
		// Click below editor to focus last field (block appender)
		await clickBelow( await page.$( '.editor-default-block-appender' ) );
		expect( await page.$( '[data-type="core/paragraph"]' ) ).not.toBeNull();

		// Up to return back to title. Assumes that appender results in focus
		// to a new block.
		// TODO: Backspace should be sufficient to return to title.
		await page.keyboard.press( 'ArrowUp' );

		// Post is empty, the newly created paragraph has been removed on focus
		// out because default block is provisional.
		expect( await page.$( '[data-type="core/paragraph"]' ) ).toBeNull();

		// Using the placeholder
		await page.click( '.editor-default-block-appender' );
		await page.keyboard.type( 'Paragraph block' );

		// Using the slash command
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '/quote' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'Quote block' );

		// Using the regular inserter
		await page.click( '.edit-post-header [aria-label="Add block"]' );
		await page.keyboard.type( 'code' );
		await page.keyboard.press( 'Tab' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'Code block' );

		// Using the between inserter
		await page.mouse.move( 200, 300 );
		await page.mouse.move( 250, 350 );
		const inserter = await page.$( '[data-type="core/quote"] .editor-block-list__insertion-point-inserter' );
		await clickAtRightish( inserter );
		await page.keyboard.type( 'Second paragraph' );

		expect( await getHTMLFromCodeEditor() ).toMatchSnapshot();
	} );
} );
