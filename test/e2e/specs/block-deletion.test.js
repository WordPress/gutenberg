/**
 * Internal dependencies
 */
import {
	clickBlockAppender,
	clickOnBlockSettingsMenuItem,
	getEditedPostContent,
	newPost,
	pressWithModifier,
	PRIMARY_ALT_MODIFIER_KEYS,
} from '../support/utils';

const addThreeParagraphsToNewPost = async () => {
	await newPost();

	// Add demo content
	await clickBlockAppender();
	await page.keyboard.type( 'First paragraph' );
	await page.keyboard.press( 'Enter' );
	await page.keyboard.type( 'Second paragraph' );
	await page.keyboard.press( 'Enter' );
};

describe( 'block deletion -', () => {
	describe( 'deleting the third block using the Remove Block menu item', () => {
		beforeAll( addThreeParagraphsToNewPost );

		it( 'results in two remaining blocks', async () => {
			await clickOnBlockSettingsMenuItem( 'Remove Block' );
			expect( await getEditedPostContent() ).toMatchSnapshot();
		} );

		it( 'positions the caret at the end of the second block as evidenced by typing additional text', async () => {
			await page.keyboard.type( ' - caret was here' );
			expect( await getEditedPostContent() ).toMatchSnapshot();
		} );
	} );

	describe( 'deleting the third block using the Remove Block shortcut', () => {
		beforeAll( addThreeParagraphsToNewPost );

		it( 'results in two remaining blocks', async () => {
			await pressWithModifier( PRIMARY_ALT_MODIFIER_KEYS, 'Backspace' );
			expect( await getEditedPostContent() ).toMatchSnapshot();
		} );

		it( 'positions the caret at the end of the second block as evidenced by typing additional text', async () => {
			await page.keyboard.type( ' - caret was here' );
			expect( await getEditedPostContent() ).toMatchSnapshot();
		} );
	} );

	describe( 'deleting the third block using backspace in an empty block', () => {
		beforeAll( addThreeParagraphsToNewPost );

		it( 'results in two remaining blocks', async () => {
			await page.keyboard.press( 'Backspace' );
			expect( await getEditedPostContent() ).toMatchSnapshot();
		} );

		it( 'positions the caret at the end of the second block as evidenced by typing additional text', async () => {
			await page.keyboard.type( ' - caret was here' );
			expect( await getEditedPostContent() ).toMatchSnapshot();
		} );
	} );

	describe( 'deleting the third block using backspace with block wrapper selection', () => {
		beforeAll( addThreeParagraphsToNewPost );

		it( 'results in three remaining blocks', async () => {
			// Add an image block since it's easier to click the wrapper on non-textual blocks.
			await page.keyboard.type( '/image' );
			await page.keyboard.press( 'Enter' );

			// Click on something that's not a block.
			await page.click( '.editor-post-title' );

			// Click on the third (image) block so that its wrapper is selected and backspace to delete it.
			await page.click( '.editor-block-list__block:nth-child(3)' );
			await page.keyboard.press( 'Backspace' );

			expect( await getEditedPostContent() ).toMatchSnapshot();
		} );

		it( 'positions the caret at the end of the second block as evidenced by typing additional text', async () => {
			await page.keyboard.type( ' - caret was here' );
			expect( await getEditedPostContent() ).toMatchSnapshot();
		} );
	} );

	describe( 'deleting third third and fourth blocks using backspace with multi-block selection', () => {
		beforeAll( async () => {
			await addThreeParagraphsToNewPost();

			// Add a third paragraph for this test.
			await page.keyboard.type( 'Third paragraph' );
			await page.keyboard.press( 'Enter' );
		} );

		it( 'results in two remaining blocks', async () => {
			// Press the up arrow once to select the third and fourth blocks.
			await pressWithModifier( 'Shift', 'ArrowUp' );

			// Now that the block wrapper is selected, press backspace to delete it.
			await page.keyboard.press( 'Backspace' );
			expect( await getEditedPostContent() ).toMatchSnapshot();

			expect( await getEditedPostContent() ).toMatchSnapshot();
		} );

		it( 'positions the caret at the end of the second block as evidenced by typing additional text', async () => {
			await page.keyboard.type( ' - caret was here' );
			expect( await getEditedPostContent() ).toMatchSnapshot();
		} );
	} );
} );
