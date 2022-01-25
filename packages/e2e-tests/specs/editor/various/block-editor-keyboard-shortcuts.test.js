/**
 * WordPress dependencies
 */
import {
	createNewPost,
	clickBlockAppender,
	getEditedPostContent,
	pressKeyWithModifier,
	clickBlockToolbarButton,
	clickMenuItem,
	clickOnCloseModalButton,
} from '@wordpress/e2e-test-utils';

const createTestParagraphBlocks = async () => {
	await clickBlockAppender();
	await page.keyboard.type( '1st' );
	await page.keyboard.press( 'Enter' );
	await page.keyboard.type( '2nd' );
	await page.keyboard.press( 'Enter' );
	await page.keyboard.type( '3rd' );
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
	describe( 'test shortcuts handling through portals in the same tree', () => {
		beforeEach( async () => {
			await createTestParagraphBlocks();
			// Multiselect via keyboard.
			await pressKeyWithModifier( 'primary', 'a' );
			await pressKeyWithModifier( 'primary', 'a' );
		} );
		it( 'should propagate properly and delete selected blocks', async () => {
			await clickBlockToolbarButton( 'Options' );
			const label = 'Duplicate';
			await page.$x(
				`//div[@role="menu"]//span[contains(concat(" ", @class, " "), " components-menu-item__item ")][contains(text(), "${ label }")]`
			);
			await page.keyboard.press( 'Delete' );
			expect( await getEditedPostContent() ).toMatchInlineSnapshot(
				`""`
			);
		} );
		it( 'should prevent deleting multiple selected blocks from inputs', async () => {
			await clickBlockToolbarButton( 'Options' );
			await clickMenuItem( 'Add to Reusable blocks' );
			const reusableBlockNameInputSelector =
				'.reusable-blocks-menu-items__convert-modal .components-text-control__input';
			const nameInput = await page.waitForSelector(
				reusableBlockNameInputSelector
			);
			await nameInput.click();
			await page.keyboard.type( 'hi' );
			await page.keyboard.press( 'Backspace' );
			await page.keyboard.press( 'ArrowLeft' );
			await page.keyboard.press( 'Delete' );
			await clickOnCloseModalButton(
				'.reusable-blocks-menu-items__convert-modal'
			);
			expect( await getEditedPostContent() ).toMatchSnapshot();
		} );
	} );
} );
