/**
 * WordPress dependencies
 */
import {
	createNewPost,
	pressKeyWithModifier,
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

async function testToolbar( currentBlockLabel ) {
	await focusBlockToolbar();
	await expectLabelToHaveFocus( 'Change block type or style' );
	await page.keyboard.press( 'ArrowRight' );
	await expectLabelToHaveFocus( 'Move up' );
	await page.keyboard.press( 'Tab' );
	await expectLabelToHaveFocus( currentBlockLabel );
	await pressKeyWithModifier( 'shift', 'Tab' );
	await expectLabelToHaveFocus( 'Move up' );
}

async function testGroup( currentBlockLabel ) {
	await page.click( '[aria-label="Change block type or style"]' );
	await page.evaluate( () => {
		document.querySelector( '.editor-block-list-item-group' ).click();
	} );
	await expectLabelToHaveFocus( 'Block: Group' );
	await page.keyboard.press( 'Tab' );
	await expectLabelToHaveFocus( currentBlockLabel );
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
		await testToolbar( 'Paragraph block' );
		await testGroup( 'Paragraph block' );
	} );

	it( 'ensures heading block toolbar uses roving tabindex', async () => {
		await insertBlock( 'Heading' );
		await page.keyboard.type( 'Heading' );
		await testToolbar( 'Write heading…' );
		await testGroup( 'Write heading…' );
	} );

	it( 'ensures list block toolbar uses roving tabindex', async () => {
		await insertBlock( 'List' );
		await page.keyboard.type( 'List' );
		await testToolbar( 'Write list…' );
		await testGroup( 'Write list…' );
	} );

	it( 'ensures image block toolbar uses roving tabindex', async () => {
		await insertBlock( 'Image' );
		await testToolbar( 'Block: Image' );
		await testGroup( 'Block: Image' );
	} );
} );
