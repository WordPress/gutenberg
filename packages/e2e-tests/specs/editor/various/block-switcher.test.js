/**
 * WordPress dependencies
 */
import {
	hasBlockSwitcher,
	getAvailableBlockTransforms,
	createNewPost,
	insertBlock,
	pressKeyWithModifier,
} from '@wordpress/e2e-test-utils';

describe( 'Block Switcher', () => {
	beforeEach( async () => {
		await createNewPost();
	} );

	it( 'Should show the expected block transforms on the list block when the blocks are removed', async () => {
		// Insert a list block.
		await insertBlock( 'List' );
		await page.keyboard.type( 'List content' );
		await pressKeyWithModifier( 'alt', 'F10' );

		// Verify the block switcher exists.
		expect( await hasBlockSwitcher() ).toBeTruthy();

		// Verify the correct block transforms appear.
		expect( await getAvailableBlockTransforms() ).toEqual(
			expect.arrayContaining( [
				'Group',
				'Paragraph',
				'Quote',
				'Heading',
				'Pullquote',
				'Columns',
			] )
		);
	} );

	it( 'Should show the expected block transforms on the list block when the quote block is removed', async () => {
		// Remove the quote block from the list of registered blocks.
		await page.evaluate( () => {
			wp.blocks.unregisterBlockType( 'core/quote' );
		} );

		// Insert a list block.
		await insertBlock( 'List' );
		await page.keyboard.type( 'List content' );
		await pressKeyWithModifier( 'alt', 'F10' );

		// Verify the block switcher exists.
		expect( await hasBlockSwitcher() ).toBeTruthy();

		// Verify the correct block transforms appear.
		expect( await getAvailableBlockTransforms() ).toEqual(
			expect.arrayContaining( [
				'Group',
				'Paragraph',
				'Pullquote',
				'Heading',
			] )
		);
	} );

	it( 'Should not show the block switcher if all the blocks the list block transforms into are removed', async () => {
		// Remove the paragraph and quote block from the list of registered blocks.
		await page.evaluate( () => {
			[
				'core/quote',
				'core/pullquote',
				'core/paragraph',
				'core/group',
				'core/heading',
				'core/columns',
			].map( ( block ) => wp.blocks.unregisterBlockType( block ) );
		} );

		// Insert a list block.
		await insertBlock( 'List' );
		await page.keyboard.type( 'List content' );
		await pressKeyWithModifier( 'alt', 'F10' );

		// Verify the block switcher exists.
		expect( await hasBlockSwitcher() ).toBeFalsy();
		// Verify the correct block transforms appear.
		expect( await getAvailableBlockTransforms() ).toHaveLength( 0 );
	} );

	describe( 'Conditional tranformation options', () => {
		describe( 'Columns tranforms', () => {
			it( 'Should show Columns block only if selected blocks are between limits (1-6)', async () => {
				await insertBlock( 'List' );
				await page.keyboard.type( 'List content' );
				await insertBlock( 'Heading' );
				await page.keyboard.type( 'I am a header' );
				await page.keyboard.down( 'Shift' );
				await page.keyboard.press( 'ArrowUp' );
				await page.keyboard.up( 'Shift' );
				expect( await getAvailableBlockTransforms() ).toEqual(
					expect.arrayContaining( [ 'Columns' ] )
				);
			} );
			it( 'Should NOT show Columns transform only if selected blocks are more than max limit(6)', async () => {
				await insertBlock( 'List' );
				await page.keyboard.type( 'List content' );
				await insertBlock( 'Heading' );
				await page.keyboard.type( 'I am a header' );
				await page.keyboard.press( 'Enter' );
				await page.keyboard.type( 'First paragraph' );
				await page.keyboard.press( 'Enter' );
				await page.keyboard.type( 'Second paragraph' );
				await page.keyboard.press( 'Enter' );
				await page.keyboard.type( 'Third paragraph' );
				await page.keyboard.press( 'Enter' );
				await page.keyboard.type( 'Fourth paragraph' );
				await page.keyboard.press( 'Enter' );
				await page.keyboard.type( 'Fifth paragraph' );
				await pressKeyWithModifier( 'primary', 'a' );
				await pressKeyWithModifier( 'primary', 'a' );
				expect( await getAvailableBlockTransforms() ).not.toEqual(
					expect.arrayContaining( [ 'Columns' ] )
				);
			} );
		} );
	} );
} );
