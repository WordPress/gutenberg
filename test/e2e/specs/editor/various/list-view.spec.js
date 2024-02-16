/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'List View', () => {
	test.use( {
		listViewUtils: async ( { page, pageUtils, editor }, use ) => {
			await use( new ListViewUtils( { page, pageUtils, editor } ) );
		},
	} );

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
		await pageUtils.pressKeys( 'access+o' );
		const listView = page.getByRole( 'treegrid', {
			name: 'Block navigation structure',
		} );

		// The last inserted block should be selected.
		await expect(
			listView.getByRole( 'gridcell', {
				name: 'Paragraph',
				exact: true,
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
		const paragraphBlockItem = listView.getByRole( 'gridcell', {
			name: 'Paragraph',
			exact: true,
		} );
		const imageBlockItem = listView.getByRole( 'gridcell', {
			name: 'Image',
			exact: true,
		} );
		const headingBlockItem = listView.getByRole( 'gridcell', {
			name: 'Heading',
			exact: true,
		} );

		await paragraphBlockItem.hover();
		await page.mouse.down();

		// To work around a drag and drop bug in Safari, the list view applies
		// `pointer-events: none` to the list view while dragging, so that
		// `onDragLeave` is not fired when dragging within the list view.
		// Without the `force: true` option, the `hover` action will fail
		// as playwright will complain that pointer-events are intercepted.
		// https://bugs.webkit.org/show_bug.cgi?id=66547
		// See: https://github.com/WordPress/gutenberg/pull/56625

		// Hover over each block to mimic moving up the list view.
		// Also, hover twice to ensure a dragover event is dispatched.
		// See: https://playwright.dev/docs/input#dragging-manually
		await imageBlockItem.hover( { force: true } );
		await imageBlockItem.hover( { force: true } );
		await headingBlockItem.hover( { force: true } );
		await headingBlockItem.hover( { force: true } );

		// Disable reason: Need to wait until the throttle timeout of 250ms has passed.
		/* eslint-disable playwright/no-wait-for-timeout */
		await editor.page.waitForTimeout( 300 );
		/* eslint-enable playwright/no-wait-for-timeout */

		await page.mouse.up();

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
		await pageUtils.pressKeys( 'access+o' );
		const listView = page.getByRole( 'treegrid', {
			name: 'Block navigation structure',
		} );

		// The last inserted block should be selected.
		await expect(
			listView.getByRole( 'gridcell', {
				name: 'Paragraph',
				exact: true,
				selected: true,
			} )
		).toBeVisible();

		// Go to the image block in List View.
		await pageUtils.pressKeys( 'ArrowUp', { times: 2 } );
		await expect(
			listView.getByRole( 'link', {
				name: 'Image',
			} )
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
		await expect( listView.getByRole( 'row' ) ).toHaveCount( 2 );
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
			.getByRole( 'option', { name: /Color: /i } )
			.first()
			.click();

		// Open List View.
		await pageUtils.pressKeys( 'access+o' );
		const listView = page.getByRole( 'treegrid', {
			name: 'Block navigation structure',
		} );

		// Things start off expanded.
		await expect(
			listView.getByRole( 'link', {
				name: 'Cover',
				expanded: true,
			} )
		).toBeVisible();

		// The child paragraph block should be selected.
		await expect(
			listView.getByRole( 'gridcell', {
				name: 'Paragraph',
				exact: true,
				selected: true,
			} )
		).toBeVisible();

		// Collapse the Cover block.
		await listView
			.getByRole( 'gridcell', { name: 'Cover', exact: true } )
			.getByTestId( 'list-view-expander', { includeHidden: true } )
			// Force the click to bypass the visibility check. The expander is
			// intentionally aria-hidden. See the implementation for details.
			.click( { force: true } );

		// Check that we're collapsed.
		await expect( listView.getByRole( 'row' ) ).toHaveCount( 1 );

		// Click the Cover block List View item.
		await listView
			.getByRole( 'link', {
				name: 'Cover',
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
				name: 'Paragraph',
				exact: true,
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
		await pageUtils.pressKeys( 'access+o' );
		const listView = page.getByRole( 'treegrid', {
			name: 'Block navigation structure',
		} );

		// The last inserted block should be selected.
		await expect(
			listView.getByRole( 'gridcell', {
				name: 'Group',
				exact: true,
				selected: true,
			} )
		).toBeVisible();

		// Press Home to go to the first inserted block (image).
		await page.keyboard.press( 'Home' );
		await expect(
			listView.getByRole( 'link', {
				name: 'Image',
			} )
		).toBeFocused();

		// Press End followed by Arrow Up to go to the second to last block (columns).
		await page.keyboard.press( 'End' );
		await page.keyboard.press( 'ArrowUp' );
		await expect(
			listView.getByRole( 'link', {
				name: 'Columns',
				exact: true,
			} )
		).toBeFocused();

		// Navigate the right column to image block options button via Home key.
		await page.keyboard.press( 'ArrowRight' );
		await page.keyboard.press( 'Home' );
		await expect(
			listView.getByRole( 'button', { name: 'Options for Image' } )
		).toBeFocused();

		// Navigate the right column to group block options button.
		await page.keyboard.press( 'End' );
		await expect(
			listView.getByRole( 'button', { name: 'Options for Group' } )
		).toBeFocused();
	} );

	// If list view sidebar is open and focus is not inside the sidebar, move
	// focus to the sidebar when using the shortcut. If focus is inside the
	// sidebar, shortcut should close the sidebar.
	test( 'ensures List View global shortcut works properly', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.insertBlock( { name: 'core/image' } );
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Paragraph text' },
		} );
		await expect(
			editor.canvas.getByRole( 'document', {
				name: 'Block: Paragraph',
			} )
		).toBeFocused();

		// Open List View.
		await pageUtils.pressKeys( 'access+o' );
		const listView = page.getByRole( 'treegrid', {
			name: 'Block navigation structure',
		} );

		// The paragraph item should be selected.
		await expect(
			listView.getByRole( 'gridcell', {
				name: 'Paragraph',
				exact: true,
				selected: true,
			} )
		).toBeVisible();

		// Navigate to the image block item.
		await page.keyboard.press( 'ArrowUp' );
		const imageItem = listView.getByRole( 'link', {
			name: 'Image',
		} );

		await expect( imageItem ).toBeFocused();

		// Hit enter to focus the Image block.
		await page.keyboard.press( 'Enter' );
		await expect(
			editor.canvas
				.getByRole( 'document', {
					name: 'Block: Image',
				} )
				.getByRole( 'button', { name: 'Upload' } )
		).toBeFocused();

		// Since focus is now at the image block upload button in the canvas,
		// pressing the list view shortcut should bring focus back to the image
		// block in the list view.
		await pageUtils.pressKeys( 'access+o' );
		await expect( imageItem ).toBeFocused();

		// Since focus is now inside the list view, the shortcut should close
		// the sidebar.
		await pageUtils.pressKeys( 'access+o' );

		// Focus should now be on the list view toggle button.
		await expect(
			page.getByRole( 'button', { name: 'Document Overview' } )
		).toBeFocused();

		// List View should be closed.
		await expect( listView ).toBeHidden();

		// Open List View.
		await pageUtils.pressKeys( 'access+o' );

		// Focus the list view close button and make sure the shortcut will
		// close the list view. This is to catch a bug where elements could be
		// out of range of the sidebar region. Must shift+tab 2 times to reach
		// close button before tab panel.
		await pageUtils.pressKeys( 'shift+Tab' );
		await pageUtils.pressKeys( 'shift+Tab' );
		await expect(
			page
				.getByRole( 'region', { name: 'Document Overview' } )
				.getByRole( 'button', {
					name: 'Close',
				} )
		).toBeFocused();

		// Close List View and ensure it's closed.
		await pageUtils.pressKeys( 'access+o' );
		await expect( listView ).toBeHidden();

		// Open List View.
		await pageUtils.pressKeys( 'access+o' );

		// Focus the outline tab and select it. This test ensures the outline
		// tab receives similar focus events based on the shortcut.
		await pageUtils.pressKeys( 'shift+Tab' );
		await page.keyboard.press( 'ArrowRight' );
		const outlineButton = page.getByRole( 'tab', {
			name: 'Outline',
		} );
		await expect( outlineButton ).toBeFocused();
		await page.keyboard.press( 'Enter' );

		// From here, tab in to the editor so focus can be checked on return to
		// the outline tab in the sidebar.
		await pageUtils.pressKeys( 'Tab', { times: 2 } );
		// Focus should be placed on the outline tab button since there is
		// nothing to focus inside the tab itself.
		await pageUtils.pressKeys( 'access+o' );
		await expect( outlineButton ).toBeFocused();

		// Close List View and ensure it's closed.
		await pageUtils.pressKeys( 'access+o' );
		await expect( listView ).toBeHidden();
	} );

	test( 'should place focus on the currently selected block in the canvas', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		// Insert a couple of blocks of different types.
		await editor.insertBlock( { name: 'core/image' } );
		await editor.insertBlock( { name: 'core/heading' } );
		await editor.insertBlock( { name: 'core/paragraph' } );

		// Open List View.
		await pageUtils.pressKeys( 'access+o' );
		const listView = page.getByRole( 'treegrid', {
			name: 'Block navigation structure',
		} );

		// The last inserted block should be selected.
		await expect(
			listView.getByRole( 'gridcell', {
				name: 'Paragraph',
				exact: true,
				selected: true,
			} )
		).toBeVisible();

		// Go to the image block in List View.
		await pageUtils.pressKeys( 'ArrowUp', { times: 2 } );
		await expect(
			listView.getByRole( 'link', {
				name: 'Image',
			} )
		).toBeFocused();

		// Select the image block in the canvas.
		await page.keyboard.press( 'Enter' );
		const imageBlock = editor.canvas.getByRole( 'document', {
			name: 'Block: Image',
		} );
		await expect(
			imageBlock.getByRole( 'button', { name: 'Upload' } )
		).toBeFocused();

		// Triggering the List View shortcut should result in the image block gaining focus.
		await pageUtils.pressKeys( 'access+o' );
		await expect(
			listView.getByRole( 'link', {
				name: 'Image',
			} )
		).toBeFocused();
	} );

	test( 'should cut, copy, paste, select, duplicate, delete, and deselect blocks using keyboard', async ( {
		editor,
		page,
		pageUtils,
		listViewUtils,
	} ) => {
		// Insert some blocks of different types.
		await editor.insertBlock( {
			name: 'core/group',
			innerBlocks: [ { name: 'core/pullquote' } ],
		} );
		await editor.insertBlock( {
			name: 'core/columns',
			innerBlocks: [
				{
					name: 'core/column',
					innerBlocks: [
						{ name: 'core/heading' },
						{ name: 'core/paragraph' },
					],
				},
				{
					name: 'core/column',
					innerBlocks: [ { name: 'core/verse' } ],
				},
			],
		} );
		await editor.insertBlock( { name: 'core/file' } );

		// Open List View.
		const listView = await listViewUtils.openListView();

		await expect
			.poll(
				listViewUtils.getBlocksWithA11yAttributes,
				'The last inserted block should be selected and focused.'
			)
			.toMatchObject( [
				{ name: 'core/group' },
				{ name: 'core/columns' },
				{ name: 'core/file', selected: true, focused: true },
			] );

		// Move up to columns block, expand, and then move to the first column block.
		await page.keyboard.press( 'ArrowUp' );
		await page.keyboard.press( 'ArrowRight' );
		await page.keyboard.press( 'ArrowDown' );

		await expect
			.poll(
				listViewUtils.getBlocksWithA11yAttributes,
				'The last inserted block should be selected, while the first column block should be focused.'
			)
			.toMatchObject( [
				{ name: 'core/group' },
				{
					name: 'core/columns',
					innerBlocks: [
						{ name: 'core/column', selected: false, focused: true },
						{ name: 'core/column' },
					],
				},
				{ name: 'core/file', selected: true, focused: false },
			] );

		// Select all sibling column blocks at current level.
		await pageUtils.pressKeys( 'primary+a' );
		await expect
			.poll(
				listViewUtils.getBlocksWithA11yAttributes,
				'All column blocks should be selected, with the first one focused.'
			)
			.toMatchObject( [
				{ name: 'core/group', selected: false, focused: false },
				{
					name: 'core/columns',
					innerBlocks: [
						{ name: 'core/column', selected: true, focused: true },
						{ name: 'core/column', selected: true, focused: false },
					],
					selected: false,
				},
				{ name: 'core/file', selected: false, focused: false },
			] );

		// Select next parent (the columns block).
		await pageUtils.pressKeys( 'primary+a' );
		await expect
			.poll(
				listViewUtils.getBlocksWithA11yAttributes,
				'The columns block should be selected and focused.'
			)
			.toMatchObject( [
				{ name: 'core/group', selected: false, focused: false },
				{
					name: 'core/columns',
					innerBlocks: [
						{ name: 'core/column' },
						{ name: 'core/column' },
					],
					selected: true,
					focused: true,
				},
				{ name: 'core/file', selected: false, focused: false },
			] );

		// Select all siblings at root level.
		await pageUtils.pressKeys( 'primary+a' );
		await expect
			.poll(
				listViewUtils.getBlocksWithA11yAttributes,
				'All blocks should be selected.'
			)
			.toMatchObject( [
				{ name: 'core/group', selected: true, focused: false },
				{
					name: 'core/columns',
					innerBlocks: [
						{ name: 'core/column' },
						{ name: 'core/column' },
					],
					selected: true,
					focused: true,
				},
				{ name: 'core/file', selected: true, focused: false },
			] );

		// Deselect blocks via Escape key.
		await page.keyboard.press( 'Escape' );
		// Collapse the columns block.
		await page.keyboard.press( 'ArrowLeft' );

		await expect
			.poll(
				listViewUtils.getBlocksWithA11yAttributes,
				'All blocks should be deselected, with focus on the Columns block.'
			)
			.toMatchObject( [
				{ name: 'core/group', selected: false, focused: false },
				{
					name: 'core/columns',
					selected: false,
					focused: true,
				},
				{ name: 'core/file', selected: false, focused: false },
			] );

		// Move focus and selection to the file block to set up for testing duplication.
		await listView
			.getByRole( 'gridcell', { name: 'File', exact: true } )
			.dblclick();

		// Test duplication behaviour.
		await pageUtils.pressKeys( 'primaryShift+d' );

		await expect
			.poll(
				listViewUtils.getBlocksWithA11yAttributes,
				'Duplicating a block should retain selection on existing block, move focus to duplicated block.'
			)
			.toMatchObject( [
				{ name: 'core/group' },
				{ name: 'core/columns' },
				{ name: 'core/file', selected: true },
				{ name: 'core/file', focused: true },
			] );

		// Move focus to the first file block, and then delete it.
		await page.keyboard.press( 'ArrowUp' );
		await page.keyboard.press( 'Delete' );
		await expect
			.poll(
				listViewUtils.getBlocksWithA11yAttributes,
				'Deleting a block should move focus and selection to the previous block'
			)
			.toMatchObject( [
				{ name: 'core/group' },
				{ name: 'core/columns', selected: true, focused: true },
				{ name: 'core/file' },
			] );

		// Expand the current column.
		await page.keyboard.press( 'ArrowRight' );
		await page.keyboard.press( 'ArrowDown' );
		await page.keyboard.press( 'ArrowDown' );
		await expect
			.poll(
				listViewUtils.getBlocksWithA11yAttributes,
				'Move focus but do not select the second column'
			)
			.toMatchObject( [
				{ name: 'core/group' },
				{
					name: 'core/columns',
					selected: true,
					innerBlocks: [
						{ name: 'core/column' },
						{ name: 'core/column', focused: true },
					],
				},
				{ name: 'core/file' },
			] );

		await page.keyboard.press( 'Delete' );
		await expect
			.poll(
				listViewUtils.getBlocksWithA11yAttributes,
				'Deleting a inner block moves focus to the previous inner block'
			)
			.toMatchObject( [
				{ name: 'core/group' },
				{
					name: 'core/columns',
					selected: true,
					innerBlocks: [
						{
							name: 'core/column',
							selected: false,
							focused: true,
						},
					],
				},
				{ name: 'core/file' },
			] );

		// Expand the current column.
		await page.keyboard.press( 'ArrowRight' );
		// Move focus and select the Heading block.
		await listView
			.getByRole( 'gridcell', { name: 'Heading', exact: true } )
			.dblclick();
		// Select both inner blocks in the column.
		await page.keyboard.press( 'Shift+ArrowDown' );

		await page.keyboard.press( 'Backspace' );
		await expect
			.poll(
				listViewUtils.getBlocksWithA11yAttributes,
				'Deleting multiple blocks moves focus to the parent block'
			)
			.toMatchObject( [
				{ name: 'core/group' },
				{
					name: 'core/columns',
					innerBlocks: [
						{
							name: 'core/column',
							selected: true,
							focused: true,
							innerBlocks: [],
						},
					],
				},
				{ name: 'core/file' },
			] );

		// Move focus and select the first block.
		await listView
			.getByRole( 'gridcell', { name: 'Group', exact: true } )
			.dblclick();
		await page.keyboard.press( 'Backspace' );
		await expect
			.poll(
				listViewUtils.getBlocksWithA11yAttributes,
				'Deleting the first block moves focus to the second block'
			)
			.toMatchObject( [
				{
					name: 'core/columns',
					selected: true,
					focused: true,
				},
				{ name: 'core/file' },
			] );

		// Delete remaining blocks.
		// Keyboard shortcut should also work.
		await pageUtils.pressKeys( 'access+z' );
		await pageUtils.pressKeys( 'access+z' );
		await expect
			.poll(
				listViewUtils.getBlocksWithA11yAttributes,
				'Deleting the only blocks left will create a default block and focus/select it'
			)
			.toMatchObject( [
				{
					name: 'core/paragraph',
					selected: true,
					focused: true,
				},
			] );

		await editor.insertBlock( { name: 'core/heading' } );
		await page.evaluate( () =>
			window.wp.data.dispatch( 'core/block-editor' ).clearSelectedBlock()
		);
		await listView
			.getByRole( 'gridcell', { name: 'Paragraph' } )
			.getByRole( 'link' )
			.focus();
		await expect
			.poll(
				listViewUtils.getBlocksWithA11yAttributes,
				'Block selection is cleared and focus is on the paragraph block'
			)
			.toMatchObject( [
				{ name: 'core/paragraph', selected: false, focused: true },
				{ name: 'core/heading', selected: false },
			] );

		await pageUtils.pressKeys( 'access+z' );
		await expect
			.poll(
				listViewUtils.getBlocksWithA11yAttributes,
				'Deleting blocks without existing selection will not select blocks'
			)
			.toMatchObject( [
				{ name: 'core/heading', selected: false, focused: true },
			] );

		// Insert a block that is locked and cannot be removed.
		await editor.insertBlock( {
			name: 'core/file',
			attributes: { lock: { move: false, remove: true } },
		} );
		// Click on the Heading block to select it.
		await listView
			.getByRole( 'gridcell', { name: 'Heading', exact: true } )
			.click();
		await listView
			.getByRole( 'gridcell', { name: 'File' } )
			.getByRole( 'link' )
			.focus();
		for ( const keys of [ 'Delete', 'Backspace', 'access+z' ] ) {
			await pageUtils.pressKeys( keys );
			await expect
				.poll(
					listViewUtils.getBlocksWithA11yAttributes,
					'Trying to delete locked blocks should not do anything'
				)
				.toMatchObject( [
					{ name: 'core/heading', selected: true, focused: false },
					{ name: 'core/file', selected: false, focused: true },
				] );
		}

		// Deselect blocks via Escape key.
		await page.keyboard.press( 'Escape' );

		await expect
			.poll(
				listViewUtils.getBlocksWithA11yAttributes,
				'Pressing Escape should deselect blocks'
			)
			.toMatchObject( [
				{ name: 'core/heading', selected: false, focused: false },
				{ name: 'core/file', selected: false, focused: true },
			] );

		// Copy and paste blocks. To begin, add another Group block.
		await editor.insertBlock( {
			name: 'core/group',
			innerBlocks: [
				{ name: 'core/paragraph' },
				{ name: 'core/pullquote' },
			],
		} );

		// Click the newly inserted Group block List View item to ensure it is focused.
		await listView
			.getByRole( 'link', {
				name: 'Group',
				expanded: false,
			} )
			.click();

		// Move down to group block, expand, and then move to the paragraph block.
		await page.keyboard.press( 'ArrowDown' );
		await page.keyboard.press( 'ArrowRight' );
		await page.keyboard.press( 'ArrowDown' );
		await page.keyboard.press( 'ArrowDown' );
		await pageUtils.pressKeys( 'primary+c' );
		await page.keyboard.press( 'ArrowUp' );
		await pageUtils.pressKeys( 'primary+v' );

		await expect
			.poll(
				listViewUtils.getBlocksWithA11yAttributes,
				'Should be able to copy focused block and paste in the list view via keyboard shortcuts'
			)
			.toMatchObject( [
				{ name: 'core/heading', selected: false, focused: false },
				{ name: 'core/file', selected: false, focused: false },
				{
					name: 'core/group',
					selected: true,
					innerBlocks: [
						{
							name: 'core/pullquote',
							selected: false,
							focused: true,
						},
						{
							name: 'core/pullquote',
							selected: false,
							focused: false,
						},
					],
				},
			] );

		// Cut and paste blocks.
		await page.keyboard.press( 'ArrowUp' );
		await pageUtils.pressKeys( 'primary+x' );

		await expect
			.poll(
				listViewUtils.getBlocksWithA11yAttributes,
				'Should be able to cut a block in the list view, with the preceding block being selected'
			)
			.toMatchObject( [
				{ name: 'core/heading', selected: false, focused: false },
				{ name: 'core/file', selected: true, focused: true },
			] );

		await pageUtils.pressKeys( 'primary+v' );

		await expect
			.poll(
				listViewUtils.getBlocksWithA11yAttributes,
				'Should be able to paste previously cut block in the list view via keyboard shortcuts'
			)
			.toMatchObject( [
				{ name: 'core/heading', selected: false, focused: false },
				{
					name: 'core/group',
					selected: true,
					focused: true,
					innerBlocks: [
						{
							name: 'core/pullquote',
							selected: false,
							focused: false,
						},
						{
							name: 'core/pullquote',
							selected: false,
							focused: false,
						},
					],
				},
			] );
	} );

	test( 'block settings dropdown menu', async ( {
		editor,
		page,
		pageUtils,
		listViewUtils,
	} ) => {
		// Insert some blocks of different types.
		await editor.insertBlock( { name: 'core/heading' } );
		await editor.insertBlock( { name: 'core/file' } );

		// Open List View.
		const listView = await listViewUtils.openListView();

		await listView
			.getByRole( 'button', { name: 'Options for Heading' } )
			.click();

		await page
			.getByRole( 'menu', { name: 'Options for Heading' } )
			.getByRole( 'menuitem', { name: 'Duplicate' } )
			.click();
		await expect
			.poll(
				listViewUtils.getBlocksWithA11yAttributes,
				'Should duplicate a block and move focus'
			)
			.toMatchObject( [
				{ name: 'core/heading', selected: false },
				{ name: 'core/heading', selected: false, focused: true },
				{ name: 'core/file', selected: true },
			] );

		await page.keyboard.press( 'Shift+ArrowUp' );
		await listView
			.getByRole( 'button', { name: 'Options for Heading' } )
			.first()
			.click();
		await page
			.getByRole( 'menu', { name: 'Options for Heading' } )
			.getByRole( 'menuitem', { name: 'Delete' } )
			.click();
		await expect
			.poll(
				listViewUtils.getBlocksWithA11yAttributes,
				'Should delete multiple selected blocks using the dropdown menu'
			)
			.toMatchObject( [
				{ name: 'core/file', selected: true, focused: true },
			] );

		await page.keyboard.press( 'ArrowRight' );
		const optionsForFileToggle = listView
			.getByRole( 'row' )
			.filter( {
				has: page.getByRole( 'gridcell', { name: 'File' } ),
			} )
			.getByRole( 'button', { name: 'Options for File' } );
		const optionsForFileMenu = page.getByRole( 'menu', {
			name: 'Options for File',
		} );
		await expect(
			optionsForFileToggle,
			'Pressing arrow right should move focus to the menu dropdown toggle button'
		).toBeFocused();

		await page.keyboard.press( 'Enter' );
		await expect(
			optionsForFileMenu,
			'Pressing Enter should open the menu dropdown'
		).toBeVisible();

		await page.keyboard.press( 'Escape' );
		await expect(
			optionsForFileMenu,
			'Pressing Escape should close the menu dropdown'
		).toBeHidden();
		await expect(
			optionsForFileToggle,
			'Should move focus back to the toggle button'
		).toBeFocused();

		await page.keyboard.press( 'Space' );
		await expect(
			optionsForFileMenu,
			'Pressing Space should also open the menu dropdown'
		).toBeVisible();

		await pageUtils.pressKeys( 'primaryAlt+t' ); // Keyboard shortcut for Insert before.
		await expect
			.poll(
				listViewUtils.getBlocksWithA11yAttributes,
				'Pressing keyboard shortcut should also work when the menu is opened and focused'
			)
			.toMatchObject( [
				{ name: 'core/paragraph', selected: true, focused: false },
				{ name: 'core/file', selected: false, focused: false },
			] );
		await expect(
			optionsForFileMenu,
			'The menu should be closed after pressing keyboard shortcut'
		).toBeHidden();

		await optionsForFileToggle.click();
		await expect(
			optionsForFileMenu,
			'Pressing Space should also open the menu dropdown'
		).toBeVisible();
		await pageUtils.pressKeys( 'access+z' ); // Keyboard shortcut for Delete.
		await expect
			.poll(
				listViewUtils.getBlocksWithA11yAttributes,
				'Deleting blocks should move focus and selection'
			)
			.toMatchObject( [
				{ name: 'core/paragraph', selected: true, focused: true },
			] );

		// Insert a block that is locked and cannot be removed.
		await editor.insertBlock( {
			name: 'core/file',
			attributes: { lock: { move: false, remove: true } },
		} );
		await optionsForFileToggle.click();
		await expect(
			optionsForFileMenu.getByRole( 'menuitem', { name: 'Delete' } ),
			'The delete menu item should be hidden for locked blocks'
		).toBeHidden();
		await pageUtils.pressKeys( 'access+z' );
		await expect
			.poll(
				listViewUtils.getBlocksWithA11yAttributes,
				'Pressing keyboard shortcut should not delete locked blocks either'
			)
			.toMatchObject( [
				{ name: 'core/paragraph' },
				{ name: 'core/file', selected: true },
			] );
		await expect(
			optionsForFileMenu,
			'The dropdown menu should also be visible'
		).toBeVisible();
	} );
} );

/** @typedef {import('@playwright/test').Locator} Locator */
class ListViewUtils {
	#page;
	#pageUtils;
	#editor;

	constructor( { page, pageUtils, editor } ) {
		this.#page = page;
		this.#pageUtils = pageUtils;
		this.#editor = editor;

		/** @type {Locator} */
		this.listView = page.getByRole( 'treegrid', {
			name: 'Block navigation structure',
		} );
	}

	/**
	 * @return {Promise<Locator>} The list view locator.
	 */
	openListView = async () => {
		await this.#pageUtils.pressKeys( 'access+o' );
		return this.listView;
	};

	getBlocksWithA11yAttributes = async () => {
		const selectedRows = await this.listView
			.getByRole( 'row' )
			.filter( {
				has: this.#page.getByRole( 'gridcell', { selected: true } ),
			} )
			.all();
		const selectedClientIds = await Promise.all(
			selectedRows.map( ( row ) => row.getAttribute( 'data-block' ) )
		);
		const focusedRows = await this.listView
			.getByRole( 'row' )
			.filter( { has: this.#page.locator( ':focus' ) } )
			.all();
		const focusedClientId =
			focusedRows.length > 0
				? await focusedRows[ focusedRows.length - 1 ].getAttribute(
						'data-block'
				  )
				: null;
		// Don't use the util to get the unmodified default block when it's empty.
		const blocks = await this.#page.evaluate( () =>
			window.wp.data.select( 'core/block-editor' ).getBlocks()
		);
		function recursivelyApplyAttributes( _blocks ) {
			return _blocks.map( ( block ) => ( {
				name: block.name,
				selected: selectedClientIds.includes( block.clientId ),
				focused: block.clientId === focusedClientId,
				innerBlocks: recursivelyApplyAttributes( block.innerBlocks ),
			} ) );
		}
		return recursivelyApplyAttributes( blocks );
	};
}
