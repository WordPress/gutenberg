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

		// Drag above the heading block.
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

		const uploadButton = await page.waitForXPath(
			'//button[contains( text(), "Upload" ) ]'
		);
		expect( uploadButton ).toHaveFocus();

		// Delete the image block in the canvas.
		await page.keyboard.press( 'ArrowUp' );
		await page.keyboard.press( 'Backspace' );

		// List view should have two rows.
		const listViewRows = await page.$$( 'tr.block-editor-list-view-leaf' );
		expect( listViewRows ).toHaveLength( 2 );

		// The console didn't throw an error as reported in
		// https://github.com/WordPress/gutenberg/issues/38763.
		expect( console ).not.toHaveErrored();
	} );

	// Check for regression of https://github.com/WordPress/gutenberg/issues/39026
	it( 'should select previous block after removing selected one', async () => {
		// Insert some blocks of different types.
		await insertBlock( 'Image' );
		await insertBlock( 'Heading' );
		await insertBlock( 'Paragraph' );

		// Open list view.
		await openListView();

		// The last inserted paragraph block should be selected in List View.
		await page.waitForXPath(
			'//a[contains(., "Paragraph(selected block)")]'
		);

		// Paragraph options button.
		const paragraphOptionsButton = await page.waitForSelector(
			'tr.block-editor-list-view-leaf:last-child button[aria-label="Options for Paragraph block"]'
		);

		await paragraphOptionsButton.click();

		const paragraphRemoveButton = await page.waitForXPath(
			'//button[contains(., "Remove Paragraph")]'
		);

		// Remove paragraph.
		await paragraphRemoveButton.click();

		// Heading block should be selected as previous block.
		await page.waitForXPath(
			'//a[contains(., "Heading(selected block)")]'
		);
	} );

	// Check for regression of https://github.com/WordPress/gutenberg/issues/39026
	it( 'should select next block after removing the very first block', async () => {
		// Insert some blocks of different types.
		await insertBlock( 'Image' );
		await insertBlock( 'Heading' );
		await insertBlock( 'Paragraph' );

		// Open list view.
		await openListView();

		// The last inserted paragraph block should be selected in List View.
		await page.waitForXPath(
			'//a[contains(., "Paragraph(selected block)")]'
		);

		// Go to the image block in list view.
		await pressKeyTimes( 'ArrowUp', 2 );
		await pressKeyTimes( 'Enter', 1 );

		// Image block should have selected.
		await page.waitForXPath( '//a[contains(., "Image(selected block)")]' );

		// Image options dropdown.
		const imageOptionsButton = await page.waitForSelector(
			'tr.block-editor-list-view-leaf:first-child button[aria-label="Options for Image block"]'
		);

		await imageOptionsButton.click();

		const imageRemoveButton = await page.waitForXPath(
			'//button[contains(., "Remove Image")]'
		);

		// Remove Image block.
		await imageRemoveButton.click();

		// Heading block should be selected as next block.
		await page.waitForXPath(
			'//a[contains(., "Heading(selected block)")]'
		);
	} );

	/**
	 * When all the blocks gets removed from the editor, it inserts a default paragraph block;
	 * make sure that paragraph block gets selected after removing blocks from ListView.
	 */
	it( 'should select default paragraph block after removing all blocks', async () => {
		// Insert some blocks of different types.
		await insertBlock( 'Image' );
		await insertBlock( 'Heading' );

		// Open list view.
		await openListView();

		// The last inserted heading block should be selected in List View.
		const headingBlock = await page.waitForXPath(
			'//a[contains(., "Heading(selected block)")]'
		);

		await headingBlock.click();

		// Select all two blocks.
		await pressKeyWithModifier( 'shift', 'ArrowUp' );

		// Both Image and Heading blocks should have selected.
		await page.waitForXPath(
			'//a[contains(., "Heading(selected block)")]'
		);
		await page.waitForXPath( '//a[contains(., "Image(selected block)")]' );

		const imageOptionsButton = await page.waitForSelector(
			'tr.block-editor-list-view-leaf:first-child button[aria-label="Options for Image block"]'
		);

		// Blocks options dropdown.
		await imageOptionsButton.click();

		const blocksRemoveButton = await page.waitForXPath(
			'//button[contains(., "Remove blocks")]'
		);

		// Remove all blocks.
		await blocksRemoveButton.click();

		// Newly created default paragraph block should be selected.
		await page.waitForXPath(
			'//a[contains(., "Paragraph(selected block)")]'
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

	// Test keyboard Home/End keys.
	it( 'ensures the Home/End keyboard keys move focus to start/end of list', async () => {
		// Insert some blocks of different types.
		await insertBlock( 'Image' );
		await insertBlock( 'Heading' );
		await insertBlock( 'Paragraph' );
		await insertBlock( 'Columns' );
		await insertBlock( 'Group' );

		// Open list view.
		await pressKeyWithModifier( 'access', 'o' );

		// The last inserted group block should be selected in list view.
		await page.waitForXPath( '//a[contains(., "Group(selected block)")]' );

		// Press Home to go to the first inserted block (image).
		await page.keyboard.press( 'Home' );
		const listViewImageBlock = await page.waitForXPath(
			'//a[contains(., "Image")]'
		);
		await expect( listViewImageBlock ).toHaveFocus();

		// Press End followed by Arrow Up to go to the second to last block (columns).
		await page.keyboard.press( 'End' );
		await page.keyboard.press( 'ArrowUp' );
		const listViewColumnsBlock = await page.waitForXPath(
			'//a[contains(., "Columns")]'
		);
		await expect( listViewColumnsBlock ).toHaveFocus();

		// Try navigating the right column to image block options button via Home key.
		await page.keyboard.press( 'ArrowRight' );
		await page.keyboard.press( 'Home' );
		const listViewImageBlockRight = await page.waitForSelector(
			'button[aria-label="Options for Image block"]'
		);
		await expect( listViewImageBlockRight ).toHaveFocus();

		// Try navigating the right column to group block options button.
		await page.keyboard.press( 'End' );
		const listViewGroupBlockRight = await page.waitForSelector(
			'button[aria-label="Options for Group block"]'
		);
		await expect( listViewGroupBlockRight ).toHaveFocus();
	} );
} );
