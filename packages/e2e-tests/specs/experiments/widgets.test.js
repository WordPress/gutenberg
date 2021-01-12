/**
 * WordPress dependencies
 */
import {
	createURL,
	deactivatePlugin,
	activatePlugin,
} from '@wordpress/e2e-test-utils';

/** @typedef {import('puppeteer').ElementHandle} ElementHandle */

describe( 'Widgets screen', () => {
	beforeEach( async () => {
		await page.goto(
			createURL( 'wp-admin/themes.php', 'page=gutenberg-widgets' ),
			{
				waitUntil: [ 'networkidle0' ],
			}
		);
		await page.waitForSelector( 'aria/Block: Widget Area[role="group"]' );
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
			'aria/Block: Widget Area[role="group"]'
		);
		const [ firstWidgetArea, secondWidgetArea ] = widgetAreas;

		// FIXME: We can't add [role="button"] here since CDP has a bug
		// where buttons with aria-pressed can't be queried with the button role.
		// See https://bugs.chromium.org/p/chromium/issues/detail?id=1164294
		const addBlockButton = await page.$( 'aria/Add block' );
		await addBlockButton.click();

		let blockLibrary = await page.waitForSelector(
			'aria/Block Library[role="region"]'
		);
		let addParagraphBlock = await blockLibrary.$(
			'aria/Paragraph[role="option"]'
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
			'aria/Block Library[role="region"]'
		);
		addParagraphBlock = await blockLibrary.$(
			'aria/Paragraph[role="option"]'
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
		// const updateButton = await page.$( 'aria/Update[role="button"]' );
		// await updateButton.click();
	} );

	it( 'Should insert content using the inline inserter', async () => {
		const firstWidgetArea = await page.$(
			'aria/Block: Widget Area[role="group"]'
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
		await page.click(
			'button[aria-label="Add block"][aria-haspopup="true"]'
		);

		const inlineQuickInserter = await page.waitForSelector(
			'aria/Blocks[role="listbox"]'
		);

		const paragraphBlock = await inlineQuickInserter.$(
			'aria/Paragraph[role="option"]'
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

		// Click near the end of the widget area to select it.
		await page.mouse.click(
			firstWidgetAreaBoundingBox.x + firstWidgetAreaBoundingBox.width / 2,
			firstWidgetAreaBoundingBox.y +
				firstWidgetAreaBoundingBox.height -
				10
		);

		const addedParagraphBlockInFirstWidgetAreaBoundingBox = await addedParagraphBlockInFirstWidgetArea.boundingBox();
		// Hover above the last block to trigger the inline inserter between blocks
		await page.mouse.move(
			addedParagraphBlockInFirstWidgetAreaBoundingBox.x +
				addedParagraphBlockInFirstWidgetAreaBoundingBox.width / 2,
			addedParagraphBlockInFirstWidgetAreaBoundingBox.y - 10
		);

		const inserterButton = await page.$(
			'button[aria-label="Add block"][aria-haspopup="true"]'
		);
		await inserterButton.click();

		const inserterSearchBox = await page.waitForSelector(
			'aria/Search for a block[role="searchbox"]'
		);
		expect(
			await inserterSearchBox.evaluate(
				( node ) => node === document.activeElement
			)
		).toBe( true );

		await page.keyboard.type( 'Heading' );

		const inserterListBox = await page.waitForSelector(
			'aria/Blocks[role="listbox"]'
		);
		const headingBlockOption = await inserterListBox.$(
			'aria/Heading[role="option"]'
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
