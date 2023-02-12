/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'List View', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'allows a user to drag a block to a new sibling position', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		// Insert a couple of blocks of different types.
		await editor.insertBlock( { name: 'core/heading' } );
		await editor.insertBlock( { name: 'core/image' } );
		await editor.insertBlock( { name: 'core/paragraph' } );

		// Open List View.
		await pageUtils.pressKeyWithModifier( 'access', 'o' );
		const listView = page.getByRole( 'treegrid', {
			name: 'Block navigation structure',
		} );

		// The last inserted block should be selected.
		await expect(
			listView.getByRole( 'gridcell', {
				name: 'Paragraph link',
				selected: true,
			} )
		).toBeVisible();

		// Ensure the setup is correct before dragging.
		await expect
			.poll( editor.getBlocks )
			.toMatchObject( [
				{ name: 'core/heading' },
				{ name: 'core/image' },
				{ name: 'core/paragraph' },
			] );

		// Drag the paragraph above the heading.
		const paragraphBlockItem = await listView.getByRole( 'gridcell', {
			name: 'Paragraph link',
		} );
		const headingBlockItem = listView.getByRole( 'gridcell', {
			name: 'Heading link',
		} );
		await paragraphBlockItem.dragTo( headingBlockItem, { x: 0, y: 0 } );

		// Ensure the block was dropped correctly.
		await expect
			.poll( editor.getBlocks )
			.toMatchObject( [
				{ name: 'core/paragraph' },
				{ name: 'core/heading' },
				{ name: 'core/image' },
			] );
	} );

	// Check for regressions of https://github.com/WordPress/gutenberg/issues/38763.
	test( 'shows the correct amount of blocks after a block is removed in the canvas', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		// Insert a couple of blocks of different types.
		await editor.insertBlock( { name: 'core/image' } );
		await editor.insertBlock( { name: 'core/heading' } );
		await editor.insertBlock( { name: 'core/paragraph' } );

		// Open List View.
		await pageUtils.pressKeyWithModifier( 'access', 'o' );
		const listView = page.getByRole( 'treegrid', {
			name: 'Block navigation structure',
		} );

		// The last inserted block should be selected.
		await expect(
			listView.getByRole( 'gridcell', {
				name: 'Paragraph link',
				selected: true,
			} )
		).toBeVisible();

		// Go to the image block in List View.
		await pageUtils.pressKeyTimes( 'ArrowUp', 2 );
		await expect(
			listView
				.getByRole( 'gridcell', {
					name: 'Image link',
				} )
				.getByRole( 'link', { includeHidden: true } )
		).toBeFocused();

		// Select the image block in the canvas.
		await page.keyboard.press( 'Enter' );
		const imageBlock = editor.canvas.getByRole( 'document', {
			name: 'Block: Image',
		} );
		await expect(
			imageBlock.getByRole( 'button', { name: 'Upload' } )
		).toBeFocused();
		await page.keyboard.press( 'ArrowUp' );
		await expect( imageBlock ).toBeFocused();

		// Delete the image block in the canvas.
		await page.keyboard.press( 'Backspace' );

		// List View should have two rows.
		await expect(
			listView.getByRole( 'gridcell', { name: /link/i } )
		).toHaveCount( 2 );
	} );

	// Check for regression of https://github.com/WordPress/gutenberg/issues/39026.
	test( 'selects the previous block after removing the selected one', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		// Insert a couple of blocks of different types.
		await editor.insertBlock( { name: 'core/image' } );
		await editor.insertBlock( { name: 'core/heading' } );
		await editor.insertBlock( { name: 'core/paragraph' } );

		// Open List View.
		await pageUtils.pressKeyWithModifier( 'access', 'o' );
		const listView = page.getByRole( 'treegrid', {
			name: 'Block navigation structure',
		} );

		// The last inserted block should be selected.
		await expect(
			listView.getByRole( 'gridcell', {
				name: 'Paragraph link',
				selected: true,
			} )
		).toBeVisible();

		// Remove the Paragraph block via its options menu in List View.
		await listView
			.getByRole( 'button', { name: 'Options for Paragraph block' } )
			.click();
		await page
			.getByRole( 'menuitem', { name: /Remove Paragraph/i } )
			.click();

		// Heading block should be selected as previous block.
		await expect(
			editor.canvas.getByRole( 'document', {
				name: 'Block: Heading',
			} )
		).toBeFocused();
	} );

	// Check for regression of https://github.com/WordPress/gutenberg/issues/39026.
	test( 'selects the next block after removing the very first block', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		// Insert a couple of blocks of different types.
		await editor.insertBlock( { name: 'core/image' } );
		await editor.insertBlock( { name: 'core/heading' } );
		await editor.insertBlock( { name: 'core/paragraph' } );

		// Open List View.
		await pageUtils.pressKeyWithModifier( 'access', 'o' );
		const listView = page.getByRole( 'treegrid', {
			name: 'Block navigation structure',
		} );

		// The last inserted block should be selected.
		await expect(
			listView.getByRole( 'gridcell', {
				name: 'Paragraph link',
				selected: true,
			} )
		).toBeVisible();

		// Select the image block in List View.
		await pageUtils.pressKeyTimes( 'ArrowUp', 2 );
		await expect(
			listView
				.getByRole( 'gridcell', {
					name: 'Image link',
				} )
				.getByRole( 'link', { includeHidden: true } )
		).toBeFocused();
		await page.keyboard.press( 'Enter' );

		// Remove the Image block via its options menu in List View.
		await listView
			.getByRole( 'button', { name: 'Options for Image block' } )
			.click();
		await page.getByRole( 'menuitem', { name: /Remove Image/i } ).click();

		// Heading block should be selected as previous block.
		await expect(
			editor.canvas.getByRole( 'document', {
				name: 'Block: Heading',
			} )
		).toBeFocused();
	} );

	/**
	 * When all the blocks gets removed from the editor, it inserts a default
	 * paragraph block; make sure that paragraph block gets selected after
	 * removing blocks from ListView.
	 */
	test( 'selects the default paragraph block after removing all blocks', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		// Insert a couple of blocks of different types.
		await editor.insertBlock( { name: 'core/image' } );
		await editor.insertBlock( { name: 'core/heading' } );

		// Open List View.
		await pageUtils.pressKeyWithModifier( 'access', 'o' );
		const listView = page.getByRole( 'treegrid', {
			name: 'Block navigation structure',
		} );

		// The last inserted block should be selected.
		await expect(
			listView.getByRole( 'gridcell', {
				name: 'Heading link',
				selected: true,
			} )
		).toBeVisible();

		// Select the Image block as well.
		await pageUtils.pressKeyWithModifier( 'shift', 'ArrowUp' );
		await expect(
			listView.getByRole( 'gridcell', {
				name: 'Image link',
				selected: true,
			} )
		).toBeVisible();

		// Remove both blocks.
		await listView
			.getByRole( 'button', { name: 'Options for Image block' } )
			.click();
		await page.getByRole( 'menuitem', { name: /Remove blocks/i } ).click();

		// Newly created paragraph block should be selected.
		await expect(
			editor.canvas.getByRole( 'document', { name: /Empty block/i } )
		).toBeFocused();
	} );

	test( 'expands nested list items', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.insertBlock( { name: 'core/cover' } );

		// Click first color option from the block placeholder's color picker to
		// make the inner blocks appear.
		await editor.canvas
			.getByRole( 'document', { name: 'Block: Cover' } )
			.getByRole( 'button', { name: /Color: /i } )
			.first()
			.click();

		// Open List View.
		await pageUtils.pressKeyWithModifier( 'access', 'o' );
		const listView = page.getByRole( 'treegrid', {
			name: 'Block navigation structure',
		} );

		// Things start off expanded.
		await expect(
			listView.getByRole( 'gridcell', {
				name: 'Cover link',
				expanded: true,
			} )
		).toBeVisible();

		// The child paragraph block should be selected.
		await expect(
			listView.getByRole( 'gridcell', {
				name: 'Paragraph link',
				selected: true,
			} )
		).toBeVisible();

		// Collapse the Cover block.
		await listView
			.getByRole( 'gridcell', { name: 'Cover link' } )
			.locator( '.block-editor-list-view__expander[aria-hidden="true"]' )
			// Force the click to bypass the visibility check. The expander is
			// intentionally aria-hidden. See the implementation for details.
			.click( { force: true } );

		// Check that we're collapsed.
		await expect(
			listView.getByRole( 'gridcell', { name: /link/i } )
		).toHaveCount( 1 );

		// Click the Cover block List View item.
		await listView
			.getByRole( 'gridcell', {
				name: 'Cover link',
				expanded: false,
			} )
			.click();

		// Click the Cover block title placeholder.
		await editor.canvas
			.getByRole( 'document', { name: 'Block: Cover' } )
			.getByRole( 'document', { name: /Empty block/i } )
			.click();

		// The child paragraph block in List View should be selected.
		await expect(
			listView.getByRole( 'gridcell', {
				name: 'Paragraph link',
				selected: true,
			} )
		).toBeVisible();
	} );

	test( 'moves focus to start/end of list with Home/End keys', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		// Insert a couple of blocks of different types.
		await editor.insertBlock( { name: 'core/image' } );
		await editor.insertBlock( { name: 'core/heading' } );
		await editor.insertBlock( { name: 'core/paragraph' } );
		await editor.insertBlock( { name: 'core/columns' } );
		await editor.insertBlock( { name: 'core/group' } );

		// Open List View.
		await pageUtils.pressKeyWithModifier( 'access', 'o' );
		const listView = page.getByRole( 'treegrid', {
			name: 'Block navigation structure',
		} );

		// The last inserted block should be selected.
		await expect(
			listView.getByRole( 'gridcell', {
				name: 'Group link',
				selected: true,
			} )
		).toBeVisible();

		// Press Home to go to the first inserted block (image).
		await page.keyboard.press( 'Home' );
		await expect(
			listView
				.getByRole( 'gridcell', {
					name: 'Image link',
				} )
				.getByRole( 'link', { includeHidden: true } )
		).toBeFocused();

		// Press End followed by Arrow Up to go to the second to last block (columns).
		await page.keyboard.press( 'End' );
		await page.keyboard.press( 'ArrowUp' );
		await expect(
			listView
				.getByRole( 'gridcell', {
					name: 'Columns link',
				} )
				.getByRole( 'link', { includeHidden: true } )
		).toBeFocused();

		// Navigate the right column to image block options button via Home key.
		await page.keyboard.press( 'ArrowRight' );
		await page.keyboard.press( 'Home' );
		await expect(
			listView.getByRole( 'button', { name: 'Options for Image block' } )
		).toBeFocused();

		// Navigate the right column to group block options button.
		await page.keyboard.press( 'End' );
		await expect(
			listView.getByRole( 'button', { name: 'Options for Group block' } )
		).toBeFocused();
	} );
} );
