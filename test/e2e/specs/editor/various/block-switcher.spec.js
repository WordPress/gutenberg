/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Block Switcher', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'Should show the expected block transforms on the list block when the blocks are removed', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.canvas
			.getByRole( 'button', { name: 'Add default block' } )
			.click();
		await page.keyboard.type( '- List content' );
		await page.keyboard.press( 'ArrowUp' );
		await pageUtils.pressKeys( 'alt+F10' );

		const blockSwitcher = page
			.getByRole( 'toolbar', { name: 'Block tools' } )
			.getByRole( 'button', { name: 'List' } );

		// Verify the block switcher exists.
		await expect( blockSwitcher ).toHaveAttribute(
			'aria-haspopup',
			'true'
		);

		// Verify the correct block transforms appear.
		await blockSwitcher.click();
		await expect(
			page.getByRole( 'menu', { name: 'List' } ).getByRole( 'menuitem' )
		).toHaveText( [ 'Paragraph', 'Heading', 'Quote', 'Columns', 'Group' ] );
	} );

	test( 'Should show the expected block transforms on the list block when the quote block is removed', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		// Remove the quote block from the list of registered blocks.
		await page.waitForFunction( () => {
			try {
				window.wp.blocks.unregisterBlockType( 'core/quote' );
				return true;
			} catch {
				return false;
			}
		} );

		// Insert a list block.
		await editor.canvas
			.getByRole( 'button', { name: 'Add default block' } )
			.click();
		await page.keyboard.type( '- List content' );
		await page.keyboard.press( 'ArrowUp' );
		await pageUtils.pressKeys( 'alt+F10' );

		const blockSwitcher = page
			.getByRole( 'toolbar', { name: 'Block tools' } )
			.getByRole( 'button', { name: 'List' } );

		// Verify the block switcher exists.
		await expect( blockSwitcher ).toHaveAttribute(
			'aria-haspopup',
			'true'
		);

		// Verify the correct block transforms appear.
		await blockSwitcher.click();
		await expect(
			page.getByRole( 'menu', { name: 'List' } ).getByRole( 'menuitem' )
		).toHaveText( [ 'Paragraph', 'Heading', 'Columns', 'Group' ] );
	} );

	test( 'Should not show the block switcher if the block has no styles and cannot be removed', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		// Insert a list block.
		await editor.canvas
			.getByRole( 'button', { name: 'Add default block' } )
			.click();
		await page.keyboard.type( '1' );
		await pageUtils.pressKeys( 'alt+F10' );
		const button = page
			.getByRole( 'toolbar', { name: 'Block tools' } )
			.getByRole( 'button', { name: 'Paragraph' } );
		await expect( button ).toBeEnabled();

		await editor.clickBlockOptionsMenuItem( 'Lock' );
		await page.click( 'role=checkbox[name="Prevent removal"]' );
		await page.click( 'role=button[name="Apply"]' );

		// Verify the block switcher isn't enabled.
		await expect( button ).toBeDisabled();
	} );

	test( 'Should show a message if there are no transforms or styles available', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		// Insert a list block.
		await editor.canvas
			.getByRole( 'button', { name: 'Add default block' } )
			.click();
		await page.keyboard.type( '- List content' );
		await pageUtils.pressKeys( 'alt+F10' );

		await page
			.getByRole( 'toolbar', { name: 'Block tools' } )
			.getByRole( 'button', { name: 'List item' } )
			.click();
		await expect( page.getByText( 'No transforms.' ) ).toBeVisible();
	} );

	test( 'Should show Columns block only if selected blocks are between limits (1-6)', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.canvas
			.getByRole( 'button', { name: 'Add default block' } )
			.click();
		await page.keyboard.type( '- List content' );
		await page.keyboard.press( 'ArrowUp' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '## I am a header' );
		// `Shift+ArrowUp` extends the text selection into a multi-block
		// selection asynchronously; clicking the toolbar's "Multiple
		// blocks selected" button immediately afterward can race that
		// state update and time out waiting for the button to appear.
		// Use the same `primary+a` (select all) double-press the
		// neighboring "Should NOT show..." test below already relies
		// on for a multi-block selection instead — it reliably reaches
		// the same state. A small delay between the two presses avoids
		// the identical `pressKeys()` race already fixed for that
		// neighboring test.
		await pageUtils.pressKeys( 'primary+a', { times: 2, delay: 50 } );

		await page
			.getByRole( 'toolbar', { name: 'Block tools' } )
			.getByRole( 'button', { name: 'Multiple blocks selected' } )
			.click();

		await expect(
			page
				.getByRole( 'menu', { name: 'Multiple blocks selected' } )
				.getByRole( 'menuitem', { name: 'Columns' } )
		).toBeVisible();
	} );

	test( 'Should NOT show Columns transform only if selected blocks are more than max limit(6)', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.canvas
			.getByRole( 'button', { name: 'Add default block' } )
			.click();
		await page.keyboard.type( '- List content' );
		await page.keyboard.press( 'ArrowUp' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '## I am a header' );
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
		// `pressKeys()` only waits between repeated presses when an
		// explicit `delay` is passed; without it, the two `primary+a`
		// presses fire back-to-back and can race the block editor's
		// `useSelectAll` handler (which relies on the browser having
		// already applied the first press's "select all text in this
		// block" selection before the second press arrives to expand it
		// to a multi-block selection). Pass a small delay so the second
		// press reliably observes the first one's effect.
		await pageUtils.pressKeys( 'primary+a', { times: 2, delay: 50 } );

		await page
			.getByRole( 'toolbar', { name: 'Block tools' } )
			.getByRole( 'button', { name: 'Multiple blocks selected' } )
			.click();

		await expect(
			page
				.getByRole( 'menu', { name: 'Multiple blocks selected' } )
				.getByRole( 'menuitem', { name: 'Columns' } )
		).toBeHidden();
	} );

	test( 'should be able to transform to block variations', async ( {
		editor,
		page,
	} ) => {
		// This is the `stack` Group variation.
		await editor.insertBlock( {
			name: 'core/group',
			attributes: {
				layout: {
					type: 'flex',
					orientation: 'vertical',
				},
			},
			innerBlocks: [
				{
					name: 'core/paragraph',
					attributes: { content: '1' },
				},
			],
		} );
		// Transform to `Stack` variation.
		await editor.clickBlockToolbarButton( 'Stack' );
		const variations = page
			.getByRole( 'menu', { name: 'Stack' } )
			.getByRole( 'group' );
		await expect(
			variations.getByRole( 'menuitem', { name: 'Stack' } )
		).toBeHidden();
		await variations.getByRole( 'menuitem', { name: 'Row' } ).click();
		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/group',
				attributes: expect.objectContaining( {
					layout: {
						type: 'flex',
						flexWrap: 'nowrap',
						orientation: undefined,
					},
				} ),
				innerBlocks: [
					{
						name: 'core/paragraph',
						attributes: { content: '1' },
					},
				],
			},
		] );
		await editor.clickBlockToolbarButton( 'Row' );
		await expect(
			page.locator( 'role=menuitem[name="Stack"i]' )
		).toBeVisible();
	} );
} );
