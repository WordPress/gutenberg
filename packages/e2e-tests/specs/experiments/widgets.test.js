/**
 * WordPress dependencies
 */
import { createURL } from '@wordpress/e2e-test-utils';

/** @typedef {import('puppeteer').ElementHandle} ElementHandle */

describe( 'Widgets screen', () => {
	beforeEach( async () => {
		await Promise.all( [
			page.goto(
				createURL( 'wp-admin/themes.php', 'page=gutenberg-widgets' )
			),
			page.waitForNavigation(),
		] );
	} );

	it( 'Should insert content using the global inserter', async () => {
		const firstWidgetArea = await page.$(
			'aria/Block: Widget Area[role="group"]'
		);

		const firstWidgetAreaChildBlocks = await firstWidgetArea.$$(
			'[data-block]'
		);
		const lastBlockInFirstWidgetArea =
			firstWidgetAreaChildBlocks[ firstWidgetAreaChildBlocks.length - 1 ];
		const lastBlockInFirstWidgetAreaBoundingBox = await lastBlockInFirstWidgetArea.boundingBox();

		// FIXME: We can't add [role="button"] here since CDP has a bug
		// where buttons with aria-pressed can't be queried with the button role.
		// See https://bugs.chromium.org/p/chromium/issues/detail?id=1164294
		const addBlockButton = await page.$( 'aria/Add block' );
		await addBlockButton.click();

		const blockLibrary = await page.waitForSelector(
			'aria/Block Library[role="region"]'
		);
		const addParagraphBlock = await blockLibrary.$(
			'aria/Paragraph[role="option"]'
		);
		await addParagraphBlock.hover();

		// TODO: Probably need a more accessible way to select this, maybe a test ID or data attribute.
		const insertionPointIndicator = await page.$(
			'.block-editor-block-list__insertion-point-indicator'
		);
		const insertionPointIndicatorBoundingBox = await insertionPointIndicator.boundingBox();

		expect(
			insertionPointIndicatorBoundingBox.y >
				lastBlockInFirstWidgetAreaBoundingBox.y
		).toBe( true );

		await addParagraphBlock.click();

		const addedParagraphBlock = await firstWidgetArea.$(
			'[data-block][data-type="core/paragraph"][aria-label^="Empty block"]'
		);

		const snapshot = await page.accessibility.snapshot( {
			root: addedParagraphBlock,
		} );
		expect( snapshot.focused ).toBe( true );

		await page.keyboard.type( 'First Paragraph' );

		// TODO: Add tests for updating/saving when possible.
		// const updateButton = await page.$( 'aria/Update[role="button"]' );
		// await updateButton.click();
	} );
} );
