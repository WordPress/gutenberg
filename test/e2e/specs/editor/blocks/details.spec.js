const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Details', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'can toggle hidden blocks by pressing enter', async ( {
		editor,
		page,
	} ) => {
		// Insert a details block with empty inner blocks.
		await editor.insertBlock( {
			name: 'core/details',
			attributes: {
				summary: 'Details summary',
			},
			innerBlocks: [
				{
					name: 'core/paragraph',
					attributes: {
						content: 'Details content',
					},
				},
			],
		} );

		// Open the details block.
		await page.keyboard.press( 'Enter' );

		// The inner block should be visible.
		await expect(
			editor.canvas.getByRole( 'document', { name: 'Block: Paragraph' } )
		).toContainText( 'Details content' );

		// Close the details block.
		await page.keyboard.press( 'Enter' );

		// The inner block should be hidden.
		await expect(
			editor.canvas.getByRole( 'document', { name: 'Block: Paragraph' } )
		).toBeHidden();
	} );

	test( 'can create a multiline summary with Shift+Enter', async ( {
		editor,
		page,
	} ) => {
		// Insert a details block.
		await editor.insertBlock( {
			name: 'core/details',
		} );

		const summary = editor.canvas.getByRole( 'textbox', {
			name: 'Write summary',
		} );

		// Add a multiline summary.
		await summary.type( 'First line' );
		await page.keyboard.press( 'Shift+Enter' );
		await summary.type( 'Second line' );

		// Verify the summary is multiline.
		await expect( summary ).toHaveText( 'First line\nSecond line', {
			useInnerText: true,
		} );
	} );

	test( 'typing space in summary rich-text should not toggle details', async ( {
		editor,
	} ) => {
		// Insert a details block.
		await editor.insertBlock( {
			name: 'core/details',
		} );

		const summary = editor.canvas.getByRole( 'textbox', {
			name: 'Write summary',
		} );

		// Type space in the summary rich-text.
		await summary.type( ' ' );

		// Verify the details block is not toggled.
		await expect(
			editor.canvas.getByRole( 'document', { name: 'Empty block' } )
		).toBeHidden();
	} );

	test( 'selecting hidden blocks in list view expands details and focuses content', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		// Insert a details block.
		await editor.insertBlock( {
			name: 'core/details',
			attributes: {
				summary: 'Details summary',
			},
			innerBlocks: [
				{
					name: 'core/paragraph',
					attributes: {
						content: 'Details content',
					},
				},
			],
		} );

		const listView = page.getByRole( 'treegrid', {
			name: 'Block navigation structure',
		} );

		// Open the list view.
		await pageUtils.pressKeys( 'access+o' );

		// Verify inner blocks appear in the list view.
		await page.keyboard.press( 'ArrowRight' );
		await expect(
			listView.getByRole( 'link', {
				name: 'Paragraph',
				exact: true,
			} )
		).toBeVisible();

		// Verify the first inner block in the list view is focused.
		await page.keyboard.press( 'ArrowDown' );
		await expect(
			listView.getByRole( 'link', {
				name: 'Paragraph',
				exact: true,
			} )
		).toBeFocused();

		// Verify the first inner block in the editor canvas holds the
		// selection.
		await page.keyboard.press( 'Enter' );
		await expect
			.poll( () =>
				editor.ownsSelection(
					editor.canvas.getByRole( 'document', {
						name: 'Block: Paragraph',
					} )
				)
			)
			.toBe( true );
	} );

	test( 'should select the parent when clicking its summary from an inner paragraph', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/details',
			attributes: { summary: 'Parent summary', showContent: true },
			innerBlocks: [
				{
					name: 'core/paragraph',
					attributes: { content: 'Inner paragraph' },
				},
			],
		} );

		// Select the inner paragraph.
		const paragraph = editor.canvas.getByRole( 'document', {
			name: 'Block: Paragraph',
		} );
		await paragraph.click();
		await expect
			.poll( () =>
				page.evaluate( () => {
					const { getSelectedBlockClientId, getBlockName } =
						window.wp.data.select( 'core/block-editor' );
					return getBlockName( getSelectedBlockClientId() );
				} )
			)
			.toBe( 'core/paragraph' );

		// Click the summary, a rich text owned by the parent Details block:
		// the parent must become the selected block and own the caret, even
		// though it is an ancestor of the previously selected paragraph.
		const summary = editor.canvas.getByRole( 'textbox', {
			name: 'Write summary. Press Enter to expand or collapse the details.',
		} );
		await summary.click();
		await expect
			.poll( () =>
				page.evaluate( () => {
					const { getSelectedBlockClientId, getBlockName } =
						window.wp.data.select( 'core/block-editor' );
					return getBlockName( getSelectedBlockClientId() );
				} )
			)
			.toBe( 'core/details' );
		await expect.poll( () => editor.ownsSelection( summary ) ).toBe( true );
	} );

	test( 'deleting empty core/details by pressing Backspace in empty summary', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/details',
		} );

		const summary = editor.canvas.getByRole( 'textbox', {
			name: 'Write summary. Press Enter to expand or collapse the details.',
		} );
		await summary.focus();

		// Press Backspace in the empty summary rich text.
		await page.keyboard.press( 'Backspace' );

		// The details block should be removed.
		await expect.poll( editor.getBlocks ).toHaveLength( 0 );
	} );

	test( 'deleting empty inner block via Backspace preserves details block and shows custom prompt', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/details',
			attributes: { summary: 'Details summary', showContent: true },
			innerBlocks: [
				{
					name: 'core/paragraph',
					attributes: { content: 'Temporary text' },
				},
			],
		} );

		const paragraph = editor.canvas.getByRole( 'document', {
			name: 'Block: Paragraph',
		} );
		await paragraph.focus();

		// Select all text and clear it.
		await page.keyboard.press( 'ControlOrMeta+a' );
		await page.keyboard.press( 'Backspace' );

		// Press Backspace again on the empty paragraph.
		await page.keyboard.press( 'Backspace' );

		// The parent core/details block must remain intact with 1 replacement inner block (no jump!).
		await expect.poll( editor.getBlocks ).toEqual( [
			expect.objectContaining( {
				name: 'core/details',
				attributes: expect.objectContaining( {
					summary: 'Details summary',
				} ),
				innerBlocks: [
					expect.objectContaining( {
						name: 'core/paragraph',
						attributes: expect.objectContaining( {
							placeholder: 'Type / to add a hidden block',
						} ),
					} ),
				],
			} ),
		] );

		// Exactly 1 "Type / to add a hidden block" placeholder prompt is shown.
		await expect(
			editor.canvas.locator(
				'details [data-rich-text-placeholder="Type / to add a hidden block"]'
			)
		).toHaveCount( 1 );
		await expect(
			editor.canvas.locator(
				'details [data-rich-text-placeholder="Type / to choose a block"]'
			)
		).toHaveCount( 0 );
		await expect(
			editor.canvas.getByText( 'Type / to choose a block' )
		).toHaveCount( 0 );
	} );

	test( 'pressing Backspace at start of modified inner paragraph does not bounce it outside details', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/details',
			attributes: { summary: 'Details summary', showContent: true },
			innerBlocks: [
				{
					name: 'core/paragraph',
					attributes: { content: 'Inner text' },
				},
			],
		} );

		const paragraph = editor.canvas.getByRole( 'document', {
			name: 'Block: Paragraph',
		} );
		await paragraph.focus();

		// Move caret to start of paragraph.
		await page.keyboard.press( 'Home' );
		await page.keyboard.press( 'Backspace' );

		// The paragraph should remain inside core/details, not lifted to the root.
		await expect.poll( editor.getBlocks ).toEqual( [
			expect.objectContaining( {
				name: 'core/details',
				innerBlocks: [
					expect.objectContaining( {
						name: 'core/paragraph',
						attributes: expect.objectContaining( {
							content: 'Inner text',
						} ),
					} ),
				],
			} ),
		] );
	} );

	test( 'deleting inner block via options menu in unmodified details block preserves details block and prompt', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/details',
			attributes: { showContent: true },
			innerBlocks: [
				{
					name: 'core/paragraph',
					attributes: { content: 'To be deleted' },
				},
			],
		} );

		const paragraph = editor.canvas.getByRole( 'document', {
			name: 'Block: Paragraph',
		} );
		await editor.selectBlocks( paragraph );

		// Delete inner paragraph via options menu.
		await editor.showBlockToolbar();
		await page
			.getByRole( 'toolbar', { name: 'Block tools' } )
			.getByRole( 'button', { name: 'Options' } )
			.click();
		await page.getByRole( 'menuitem', { name: 'Delete' } ).click();

		// Details block is preserved with 0 inner blocks even without summary.
		await expect.poll( editor.getBlocks ).toEqual( [
			expect.objectContaining( {
				name: 'core/details',
				innerBlocks: [],
			} ),
		] );

		// Exactly 1 "Type / to add a hidden block" prompt is shown.
		await expect(
			editor.canvas.getByText( 'Type / to add a hidden block' )
		).toHaveCount( 1 );
		await expect(
			editor.canvas.getByText( 'Type / to choose a block' )
		).toHaveCount( 0 );

		// Clicking that prompt inserts a new paragraph with "Type / to add a hidden block".
		await editor.canvas.getByText( 'Type / to add a hidden block' ).click();

		await expect.poll( editor.getBlocks ).toEqual( [
			expect.objectContaining( {
				name: 'core/details',
				innerBlocks: [
					expect.objectContaining( {
						name: 'core/paragraph',
						attributes: expect.objectContaining( {
							placeholder: 'Type / to add a hidden block',
						} ),
					} ),
				],
			} ),
		] );

		await expect(
			editor.canvas.locator(
				'details [data-rich-text-placeholder="Type / to add a hidden block"]'
			)
		).toHaveCount( 1 );
		await expect(
			editor.canvas.locator(
				'details [data-rich-text-placeholder="Type / to choose a block"]'
			)
		).toHaveCount( 0 );
		await expect(
			editor.canvas.getByText( 'Type / to choose a block' )
		).toHaveCount( 0 );
	} );

	test( 'selecting text inside summary does not toggle details while single click or Enter toggles', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/details',
			attributes: { summary: 'Sample summary', showContent: false },
			innerBlocks: [
				{
					name: 'core/paragraph',
					attributes: { content: 'Hidden content' },
				},
			],
		} );

		const details = editor.canvas.getByRole( 'document', {
			name: 'Block: Details',
		} );
		const summary = editor.canvas.getByRole( 'textbox', {
			name: 'Write summary. Press Enter to expand or collapse the details.',
		} );
		const paragraph = editor.canvas.getByRole( 'document', {
			name: 'Block: Paragraph',
		} );

		// Initially hidden.
		await expect( paragraph ).toBeHidden();
		await expect( details ).not.toHaveAttribute( 'open' );

		// Single clicking the summary text toggles <details> open.
		await summary.click();
		await expect( paragraph ).toBeVisible();
		await expect( details ).toHaveAttribute( 'open' );

		// Single clicking the summary text again toggles <details> closed.
		await summary.click();
		await expect( paragraph ).toBeHidden();
		await expect( details ).not.toHaveAttribute( 'open' );

		// Double clicking a word in the summary leaves <details> in its original state (closed).
		await summary.dblclick();
		await expect( paragraph ).toBeHidden();
		await expect( details ).not.toHaveAttribute( 'open' );

		// Double clicking a word in an open summary leaves <details> in its original state (open).
		await summary.click();
		await expect( paragraph ).toBeVisible();
		await expect( details ).toHaveAttribute( 'open' );
		await summary.dblclick();
		await expect( paragraph ).toBeVisible();
		await expect( details ).toHaveAttribute( 'open' );
		await summary.click();
		await expect( paragraph ).toBeHidden();
		await expect( details ).not.toHaveAttribute( 'open' );

		// Click-and-dragging across the summary text to select it does not toggle <details>.
		const summaryBox = await summary.boundingBox();
		await page.mouse.move(
			summaryBox.x + 5,
			summaryBox.y + summaryBox.height / 2
		);
		await page.mouse.down();
		await page.mouse.move(
			summaryBox.x + summaryBox.width - 5,
			summaryBox.y + summaryBox.height / 2
		);
		await page.mouse.up();

		// Should remain closed after drag selection.
		await expect( paragraph ).toBeHidden();
		await expect( details ).not.toHaveAttribute( 'open' );

		// Pressing Enter inside summary toggles <details> open.
		await page.keyboard.press( 'Enter' );
		await expect( paragraph ).toBeVisible();
		await expect( details ).toHaveAttribute( 'open' );

		// Pressing Enter again toggles <details> closed.
		await page.keyboard.press( 'Enter' );
		await expect( paragraph ).toBeHidden();
		await expect( details ).not.toHaveAttribute( 'open' );
	} );
} );
