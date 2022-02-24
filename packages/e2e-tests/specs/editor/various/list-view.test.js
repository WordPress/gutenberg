/**
 * WordPress dependencies
 */
import {
	createNewPost,
	insertBlock,
	getEditedPostContent,
	openListView,
	pressKeyWithModifier,
	pressKeyTimes,
} from '@wordpress/e2e-test-utils';

async function dragAndDrop( draggableElement, targetElement, offsetY ) {
	const draggablePoint = await draggableElement.clickablePoint();
	const targetClickablePoint = await targetElement.clickablePoint();
	const targetPoint = {
		x: targetClickablePoint.x,
		y: targetClickablePoint.y + offsetY,
	};

	return await page.mouse.dragAndDrop( draggablePoint, targetPoint );
}

async function getBlockListLeafNodes() {
	return await page.$$( '.block-editor-list-view-leaf' );
}

describe( 'List view', () => {
	beforeAll( async () => {
		await page.setDragInterception( true );
	} );

	beforeEach( async () => {
		await createNewPost();
	} );

	afterAll( async () => {
		await page.setDragInterception( false );
	} );

	it( 'allows a user to drag a block to a new sibling position', async () => {
		// Insert some blocks of different types.
		await insertBlock( 'Heading' );
		await insertBlock( 'Image' );
		await insertBlock( 'Paragraph' );

		// Open list view.
		await pressKeyWithModifier( 'access', 'o' );

		const paragraphBlock = await page.waitForXPath(
			'//a[contains(., "Paragraph")][@draggable="true"]'
		);

		// Drag above the heading block
		const headingBlock = await page.waitForXPath(
			'//a[contains(., "Heading")][@draggable="true"]'
		);

		await dragAndDrop( paragraphBlock, headingBlock, -5 );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	// Check for regressions of https://github.com/WordPress/gutenberg/issues/38763.
	it( 'shows the correct amount of blocks after a block is removed in the canvas', async () => {
		// Insert some blocks of different types.
		await insertBlock( 'Image' );
		await insertBlock( 'Heading' );
		await insertBlock( 'Paragraph' );

		// Open list view.
		await pressKeyWithModifier( 'access', 'o' );

		// The last inserted paragraph block should be selected in List View.
		await page.waitForXPath(
			'//a[contains(., "Paragraph(selected block)")]'
		);

		// Go to the image block in list view.
		await pressKeyTimes( 'ArrowUp', 2 );
		const listViewImageBlock = await page.waitForXPath(
			'//a[contains(., "Image")]'
		);
		expect( listViewImageBlock ).toHaveFocus();

		// Select the image block in the canvas.
		await page.keyboard.press( 'Enter' );

		const canvasImageBlock = await page.waitForSelector(
			'figure[aria-label="Block: Image"]'
		);
		expect( canvasImageBlock ).toHaveFocus();

		// Delete the image block in the canvas.
		await page.keyboard.press( 'Backspace' );

		// List view should have two rows.
		const listViewRows = await page.$$( 'tr.block-editor-list-view-leaf' );
		expect( listViewRows ).toHaveLength( 2 );

		// The console didn't throw an error as reported in
		// https://github.com/WordPress/gutenberg/issues/38763.
		expect( console ).not.toHaveErrored();
	} );

	it( 'should select previous block after removing currently selected one', async () => {
		// Insert some blocks of different types.
		await insertBlock( 'Quote' );
		await insertBlock( 'Image' );
		await insertBlock( 'Heading' );
		await insertBlock( 'Paragraph' );

		// Open list view.
		await openListView();

		// The last inserted paragraph block should be selected in List View.
		await page.waitForXPath(
			'//a[contains(., "Paragraph(selected block)")]'
		);

		/**
		 * Make sure removing the currently selected block makes the previous block selected
		 */
		const paragraphOptionsButton = await page.waitForSelector(
			'tr.block-editor-list-view-leaf.is-selected button[aria-label="Options for Paragraph block"]'
		);

		// Open paragraph block option dropdown.
		await paragraphOptionsButton.click();

		const paragraphRemoveButton = await page.waitForXPath(
			'//button[contains(., "Remove Paragraph")]'
		);

		// Remove paragraph block.
		await paragraphRemoveButton.click();

		// Make sure the Paragraph has been removed.
		let listViewRows = await page.$$( 'tr.block-editor-list-view-leaf' );
		expect( listViewRows ).toHaveLength( 3 );

		// Heading block should be selected as previous block.
		await page.waitForXPath(
			'//a[contains(., "Heading(selected block)")]'
		);

		/**
		 * Make sure removing a non-selected block doesn't change selection.
		 */
		const quoteOptionsButton = await page.waitForSelector(
			'tr.block-editor-list-view-leaf:first-child button[aria-label="Options for Quote block"]'
		);

		// Open Image block option dropdown.
		quoteOptionsButton.click();

		const quoteRemoveButton = await page.waitForXPath(
			'//button[contains(., "Remove Quote")]'
		);

		// Remove image block
		await quoteRemoveButton.click();

		// Make sure the Quote block has been removed.
		listViewRows = await page.$$( 'tr.block-editor-list-view-leaf' );
		expect( listViewRows ).toHaveLength( 2 );

		// Heading block should be selected
		await page.waitForXPath(
			'//a[contains(., "Heading(selected block)")]'
		);
	} );

	it( 'should expand nested list items', async () => {
		// Insert some blocks of different types.
		await insertBlock( 'Cover' );

		// Click first color option from the block placeholder's color picker to make the inner blocks appear.
		const colorPickerButton = await page.waitForSelector(
			'.wp-block-cover__placeholder-background-options .components-circular-option-picker__option-wrapper:first-child button'
		);
		await colorPickerButton.click();

		// Open list view.
		await openListView();

		// Things start off expanded.
		expect( await getBlockListLeafNodes() ).toHaveLength( 2 );

		const blockListExpanders = await page.$$(
			'.block-editor-list-view__expander'
		);

		// Collapse the first block
		await blockListExpanders[ 0 ].click();

		// Check that we're collapsed
		expect( await getBlockListLeafNodes() ).toHaveLength( 1 );

		// Focus the cover block. The paragraph is not focussed by default.
		const coverBlock = await page.waitForSelector( '.wp-block-cover' );

		await coverBlock.focus();

		// Click the cover title placeholder.
		const coverTitle = await page.waitForSelector(
			'.wp-block-cover .wp-block-paragraph'
		);

		await coverTitle.click();

		// The block list should contain two leafs and the second should be selected (and be a paragraph).
		const selectedElementText = await page.$eval(
			'.block-editor-list-view-leaf.is-selected .block-editor-list-view-block-contents',
			( element ) => element.innerText
		);

		expect( selectedElementText ).toContain( 'Paragraph' );
	} );
} );
