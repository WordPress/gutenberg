/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

/** @typedef {import('@playwright/test').Page} Page */
/** @typedef {import('@wordpress/e2e-test-utils-playwright').Editor} Editor */

/**
 * Some tests in this file use the character `|` to represent the caret's position
 * in a more readable format.
 */
test.describe( 'Multi-block selection', () => {
	test.use( {
		multiBlockSelectionUtils: async ( { page, editor }, use ) => {
			await use( new MultiBlockSelectionUtils( { page, editor } ) );
		},
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'should select with double ctrl+a and speak', async ( {
		page,
		editor,
		pageUtils,
		multiBlockSelectionUtils,
	} ) => {
		for ( let i = 1; i <= 3; i += 1 ) {
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: { content: `${ i }` },
			} );
		}

		// Multiselect via keyboard.
		await pageUtils.pressKeys( 'primary+a' );
		await pageUtils.pressKeys( 'primary+a' );

		await expect
			.poll( multiBlockSelectionUtils.getSelectedFlatIndices )
			.toEqual( [ 1, 2, 3 ] );

		await expect( page.locator( '[aria-live="assertive"]' ) ).toHaveText(
			'3 blocks selected.'
		);
	} );

	// See #14448: an incorrect buffer may trigger multi-selection too soon.
	test( 'should only trigger multi-selection when at the end', async ( {
		page,
		editor,
		pageUtils,
	} ) => {
		// Create a paragraph with four lines.
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: '1.<br>2.<br>3.<br>4.' },
		} );
		// Create a second block and focus it.
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: '' },
		} );
		await editor.canvas
			.getByRole( 'document', { name: 'Empty block' } )
			.click();
		// Move to the middle of the first line.
		await pageUtils.pressKeys( 'ArrowUp', { times: 4 } );
		await page.keyboard.press( 'ArrowRight' );
		// Select mid line one to mid line four.
		await pageUtils.pressKeys( 'Shift+ArrowDown', { times: 3 } );
		// Delete the text to see if the selection was correct.
		await page.keyboard.press( 'Backspace' );

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{ name: 'core/paragraph', attributes: { content: '1.' } },
			{ name: 'core/paragraph', attributes: { content: '' } },
		] );
	} );

	test( 'should use selection direction to determine vertical edge', async ( {
		page,
		editor,
	} ) => {
		await editor.canvas
			.getByRole( 'button', { name: 'Add default block' } )
			.click();
		await page.keyboard.type( '1' );
		await page.keyboard.press( 'Shift+Enter' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '3' );
		await page.keyboard.press( 'ArrowUp' );
		await page.keyboard.type( '2' );

		await page.keyboard.press( 'Shift+ArrowUp' );
		await page.keyboard.press( 'Shift+ArrowDown' );

		// Should type at the end of the paragraph.
		await page.keyboard.type( '|' );

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{ name: 'core/paragraph', attributes: { content: '1<br>2|' } },
			{ name: 'core/paragraph', attributes: { content: '3' } },
		] );
	} );

	test( 'should always expand single line selection', async ( {
		page,
		editor,
		multiBlockSelectionUtils,
	} ) => {
		await editor.canvas
			.getByRole( 'button', { name: 'Add default block' } )
			.click();
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '12' );
		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.press( 'Shift+ArrowLeft' );
		await page.keyboard.press( 'Shift+ArrowUp' );
		await expect( multiBlockSelectionUtils.assertNativeSelection ).toPass();

		await page.keyboard.press( 'Backspace' );
		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: { content: '2' },
			},
		] );
	} );

	test( 'should allow selecting outer edge if there is no sibling block', async ( {
		page,
		editor,
	} ) => {
		await editor.canvas
			.getByRole( 'button', { name: 'Add default block' } )
			.click();
		await page.keyboard.type( '1' );
		await page.keyboard.press( 'Shift+ArrowUp' );
		// This should replace the content.
		await page.keyboard.type( '2' );

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: { content: '2' },
			},
		] );
	} );

	test( 'should select and deselect with shift and arrow keys', async ( {
		page,
		editor,
		multiBlockSelectionUtils,
	} ) => {
		for ( let i = 1; i <= 5; i += 1 ) {
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: { content: `${ i }` },
			} );
		}
		await editor.canvas
			.getByRole( 'document', { name: 'Paragraph block' } )
			.filter( { hasText: '3' } )
			.click();

		await page.keyboard.press( 'Shift+ArrowDown' );
		await expect( multiBlockSelectionUtils.assertNativeSelection ).toPass();
		await expect
			.poll( multiBlockSelectionUtils.getSelectedFlatIndices )
			.toEqual( [ 3, 4 ] );

		await page.keyboard.press( 'Shift+ArrowDown' );
		await expect( multiBlockSelectionUtils.assertNativeSelection ).toPass();
		await expect
			.poll( multiBlockSelectionUtils.getSelectedFlatIndices )
			.toEqual( [ 3, 4, 5 ] );

		await page.keyboard.press( 'Shift+ArrowUp' );
		await expect( multiBlockSelectionUtils.assertNativeSelection ).toPass();
		await expect
			.poll( multiBlockSelectionUtils.getSelectedFlatIndices )
			.toEqual( [ 3, 4 ] );

		await page.keyboard.press( 'Shift+ArrowUp' );
		await expect( multiBlockSelectionUtils.assertNativeSelection ).toPass();
		await expect
			.poll( multiBlockSelectionUtils.getSelectedFlatIndices )
			.toEqual( [ 3 ] );

		await page.keyboard.press( 'Shift+ArrowUp' );
		await expect( multiBlockSelectionUtils.assertNativeSelection ).toPass();
		await expect
			.poll( multiBlockSelectionUtils.getSelectedFlatIndices )
			.toEqual( [ 2, 3 ] );

		await page.keyboard.press( 'Shift+ArrowUp' );
		await expect( multiBlockSelectionUtils.assertNativeSelection ).toPass();
		await expect
			.poll( multiBlockSelectionUtils.getSelectedFlatIndices )
			.toEqual( [ 1, 2, 3 ] );

		await page.keyboard.press( 'Shift+ArrowDown' );
		await expect( multiBlockSelectionUtils.assertNativeSelection ).toPass();
		await expect
			.poll( multiBlockSelectionUtils.getSelectedFlatIndices )
			.toEqual( [ 2, 3 ] );

		await page.keyboard.press( 'Shift+ArrowDown' );
		await expect( multiBlockSelectionUtils.assertNativeSelection ).toPass();
		await expect
			.poll( multiBlockSelectionUtils.getSelectedFlatIndices )
			.toEqual( [ 3 ] );
	} );

	test( 'should deselect with Escape', async ( {
		page,
		editor,
		pageUtils,
		multiBlockSelectionUtils,
	} ) => {
		for ( let i = 1; i <= 2; i += 1 ) {
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: { content: `${ i }` },
			} );
		}
		await pageUtils.pressKeys( 'primary+a' );
		await pageUtils.pressKeys( 'primary+a' );

		await expect
			.poll( multiBlockSelectionUtils.getSelectedFlatIndices )
			.toEqual( [ 1, 2 ] );

		await page.keyboard.press( 'Escape' );

		// FIXME: This doesn't seem to work anymore.
		// await expect
		// 	.poll( multiBlockSelectionUtils.getSelectedFlatIndices )
		// 	.toEqual( [] );
	} );

	test( 'should select with shift + click', async ( {
		page,
		editor,
		multiBlockSelectionUtils,
	} ) => {
		// To do: run with iframe.
		await page.evaluate( () => {
			window.wp.blocks.registerBlockType( 'test/v2', {
				apiVersion: '2',
				title: 'test',
			} );
		} );
		await editor.canvas
			.getByRole( 'button', { name: 'Add default block' } )
			.click();
		await page.keyboard.type( '1' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '2' );

		await editor.canvas
			.getByRole( 'document', { name: 'Paragraph block' } )
			.filter( { hasText: '1' } )
			.click( { modifiers: [ 'Shift' ] } );

		await expect( multiBlockSelectionUtils.assertNativeSelection ).toPass();
		await expect
			.poll( multiBlockSelectionUtils.getSelectedFlatIndices )
			.toEqual( [ 1, 2 ] );

		// Group the blocks and test that multiselection also works for nested
		// blocks. Checks for regressions of
		// https://github.com/WordPress/gutenberg/issues/32056
		await page
			.getByRole( 'toolbar', { name: 'Block tools' } )
			.getByRole( 'button', { name: 'Group' } )
			.click();
		await editor.canvas
			.getByRole( 'document', { name: 'Paragraph block' } )
			.filter( { hasText: '1' } )
			.click();
		await editor.canvas
			.getByRole( 'document', { name: 'Paragraph block' } )
			.filter( { hasText: '2' } )
			.click( { modifiers: [ 'Shift' ] } );

		await expect( multiBlockSelectionUtils.assertNativeSelection ).toPass();
		await expect
			.poll( multiBlockSelectionUtils.getSelectedFlatIndices )
			.toEqual( [ 2, 3 ] );
	} );

	// @see https://github.com/WordPress/gutenberg/issues/34118
	test( 'should properly select a single block even if `shift` was held for the selection', async ( {
		page,
		editor,
		pageUtils,
	} ) => {
		// To do: run with iframe.
		await page.evaluate( () => {
			window.wp.blocks.registerBlockType( 'test/v2', {
				apiVersion: '2',
				title: 'test',
			} );
		} );
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'test' },
		} );

		await page.getByRole( 'button', { name: 'Save draft' } ).click();
		await expect(
			page
				.getByRole( 'button', { name: 'Dismiss this notice' } )
				.filter( { hasText: 'Draft saved' } )
		).toBeVisible();
		await page.reload();
		// To do: run with iframe.
		await page.evaluate( () => {
			window.wp.blocks.registerBlockType( 'test/v2', {
				apiVersion: '2',
				title: 'test',
			} );
		} );

		await editor.canvas
			.getByRole( 'document', { name: 'Paragraph block' } )
			.click( { modifiers: [ 'Shift' ] } );
		await pageUtils.pressKeys( 'primary+a' );
		await page.keyboard.type( 'new content' );

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: { content: 'new content' },
			},
		] );
	} );

	test( 'should properly select multiple blocks if selected nested blocks belong to different parent', async ( {
		editor,
		multiBlockSelectionUtils,
	} ) => {
		await editor.insertBlock( {
			name: 'core/group',
			innerBlocks: [
				{ name: 'core/paragraph', attributes: { content: 'first' } },
				{ name: 'core/paragraph', attributes: { content: 'group' } },
			],
		} );
		await editor.insertBlock( {
			name: 'core/group',
			innerBlocks: [
				{ name: 'core/paragraph', attributes: { content: 'second' } },
				{ name: 'core/paragraph', attributes: { content: 'group' } },
			],
		} );

		await editor.canvas
			.getByRole( 'document', { name: 'Paragraph block' } )
			.filter( { hasText: 'group' } )
			.nth( 1 )
			.click();
		await editor.canvas
			.getByRole( 'document', { name: 'Paragraph block' } )
			.filter( { hasText: 'first' } )
			.click( { modifiers: [ 'Shift' ] } );

		await expect
			.poll( multiBlockSelectionUtils.getSelectedFlatIndices )
			.toEqual( [ 1, 4 ] );
	} );

	test( 'should properly select part of nested rich text block while holding shift', async ( {
		page,
		editor,
	} ) => {
		await editor.insertBlock( {
			name: 'core/group',
			innerBlocks: [
				{
					name: 'core/paragraph',
					attributes: { content: 'rich text in group' },
				},
			],
		} );

		const paragraphBlock = editor.canvas.getByRole( 'document', {
			name: 'Paragraph block',
		} );
		const { height } = await paragraphBlock.boundingBox();
		await paragraphBlock.click( { position: { x: 0, y: height / 2 } } );
		await paragraphBlock.click( {
			position: { x: 20, y: height / 2 },
			modifiers: [ 'Shift' ],
		} );
		await page.keyboard.type( 'hi' );

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/group',
				innerBlocks: [
					{
						name: 'core/paragraph',
						attributes: { content: 'hih text in group' },
					},
				],
			},
		] );
	} );

	test( 'should select by dragging', async ( {
		page,
		editor,
		multiBlockSelectionUtils,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: '1' },
		} );
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: '2' },
		} );
		// To hide the block tool bar.
		await page.keyboard.press( 'ArrowDown' );

		const [ paragraph1, paragraph2 ] = await editor.canvas
			.getByRole( 'document', { name: 'Paragraph block' } )
			.all();

		await paragraph1.hover();
		await page.mouse.down();
		await paragraph2.hover();
		await page.mouse.up();

		await expect( multiBlockSelectionUtils.assertNativeSelection ).toPass();
		await expect
			.poll( multiBlockSelectionUtils.getSelectedFlatIndices )
			.toEqual( [ 1, 2 ] );
	} );

	test( 'should select by dragging into nested block', async ( {
		page,
		editor,
		multiBlockSelectionUtils,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: '1' },
		} );
		await editor.insertBlock( {
			name: 'core/group',
			innerBlocks: [
				{
					name: 'core/paragraph',
					attributes: { content: '2' },
				},
			],
		} );
		// To hide the block tool bar.
		await page.keyboard.press( 'ArrowDown' );
		await page.keyboard.press( 'ArrowDown' );

		const [ paragraph1, paragraph2 ] = await editor.canvas
			.getByRole( 'document', { name: 'Paragraph block' } )
			.all();

		await paragraph1.hover();
		await page.mouse.down();
		await paragraph2.hover();
		await page.mouse.up();

		await expect
			.poll( multiBlockSelectionUtils.getSelectedFlatIndices )
			.toEqual( [ 1, 2 ] );
	} );

	test( 'should cut and paste', async ( { editor, pageUtils } ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: '1' },
		} );
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: '2' },
		} );

		await pageUtils.pressKeys( 'primary+a' );
		await pageUtils.pressKeys( 'primary+a' );
		await pageUtils.pressKeys( 'primary+x' );

		await expect.poll( editor.getBlocks ).toEqual( [] );

		await pageUtils.pressKeys( 'primary+v' );

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{ name: 'core/paragraph', attributes: { content: '1' } },
			{ name: 'core/paragraph', attributes: { content: '2' } },
		] );
	} );

	test( 'should copy and paste', async ( { page, editor, pageUtils } ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'first paragraph' },
		} );
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'second paragraph' },
		} );

		await pageUtils.pressKeys( 'primary+a' );
		await pageUtils.pressKeys( 'primary+a' );
		await pageUtils.pressKeys( 'primary+c' );

		await page.keyboard.press( 'Backspace' );
		await expect
			.poll( editor.getBlocks, 'should select all blocks after copying' )
			.toEqual( [] );

		await pageUtils.pressKeys( 'primary+v' );
		await expect
			.poll( editor.getBlocks, 'should copy and paste multiple blocks' )
			.toMatchObject( [
				{ attributes: { content: 'first paragraph' } },
				{ attributes: { content: 'second paragraph' } },
			] );

		await page.keyboard.type( '|' );
		await expect
			.poll(
				editor.getBlocks,
				'should place the caret at the end of last pasted paragraph'
			)
			.toMatchObject( [
				{ attributes: { content: 'first paragraph' } },
				{ attributes: { content: 'second paragraph|' } },
			] );

		await pageUtils.pressKeys( 'primary+a' );
		await pageUtils.pressKeys( 'primary+a' );
		await pageUtils.pressKeys( 'primary+v' );
		await page.keyboard.type( '|' );
		await expect
			.poll( editor.getBlocks, 'should replace blocks' )
			.toMatchObject( [
				{ attributes: { content: 'first paragraph' } },
				{ attributes: { content: 'second paragraph|' } },
			] );
		await page.keyboard.press( 'Backspace' );

		await pageUtils.pressKeys( 'ArrowLeft', { times: 3 } );
		await pageUtils.pressKeys( 'primary+v' );
		await page.keyboard.type( '|' );
		await expect
			.poll( editor.getBlocks, 'should paste mid-block' )
			.toMatchObject( [
				{ attributes: { content: 'first paragraph' } },
				{ attributes: { content: 'second paragr' } },
				{ attributes: { content: 'first paragraph' } },
				{ attributes: { content: 'second paragraph|' } },
				{ attributes: { content: 'aph' } },
			] );
	} );

	test( 'should return original focus after failed multi selection attempt', async ( {
		page,
		editor,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: '1' },
		} );
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: '2' },
		} );

		const [ paragraph1, paragraph2 ] = await editor.canvas
			.getByRole( 'document', { name: 'Paragraph block' } )
			.all();
		const { height } = await paragraph2.boundingBox();

		// Move caret to the start of the second block.
		await paragraph2.click( { position: { x: 0, y: height / 2 } } );
		await page.mouse.down();
		await paragraph1.hover( {
			position: { x: -5, y: height / 2 },
			// Use force since it's outside the bounding box of the element.
			force: true,
		} );
		await page.mouse.up();

		// Only "1" should be deleted.
		await page.keyboard.press( 'Backspace' );

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: { content: '2' },
			},
		] );
	} );

	test( 'should preserve dragged selection on move', async ( {
		page,
		editor,
		multiBlockSelectionUtils,
	} ) => {
		for ( let i = 1; i <= 3; i += 1 ) {
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: { content: `${ i }` },
			} );
		}

		const [ , paragraph2, paragraph3 ] = await editor.canvas
			.getByRole( 'document', { name: 'Paragraph block' } )
			.all();

		// Focus the last paragraph block and hide the block toolbar.
		await paragraph3.click();
		await page.keyboard.press( 'ArrowRight' );

		await paragraph3.hover();
		await page.mouse.down();
		await paragraph2.hover();
		await page.mouse.up();

		await expect( multiBlockSelectionUtils.assertNativeSelection ).toPass();
		await expect
			.poll( multiBlockSelectionUtils.getSelectedFlatIndices )
			.toEqual( [ 2, 3 ] );

		await editor.showBlockToolbar();
		await page
			.getByRole( 'toolbar', { name: 'Block tools' } )
			.getByRole( 'button', { name: 'Move up' } )
			.click();

		await expect( multiBlockSelectionUtils.assertNativeSelection ).toPass();
		await expect
			.poll( multiBlockSelectionUtils.getSelectedFlatIndices )
			.toEqual( [ 1, 2 ] );

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{ name: 'core/paragraph', attributes: { content: '2' } },
			{ name: 'core/paragraph', attributes: { content: '3' } },
			{ name: 'core/paragraph', attributes: { content: '1' } },
		] );
	} );

	test( 'should clear selection when clicking next to blocks', async ( {
		page,
		editor,
		multiBlockSelectionUtils,
	} ) => {
		await editor.canvas
			.getByRole( 'button', {
				name: 'Add default block',
			} )
			.click();
		await page.keyboard.type( '1' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '2' );
		await page.keyboard.press( 'Shift+ArrowUp' );
		await expect( multiBlockSelectionUtils.assertNativeSelection ).toPass();
		await expect
			.poll( multiBlockSelectionUtils.getSelectedFlatIndices )
			.toEqual( [ 1, 2 ] );

		const paragraph1 = editor.canvas
			.getByRole( 'document', {
				name: 'Paragraph block',
			} )
			.filter( { hasText: '1' } );
		await paragraph1.click( {
			position: { x: -1, y: 0 },
			// Use force since it's outside the bounding box of the element.
			force: true,
		} );

		await expect
			.poll( () =>
				page.evaluate( () => window.getSelection().rangeCount )
			)
			.toBe( 0 );
		await expect
			.poll( multiBlockSelectionUtils.getSelectedFlatIndices )
			.toEqual( [] );

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{ name: 'core/paragraph', attributes: { content: '1' } },
			{ name: 'core/paragraph', attributes: { content: '2' } },
		] );
	} );

	test( 'should set attributes for multiple paragraphs', async ( {
		page,
		editor,
		pageUtils,
	} ) => {
		for ( let i = 1; i <= 2; i += 1 ) {
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: { content: `${ i }` },
			} );
		}
		await pageUtils.pressKeys( 'primary+a' );
		await pageUtils.pressKeys( 'primary+a' );

		await page
			.getByRole( 'toolbar', { name: 'Block tools' } )
			.getByRole( 'button', { name: 'Align text' } )
			.click();
		await page
			.getByRole( 'menu', { name: 'Align text' } )
			.getByRole( 'menuitemradio', { name: 'Align text center' } )
			.click();

		await expect
			.poll( editor.getBlocks )
			.toMatchObject( [
				{ attributes: { align: 'center', content: '1' } },
				{ attributes: { align: 'center', content: '2' } },
			] );
	} );

	// Previously we would unexpectedly duplicate the block on Enter.
	test( 'should not multi select single block', async ( {
		page,
		editor,
		pageUtils,
	} ) => {
		await editor.canvas
			.getByRole( 'button', { name: 'Add default block' } )
			.click();
		await page.keyboard.type( '1' );

		await pageUtils.pressKeys( 'primary+a' );
		await pageUtils.pressKeys( 'primary+a' );
		await page.keyboard.press( 'Enter' );

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{ name: 'core/paragraph', attributes: { content: '' } },
			{ name: 'core/paragraph', attributes: { content: '' } },
		] );
	} );

	test( 'should gradually multi-select', async ( {
		page,
		editor,
		pageUtils,
		multiBlockSelectionUtils,
	} ) => {
		await editor.insertBlock( {
			name: 'core/columns',
			innerBlocks: [
				{
					name: 'core/column',
					innerBlocks: [
						{
							name: 'core/paragraph',
							attributes: { content: '1' },
						},
						{
							name: 'core/paragraph',
							attributes: { content: '2' },
						},
					],
				},
				{ name: 'core/column' },
			],
		} );
		// Focus the last paragraph block.
		await editor.canvas
			.getByRole( 'document', { name: 'Paragraph block' } )
			.nth( 1 )
			.click();

		await pageUtils.pressKeys( 'primary+a' );
		await pageUtils.pressKeys( 'primary+a' );

		await expect
			.poll( multiBlockSelectionUtils.getSelectedBlocks )
			.toMatchObject( [
				{ name: 'core/paragraph' },
				{ name: 'core/paragraph' },
			] );

		await pageUtils.pressKeys( 'primary+a' );

		await expect
			.poll( multiBlockSelectionUtils.getSelectedBlocks )
			.toMatchObject( [ { name: 'core/column' } ] );

		await pageUtils.pressKeys( 'primary+a' );

		await expect
			.poll( multiBlockSelectionUtils.getSelectedBlocks )
			.toMatchObject( [
				{ name: 'core/column' },
				{ name: 'core/column' },
			] );

		await page.keyboard.press( 'Backspace' );

		// Expect both columns to be deleted.
		await expect
			.poll( editor.getBlocks )
			.toMatchObject( [ { name: 'core/columns', innerBlocks: [] } ] );
	} );

	test( 'should multi-select from within the list block', async ( {
		editor,
		pageUtils,
		multiBlockSelectionUtils,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: '1' },
		} );
		await editor.insertBlock( {
			name: 'core/list',
			innerBlocks: [
				{
					name: 'core/list-item',
					attributes: { content: '1' },
				},
			],
		} );
		// Focus on the list item.
		await editor.canvas
			.getByRole( 'document', { name: 'Block: List item' } )
			.getByRole( 'textbox' )
			.click();

		await pageUtils.pressKeys( 'primary+a' );
		await expect
			.poll( multiBlockSelectionUtils.getSelectedBlocks )
			.toMatchObject( [ { name: 'core/list-item' } ] );

		await pageUtils.pressKeys( 'primary+a' );
		await expect
			.poll( multiBlockSelectionUtils.getSelectedBlocks )
			.toMatchObject( [ { name: 'core/list' } ] );

		await pageUtils.pressKeys( 'primary+a' );
		await expect
			.poll( multiBlockSelectionUtils.getSelectedBlocks )
			.toMatchObject( [
				{ name: 'core/paragraph' },
				{ name: 'core/list' },
			] );
	} );

	test( 'should select all from empty selection', async ( {
		page,
		editor,
		pageUtils,
		multiBlockSelectionUtils,
	} ) => {
		for ( let i = 1; i <= 2; i += 1 ) {
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: { content: `${ i }` },
			} );
		}

		// Clear the selected block.
		await page.keyboard.press( 'Escape' );
		await page.keyboard.press( 'Escape' );

		await expect
			.poll( multiBlockSelectionUtils.getSelectedBlocks )
			.toEqual( [] );

		await pageUtils.pressKeys( 'primary+a' );

		await page.keyboard.press( 'Backspace' );

		// Expect both paragraphs to be deleted.
		await expect.poll( editor.getBlocks ).toEqual( [] );
	} );

	test( 'should select title if the cursor is on title', async ( {
		editor,
		pageUtils,
		multiBlockSelectionUtils,
	} ) => {
		for ( let i = 1; i <= 2; i += 1 ) {
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: { content: `${ i }` },
			} );
		}

		await editor.canvas
			.getByRole( 'textbox', { name: 'Add title' } )
			.type( 'Post title' );

		await pageUtils.pressKeys( 'primary+a' );

		await expect
			.poll( multiBlockSelectionUtils.getSelectedBlocks )
			.toEqual( [] );
		await expect
			.poll( () =>
				editor.canvas.evaluate( () => window.getSelection().toString() )
			)
			.toBe( 'Post title' );
	} );

	test( 'should multi-select in the ListView component with shift + click', async ( {
		page,
		editor,
		multiBlockSelectionUtils,
		pageUtils,
	} ) => {
		for ( let i = 1; i <= 4; i += 1 ) {
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: { content: `${ i }` },
			} );
		}

		await page
			.getByRole( 'toolbar', { name: 'Document tools' } )
			.getByRole( 'button', { name: 'Document Overview' } )
			.click();

		const listView = page.getByRole( 'treegrid', {
			name: 'Block navigation structure',
		} );
		const navButtons = listView.getByRole( 'link', {
			name: 'Paragraph',
		} );

		await navButtons.nth( 1 ).click();
		await expect
			.poll(
				multiBlockSelectionUtils.getSelectedFlatIndices,
				'Clicking on the second list item should result in the second block being selected.'
			)
			.toEqual( [ 2 ] );

		await navButtons.nth( 3 ).click( { modifiers: [ 'Shift' ] } );
		await expect
			.poll(
				multiBlockSelectionUtils.getSelectedFlatIndices,
				'Shift clicking the fourth list item should result in blocks 2 through 4 being selected.'
			)
			.toEqual( [ 2, 3, 4 ] );

		await navButtons.nth( 0 ).click( { modifiers: [ 'Shift' ] } );
		await expect
			.poll(
				multiBlockSelectionUtils.getSelectedFlatIndices,
				'With the shift key still held down, clicking the first block should result in the first two blocks being selected.'
			)
			.toEqual( [ 1, 2 ] );

		await navButtons.nth( 3 ).click();
		await expect
			.poll(
				multiBlockSelectionUtils.getSelectedFlatIndices,
				'With the shift key up, clicking the fourth block should result in only that block being selected.'
			)
			.toEqual( [ 4 ] );

		// Move focus to the list view link to prepare for the keyboard navigation.
		await navButtons.nth( 3 ).click();
		await expect( navButtons.nth( 3 ) ).toBeFocused();
		// Press Up twice to highlight the second block.
		await pageUtils.pressKeys( 'ArrowUp', { times: 2 } );

		await page.keyboard.press( 'Shift+ArrowDown' );
		await expect
			.poll(
				multiBlockSelectionUtils.getSelectedFlatIndices,
				'Shift + press Down to select the 2nd and 3rd blocks.'
			)
			.toEqual( [ 2, 3 ] );

		await page.keyboard.press( 'Shift+ArrowDown' );
		await expect
			.poll(
				multiBlockSelectionUtils.getSelectedFlatIndices,
				'Press Down once more to also select the 4th block.'
			)
			.toEqual( [ 2, 3, 4 ] );

		await pageUtils.pressKeys( 'Shift+ArrowUp', { times: 3 } );
		await expect
			.poll(
				multiBlockSelectionUtils.getSelectedFlatIndices,
				'Press Up three times to adjust the selection to only include the first two blocks.'
			)
			.toEqual( [ 1, 2 ] );

		// Navigate to the bottom of the list of blocks.
		await pageUtils.pressKeys( 'ArrowDown', { times: 3 } );

		// This tests that shift selecting blocks by keyboard that are not adjacent
		// to an existing selection resets the selection.
		await page.keyboard.press( 'Shift+ArrowUp' );
		await expect
			.poll(
				multiBlockSelectionUtils.getSelectedFlatIndices,
				'Shift + press UP to select the 3rd and 4th blocks.'
			)
			.toEqual( [ 3, 4 ] );
	} );

	test( 'should forward delete across blocks', async ( {
		page,
		editor,
		pageUtils,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: '1[' },
		} );
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: '.' },
		} );
		await editor.insertBlock( {
			name: 'core/heading',
			attributes: { level: 2, content: ']2' },
		} );
		// Focus the heading block.
		await editor.canvas
			.getByRole( 'document', { name: 'Block: Heading' } )
			.click();

		await page.keyboard.press( 'ArrowLeft' );
		// Select everything between [].
		await pageUtils.pressKeys( 'Shift+ArrowLeft', { times: 5 } );

		await page.keyboard.press( 'Delete' );

		// Ensure selection is in the correct place.
		await page.keyboard.type( '|' );
		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/heading',
				attributes: { level: 2, content: '1|2' },
			},
		] );
	} );

	test( 'should write over selection', async ( {
		page,
		editor,
		pageUtils,
	} ) => {
		await editor.canvas
			.getByRole( 'button', { name: 'Add default block' } )
			.click();
		await page.keyboard.type( '1[' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( ']2' );
		await page.keyboard.press( 'ArrowLeft' );
		// Select everything between [].
		await pageUtils.pressKeys( 'Shift+ArrowLeft', { times: 3 } );

		// Ensure selection is in the correct place.
		await page.keyboard.type( '|' );
		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: { content: '1|2' },
			},
		] );
	} );

	test( 'should handle Enter across blocks', async ( {
		page,
		editor,
		pageUtils,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: '1[' },
		} );
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: '.' },
		} );
		await editor.insertBlock( {
			name: 'core/heading',
			attributes: { level: 2, content: ']2' },
		} );
		// Focus the heading block.
		await editor.canvas
			.getByRole( 'document', { name: 'Block: Heading' } )
			.click();
		await page.keyboard.press( 'ArrowLeft' );
		// Select everything between [].
		await pageUtils.pressKeys( 'Shift+ArrowLeft', { times: 5 } );

		await page.keyboard.press( 'Enter' );

		// Ensure selection is in the correct place.
		await page.keyboard.type( '|' );
		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: { content: '1' },
			},
			{
				name: 'core/heading',
				attributes: { level: 2, content: '|2' },
			},
		] );
	} );

	test( 'should select separator (single element block)', async ( {
		page,
		editor,
		pageUtils,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'a' },
		} );
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: '' },
		} );
		await editor.insertBlock( { name: 'core/separator' } );

		// Focus and move the caret to the right of the first paragraph.
		await editor.canvas
			.getByRole( 'document', { name: 'Paragraph block' } )
			.filter( { hasText: 'a' } )
			.click();

		await pageUtils.pressKeys( 'Shift+ArrowDown', { times: 2 } );
		await page.keyboard.press( 'Backspace' );

		// Ensure selection is in the correct place.
		await page.keyboard.type( '|' );
		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: { content: '|' },
			},
		] );
	} );

	test( 'should partially select with shift + click', async ( {
		page,
		editor,
	} ) => {
		// To do: run with iframe.
		await page.evaluate( () => {
			window.wp.blocks.registerBlockType( 'test/v2', {
				apiVersion: '2',
				title: 'test',
			} );
		} );
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: '<strong>1</strong>[' },
		} );
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: ']2' },
		} );
		// Focus and move the caret to the end.
		await editor.canvas
			.getByRole( 'document', { name: 'Paragraph block' } )
			.filter( { hasText: ']2' } )
			.click();

		await page.keyboard.press( 'ArrowLeft' );
		const strongText = editor.canvas
			.getByRole( 'region', { name: 'Editor content' } )
			.getByText( '1', { exact: true } );
		const strongBox = await strongText.boundingBox();
		await strongText.click( {
			// Ensure clicking on the right half of the element.
			position: { x: strongBox.width, y: strongBox.height / 2 },
			modifiers: [ 'Shift' ],
		} );
		await page.keyboard.press( 'Backspace' );

		// Ensure selection is in the correct place.
		await page.keyboard.type( '|' );
		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: { content: '<strong>1</strong>|2' },
			},
		] );
	} );

	test.describe( 'shift+click multi-selection', () => {
		test( 'should multi-select block with text selection and a block without text selection', async ( {
			page,
			editor,
			multiBlockSelectionUtils,
		} ) => {
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: { content: '' },
			} );
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: { content: 'hi' },
			} );
			await editor.insertBlock( { name: 'core/spacer' } );
			await page.keyboard.press( 'ArrowUp' );

			await editor.canvas
				.getByRole( 'document', { name: 'Block: Spacer' } )
				.click( { modifiers: [ 'Shift' ] } );

			await expect
				.poll( multiBlockSelectionUtils.getSelectedBlocks )
				.toMatchObject( [
					{ name: 'core/paragraph', attributes: { content: 'hi' } },
					{ name: 'core/spacer' },
				] );
		} );

		test( 'should multi-select blocks without text selection', async ( {
			editor,
			multiBlockSelectionUtils,
		} ) => {
			await editor.insertBlock( { name: 'core/spacer' } );
			await editor.insertBlock( { name: 'core/spacer' } );

			const spacerBlocks = editor.canvas.getByRole( 'document', {
				name: 'Block: Spacer',
			} );

			await spacerBlocks.nth( 1 ).click();
			await spacerBlocks.nth( 0 ).click( { modifiers: [ 'Shift' ] } );

			await expect
				.poll( multiBlockSelectionUtils.getSelectedBlocks )
				.toMatchObject( [
					{ name: 'core/spacer' },
					{ name: 'core/spacer' },
				] );
		} );
	} );

	test( 'should select by dragging into separator', async ( {
		page,
		editor,
		multiBlockSelectionUtils,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: '1' },
		} );
		await editor.insertBlock( { name: 'core/separator' } );
		// Hide the block toolbar.
		await page.keyboard.press( 'ArrowUp' );

		await editor.canvas
			.getByRole( 'document', { name: 'Paragraph block' } )
			.hover();
		await page.mouse.down();
		await editor.canvas
			.getByRole( 'document', { name: 'Block: Separator' } )
			.hover();
		await page.mouse.up();

		await expect
			.poll( multiBlockSelectionUtils.getSelectedFlatIndices )
			.toEqual( [ 1, 2 ] );
	} );
} );

class MultiBlockSelectionUtils {
	/** @type {Page} */
	#page;
	/** @type {Editor} */
	#editor;

	constructor( { page, editor } ) {
		this.#page = page;
		this.#editor = editor;
	}

	getSelectedBlocks = async () => {
		return await this.#page.evaluate( () => {
			const {
				hasMultiSelection,
				hasSelectedBlock,
				getMultiSelectedBlocks,
				getSelectedBlock,
			} = window.wp.data.select( 'core/block-editor' );
			if ( hasMultiSelection() ) {
				return getMultiSelectedBlocks();
			} else if ( hasSelectedBlock() ) {
				return [ getSelectedBlock() ];
			}
			return [];
		} );
	};

	getSelectedFlatIndices = async () => {
		return await this.#page.evaluate( () => {
			const { getSelectedBlockClientIds, getClientIdsWithDescendants } =
				window.wp.data.select( 'core/block-editor' );
			const selectedClientIds = getSelectedBlockClientIds();
			const allClientIds = getClientIdsWithDescendants();
			return selectedClientIds.map(
				( clientId ) => allClientIds.indexOf( clientId ) + 1
			);
		} );
	};

	/**
	 * Tests if the native selection matches the block selection.
	 */
	assertNativeSelection = async () => {
		const selection = await this.#editor.canvas.evaluateHandle( () =>
			window.getSelection()
		);

		const { isMultiSelected, selectionStart, selectionEnd } =
			await this.#page.evaluate( () => {
				const {
					hasMultiSelection,
					getSelectionStart,
					getSelectionEnd,
				} = window.wp.data.select( 'core/block-editor' );
				return {
					isMultiSelected: hasMultiSelection(),
					selectionStart: getSelectionStart().clientId,
					selectionEnd: getSelectionEnd().clientId,
				};
			} );
		const startBlock = this.#editor.canvas.locator(
			`[data-block="${ selectionStart }"]`
		);
		const endBlock = this.#editor.canvas.locator(
			`[data-block="${ selectionEnd }"]`
		);

		expect(
			await selection.evaluate( ( _selection ) => _selection.rangeCount ),
			'Expected one range'
		).toBe( 1 );

		const range = await selection.evaluateHandle( ( _selection ) =>
			_selection.getRangeAt( 0 )
		);
		const isCollapsed = await range.evaluate(
			( { collapsed } ) => collapsed
		);

		if ( isMultiSelected ) {
			expect( isCollapsed, 'Expected an uncollapsed selection' ).toBe(
				false
			);

			expect(
				await startBlock.evaluate(
					( block, _selection ) =>
						_selection.containsNode( block, true ),
					selection
				),
				'Expected selection to include in the first selected block'
			).toBe( true );
			expect(
				await endBlock.evaluate(
					( block, _selection ) =>
						_selection.containsNode( block, true ),
					selection
				),
				'Expected selection to include in the last selected block'
			).toBe( true );
		} else {
			expect( isCollapsed, 'Expected a collapsed selection' ).toBe(
				true
			);

			expect(
				await startBlock.evaluate(
					( block, { startContainer, endContainer } ) =>
						block.contains( startContainer ) &&
						block.contains( endContainer ),
					range
				),
				'Expected selection to start and end in the selected block'
			).toBe( true );
		}
	};
}
