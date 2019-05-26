/**
 * WordPress dependencies
 */
import {
	createNewPost,
	insertBlock,
	navigateToContentEditorTop,
	tabThroughBlockMoverControl,
	tabThroughBlockToolbar,
} from '@wordpress/e2e-test-utils';
/**
 * External dependencies
 */

const externalWrapperHasFocus = async ( blockType ) => {
	// The block external focusable wrapper has focus
	const isFocusedBlock = await page.evaluate(
		() => document.activeElement.dataset.type
	);
	await expect( isFocusedBlock ).toEqual( blockType );
};

const inserterToggleHasFocus = async () => {
	const isFocusedInserterToggle = await page.evaluate( () =>
		document.activeElement.classList.contains( 'block-editor-inserter__toggle' )
	);
	await expect( isFocusedInserterToggle ).toBe( true );
};

const blockContentAreas = async () => {
	return await page.evaluate( () => {
		// return an array with the classNames of the block toolbar's buttons
		return [].slice
			.call(
				document.querySelectorAll(
					'.wp-block.is-selected [contenteditable], .wp-block.is-typing [contenteditable]'
				)
			)
			.map( ( elem ) => elem.className );
	} );
};
const blockContenAreasHaveFocus = async ( content ) => {
	const blocks = await blockContentAreas();
	const isFocusedBlockContentArea = async () => {
		return await page.evaluate( () => document.activeElement.contentEditable );
	};
	const blockContentAreaContent = async () => {
		return await page.evaluate( () => document.activeElement.innerHTML );
	};
	for ( let i = 0; i < blocks.length; i++ ) {
		if ( i > 0 ) {
			await page.keyboard.press( 'Tab' );
		}

		// The value of 'contentEditable' should be the string 'true'
		await expect( await isFocusedBlockContentArea() ).toBe( 'true' );
		await expect( await blockContentAreaContent() ).toContain( content );
	}
};

const tabThroughBlock = async ( content, blockType ) => {
	// Tab to the next paragraph block
	await page.keyboard.press( 'Tab' );
	await externalWrapperHasFocus( blockType );

	// Tab causes 'add block' button to receive focus
	await page.keyboard.press( 'Tab' );
	await inserterToggleHasFocus();

	await tabThroughBlockMoverControl();
	await tabThroughBlockToolbar();

	// Tab causes the paragraph content to receive focus
	await page.keyboard.press( 'Tab' );
	await blockContenAreasHaveFocus( content );
};

const insertAndPopulateBlock = async ( blockName, content ) => {
	await insertBlock( blockName );
	await page.keyboard.type( content );

	const blocks = await blockContentAreas();
	for ( let i = 0; i < blocks.length - 1; i++ ) {
		await page.keyboard.press( 'Tab' );
		await page.keyboard.type( content );
	}
	await page.keyboard.press( 'Enter' );
};

describe( 'Order of block keyboard navigation', () => {
	beforeEach( async () => {
		await createNewPost();
	} );
	it( 'permits tabbing through blocks in the expected order', async () => {
		await insertAndPopulateBlock( 'Heading', 'Heading Block Content' );
		await insertAndPopulateBlock( 'Paragraph', 'Paragraph Block Content' );
		await insertAndPopulateBlock( 'Quote', 'Quote Block Content' );
		await insertAndPopulateBlock( 'List', 'List Block Content' );

		await navigateToContentEditorTop();

		await tabThroughBlock( 'Heading Block Content', 'core/heading' );
		await tabThroughBlock( 'Paragraph Block Content', 'core/paragraph' );
		await tabThroughBlock( 'Quote Block Content', 'core/quote' );
		await tabThroughBlock( 'List Block Content', 'core/list' );
	} );

	it( 'permits tabbing through paragraph blocks in the expected order', async () => {
		const paragraphBlocks = [ 'Paragraph 0', 'Paragraph 1', 'Paragraph 2' ];

		// create 3 paragraphs blocks with some content
		for ( const paragraphBlock of paragraphBlocks ) {
			await insertAndPopulateBlock( 'Paragraph', paragraphBlock );
		}

		await navigateToContentEditorTop();

		for ( const paragraphBlock of paragraphBlocks ) {
			await tabThroughBlock( paragraphBlock, 'core/paragraph' );
		}

		// Repeat the same steps to ensure that there is no change introduced in how the focus is handled.
		// This prevents the previous regression explained in: https://github.com/WordPress/gutenberg/issues/11773.
		await navigateToContentEditorTop();

		for ( const paragraphBlock of paragraphBlocks ) {
			await tabThroughBlock( paragraphBlock, 'core/paragraph' );
		}
	} );
} );
