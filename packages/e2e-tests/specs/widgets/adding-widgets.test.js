/**
 * WordPress dependencies
 */
import {
	activatePlugin,
	activateTheme,
	clickBlockToolbarButton,
	deactivatePlugin,
	pressKeyWithModifier,
	showBlockToolbar,
	visitAdminPage,
} from '@wordpress/e2e-test-utils';

/**
 * External dependencies
 */
import { groupBy, mapValues } from 'lodash';

/** @typedef {import('puppeteer').ElementHandle} ElementHandle */

describe( 'Widgets screen', () => {
	beforeEach( async () => {
		await visitAdminPage( 'themes.php', 'page=gutenberg-widgets' );
		// Wait for the widget areas to load.
		await page.waitForSelector(
			'[aria-label="Block: Widget Area"][role="group"]'
		);
	} );

	afterEach( async () => {
		await cleanupWidgets();
	} );

	beforeAll( async () => {
		// TODO: Ideally we can bundle our test theme directly in the repo.
		await activateTheme( 'twentytwenty' );
		await deactivatePlugin(
			'gutenberg-test-plugin-disables-the-css-animations'
		);
		await cleanupWidgets();
	} );

	afterAll( async () => {
		await activatePlugin(
			'gutenberg-test-plugin-disables-the-css-animations'
		);
		await activateTheme( 'twentytwentyone' );
	} );

	async function getBlockInGlobalInserter( blockName ) {
		await page.click(
			'button[aria-pressed="false"][aria-label="Add block"]'
		);

		const blockLibrary = await page.waitForSelector(
			'[aria-label="Block Library"][role="region"]'
		);

		// Check that there are categorizations in the inserter (#26329).
		const categoryHeader = await blockLibrary.$$( 'h2' );
		expect( categoryHeader.length > 0 ).toBe( true );

		const [ addBlock ] = await blockLibrary.$x(
			`//*[@role="option"][*[text()="${ blockName }"]]`
		);

		return addBlock;
	}

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

	async function getInlineInserterButton() {
		return await page.waitForSelector(
			'button[aria-label="Add block"][aria-haspopup="true"]',
			{
				visible: true,
			}
		);
	}

	it( 'Should insert content using the global inserter', async () => {
		const widgetAreas = await page.$$(
			'[aria-label="Block: Widget Area"][role="group"]'
		);
		const [ firstWidgetArea ] = widgetAreas;

		let addParagraphBlock = await getBlockInGlobalInserter( 'Paragraph' );
		await addParagraphBlock.hover();

		// FIXME: The insertion point indicator is not showing when the widget area has no blocks.
		// await expectInsertionPointIndicatorToBeBelowLastBlock(
		// 	firstWidgetArea
		// );

		await addParagraphBlock.click();

		let addedParagraphBlockInFirstWidgetArea = await firstWidgetArea.$(
			'[data-block][data-type="core/paragraph"][aria-label^="Empty block"]'
		);
		await addedParagraphBlockInFirstWidgetArea.focus();

		await page.keyboard.type( 'First Paragraph' );

		addParagraphBlock = await getBlockInGlobalInserter( 'Paragraph' );
		await addParagraphBlock.hover();

		await expectInsertionPointIndicatorToBeBelowLastBlock(
			firstWidgetArea
		);
		await addParagraphBlock.focus();
		await addParagraphBlock.click();

		addedParagraphBlockInFirstWidgetArea = await firstWidgetArea.$(
			'[data-block][data-type="core/paragraph"][aria-label^="Empty block"]'
		);
		await addedParagraphBlockInFirstWidgetArea.focus();
		await page.keyboard.type( 'Second Paragraph' );

		const addShortCodeBlock = await getBlockInGlobalInserter( 'Shortcode' );
		await addShortCodeBlock.click();

		const shortCodeInput = await page.waitForSelector(
			'textarea[aria-label="Shortcode text"]'
		);
		await shortCodeInput.focus();
		// The famous Big Buck Bunny video.
		await shortCodeInput.type(
			'[video src="http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"]'
		);

		/**
		 * FIXME: There seems to have a bug when saving the widgets
		 */
		// await secondWidgetArea.click();

		// addParagraphBlock = await getParagraphBlockInGlobalInserter();
		// await addParagraphBlock.hover();

		// // FIXME: The insertion point indicator is not showing when the widget area has no blocks.
		// // await expectInsertionPointIndicatorToBeBelowLastBlock(
		// // 	secondWidgetArea
		// // );

		// await addParagraphBlock.click();

		// const addedParagraphBlockInSecondWidgetArea = await secondWidgetArea.$(
		// 	'[data-block][data-type="core/paragraph"][aria-label^="Empty block"]'
		// );

		// expect(
		// 	await addedParagraphBlockInSecondWidgetArea.evaluate(
		// 		( node ) => node === document.activeElement
		// 	)
		// ).toBe( true );

		// await page.keyboard.type( 'Third Paragraph' );

		await saveWidgets();
		const serializedWidgetAreas = await getSerializedWidgetAreas();
		expect( serializedWidgetAreas ).toMatchInlineSnapshot( `
		Object {
		  "sidebar-1": "<div class=\\"widget widget_block widget_text\\"><div class=\\"widget-content\\">
		<p>First Paragraph</p>
		</div></div>
		<div class=\\"widget widget_block widget_text\\"><div class=\\"widget-content\\">
		<p>Second Paragraph</p>
		</div></div>
		<div class=\\"widget widget_block\\"><div class=\\"widget-content\\"><p><div style=\\"width: 580px;\\" class=\\"wp-video\\"><!--[if lt IE 9]><script>document.createElement('video');</script><![endif]-->
		<video class=\\"wp-video-shortcode\\" id=\\"video-0-1\\" width=\\"580\\" height=\\"326\\" preload=\\"metadata\\" controls=\\"controls\\"><source type=\\"video/mp4\\" src=\\"http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4?_=1\\" /><a href=\\"http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4\\">http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4</a></video></div></p>
		</div></div>",
		}
	` );
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

		let inlineInserterButton = await getInlineInserterButton();
		await inlineInserterButton.click();

		const inlineQuickInserter = await page.waitForSelector(
			'[aria-label="Blocks"][role="listbox"]'
		);

		const [ paragraphBlock ] = await inlineQuickInserter.$x(
			'//*[@role="option"][*[text()="Paragraph"]]'
		);
		await paragraphBlock.click();

		const firstParagraphBlock = await page.waitForFunction(
			( widgetArea ) =>
				widgetArea.querySelector(
					'[data-block][data-type="core/paragraph"][aria-label^="Empty block"]'
				),
			{},
			firstWidgetArea
		);

		await firstParagraphBlock.focus();
		await page.keyboard.type( 'First Paragraph' );

		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'Second Paragraph' );

		const secondParagraphBlock = await page.evaluateHandle(
			() => document.activeElement
		);
		expect( secondParagraphBlock ).not.toBe( firstParagraphBlock );

		const secondParagraphBlockBoundingBox = await secondParagraphBlock.boundingBox();

		// Click outside the block to move the focus back to the widget area.
		await page.mouse.click(
			secondParagraphBlockBoundingBox.x +
				firstWidgetAreaBoundingBox.width / 2,
			secondParagraphBlockBoundingBox.y +
				secondParagraphBlockBoundingBox.height +
				10
		);

		// Hover above the last block to trigger the inline inserter between blocks.
		await page.mouse.move(
			secondParagraphBlockBoundingBox.x +
				secondParagraphBlockBoundingBox.width / 2,
			secondParagraphBlockBoundingBox.y - 10
		);

		inlineInserterButton = await getInlineInserterButton();
		await inlineInserterButton.click();

		// TODO: The query should be rewritten with role and label.
		const inserterSearchBox = await page.waitForSelector(
			'input[type="search"][placeholder="Search"]'
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
		const addedHeadingBlock = await secondParagraphBlock.evaluateHandle(
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

		await saveWidgets();
		const serializedWidgetAreas = await getSerializedWidgetAreas();
		expect( serializedWidgetAreas ).toMatchInlineSnapshot( `
		Object {
		  "sidebar-1": "<div class=\\"widget widget_block widget_text\\"><div class=\\"widget-content\\">
		<p>First Paragraph</p>
		</div></div>
		<div class=\\"widget widget_block\\"><div class=\\"widget-content\\">
		<h2>My Heading</h2>
		</div></div>
		<div class=\\"widget widget_block widget_text\\"><div class=\\"widget-content\\">
		<p>Second Paragraph</p>
		</div></div>",
		}
	` );
	} );

	// Disable reason: We temporary skip this test until we can figure out why it fails sometimes.
	// eslint-disable-next-line jest/no-disabled-tests
	it.skip( 'Should duplicate the widgets', async () => {
		let firstWidgetArea = await page.$(
			'[aria-label="Block: Widget Area"][role="group"]'
		);

		const addParagraphBlock = await getBlockInGlobalInserter( 'Paragraph' );
		await addParagraphBlock.click();

		let firstParagraphBlock = await firstWidgetArea.$(
			'[data-block][data-type="core/paragraph"][aria-label^="Empty block"]'
		);
		await firstParagraphBlock.focus();
		await page.keyboard.type( 'First Paragraph' );

		await saveWidgets();
		await page.reload();
		// Wait for the widget areas to load.
		firstWidgetArea = await page.waitForSelector(
			'[aria-label="Block: Widget Area"][role="group"]'
		);

		const initialSerializedWidgetAreas = await getSerializedWidgetAreas();
		expect( initialSerializedWidgetAreas ).toMatchInlineSnapshot( `
		Object {
		  "sidebar-1": "<div class=\\"widget widget_block widget_text\\"><div class=\\"widget-content\\">
		<p>First Paragraph</p>
		</div></div>",
		}
	` );
		const initialWidgets = await getWidgetAreaWidgets();
		expect( initialWidgets[ 'sidebar-1' ].length ).toBe( 1 );

		firstParagraphBlock = await firstWidgetArea.$(
			'[data-block][data-type="core/paragraph"]'
		);
		await firstParagraphBlock.focus();

		// Trigger the toolbar to appear.
		await pressKeyWithModifier( 'shift', 'Tab' );

		const blockToolbar = await page.waitForSelector(
			'[role="toolbar"][aria-label="Block tools"]'
		);
		const moreOptionsButton = await blockToolbar.$(
			'button[aria-label="Options"]'
		);
		await moreOptionsButton.click();

		const optionsMenu = await page.waitForSelector(
			'[role="menu"][aria-label="Options"]'
		);
		const [ duplicateButton ] = await optionsMenu.$x(
			'//*[@role="menuitem"][*[text()="Duplicate"]]'
		);
		await duplicateButton.click();

		await page.waitForFunction(
			( paragraph ) =>
				paragraph.nextSibling &&
				paragraph.nextSibling.matches( '[data-block]' ),
			{},
			firstParagraphBlock
		);
		const duplicatedParagraphBlock = await firstParagraphBlock.evaluateHandle(
			( paragraph ) => paragraph.nextSibling
		);

		const firstParagraphBlockClientId = await firstParagraphBlock.evaluate(
			( node ) => node.dataset.block
		);
		const duplicatedParagraphBlockClientId = await duplicatedParagraphBlock.evaluate(
			( node ) => node.dataset.block
		);

		expect( firstParagraphBlockClientId ).not.toBe(
			duplicatedParagraphBlockClientId
		);
		expect(
			await duplicatedParagraphBlock.evaluate(
				( node ) => node.textContent
			)
		).toBe( 'First Paragraph' );
		expect(
			await duplicatedParagraphBlock.evaluate(
				( node ) => node === document.activeElement
			)
		).toBe( true );

		await saveWidgets();
		const editedSerializedWidgetAreas = await getSerializedWidgetAreas();
		expect( editedSerializedWidgetAreas ).toMatchInlineSnapshot( `
		Object {
		  "sidebar-1": "<div class=\\"widget widget_block widget_text\\"><div class=\\"widget-content\\">
		<p>First Paragraph</p>
		</div></div>
		<div class=\\"widget widget_block widget_text\\"><div class=\\"widget-content\\">
		<p>First Paragraph</p>
		</div></div>",
		}
	` );
		const editedWidgets = await getWidgetAreaWidgets();
		expect( editedWidgets[ 'sidebar-1' ].length ).toBe( 2 );
		expect( editedWidgets[ 'sidebar-1' ][ 0 ] ).toBe(
			initialWidgets[ 'sidebar-1' ][ 0 ]
		);
	} );

	it( 'Should display legacy widgets', async () => {
		await visitAdminPage( 'widgets.php' );

		const [ searchWidget ] = await page.$x(
			'//*[@id="widget-list"]//h3[text()="Search"]'
		);
		await searchWidget.click();

		const [ addWidgetButton ] = await page.$x(
			'//button[text()="Add Widget"]'
		);
		await addWidgetButton.click();

		// Wait for the changes to be saved.
		// TODO: Might have better ways to do this.
		await page.waitForFunction( () => {
			const addedSearchWidget = document.querySelector(
				'#widgets-right .widget'
			);
			const spinner = addedSearchWidget.querySelector( '.spinner' );

			return (
				addedSearchWidget.classList.contains( 'open' ) &&
				! spinner.classList.contains( 'is-active' )
			);
		} );
		// FIXME: For some reasons, waiting for the spinner to disappear is not enough.
		// eslint-disable-next-line no-restricted-syntax
		await page.waitForTimeout( 500 );

		await visitAdminPage( 'themes.php', 'page=gutenberg-widgets' );
		// Wait for the widget areas to load.
		await page.waitForSelector(
			'[aria-label="Block: Widget Area"][role="group"]'
		);

		// Wait for the widget's form to load.
		await page.waitForSelector(
			'[data-block][data-type="core/legacy-widget"] input'
		);

		const legacyWidget = await page.$(
			'[data-block][data-type="core/legacy-widget"]'
		);

		const legacyWidgetName = await legacyWidget.$( 'h3' );
		expect(
			await legacyWidgetName.evaluate( ( node ) => node.textContent )
		).toBe( 'Search' );

		await legacyWidget.focus();

		// Trigger the toolbar to appear.
		await pressKeyWithModifier( 'shift', 'Tab' );

		let [ previewButton ] = await page.$x(
			'//button[*[contains(text(), "Preview")]]'
		);
		await previewButton.click();

		const iframe = await legacyWidget.$( 'iframe' );
		const frame = await iframe.contentFrame();

		// Expect to have search input.
		await frame.waitForSelector( 'input[type="search"]' );

		const [ editButton ] = await page.$x(
			'//button[*[contains(text(), "Edit")]]'
		);
		await editButton.click();

		const [ titleLabel ] = await legacyWidget.$x(
			'//label[contains(text(), "Title")]'
		);
		const titleInputId = await titleLabel.evaluate( ( node ) =>
			node.getAttribute( 'for' )
		);
		const titleInput = await page.$( `#${ titleInputId }` );
		await titleInput.type( 'Search Title' );

		// Trigger the toolbar to appear.
		await pressKeyWithModifier( 'shift', 'Tab' );

		[ previewButton ] = await page.$x(
			'//button[*[contains(text(), "Preview")]]'
		);
		await previewButton.click();

		// Expect to have search title.
		await frame.waitForXPath( '//h2[text()="Search Title"]' );

		await saveWidgets();
		const serializedWidgetAreas = await getSerializedWidgetAreas();
		expect( serializedWidgetAreas ).toMatchInlineSnapshot( `
		Object {
		  "sidebar-1": "<div class=\\"widget widget_search\\"><div class=\\"widget-content\\"><h2 class=\\"widget-title subheading heading-size-3\\">Search Title</h2><form role=\\"search\\"  method=\\"get\\" class=\\"search-form\\" action=\\"http://localhost:8889/\\">
			<label for=\\"search-form-1\\">
				<span class=\\"screen-reader-text\\">Search for:</span>
				<input type=\\"search\\" id=\\"search-form-1\\" class=\\"search-field\\" placeholder=\\"Search &hellip;\\" value=\\"\\" name=\\"s\\" />
			</label>
			<input type=\\"submit\\" class=\\"search-submit\\" value=\\"Search\\" />
		</form>
		</div></div>",
		}
	` );
	} );

	it( 'allows widgets to be moved between widget areas using the dropdown in the block toolbar', async () => {
		const widgetAreas = await page.$$(
			'[aria-label="Block: Widget Area"][role="group"]'
		);
		const [ firstWidgetArea ] = widgetAreas;

		// Insert a paragraph it should be in the first widget area.
		const inserterParagraphBlock = await getBlockInGlobalInserter(
			'Paragraph'
		);
		await inserterParagraphBlock.hover();
		await inserterParagraphBlock.click();
		const addedParagraphBlockInFirstWidgetArea = await firstWidgetArea.$(
			'[data-block][data-type="core/paragraph"][aria-label^="Empty block"]'
		);
		await addedParagraphBlockInFirstWidgetArea.focus();
		await page.keyboard.type( 'First Paragraph' );

		// Check that the block exists in the first widget area.
		await page.waitForXPath(
			'//*[@aria-label="Block: Widget Area"][@role="group"][1]//p[@data-type="core/paragraph"][.="First Paragraph"]'
		);

		// Move the block to the second widget area.
		await showBlockToolbar();
		await clickBlockToolbarButton( 'Move to widget area' );
		const widgetAreaButton = await page.waitForXPath(
			'//button[@role="menuitemradio"][contains(.,"Footer #2")]'
		);
		await widgetAreaButton.click();

		// Check that the block exists in the second widget area.
		await page.waitForXPath(
			'//*[@aria-label="Block: Widget Area"][@role="group"][2]//p[@data-type="core/paragraph"][.="First Paragraph"]'
		);

		// Assert that the serialized widget areas shows the block as in the second widget area.
		await saveWidgets();
		const serializedWidgetAreas2 = await getSerializedWidgetAreas();
		expect( serializedWidgetAreas2 ).toMatchInlineSnapshot( `
		Object {
		  "sidebar-2": "<div class=\\"widget widget_block widget_text\\"><div class=\\"widget-content\\">
		<p>First Paragraph</p>
		</div></div>",
		}
	` );
	} );
} );

async function saveWidgets() {
	const [ updateButton ] = await page.$x( '//button[text()="Update"]' );
	await updateButton.click();

	await page.waitForXPath( '//*[text()="Widgets saved."]' );

	// FIXME: The snackbar above is enough for the widget areas to get saved,
	// but not enough for the widgets to get saved.
	// eslint-disable-next-line no-restricted-syntax
	await page.waitForTimeout( 500 );
}

async function getSerializedWidgetAreas() {
	const widgets = await page.evaluate( () =>
		wp.data.select( 'core' ).getWidgets( { _embed: 'about' } )
	);

	const serializedWidgetAreas = mapValues(
		groupBy( widgets, 'sidebar' ),
		( sidebarWidgets ) =>
			sidebarWidgets
				.map( ( widget ) => widget.rendered )
				.filter( Boolean )
				.join( '\n' )
	);

	return serializedWidgetAreas;
}

async function getWidgetAreaWidgets() {
	const widgets = await page.evaluate( () => {
		const widgetAreas = wp.data
			.select( 'core/edit-widgets' )
			.getWidgetAreas();
		const sidebars = {};

		for ( const widgetArea of widgetAreas ) {
			sidebars[ widgetArea.id ] = widgetArea.widgets;
		}

		return sidebars;
	} );

	return widgets;
}

/**
 * TODO: Deleting widgets in the new widgets screen seems to be unreliable.
 * We visit the old widgets screen to delete them.
 * Refactor this to use real interactions in the new widgets screen once the bug is fixed.
 */
async function cleanupWidgets() {
	await visitAdminPage( 'widgets.php' );

	let widget = await page.$( '.widgets-sortables .widget' );

	// We have to do this one-by-one since there might be race condition when deleting multiple widgets at once.
	while ( widget ) {
		const deleteButton = await widget.$( 'button.widget-control-remove' );
		const id = await widget.evaluate( ( node ) => node.id );
		await deleteButton.evaluate( ( node ) => node.click() );
		// Wait for the widget to be removed from DOM.
		await page.waitForSelector( `#${ id }`, { hidden: true } );

		widget = await page.$( '.widgets-sortables .widget' );
	}
}
