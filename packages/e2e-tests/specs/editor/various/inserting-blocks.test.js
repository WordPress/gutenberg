/**
 * WordPress dependencies
 */
import {
	closeGlobalBlockInserter,
	createNewPost,
	getEditedPostContent,
	insertBlock,
	openGlobalBlockInserter,
	pressKeyTimes,
	searchForBlock,
	setBrowserViewport,
	showBlockToolbar,
} from '@wordpress/e2e-test-utils';

/** @typedef {import('puppeteer').ElementHandle} ElementHandle */

/**
 * Waits for all patterns in the inserter to have a height, which should
 * indicate they've been parsed and are visible.
 *
 * This allows a test to wait for the layout in the inserter menu to stabilize
 * before attempting to interact with the menu contents.
 */
async function waitForInserterPatternLoad() {
	await page.waitForFunction( () => {
		const previewElements = document.querySelectorAll(
			'.block-editor-block-preview__container'
		);

		if ( ! previewElements.length ) {
			return true;
		}

		return Array.from( previewElements ).every(
			( previewElement ) => previewElement.offsetHeight > 0
		);
	} );
}

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

	it( 'Should insert content using the placeholder and the regular inserter', async () => {
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

		// Using the slash command
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

		// Using the regular inserter
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

		// Using the between inserter
		const insertionPoint = await page.$( '[data-type="core/quote"]' );
		const rect = await insertionPoint.boundingBox();
		await page.mouse.move( rect.x + rect.width / 2, rect.y - 10, {
			steps: 10,
		} );
		await page.waitForSelector(
			'.block-editor-block-list__insertion-point .block-editor-inserter__toggle'
		);
		await page.click(
			'.block-editor-block-list__insertion-point .block-editor-inserter__toggle'
		);
		// [TODO]: Search input should be focused immediately. It shouldn't be
		// necessary to have `waitForFunction`.
		await page.waitForFunction(
			() =>
				document.activeElement &&
				document.activeElement.classList.contains(
					'block-editor-inserter__search-input'
				)
		);
		await page.keyboard.type( 'para' );
		await pressKeyTimes( 'Tab', 2 );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'Second paragraph' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'should insert block with the slash inserter when using multiple words', async () => {
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '/tag cloud' );
		await page.waitForXPath(
			`//*[contains(@class, "components-autocomplete__result") and contains(@class, "is-selected") and contains(text(), 'Tag Cloud')]`
		);
		await page.keyboard.press( 'Enter' );

		expect(
			await page.waitForSelector( '[data-type="core/tag-cloud"]' )
		).not.toBeNull();
	} );

	// Check for regression of https://github.com/WordPress/gutenberg/issues/9583
	it( 'should not allow transfer of focus outside of the block-insertion menu once open', async () => {
		// Enter the default block and click the inserter toggle button to the left of it.
		await page.keyboard.press( 'ArrowDown' );
		await showBlockToolbar();
		await page.click(
			'.block-editor-block-list__empty-block-inserter .block-editor-inserter__toggle'
		);

		// Expect the inserter search input to be the active element.
		let activeElementClassList = await page.evaluate(
			() => document.activeElement.classList
		);
		expect( Object.values( activeElementClassList ) ).toContain(
			'block-editor-inserter__search-input'
		);

		// Try using the up arrow key (vertical navigation triggers the issue described in #9583).
		await page.keyboard.press( 'ArrowUp' );

		// Expect the inserter search input to still be the active element.
		activeElementClassList = await page.evaluate(
			() => document.activeElement.classList
		);
		expect( Object.values( activeElementClassList ) ).toContain(
			'block-editor-inserter__search-input'
		);

		// Tab to the block list
		await page.keyboard.press( 'Tab' );

		// Expect the block list to be the active element.
		activeElementClassList = await page.evaluate(
			() => document.activeElement.classList
		);
		expect( Object.values( activeElementClassList ) ).toContain(
			'block-editor-block-types-list__item'
		);

		// Try using the up arrow key
		await page.keyboard.press( 'ArrowUp' );

		// Expect the block list to still be the active element.
		activeElementClassList = await page.evaluate(
			() => document.activeElement.classList
		);
		expect( Object.values( activeElementClassList ) ).toContain(
			'block-editor-block-types-list__item'
		);

		// Press escape to close the block inserter.
		await page.keyboard.press( 'Escape' );

		// Expect focus to have transferred back to the inserter toggle button.
		activeElementClassList = await page.evaluate(
			() => document.activeElement.classList
		);
		expect( Object.values( activeElementClassList ) ).toContain(
			'block-editor-inserter__toggle'
		);
	} );

	// Check for regression of https://github.com/WordPress/gutenberg/issues/23263
	it( 'inserts blocks at root level when using the root appender while selection is in an inner block', async () => {
		await insertBlock( 'Buttons' );
		await page.keyboard.type( '1.1' );

		// After inserting the Buttons block the inner button block should be selected.
		const selectedButtonBlocks = await page.$$(
			'.wp-block-button.is-selected'
		);
		expect( selectedButtonBlocks.length ).toBe( 1 );

		// Specifically click the root container appender.
		await page.click(
			'.block-editor-block-list__layout.is-root-container > .block-list-appender .block-editor-inserter__toggle'
		);

		// Insert a paragraph block.
		await page.waitForSelector( '.block-editor-inserter__search-input' );

		// Search for the paragraph block if it's not in the list of blocks shown.
		if ( ! page.$( '.editor-block-list-item-paragraph' ) ) {
			await page.keyboard.type( 'Paragraph' );
			await page.waitForSelector( '.editor-block-list-item-paragraph' );
			await waitForInserterPatternLoad();
		}

		// Add the block.
		await page.click( '.editor-block-list-item-paragraph' );
		await page.keyboard.type( '2' );

		// The snapshot should show a buttons block followed by a paragraph.
		// The buttons block should contain a single button.
		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	// Check for regression of https://github.com/WordPress/gutenberg/issues/24262
	it( 'inserts a block in proper place after having clicked `Browse All` from inline inserter', async () => {
		await insertBlock( 'Paragraph' );
		await page.keyboard.type( 'First paragraph' );
		await insertBlock( 'Heading' );
		await page.keyboard.type( 'Heading' );
		await page.keyboard.press( 'Enter' );
		await insertBlock( 'Paragraph' );
		await page.keyboard.type( 'Second paragraph' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'Third paragraph' );
		expect( await getEditedPostContent() ).toMatchSnapshot();

		// Using the between inserter
		const insertionPoint = await page.$( '[data-type="core/heading"]' );
		const rect = await insertionPoint.boundingBox();
		await page.mouse.move( rect.x + rect.width / 2, rect.y - 10, {
			steps: 10,
		} );
		await page.waitForSelector(
			'.block-editor-block-list__insertion-point .block-editor-inserter__toggle'
		);
		await page.click(
			'.block-editor-block-list__insertion-point .block-editor-inserter__toggle'
		);

		const browseAll = await page.waitForSelector(
			'button.block-editor-inserter__quick-inserter-expand'
		);
		await browseAll.click();
		// `insertBlock` uses the currently open panel.
		await insertBlock( 'Cover' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	// Check for regression of https://github.com/WordPress/gutenberg/issues/25785
	it( 'inserts a block should show a blue line indicator', async () => {
		// First insert a random Paragraph.
		await insertBlock( 'Paragraph' );
		await page.keyboard.type( 'First paragraph' );
		await insertBlock( 'Image' );
		await showBlockToolbar();
		const paragraphBlock = await page.$(
			'p[aria-label="Paragraph block"]'
		);
		paragraphBlock.click();
		await showBlockToolbar();

		// Open the global inserter and search for the Heading block.
		await searchForBlock( 'Heading' );

		const headingButton = (
			await page.$x( `//button//span[contains(text(), 'Heading')]` )
		 )[ 0 ];

		// Hover over the block should show the blue line indicator.
		await headingButton.hover();

		// Should show the blue line indicator somewhere.
		const indicator = await page.$(
			'.block-editor-block-list__insertion-point-indicator'
		);
		const indicatorRect = await indicator.boundingBox();
		const paragraphRect = await paragraphBlock.boundingBox();

		// The blue line indicator should be below the last block.
		expect( indicatorRect.x ).toBe( paragraphRect.x );
		expect( indicatorRect.y > paragraphRect.y ).toBe( true );
	} );

	// Check for regression of https://github.com/WordPress/gutenberg/issues/24403
	it( 'inserts a block in proper place after having clicked `Browse All` from block appender', async () => {
		await insertBlock( 'Group' );
		await insertBlock( 'Paragraph' );
		await page.keyboard.type( 'Paragraph after group' );
		await page.click( '[data-type="core/group"] [aria-label="Add block"]' );
		const browseAll = await page.waitForXPath(
			'//button[text()="Browse all"]'
		);
		await browseAll.click();
		await insertBlock( 'Paragraph' );
		await page.keyboard.type( 'Paragraph inside group' );
		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	// Check for regression of https://github.com/WordPress/gutenberg/issues/27586
	it( 'closes the main inserter after inserting a single-use block, like the More block', async () => {
		await insertBlock( 'More' );
		await page.waitForSelector(
			'.edit-post-header-toolbar__inserter-toggle:not(.is-pressed)'
		);

		// The inserter panel should've closed.
		const inserterPanels = await page.$$(
			'.edit-post-editor__inserter-panel'
		);
		expect( inserterPanels.length ).toBe( 0 );

		// The editable 'Read More' text should be focused.
		const isFocusInBlock = await page.evaluate( () =>
			document
				.querySelector( '[data-type="core/more"]' )
				.contains( document.activeElement )
		);
		expect( isFocusInBlock ).toBe( true );
	} );

	it( 'shows block preview when hovering over block in inserter', async () => {
		await openGlobalBlockInserter();
		await page.focus( '.editor-block-list-item-paragraph' );
		const preview = await page.waitForSelector(
			'.block-editor-inserter__preview',
			{
				visible: true,
			}
		);
		const isPreviewVisible = await preview.isIntersectingViewport();
		expect( isPreviewVisible ).toBe( true );
	} );

	it.each( [ 'large', 'small' ] )(
		'last-inserted block should be given and keep the focus (%s viewport)',
		async ( viewport ) => {
			await setBrowserViewport( viewport );

			await page.type(
				'.block-editor-default-block-appender__content',
				'Testing inserted block focus'
			);

			await insertBlock( 'Image' );

			await page.waitForSelector( 'figure[data-type="core/image"]' );

			const selectedBlock = await page.evaluate( () => {
				return wp.data.select( 'core/block-editor' ).getSelectedBlock();
			} );

			expect( selectedBlock.name ).toBe( 'core/image' );
		}
	);
} );
