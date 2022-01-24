/**
 * WordPress dependencies
 */
import {
	clickBlockAppender,
	clickBlockToolbarButton,
	getEditedPostContent,
	createNewPost,
	isInDefaultBlock,
	pressKeyWithModifier,
	pressKeyTimes,
	insertBlock,
} from '@wordpress/e2e-test-utils';

const addThreeParagraphsToNewPost = async () => {
	await createNewPost();

	// Add demo content
	await clickBlockAppender();
	await page.keyboard.type( 'First paragraph' );
	await page.keyboard.press( 'Enter' );
	await page.keyboard.type( 'Second paragraph' );
	await page.keyboard.press( 'Enter' );
};

/**
 * Due to an issue with the Popover component not being scrollable
 * under certain conditions, Pupeteer cannot "see" the "Remove Block"
 * button. This is a workaround until that issue is resolved.
 *
 * see: https://github.com/WordPress/gutenberg/pull/14908#discussion_r284725956
 */
const clickOnBlockSettingsMenuRemoveBlockButton = async () => {
	await clickBlockToolbarButton( 'Options' );

	let isRemoveButton = false;

	let numButtons = await page.$$eval(
		'.block-editor-block-settings-menu__content button',
		( btns ) => btns.length
	);

	// Limit by the number of buttons available
	while ( --numButtons ) {
		await page.keyboard.press( 'Tab' );

		isRemoveButton = await page.evaluate( () => {
			return document.activeElement.innerText.includes(
				'Remove Paragraph'
			);
		} );

		// Stop looping once we find the button
		if ( isRemoveButton ) {
			await pressKeyTimes( 'Enter', 1 );
			break;
		}
	}

	// Makes failures more explicit
	await expect( isRemoveButton ).toBe( true );
};

describe( 'block deletion -', () => {
	beforeEach( addThreeParagraphsToNewPost );

	describe( 'deleting the third block using the Remove Block menu item', () => {
		it( 'results in two remaining blocks and positions the caret at the end of the second block', async () => {
			// The blocks can't be empty to trigger the toolbar
			await page.keyboard.type( 'Paragraph to remove' );
			await clickOnBlockSettingsMenuRemoveBlockButton();

			expect( await getEditedPostContent() ).toMatchSnapshot();

			// Type additional text and assert that caret position is correct by comparing to snapshot.
			await page.keyboard.type( ' - caret was here' );
			expect( await getEditedPostContent() ).toMatchSnapshot();
		} );
	} );

	describe( 'deleting the third block using the Remove Block shortcut', () => {
		it( 'results in two remaining blocks and positions the caret at the end of the second block', async () => {
			// Type some text to assert that the shortcut also deletes block content.
			await page.keyboard.type( 'this is block 2' );
			await pressKeyWithModifier( 'access', 'z' );
			expect( await getEditedPostContent() ).toMatchSnapshot();

			// Type additional text and assert that caret position is correct by comparing to snapshot.
			await page.keyboard.type( ' - caret was here' );
			expect( await getEditedPostContent() ).toMatchSnapshot();
		} );
	} );

	describe( 'deleting the third block using backspace in an empty block', () => {
		it( 'results in two remaining blocks and positions the caret at the end of the second block', async () => {
			await page.keyboard.press( 'Backspace' );
			expect( await getEditedPostContent() ).toMatchSnapshot();

			// Type additional text and assert that caret position is correct by comparing to snapshot.
			await page.keyboard.type( ' - caret was here' );
			expect( await getEditedPostContent() ).toMatchSnapshot();
		} );
	} );

	describe( 'deleting the third block using backspace with block wrapper selection', () => {
		it( 'results in three remaining blocks and positions the caret at the end of the third block', async () => {
			// Add an image block since it's easier to click the wrapper on non-textual blocks.
			await page.keyboard.type( '/image' );
			await page.waitForXPath(
				`//*[contains(@class, "components-autocomplete__result") and contains(@class, "is-selected") and contains(text(), 'Image')]`
			);
			await page.keyboard.press( 'Enter' );

			// Click on something that's not a block.
			await page.click( '.editor-post-title' );

			// Click on the image block so that its wrapper is selected and backspace to delete it.
			await page.click(
				'.wp-block[data-type="core/image"] .components-placeholder__label'
			);
			await page.keyboard.press( 'Backspace' );

			expect( await getEditedPostContent() ).toMatchSnapshot();

			// Type additional text and assert that caret position is correct by comparing to snapshot.
			await page.keyboard.type( ' - caret was here' );
			expect( await getEditedPostContent() ).toMatchSnapshot();
		} );
	} );

	describe( 'deleting the third and fourth blocks using backspace with multi-block selection', () => {
		it( 'results in two remaining blocks and positions the caret at the end of the second block', async () => {
			// Add a third paragraph for this test.
			await page.keyboard.type( 'Third paragraph' );
			await page.keyboard.press( 'Enter' );

			// Press the up arrow once to select the third and fourth blocks.
			await pressKeyWithModifier( 'shift', 'ArrowUp' );

			// Now that the block wrapper is selected, press backspace to delete it.
			await page.keyboard.press( 'Backspace' );
			expect( await getEditedPostContent() ).toMatchSnapshot();

			// Type additional text and assert that caret position is correct by comparing to snapshot.
			await page.keyboard.type( ' - caret was here' );
			expect( await getEditedPostContent() ).toMatchSnapshot();
		} );
	} );
} );

describe( 'deleting all blocks', () => {
	beforeEach( async () => {
		await createNewPost();
	} );

	it( 'results in the default block getting selected', async () => {
		await clickBlockAppender();
		await page.keyboard.type( 'Paragraph' );
		await clickOnBlockSettingsMenuRemoveBlockButton();

		// There is a default block and post title:
		expect(
			await page.$$( '.block-editor-block-list__block' )
		).toHaveLength( 2 );

		// But the effective saved content is still empty:
		expect( await getEditedPostContent() ).toBe( '' );

		// And focus is retained:
		expect( await isInDefaultBlock() ).toBe( true );
	} );

	it( 'gracefully removes blocks when the default block is not available', async () => {
		// Regression Test: Previously, removing a block would not clear
		// selection state when there were no other blocks to select.
		//
		// See: https://github.com/WordPress/gutenberg/issues/15458
		// See: https://github.com/WordPress/gutenberg/pull/15543

		// Unregister default block type. This may happen if the editor is
		// configured to not allow the default (paragraph) block type, either
		// by plugin editor settings filtering or user block preferences.
		await page.evaluate( () => {
			const defaultBlockName = wp.data
				.select( 'core/blocks' )
				.getDefaultBlockName();
			wp.data
				.dispatch( 'core/blocks' )
				.removeBlockTypes( defaultBlockName );
		} );

		// Add and remove a block.
		await insertBlock( 'Image' );
		await page.waitForSelector( 'figure[data-type="core/image"]' );
		await page.keyboard.press( 'Backspace' );

		// Verify there is no selected block.
		// TODO: There should be expectations around where focus is placed in
		// this scenario. Currently, a focus loss occurs (not acceptable).
		const selectedBlocksCount = await page.evaluate( () => {
			return wp.data
				.select( 'core/block-editor' )
				.getSelectedBlockClientIds().length;
		} );

		expect( selectedBlocksCount ).toBe( 0 );
	} );
} );
