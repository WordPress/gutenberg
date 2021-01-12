/**
 * WordPress dependencies
 */
import {
	visitAdminPage,
	deactivatePlugin,
	activatePlugin,
} from '@wordpress/e2e-test-utils';

/** @typedef {import('puppeteer').ElementHandle} ElementHandle */

describe( 'Widgets screen', () => {
	beforeEach( async () => {
		await visitAdminPage( 'themes.php', 'page=gutenberg-widgets' );
		// Wait for the widget areas to load.
		await page.waitForSelector(
			'[aria-label="Block: Widget Area"][role="group"]'
		);
	} );

	beforeAll( async () => {
		await deactivatePlugin(
			'gutenberg-test-plugin-disables-the-css-animations'
		);
	} );

	afterAll( async () => {
		await activatePlugin(
			'gutenberg-test-plugin-disables-the-css-animations'
		);
	} );

	async function expectInsertionPointIndicatorToBeBelowLastBlock(
		widgetArea
	) {
		const childBlocks = await widgetArea.$$( '[data-block]' );
		const lastBlock = childBlocks[ childBlocks.length - 1 ];
		const lastBlockBoundingBox = await lastBlock.boundingBox();

		// TODO: Probably need a more accessible way to select this, maybe a test ID or data attribute.
		const insertionPointIndicator = await page.$(
			'.block-editor-block-list__insertion-point-indicator'
		);
		const insertionPointIndicatorBoundingBox = await insertionPointIndicator.boundingBox();

		expect(
			insertionPointIndicatorBoundingBox.y > lastBlockBoundingBox.y
		).toBe( true );
	}

	it( 'Should insert content using the global inserter', async () => {
		const widgetAreas = await page.$$(
			'[aria-label="Block: Widget Area"][role="group"]'
		);
		const [ firstWidgetArea, secondWidgetArea ] = widgetAreas;

		const addBlockButton = await page.$( 'button[aria-label="Add block"]' );
		await addBlockButton.click();

		let blockLibrary = await page.waitForSelector(
			'[aria-label="Block Library"][role="region"]'
		);
		let [ addParagraphBlock ] = await blockLibrary.$x(
			'//*[@role="option"][*[text()="Paragraph"]]'
		);
		await addParagraphBlock.hover();

		await expectInsertionPointIndicatorToBeBelowLastBlock(
			firstWidgetArea
		);

		await addParagraphBlock.click();

		const addedParagraphBlockInFirstWidgetArea = await firstWidgetArea.$(
			'[data-block][data-type="core/paragraph"][aria-label^="Empty block"]'
		);

		expect(
			(
				await page.accessibility.snapshot( {
					root: addedParagraphBlockInFirstWidgetArea,
				} )
			 ).focused
		).toBe( true );

		await page.keyboard.type( 'First Paragraph' );

		await secondWidgetArea.click();
		await addBlockButton.click();

		blockLibrary = await page.waitForSelector(
			'[aria-label="Block Library"][role="region"]'
		);
		[ addParagraphBlock ] = await blockLibrary.$x(
			'//*[@role="option"][*[text()="Paragraph"]]'
		);
		await addParagraphBlock.hover();

		// FIXME: The insertion point indicator is not showing when the widget area has no blocks.
		// await expectInsertionPointIndicatorToBeBelowLastBlock(
		// 	secondWidgetArea
		// );

		await addParagraphBlock.click();

		const addedParagraphBlockInSecondWidgetArea = await secondWidgetArea.$(
			'[data-block][data-type="core/paragraph"][aria-label^="Empty block"]'
		);

		expect(
			(
				await page.accessibility.snapshot( {
					root: addedParagraphBlockInSecondWidgetArea,
				} )
			 ).focused
		).toBe( true );

		await page.keyboard.type( 'Second Paragraph' );

		// TODO: Add tests for updating/saving when possible.
		// const [ updateButton ] = await page.$x( '//*[@role="button"][*[text()="Update"]]' );
		// await updateButton.click();
	} );

	it( 'Should insert content using the inline inserter', async () => {
		const firstWidgetArea = await page.$(
			'[aria-label="Block: Widget Area"][role="group"]'
		);

		// Scroll to the end of the first widget area.
		await firstWidgetArea.evaluate( ( node ) =>
			node.scrollIntoView( { block: 'end' } )
		);

		const firstWidgetAreaBoundingBox = await firstWidgetArea.boundingBox();

		// Click near the end of the widget area to select it.
		await page.mouse.click(
			firstWidgetAreaBoundingBox.x + firstWidgetAreaBoundingBox.width / 2,
			firstWidgetAreaBoundingBox.y +
				firstWidgetAreaBoundingBox.height -
				10
		);

		// Aria selectors cannot select buttons with the aria-haspopup property, fallback to CSS selector.
		const inlineInserterButton = await page.waitForSelector(
			'button[aria-label="Add block"][aria-haspopup="true"]'
		);
		await inlineInserterButton.click();

		const inlineQuickInserter = await page.waitForSelector(
			'[aria-label="Blocks"][role="listbox"]'
		);

		const [ paragraphBlock ] = await inlineQuickInserter.$x(
			'//*[@role="option"][*[text()="Paragraph"]]'
		);
		await paragraphBlock.click();

		const addedParagraphBlockInFirstWidgetArea = await firstWidgetArea.$(
			'[data-block][data-type="core/paragraph"][aria-label^="Empty block"]'
		);

		expect(
			(
				await page.accessibility.snapshot( {
					root: addedParagraphBlockInFirstWidgetArea,
				} )
			 ).focused
		).toBe( true );

		await page.keyboard.type( 'First Paragraph' );

		const addedParagraphBlockInFirstWidgetAreaBoundingBox = await addedParagraphBlockInFirstWidgetArea.boundingBox();

		// Click outside the block to move the focus back to the widget area.
		await page.mouse.click(
			addedParagraphBlockInFirstWidgetAreaBoundingBox.x +
				firstWidgetAreaBoundingBox.width / 2,
			addedParagraphBlockInFirstWidgetAreaBoundingBox.y +
				addedParagraphBlockInFirstWidgetAreaBoundingBox.height +
				10
		);

		// Hover above the last block to trigger the inline inserter between blocks.
		await page.mouse.move(
			addedParagraphBlockInFirstWidgetAreaBoundingBox.x +
				addedParagraphBlockInFirstWidgetAreaBoundingBox.width / 2,
			addedParagraphBlockInFirstWidgetAreaBoundingBox.y - 10
		);

		const inserterButton = await page.waitForSelector(
			'button[aria-label="Add block"][aria-haspopup="true"]'
		);
		await inserterButton.click();

		// TODO: The query should be rewritten with role and label.
		const inserterSearchBox = await page.waitForSelector(
			'input[type="search"][placeholder="Search for a block"]'
		);
		expect(
			await inserterSearchBox.evaluate(
				( node ) => node === document.activeElement
			)
		).toBe( true );

		await page.keyboard.type( 'Heading' );

		const inserterListBox = await page.$(
			'[role="listbox"][aria-label="Blocks"]'
		);
		const [ headingBlockOption ] = await inserterListBox.$x(
			'//*[@role="option"][*[text()="Heading"]]'
		);
		await headingBlockOption.click();

		// Get the added heading block as second last block.
		const addedHeadingBlock = await addedParagraphBlockInFirstWidgetArea.evaluateHandle(
			( node ) => node.previousSibling
		);

		expect(
			await addedHeadingBlock.evaluate(
				( node ) => node === document.activeElement
			)
		).toBe( true );

		await page.keyboard.type( 'My Heading' );

		const addedHeadingBlockSnapshot = await page.accessibility.snapshot( {
			root: addedHeadingBlock,
		} );
		expect( addedHeadingBlockSnapshot.name ).toBe( 'Block: Heading' );
		expect( addedHeadingBlockSnapshot.level ).toBe( 2 );
		expect( addedHeadingBlockSnapshot.value ).toBe( 'My Heading' );
	} );
} );
