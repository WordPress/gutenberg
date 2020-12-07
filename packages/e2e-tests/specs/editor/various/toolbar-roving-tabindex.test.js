/**
 * WordPress dependencies
 */
import {
	createNewPost,
	pressKeyWithModifier,
	clickBlockToolbarButton,
	insertBlock,
	canvas,
} from '@wordpress/e2e-test-utils';

async function focusBlockToolbar() {
	await pressKeyWithModifier( 'alt', 'F10' );
}

async function expectLabelToHaveFocus( label, p = page ) {
	await expect(
		await p.evaluate( () =>
			document.activeElement.getAttribute( 'aria-label' )
		)
	).toBe( label );
}

async function testBlockToolbarKeyboardNavigation( currentBlockLabel ) {
	await focusBlockToolbar();
	await expectLabelToHaveFocus( 'Change block type or style' );
	await page.keyboard.press( 'ArrowRight' );
	await expectLabelToHaveFocus( 'Move up' );
	await page.keyboard.press( 'Tab' );
	await expectLabelToHaveFocus( currentBlockLabel, canvas() );
	await pressKeyWithModifier( 'shift', 'Tab' );
	await expectLabelToHaveFocus( 'Move up' );
}

async function wrapCurrentBlockWithGroup() {
	await page.click( '[aria-label="Change block type or style"]' );
	await page.evaluate( () => {
		document.querySelector( '.editor-block-list-item-group' ).click();
	} );
}

async function testGroupKeyboardNavigation( currentBlockLabel ) {
	await expectLabelToHaveFocus( 'Block: Group', canvas() );
	await page.keyboard.press( 'Tab' );
	await expectLabelToHaveFocus( currentBlockLabel, canvas() );
	await pressKeyWithModifier( 'shift', 'Tab' );
	await expectLabelToHaveFocus( 'Select parent (Group)' );
	await page.keyboard.press( 'ArrowRight' );
	await expectLabelToHaveFocus( 'Change block type or style' );
}

describe( 'Toolbar roving tabindex', () => {
	beforeEach( async () => {
		await createNewPost();
		await insertBlock( 'Paragraph' );
		await page.keyboard.type( 'First block' );
	} );

	it( 'ensures paragraph block toolbar uses roving tabindex', async () => {
		await insertBlock( 'Paragraph' );
		await page.keyboard.type( 'Paragraph' );
		await testBlockToolbarKeyboardNavigation( 'Paragraph block' );
		await wrapCurrentBlockWithGroup();
		await testGroupKeyboardNavigation( 'Paragraph block' );
	} );

	it( 'ensures heading block toolbar uses roving tabindex', async () => {
		await insertBlock( 'Heading' );
		await page.keyboard.type( 'Heading' );
		await testBlockToolbarKeyboardNavigation( 'Block: Heading' );
		await wrapCurrentBlockWithGroup();
		await testGroupKeyboardNavigation( 'Block: Heading' );
	} );

	it( 'ensures list block toolbar uses roving tabindex', async () => {
		await insertBlock( 'List' );
		await page.keyboard.type( 'List' );
		await testBlockToolbarKeyboardNavigation( 'Block: List' );
		await wrapCurrentBlockWithGroup();
		await testGroupKeyboardNavigation( 'Block: List' );
	} );

	it( 'ensures image block toolbar uses roving tabindex', async () => {
		await insertBlock( 'Image' );
		await testBlockToolbarKeyboardNavigation( 'Block: Image' );
		await wrapCurrentBlockWithGroup();
		await testGroupKeyboardNavigation( 'Block: Image' );
	} );

	it( 'ensures table block toolbar uses roving tabindex', async () => {
		await insertBlock( 'Table' );
		await testBlockToolbarKeyboardNavigation( 'Block: Table' );
		// Move focus to the first toolbar item
		await page.keyboard.press( 'Home' );
		await expectLabelToHaveFocus( 'Change block type or style' );
		await canvas().click( '.blocks-table__placeholder-button' );
		await testBlockToolbarKeyboardNavigation( 'Block: Table' );
		await wrapCurrentBlockWithGroup();
		await testGroupKeyboardNavigation( 'Block: Table' );
	} );

	it( 'ensures custom html block toolbar uses roving tabindex', async () => {
		await insertBlock( 'Custom HTML' );
		await testBlockToolbarKeyboardNavigation( 'Block: Custom HTML' );
		await wrapCurrentBlockWithGroup();
		await testGroupKeyboardNavigation( 'Block: Custom HTML' );
	} );

	it( 'ensures block toolbar remembers the last focused item', async () => {
		await insertBlock( 'Paragraph' );
		await page.keyboard.type( 'Paragraph' );
		await focusBlockToolbar();
		await clickBlockToolbarButton( 'Bold' );
		await page.keyboard.type( 'a' );
		await pressKeyWithModifier( 'shift', 'Tab' );
		await expectLabelToHaveFocus( 'Bold' );
	} );
} );
