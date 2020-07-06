/**
 * WordPress dependencies
 */
import {
	createNewPost,
	clickBlockAppender,
	getEditedPostContent,
	pressKeyWithModifier,
} from '@wordpress/e2e-test-utils';

const createTestParagraphBlocks = async () => {
	await clickBlockAppender();
	await page.keyboard.type( 'First paragraph' );
	await page.keyboard.press( 'Enter' );
	await page.keyboard.type( 'Second paragraph' );
	await page.keyboard.press( 'Enter' );
	await page.keyboard.type( 'Third paragraph' );
};

describe( 'block editor keyboard shortcuts', () => {
	beforeEach( async () => {
		await createNewPost();
	} );

	describe( 'move blocks', () => {
		const moveUp = async () => pressKeyWithModifier( 'secondary', 't' );
		const moveDown = async () => pressKeyWithModifier( 'secondary', 'y' );
		describe( 'single block selected', () => {
			it( 'should move the block up', async () => {
				await createTestParagraphBlocks();
				expect( await getEditedPostContent() ).toMatchSnapshot();
				await moveUp();
				await moveUp();
				expect( await getEditedPostContent() ).toMatchSnapshot();
			} );

			it( 'should move the block down', async () => {
				await createTestParagraphBlocks();
				expect( await getEditedPostContent() ).toMatchSnapshot();
				await page.keyboard.press( 'ArrowUp' );
				await moveDown();
				expect( await getEditedPostContent() ).toMatchSnapshot();
			} );
		} );

		describe( 'multiple blocks selected', () => {
			it( 'should move the blocks up', async () => {
				await createTestParagraphBlocks();
				expect( await getEditedPostContent() ).toMatchSnapshot();
				await page.keyboard.down( 'Shift' );
				await page.keyboard.press( 'ArrowUp' );
				await page.keyboard.up( 'Shift' );
				await moveUp();
				expect( await getEditedPostContent() ).toMatchSnapshot();
			} );

			it( 'should move the blocks down', async () => {
				await createTestParagraphBlocks();
				expect( await getEditedPostContent() ).toMatchSnapshot();
				await page.keyboard.press( 'ArrowUp' );
				await page.keyboard.down( 'Shift' );
				await page.keyboard.press( 'ArrowUp' );
				await page.keyboard.up( 'Shift' );
				await moveDown();
				expect( await getEditedPostContent() ).toMatchSnapshot();
			} );
		} );
	} );
} );
