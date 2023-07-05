/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.use( {
	blockSwitcher: async ( { page }, use ) => {
		await use( new blockSwitcher( { page } ) );
	},
} );

test.describe( 'Block Switcher', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'Should show the expected block transforms on the list block when the blocks are removed', async ( {
		page,
		blockSwitcher,
		pageUtils,
	} ) => {
		// Insert a list block.
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '- List content' );

		await page.keyboard.press( 'ArrowUp' );
		await pageUtils.pressKeys( 'alt+F10' );

		// Verify the block switcher exists.
		const blockToolbar = page.getByRole( 'toolbar', {
			name: 'Block tools',
		} );
		await expect(
			blockToolbar.getByRole( 'button', { name: 'List' } )
		).toBeVisible();

		// Verify the correct block transforms appear.
		expect( await blockSwitcher.getAvailableBlockTransforms() ).toEqual(
			expect.arrayContaining( [
				'Group',
				'Paragraph',
				'Heading',
				'Quote',
				'Columns',
			] )
		);
	} );

	test( 'Should show the expected block transforms on the list block when the quote block is removed', async ( {
		page,
		blockSwitcher,
		pageUtils,
	} ) => {
		// Remove the quote block from the list of registered blocks.
		await page.evaluate( () => {
			window.wp.blocks.unregisterBlockType( 'core/quote' );
		} );

		// Insert a list block.
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '- List content' );

		await page.keyboard.press( 'ArrowUp' );
		await pageUtils.pressKeys( 'alt+F10' );

		// Verify the block switcher exists.
		const blockToolbar = page.getByRole( 'toolbar', {
			name: 'Block tools',
		} );
		await expect(
			blockToolbar.getByRole( 'button', { name: 'List' } )
		).toBeVisible();

		// Verify the correct block transforms appear.
		expect( await blockSwitcher.getAvailableBlockTransforms() ).toEqual(
			expect.arrayContaining( [
				'Group',
				'Paragraph',
				'Heading',
				'Columns',
			] )
		);
	} );

	test( 'Should not show the block switcher if all the blocks the list block transforms into are removed', async ( {
		page,
		pageUtils,
	} ) => {
		async function getAvailableBlockTransforms() {
			return page.evaluate( ( buttonSelector ) => {
				return Array.from(
					document.querySelectorAll( buttonSelector )
				).map( ( button ) => {
					return button.textContent;
				} );
			}, '.block-editor-block-switcher__popover .block-editor-block-switcher__transforms__menugroup button' );
		}

		// Insert a list block.
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '- List content' );

		// Remove the paragraph and quote block from the list of registered blocks.
		await page.evaluate( () => {
			[
				'core/quote',
				'core/pullquote',
				'core/paragraph',
				'core/group',
				'core/heading',
				'core/columns',
			].forEach( ( block ) => wp.blocks.unregisterBlockType( block ) );
		} );

		await page.keyboard.press( 'ArrowUp' );
		await pageUtils.pressKeys( 'alt+F10' );

		// Verify the block switcher exists.
		const blockToolbar = page.getByRole( 'toolbar', {
			name: 'Block tools',
		} );
		await expect(
			blockToolbar.getByRole( 'button', { name: 'List' } )
		).toBeVisible();

		// Verify the correct block transforms appear.
		expect( await getAvailableBlockTransforms() ).toHaveLength( 0 );
	} );

	test.describe( 'Conditional tranformation options', () => {
		test.describe( 'Columns tranforms', () => {
			test( 'Should show Columns block only if selected blocks are between limits (1-6)', async ( {
				page,
				editor,
				blockSwitcher,
			} ) => {
				await page.keyboard.press( 'Enter' );
				await page.keyboard.type( '- List content' );
				await page.keyboard.press( 'ArrowUp' );
				await editor.insertBlock( {
					name: 'core/heading',
				} );
				await page.keyboard.type( 'I am a header' );
				await page.keyboard.down( 'Shift' );
				await page.keyboard.press( 'ArrowUp' );
				await page.keyboard.up( 'Shift' );
				expect(
					await blockSwitcher.getAvailableBlockTransforms()
				).toEqual( expect.arrayContaining( [ 'Columns' ] ) );
			} );
			test( 'Should NOT show Columns transform only if selected blocks are more than max limit(6)', async ( {
				page,
				editor,
				pageUtils,
				blockSwitcher,
			} ) => {
				await page.keyboard.press( 'Enter' );
				await page.keyboard.type( '- List content' );
				await page.keyboard.press( 'ArrowUp' );
				await editor.insertBlock( {
					name: 'core/heading',
				} );
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
				await pageUtils.pressKeys( 'primary+a' );
				await pageUtils.pressKeys( 'primary+a' );
				expect(
					await blockSwitcher.getAvailableBlockTransforms()
				).not.toEqual( expect.arrayContaining( [ 'Columns' ] ) );
			} );
		} );
	} );
} );

class blockSwitcher {
	constructor( { page } ) {
		this.page = page;
	}

	async getAvailableBlockTransforms() {
		await this.page.click( 'role=button[name="List"i]' );
		return this.page.evaluate( ( buttonSelector ) => {
			return Array.from(
				document.querySelectorAll( buttonSelector )
			).map( ( button ) => {
				return button.textContent;
			} );
		}, '.block-editor-block-switcher__popover .block-editor-block-switcher__transforms__menugroup button' );
	}
}
