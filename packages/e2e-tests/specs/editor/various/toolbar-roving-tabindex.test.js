/**
 * WordPress dependencies
 */
import {
	createNewPost,
	pressKeyWithModifier,
	clickBlockToolbarButton,
	insertBlock,
} from '@wordpress/e2e-test-utils';

async function focusBlockToolbar() {
	await pressKeyWithModifier( 'alt', 'F10' );
}

async function expectLabelToHaveFocus( label ) {
	await expect(
		await page.evaluate( () =>
			document.activeElement.getAttribute( 'aria-label' )
		)
	).toBe( label );
}

async function testBlockToolbarKeyboardNavigation(
	currentBlockLabel,
	currentBlockTitle
) {
	await focusBlockToolbar();
	await expectLabelToHaveFocus( currentBlockTitle );
	await page.keyboard.press( 'ArrowRight' );
	await expectLabelToHaveFocus( 'Move up' );
	await page.keyboard.press( 'Tab' );
	await expectLabelToHaveFocus( currentBlockLabel );
	await pressKeyWithModifier( 'shift', 'Tab' );
	await expectLabelToHaveFocus( 'Move up' );
}

async function wrapCurrentBlockWithGroup( currentBlockTitle ) {
	await page.click( `[aria-label="${ currentBlockTitle }"]` );
	await page.evaluate( () => {
		document.querySelector( '.editor-block-list-item-group' ).click();
	} );
}

async function testGroupKeyboardNavigation(
	currentBlockLabel,
	currentBlockTitle
) {
	await expectLabelToHaveFocus( 'Block: Group' );
	await page.keyboard.press( 'Tab' );
	await expectLabelToHaveFocus( currentBlockLabel );
	await pressKeyWithModifier( 'shift', 'Tab' );
	await expectLabelToHaveFocus( 'Select Group' );
	await page.keyboard.press( 'ArrowRight' );
	await expectLabelToHaveFocus( currentBlockTitle );
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
		await testBlockToolbarKeyboardNavigation(
			'Paragraph block',
			'Paragraph'
		);
		await wrapCurrentBlockWithGroup( 'Paragraph' );
		await testGroupKeyboardNavigation( 'Paragraph block', 'Paragraph' );
	} );

	it( 'ensures heading block toolbar uses roving tabindex', async () => {
		await insertBlock( 'Heading' );
		await page.keyboard.type( 'Heading' );
		await testBlockToolbarKeyboardNavigation( 'Block: Heading', 'Heading' );
		await wrapCurrentBlockWithGroup( 'Heading' );
		await testGroupKeyboardNavigation( 'Block: Heading', 'Heading' );
	} );

	it( 'ensures list block toolbar uses roving tabindex', async () => {
		await insertBlock( 'List' );
		await page.keyboard.type( 'List' );
		await testBlockToolbarKeyboardNavigation( 'Block: List', 'List' );
		await wrapCurrentBlockWithGroup( 'List' );
		await testGroupKeyboardNavigation( 'Block: List', 'List' );
	} );

	it( 'ensures image block toolbar uses roving tabindex', async () => {
		await insertBlock( 'Image' );
		await testBlockToolbarKeyboardNavigation( 'Block: Image', 'Image' );
		await wrapCurrentBlockWithGroup( 'Image' );
		await testGroupKeyboardNavigation( 'Block: Image', 'Image' );
	} );

	it( 'ensures table block toolbar uses roving tabindex', async () => {
		await insertBlock( 'Table' );
		await testBlockToolbarKeyboardNavigation( 'Block: Table', 'Table' );
		// Move focus to the first toolbar item
		await page.keyboard.press( 'Home' );
		await expectLabelToHaveFocus( 'Table' );
		await page.click( '.blocks-table__placeholder-button' );
		await testBlockToolbarKeyboardNavigation( 'Block: Table', 'Table' );
		await wrapCurrentBlockWithGroup( 'Table' );
		await testGroupKeyboardNavigation( 'Block: Table', 'Table' );
	} );

	it( 'ensures custom html block toolbar uses roving tabindex', async () => {
		await insertBlock( 'Custom HTML' );
		await testBlockToolbarKeyboardNavigation(
			'Block: Custom HTML',
			'Custom HTML'
		);
		await wrapCurrentBlockWithGroup( 'Custom HTML' );
		await testGroupKeyboardNavigation(
			'Block: Custom HTML',
			'Custom HTML'
		);
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

	it( 'can reach toolbar items with arrow keys after pressing alt+F10', async () => {
		await pressKeyWithModifier( 'alt', 'F10' );
		await page.keyboard.press( 'ArrowRight' );
		await page.keyboard.press( 'ArrowRight' );
		await expectLabelToHaveFocus( 'Bold' );
	} );
} );
