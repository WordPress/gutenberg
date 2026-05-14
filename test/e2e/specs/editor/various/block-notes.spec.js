/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.use( {
	blockNoteUtils: async ( { page, editor }, use ) => {
		await use( new BlockNoteUtils( { page, editor } ) );
	},
} );

test.describe( 'Block Notes', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllComments( 'note' );
	} );

	test( 'should move focus to add a new note form', async ( {
		editor,
		page,
		blockNoteUtils,
	} ) => {
		await blockNoteUtils.addBlockWithNote( {
			type: 'core/paragraph',
			attributes: { content: 'Howdy!' },
			comment: 'Test comment',
		} );
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Testing block comments' },
		} );
		const form = page.getByRole( 'textbox', {
			name: 'New note',
			exact: true,
		} );

		await editor.clickBlockOptionsMenuItem( 'Add note' );
		await expect( form ).toBeFocused();
		// Close the pinned notes sidebar.
		await page
			.getByRole( 'region', { name: 'Editor top bar' } )
			.getByRole( 'button', { name: 'All notes', exact: true } )
			.click();
		await editor.clickBlockOptionsMenuItem( 'Add note' );
		await expect( form ).toBeFocused();
	} );

	test( 'can add a note to a block', async ( { editor, page } ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Testing block comments' },
		} );
		await editor.clickBlockOptionsMenuItem( 'Add note' );
		await page
			.getByRole( 'textbox', {
				name: 'New note',
				exact: true,
			} )
			.fill( 'A test comment' );
		await page
			.getByRole( 'region', { name: 'Editor settings' } )
			.getByRole( 'button', { name: 'Add note', exact: true } )
			.click();
		const thread = page
			.getByRole( 'region', { name: 'Editor settings' } )
			.getByRole( 'treeitem', {
				name: 'Note: A test comment',
			} );

		await expect( thread ).toBeVisible();
		// Should focus the newly added note thread.
		await expect( thread ).toBeFocused();
	} );

	test( 'can reply to a block note', async ( { page, blockNoteUtils } ) => {
		await blockNoteUtils.addBlockWithNote( {
			type: 'core/paragraph',
			attributes: { content: 'Testing block comments' },
			comment: 'Test comment',
		} );
		const commentForm = page.getByRole( 'textbox', { name: 'Reply to' } );
		const commentText = page
			.locator( '.editor-collab-sidebar-panel__note-content' )
			.last();

		await commentForm.fill( 'Test reply' );
		await page
			.getByRole( 'region', { name: 'Editor settings' } )
			.getByRole( 'button', { name: 'Reply', exact: true } )
			.click();
		await expect( commentText ).toHaveText( 'Test reply' );
		await expect(
			page
				.getByRole( 'button', { name: 'Dismiss this notice' } )
				.filter( { hasText: 'Reply added.' } )
		).toBeVisible();
	} );

	test( 'can edit a block note', async ( { page, blockNoteUtils } ) => {
		await blockNoteUtils.addBlockWithNote( {
			type: 'core/heading',
			attributes: { content: 'Testing block comments' },
			comment: 'test comment before edit',
		} );
		await blockNoteUtils.clickBlockNoteActionMenuItem( 'Edit' );
		await page
			.getByRole( 'textbox', { name: 'Note' } )
			.first()
			.fill( 'Test comment after edit.' );
		await page
			.getByRole( 'region', { name: 'Editor settings' } )
			.getByRole( 'button', { name: 'Update', exact: true } )
			.click();

		await expect(
			page.locator( '.editor-collab-sidebar-panel__note-content' )
		).toHaveText( 'Test comment after edit.' );
		await expect(
			page
				.getByRole( 'button', { name: 'Dismiss this notice' } )
				.filter( { hasText: 'Note updated.' } )
		).toBeVisible();
	} );

	test( 'can delete a block note', async ( { page, blockNoteUtils } ) => {
		await blockNoteUtils.addBlockWithNote( {
			type: 'core/paragraph',
			attributes: { content: 'Testing block comments' },
			comment: 'Test comment to delete.',
		} );
		await blockNoteUtils.clickBlockNoteActionMenuItem( 'Delete' );
		await page
			.getByRole( 'dialog' )
			.getByRole( 'button', { name: 'Delete' } )
			.click();

		await expect(
			page.locator( '.editor-collab-sidebar-panel__note-content' )
		).toBeHidden();
		await expect(
			page
				.getByRole( 'button', { name: 'Dismiss this notice' } )
				.filter( { hasText: 'Note deleted.' } )
		).toBeVisible();
	} );

	test( 'can resolve and reopen a block note', async ( {
		page,
		blockNoteUtils,
	} ) => {
		await blockNoteUtils.addBlockWithNote( {
			type: 'core/heading',
			attributes: { content: 'Testing block comments' },
			comment: 'Test comment to resolve.',
		} );
		await blockNoteUtils.openBlockNoteSidebar();

		const thread = page
			.getByRole( 'region', { name: 'Editor settings' } )
			.getByRole( 'treeitem', {
				name: 'Note: Test comment to resolve.',
			} );
		await thread.click();
		await expect( thread ).toHaveAttribute( 'aria-expanded', 'true' );

		const resolveButton = page.getByRole( 'button', { name: 'Resolve' } );
		await resolveButton.click();
		await expect(
			page
				.getByRole( 'button', { name: 'Dismiss this notice' } )
				.filter( { hasText: 'Note marked as resolved.' } )
		).toBeVisible();
		await expect( thread ).toBeFocused();
		await expect( thread ).toHaveAttribute( 'aria-expanded', 'false' );

		await thread.click();
		await expect( resolveButton ).toBeDisabled();

		await blockNoteUtils.clickBlockNoteActionMenuItem( 'Reopen' );
		await expect( resolveButton ).toBeEnabled();
		await expect(
			page
				.getByRole( 'button', { name: 'Dismiss this notice' } )
				.filter( { hasText: 'Note reopened.' } )
		).toBeVisible();
	} );

	test( 'can reopen a resolved note when adding a reply', async ( {
		page,
		blockNoteUtils,
	} ) => {
		await blockNoteUtils.addBlockWithNote( {
			type: 'core/heading',
			attributes: { content: 'Testing block comments' },
			comment: 'Test comment to resolve.',
		} );

		const resolveButton = page.getByRole( 'button', { name: 'Resolve' } );
		await resolveButton.click();
		await expect(
			page
				.getByRole( 'button', { name: 'Dismiss this notice' } )
				.filter( { hasText: 'Note marked as resolved.' } )
		).toBeVisible();

		await blockNoteUtils.openBlockNoteSidebar();
		await page.locator( '.editor-collab-sidebar-panel__thread' ).click();
		await expect( resolveButton ).toBeDisabled();
		const commentForm = page.getByRole( 'textbox', { name: 'Reply to' } );
		await commentForm.fill( 'Test reply that reopens the comment.' );
		await page
			.getByRole( 'region', { name: 'Editor settings' } )
			.getByRole( 'button', { name: 'Reopen & Reply', exact: true } )
			.click();

		await expect( resolveButton ).toBeEnabled();
		await expect(
			page
				.getByRole( 'button', { name: 'Dismiss this notice' } )
				.filter( { hasText: 'Note reopened.' } )
		).toBeVisible();
	} );

	test( 'selecting a block or note marks it as an active', async ( {
		editor,
		page,
		blockNoteUtils,
	} ) => {
		await blockNoteUtils.addBlockWithNote( {
			type: 'core/heading',
			attributes: { content: 'First block' },
			comment: 'First block comment',
		} );
		await blockNoteUtils.addBlockWithNote( {
			type: 'core/paragraph',
			attributes: { content: 'Second block' },
			comment: 'Second block comment',
		} );
		await editor.insertBlock( { name: 'core/spacer' } );
		await blockNoteUtils.addBlockWithNote( {
			type: 'core/heading',
			attributes: { content: 'Third block' },
			comment: 'Third block comment',
		} );

		const threadsContainer = page
			.getByRole( 'region', {
				name: 'Editor settings',
			} )
			.getByRole( 'tree' );
		const threads = threadsContainer.getByRole( 'treeitem' );
		const activeThread = threadsContainer.getByRole( 'treeitem', {
			expanded: true,
		} );
		const replyTextbox = activeThread.getByRole( 'textbox', {
			name: 'Reply to',
		} );

		// Note and reply textbox should be active for the last inserted block.
		await expect( activeThread ).toContainText( 'Third block comment' );
		await expect( replyTextbox ).toBeVisible();

		// Clicking on a block note should make it active.
		await threads.last().click();
		await expect( activeThread ).toContainText( 'Third block comment' );
		await expect( replyTextbox ).toBeVisible();

		// Clicking on a block in canvas should make its note active.
		await editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.click();
		await expect( activeThread ).toContainText( 'Second block comment' );
		await expect( replyTextbox ).toBeVisible();
	} );

	test.describe( 'Keyboard', () => {
		const KEY_COMBINATIONS = [
			{
				keyToExpand: 'Enter',
				keyToCollapse: 'Enter',
				keyName: 'enter',
			},
			{
				keyToExpand: 'ArrowRight',
				keyToCollapse: 'ArrowLeft',
				keyName: 'arrow right and left',
			},
		];
		KEY_COMBINATIONS.forEach(
			( { keyToExpand, keyToCollapse, keyName } ) => {
				test( `should expand or collapse a note with ${ keyName } key`, async ( {
					page,
					editor,
					blockNoteUtils,
				} ) => {
					await blockNoteUtils.addBlockWithNote( {
						type: 'core/heading',
						attributes: { content: 'Testing block comments' },
						comment: 'Test comment',
					} );

					// Click on the title field to deselect the block and the note.
					await editor.canvas
						.getByRole( 'textbox', { name: 'Add title' } )
						.focus();

					const thread = page
						.getByRole( 'region', {
							name: 'Editor settings',
						} )
						.getByRole( 'treeitem', {
							name: 'Note: Test comment',
						} );

					// Expand the note with the specified key.
					await thread.focus();
					await page.keyboard.press( keyToExpand );
					await expect(
						thread,
						'note should be expanded with $keyToExpand key'
					).toHaveAttribute( 'aria-expanded', 'true' );

					// The related block should be selected, but the focus should remain on the note.
					await expect(
						editor.canvas.getByText( 'Testing block comments' )
					).toHaveClass( /is-selected/ );
					await expect( thread ).toBeFocused();

					// Collapse the note with the specified key.
					await page.keyboard.press( keyToCollapse );
					await expect(
						thread,
						'note should be collapsed with $keyToCollapse key'
					).toHaveAttribute( 'aria-expanded', 'false' );
				} );
			}
		);

		test( 'should move to the adjacent note with arrow keys', async ( {
			page,
			blockNoteUtils,
		} ) => {
			await blockNoteUtils.addBlockWithNote( {
				type: 'core/paragraph',
				attributes: { content: 'Testing block comments' },
				comment: 'One',
			} );
			await blockNoteUtils.addBlockWithNote( {
				type: 'core/heading',
				attributes: { content: 'Testing block comments' },
				comment: 'Two',
			} );

			const firstThread = page
				.getByRole( 'region', {
					name: 'Editor settings',
				} )
				.getByRole( 'treeitem', {
					name: 'Note: One',
				} );
			const secondThread = page
				.getByRole( 'region', {
					name: 'Editor settings',
				} )
				.getByRole( 'treeitem', {
					name: 'Note: Two',
				} );

			await firstThread.focus();
			await page.keyboard.press( 'ArrowDown' );
			await expect( secondThread ).toBeFocused();

			await page.keyboard.press( 'ArrowUp' );
			await expect( firstThread ).toBeFocused();
		} );

		test( 'should move to the first or last note with Home or End keys', async ( {
			page,
			blockNoteUtils,
		} ) => {
			await blockNoteUtils.addBlockWithNote( {
				type: 'core/paragraph',
				attributes: { content: 'Testing block comments' },
				comment: 'One',
			} );
			await blockNoteUtils.addBlockWithNote( {
				type: 'core/heading',
				attributes: { content: 'Testing block comments' },
				comment: 'Two',
			} );
			await blockNoteUtils.addBlockWithNote( {
				type: 'core/paragraph',
				attributes: { content: 'Testing block comments' },
				comment: 'Three',
			} );

			const firstThread = page
				.getByRole( 'region', {
					name: 'Editor settings',
				} )
				.getByRole( 'treeitem', {
					name: 'Note: One',
				} );
			const lastThread = page
				.getByRole( 'region', {
					name: 'Editor settings',
				} )
				.getByRole( 'treeitem', {
					name: 'Note: Three',
				} );

			await firstThread.focus();
			await page.keyboard.press( 'End' );
			await expect( lastThread ).toBeFocused();

			await page.keyboard.press( 'Home' );
			await expect( firstThread ).toBeFocused();
		} );

		test( 'should collapse a note with Escape key', async ( {
			page,
			blockNoteUtils,
		} ) => {
			await blockNoteUtils.addBlockWithNote( {
				type: 'core/heading',
				attributes: { content: 'Testing block comments' },
				comment: 'Test comment escape',
			} );

			const thread = page
				.getByRole( 'region', {
					name: 'Editor settings',
				} )
				.getByRole( 'treeitem', {
					name: 'Note: Test comment escape',
				} );

			await thread.click();
			await expect( thread ).toHaveAttribute( 'aria-expanded', 'true' );

			// Collapse the note with Escape key.
			await page.keyboard.press( 'Escape' );
			await expect( thread ).toHaveAttribute( 'aria-expanded', 'false' );
		} );

		test( 'should keep a note collapsed while editing the same block', async ( {
			editor,
			page,
			blockNoteUtils,
		} ) => {
			await blockNoteUtils.addBlockWithNote( {
				type: 'core/paragraph',
				attributes: { content: 'Sticky collapse' },
				comment: 'Sticky collapse note',
			} );

			const thread = page
				.getByRole( 'region', { name: 'Editor settings' } )
				.getByRole( 'treeitem', {
					name: 'Note: Sticky collapse note',
				} );

			await thread.click();
			await page.keyboard.press( 'Escape' );
			await expect( thread ).toHaveAttribute( 'aria-expanded', 'false' );

			await editor.canvas
				.getByRole( 'document', { name: 'Block: Paragraph' } )
				.click();
			await page.keyboard.type( ' edited' );
			await expect( thread ).toHaveAttribute( 'aria-expanded', 'false' );
		} );

		test( 'should collapse a note after canceling note form', async ( {
			page,
			blockNoteUtils,
		} ) => {
			await blockNoteUtils.addBlockWithNote( {
				type: 'core/heading',
				attributes: { content: 'Testing block comments' },
				comment: 'Test comment',
			} );

			const thread = page
				.getByRole( 'region', {
					name: 'Editor settings',
				} )
				.getByRole( 'treeitem', {
					name: 'Note: Test comment',
				} );

			await thread.click();
			await expect( thread ).toHaveAttribute( 'aria-expanded', 'true' );
			await thread.getByRole( 'button', { name: 'Cancel' } ).click();
			await expect( thread ).toHaveAttribute( 'aria-expanded', 'false' );
			await expect( thread ).toBeFocused();
		} );

		test( 'should collapse a note when the focus moves outside the note', async ( {
			page,
			blockNoteUtils,
		} ) => {
			await blockNoteUtils.addBlockWithNote( {
				type: 'core/heading',
				attributes: { content: 'Testing block comments' },
				comment: 'Test comment',
			} );

			const thread = page
				.getByRole( 'region', {
					name: 'Editor settings',
				} )
				.getByRole( 'treeitem', {
					name: 'Note: Test comment',
				} );

			await thread.click();
			await expect( thread ).toHaveAttribute( 'aria-expanded', 'true' );
			await page.keyboard.press( 'Shift+Tab' );
			await expect( thread ).not.toBeFocused();
			await expect( thread ).toHaveAttribute( 'aria-expanded', 'false' );
		} );

		test( 'should have accessible name for the note threads', async ( {
			page,
			blockNoteUtils,
		} ) => {
			await blockNoteUtils.addBlockWithNote( {
				type: 'core/heading',
				attributes: { content: 'Testing block comments' },
				comment: 'Test comment',
			} );

			const thread = page
				.getByRole( 'region', {
					name: 'Editor settings',
				} )
				.getByRole( 'treeitem' )
				.first();

			await thread.focus();
			await expect( thread ).toHaveAccessibleName( 'Note: Test comment' );
		} );

		test( 'should expand and focus the thread after clicking the "x more replies" button', async ( {
			editor,
			page,
			blockNoteUtils,
		} ) => {
			await blockNoteUtils.addBlockWithNote( {
				type: 'core/paragraph',
				attributes: { content: 'Testing block comments' },
				comment: 'Test comment',
			} );
			const replyForm = page.getByRole( 'textbox', { name: 'Reply to' } );
			const replyButton = page
				.getByRole( 'region', { name: 'Editor settings' } )
				.getByRole( 'button', { name: 'Reply', exact: true } );

			await replyForm.fill( 'First reply' );
			await replyButton.click();
			await replyForm.fill( 'Second reply' );
			await replyButton.click();

			// Check that two replies were added.
			await expect(
				page
					.getByRole( 'button', { name: 'Dismiss this notice' } )
					.filter( { hasText: 'Reply added.' } )
			).toHaveCount( 2 );

			// Click on the title field to deselect the block and the note.
			await editor.canvas
				.getByRole( 'textbox', { name: 'Add title' } )
				.focus();

			const thread = page
				.getByRole( 'region', {
					name: 'Editor settings',
				} )
				.getByRole( 'treeitem', {
					name: 'Note: Test comment',
				} );

			await thread
				.getByRole( 'button', { name: '1 more reply' } )
				.click();
			await expect( thread ).toHaveAttribute( 'aria-expanded', 'true' );
			await expect( thread ).toBeFocused();
		} );

		test( 'should focus appropriate element when note is deleted', async ( {
			page,
			editor,
			blockNoteUtils,
		} ) => {
			await blockNoteUtils.addBlockWithNote( {
				type: 'core/paragraph',
				attributes: { content: 'First block content' },
				comment: 'First block comment',
			} );
			await blockNoteUtils.addBlockWithNote( {
				type: 'core/paragraph',
				attributes: { content: 'Second block content' },
				comment: 'Second block comment',
			} );
			await blockNoteUtils.addBlockWithNote( {
				type: 'core/paragraph',
				attributes: { content: 'Third block content' },
				comment: 'Third block comment',
			} );
			const firstThread = page
				.getByRole( 'region', { name: 'Editor settings' } )
				.getByRole( 'treeitem', {
					name: 'Note: First block comment',
				} );
			const secondThread = page
				.getByRole( 'region', { name: 'Editor settings' } )
				.getByRole( 'treeitem', {
					name: 'Note: Second block comment',
				} );
			const thirdThread = page
				.getByRole( 'region', { name: 'Editor settings' } )
				.getByRole( 'treeitem', {
					name: 'Note: Third block comment',
				} );

			await firstThread.click();
			await blockNoteUtils.clickBlockNoteActionMenuItem( 'Delete' );
			await page
				.getByRole( 'dialog' )
				.getByRole( 'button', { name: 'Delete' } )
				.click();
			await expect(
				secondThread,
				'focus should move to the next note if there is one'
			).toBeFocused();

			await thirdThread.click();
			await blockNoteUtils.clickBlockNoteActionMenuItem( 'Delete' );
			await page
				.getByRole( 'dialog' )
				.getByRole( 'button', { name: 'Delete' } )
				.click();
			await expect(
				secondThread,
				"focus should move to the previous note if there isn't a next one"
			).toBeFocused();

			await secondThread.click();
			await blockNoteUtils.clickBlockNoteActionMenuItem( 'Delete' );
			await page
				.getByRole( 'dialog' )
				.getByRole( 'button', { name: 'Delete' } )
				.click();
			const secondBlock = editor.canvas
				.getByRole( 'document', {
					name: 'Block: Paragraph',
				} )
				.nth( 1 );
			await expect(
				secondBlock,
				"focus should move to the block if there isn't a next or previous note"
			).toBeFocused();
		} );

		test( 'should focus note thread when reply is deleted', async ( {
			page,
			blockNoteUtils,
		} ) => {
			await blockNoteUtils.addBlockWithNote( {
				type: 'core/paragraph',
				attributes: { content: 'Testing block comments' },
				comment: 'Test note',
			} );
			await blockNoteUtils.addBlockWithNote( {
				type: 'core/paragraph',
				attributes: { content: 'Testing block comments' },
				comment: 'Test comment',
			} );
			const commentForm = page.getByRole( 'textbox', {
				name: 'Reply to',
			} );
			await commentForm.fill( 'Test reply' );
			await page
				.getByRole( 'region', { name: 'Editor settings' } )
				.getByRole( 'button', { name: 'Reply', exact: true } )
				.click();
			await blockNoteUtils.clickBlockNoteActionMenuItem( 'Delete', 1 );
			await page
				.getByRole( 'dialog' )
				.getByRole( 'button', { name: 'Delete' } )
				.click();
			const thread = page
				.getByRole( 'region', { name: 'Editor settings' } )
				.getByRole( 'treeitem', {
					name: 'Note: Test comment',
				} );

			await expect( thread ).toBeFocused();
		} );

		test( 'should focus note form after clicking "Add new reply" skip link button', async ( {
			page,
			blockNoteUtils,
		} ) => {
			await blockNoteUtils.addBlockWithNote( {
				type: 'core/paragraph',
				attributes: { content: 'Testing block comments' },
				comment: 'Test comment',
			} );
			const thread = page
				.getByRole( 'region', {
					name: 'Editor settings',
				} )
				.getByRole( 'treeitem', {
					name: 'Note: Test comment',
				} );
			const addNewCommentButton = thread.getByRole( 'button', {
				name: 'Add new reply',
			} );
			await thread.focus();
			await page.keyboard.press( 'Tab' );

			await expect( addNewCommentButton ).toBeFocused();

			await page.keyboard.press( 'Enter' );

			await expect(
				page.getByRole( 'textbox', { name: 'Reply to' } )
			).toBeFocused();
		} );

		test( 'should focus block after clicking "Back to block" skip link button', async ( {
			editor,
			page,
			blockNoteUtils,
		} ) => {
			await blockNoteUtils.addBlockWithNote( {
				type: 'core/paragraph',
				attributes: { content: 'Testing block comments' },
				comment: 'Test comment',
			} );
			const thread = page
				.getByRole( 'region', {
					name: 'Editor settings',
				} )
				.getByRole( 'treeitem', {
					name: 'Note: Test comment',
				} );
			const replyButton = thread.getByRole( 'button', {
				name: 'Reply',
				exact: true,
			} );
			const backToBlockButton = thread.getByRole( 'button', {
				name: 'Back to block',
			} );
			await replyButton.focus();
			await page.keyboard.press( 'Tab' );

			await expect( backToBlockButton ).toBeFocused();

			await page.keyboard.press( 'Enter' );

			await expect(
				editor.canvas.getByRole( 'document', {
					name: 'Block: Paragraph',
				} )
			).toBeFocused();
		} );

		test( 'should focus action button when note editing is cancelled or note is updated', async ( {
			page,
			blockNoteUtils,
		} ) => {
			await blockNoteUtils.addBlockWithNote( {
				type: 'core/heading',
				attributes: { content: 'Testing block comments' },
				comment: 'test comment before edit',
			} );

			// Test focus on action button when note editing is cancelled.
			await blockNoteUtils.clickBlockNoteActionMenuItem( 'Edit' );
			await page
				.getByRole( 'region', { name: 'Editor settings' } )
				.getByRole( 'button', { name: 'Cancel' } )
				.first()
				.click();

			await expect(
				page
					.getByRole( 'region', { name: 'Editor settings' } )
					.getByRole( 'button', { name: 'Actions' } )
			).toBeFocused();

			// Test focus on action button when note is updated.
			await blockNoteUtils.clickBlockNoteActionMenuItem( 'Edit' );
			await page
				.getByRole( 'textbox', { name: 'Note' } )
				.first()
				.fill( 'Test comment after edit.' );
			await page
				.getByRole( 'region', { name: 'Editor settings' } )
				.getByRole( 'button', { name: 'Update' } )
				.click();

			await expect(
				page
					.getByRole( 'region', { name: 'Editor settings' } )
					.getByRole( 'button', { name: 'Actions' } )
			).toBeFocused();
		} );

		test( 'can add a note using form shortcut', async ( {
			editor,
			page,
			pageUtils,
		} ) => {
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: { content: 'Testing block comments' },
			} );
			await editor.clickBlockOptionsMenuItem( 'Add note' );
			const textbox = page.getByRole( 'textbox', {
				name: 'New note',
				exact: true,
			} );
			const thread = page
				.getByRole( 'region', { name: 'Editor settings' } )
				.getByRole( 'treeitem', {
					name: 'Note: A test comment',
				} );

			await textbox.fill( '' );
			await pageUtils.pressKeys( 'primary+Enter' );
			await expect(
				textbox,
				`doesn't sumbit an empty form and focus remains in the textbox`
			).toBeFocused();

			await textbox.fill( 'A test comment' );
			await pageUtils.pressKeys( 'primary+Enter' );

			await expect( thread ).toBeVisible();
			// Should focus the newly added note thread.
			await expect( thread ).toBeFocused();
		} );

		test( 'can add a note using global keyboard shortcut', async ( {
			editor,
			page,
			pageUtils,
		} ) => {
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: { content: 'Testing block comments' },
			} );
			await pageUtils.pressKeys( 'primaryAlt+M' );
			const textbox = page.getByRole( 'textbox', {
				name: 'New note',
				exact: true,
			} );
			const thread = page
				.getByRole( 'region', { name: 'Editor settings' } )
				.getByRole( 'treeitem', {
					name: 'Note: A test comment',
				} );

			await textbox.fill( 'A test comment' );
			await pageUtils.pressKeys( 'primary+Enter' );

			await expect( thread ).toBeVisible();
			await expect( thread ).toBeFocused();
		} );
	} );

	test.describe( 'Multiple notes per block', () => {
		test( 'can add multiple notes to the same block', async ( {
			editor,
			page,
			blockNoteUtils,
		} ) => {
			await blockNoteUtils.addBlockWithNote( {
				type: 'core/paragraph',
				attributes: { content: 'Block with multiple notes' },
				comment: 'First note on block',
			} );

			// Second "Add note" should open the new-note form, not the reply
			// form — confirms the menu item routes through the multi-note path.
			await editor.clickBlockOptionsMenuItem( 'Add note' );
			const newNoteForm = page.getByRole( 'textbox', {
				name: 'New note',
				exact: true,
			} );
			await expect( newNoteForm ).toBeFocused();
			await newNoteForm.fill( 'Second note on block' );
			await page
				.getByRole( 'region', { name: 'Editor settings' } )
				.getByRole( 'button', { name: 'Add note', exact: true } )
				.click();

			const settings = page.getByRole( 'region', {
				name: 'Editor settings',
			} );
			await expect(
				settings.getByRole( 'treeitem', {
					name: 'Note: First note on block',
				} )
			).toBeVisible();
			await expect(
				settings.getByRole( 'treeitem', {
					name: 'Note: Second note on block',
				} )
			).toBeVisible();

			// noteId is stored as an array; the array shape (vs. a child
			// comment) proves the second add went through the new-note path.
			const noteIds = ( await editor.getBlocks() ).find(
				( b ) => b.name === 'core/paragraph'
			)?.attributes?.metadata?.noteId;
			expect( noteIds ).toHaveLength( 2 );
		} );

		test( 'deleting one note preserves the other notes on the same block', async ( {
			editor,
			page,
			blockNoteUtils,
		} ) => {
			await blockNoteUtils.addBlockWithNote( {
				type: 'core/paragraph',
				attributes: { content: 'Block with notes to delete' },
				comment: 'Note to keep',
			} );
			await blockNoteUtils.addNote( 'Note to delete' );

			// Both notes should be visible.
			const settings = page.getByRole( 'region', {
				name: 'Editor settings',
			} );
			await expect(
				settings.getByRole( 'treeitem', { name: 'Note: Note to keep' } )
			).toBeVisible();
			await expect(
				settings.getByRole( 'treeitem', {
					name: 'Note: Note to delete',
				} )
			).toBeVisible();

			// Delete the second note.
			const secondThread = settings.getByRole( 'treeitem', {
				name: 'Note: Note to delete',
			} );
			await secondThread.click();
			await blockNoteUtils.clickBlockNoteActionMenuItem( 'Delete' );
			await page
				.getByRole( 'dialog' )
				.getByRole( 'button', { name: 'Delete' } )
				.click();

			await expect(
				page
					.getByRole( 'button', { name: 'Dismiss this notice' } )
					.filter( { hasText: 'Note deleted.' } )
			).toBeVisible();

			// First note should still be visible; second should be gone.
			await expect(
				settings.getByRole( 'treeitem', { name: 'Note: Note to keep' } )
			).toBeVisible();
			await expect(
				settings.getByRole( 'treeitem', {
					name: 'Note: Note to delete',
				} )
			).toBeHidden();

			// Metadata should still have one noteId remaining.
			const blocks = await editor.getBlocks();
			const paragraphBlock = blocks.find(
				( b ) => b.name === 'core/paragraph'
			);
			const noteIds = paragraphBlock?.attributes?.metadata?.noteId;
			expect( noteIds ).toHaveLength( 1 );
		} );

		test( 'resolving one note does not affect sibling notes on the same block', async ( {
			editor,
			page,
			blockNoteUtils,
		} ) => {
			await blockNoteUtils.addBlockWithNote( {
				type: 'core/paragraph',
				attributes: { content: 'Block with notes to resolve' },
				comment: 'Note A',
			} );
			await blockNoteUtils.addNote( 'Note B' );

			const settings = page.getByRole( 'region', {
				name: 'Editor settings',
			} );

			// Resolve Note A.
			const threadA = settings.getByRole( 'treeitem', {
				name: 'Note: Note A',
			} );
			await threadA.click();
			await page.getByRole( 'button', { name: 'Resolve' } ).click();
			await expect(
				page
					.getByRole( 'button', { name: 'Dismiss this notice' } )
					.filter( { hasText: 'Note marked as resolved.' } )
			).toBeVisible();

			// Note B should still be visible and unresolved (expanded).
			const threadB = settings.getByRole( 'treeitem', {
				name: 'Note: Note B',
			} );
			await expect( threadB ).toBeVisible();

			// Both notes should still exist in metadata.
			const blocks = await editor.getBlocks();
			const paragraphBlock = blocks.find(
				( b ) => b.name === 'core/paragraph'
			);
			const noteIds = paragraphBlock?.attributes?.metadata?.noteId;
			expect( noteIds ).toHaveLength( 2 );
		} );

		test( 'auto-selects first unresolved note when clicking a block with multiple notes', async ( {
			editor,
			page,
			blockNoteUtils,
		} ) => {
			await blockNoteUtils.addBlockWithNote( {
				type: 'core/paragraph',
				attributes: { content: 'Block for auto-select' },
				comment: 'First note',
			} );
			await blockNoteUtils.addNote( 'Second note' );

			const settings = page.getByRole( 'region', {
				name: 'Editor settings',
			} );

			// Resolve the first note.
			const firstThread = settings.getByRole( 'treeitem', {
				name: 'Note: First note',
			} );
			await firstThread.click();
			await page.getByRole( 'button', { name: 'Resolve' } ).click();
			await expect(
				page
					.getByRole( 'button', { name: 'Dismiss this notice' } )
					.filter( { hasText: 'Note marked as resolved.' } )
			).toBeVisible();

			// Click the title to deselect the block and its comment.
			await editor.canvas
				.getByRole( 'textbox', { name: 'Add title' } )
				.focus();

			// Click back on the original block.
			await editor.canvas
				.getByRole( 'document', { name: 'Block: Paragraph' } )
				.filter( { hasText: 'Block for auto-select' } )
				.click();

			// The second (unresolved) note should be the active one.
			const secondThread = settings.getByRole( 'treeitem', {
				name: 'Note: Second note',
			} );
			await expect( secondThread ).toHaveAttribute(
				'aria-expanded',
				'true'
			);
		} );
	} );

	test.describe( 'Inline notes', () => {
		// Mirrors AVATAR_BORDER_COLORS in packages/editor/src/components/
		// collab-sidebar/utils.js. Duplicated so the test fails loudly if the
		// palette is changed without updating the e2e expectation.
		const AVATAR_BORDER_COLORS = [
			'#C36EFF',
			'#FF51A8',
			'#E4780A',
			'#FF35EE',
			'#879F11',
			'#46A494',
			'#00A2C3',
		];

		function hexToRgb( hex ) {
			return {
				r: parseInt( hex.slice( 1, 3 ), 16 ),
				g: parseInt( hex.slice( 3, 5 ), 16 ),
				b: parseInt( hex.slice( 5, 7 ), 16 ),
			};
		}

		test( 'highlights an inline marker with the author color at the rest opacity', async ( {
			editor,
			page,
			requestUtils,
		} ) => {
			const me = await requestUtils.rest( {
				path: '/wp/v2/users/me',
			} );
			const expectedColor =
				AVATAR_BORDER_COLORS[ me.id % AVATAR_BORDER_COLORS.length ];
			const { r, g, b } = hexToRgb( expectedColor );

			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: { content: 'Select me for a note.' },
			} );

			// Select all of the paragraph text so the inline path is taken
			// (the "Add note" rich-text toolbar entry only renders for a
			// non-collapsed selection).
			const paragraph = editor.canvas.getByRole( 'document', {
				name: 'Block: Paragraph',
			} );
			await paragraph.click();
			await page.keyboard.press( 'ControlOrMeta+a' );

			// "Add note" lives in the rich-text "More" dropdown alongside
			// Footnote / Inline image.
			await page
				.getByRole( 'button', { name: 'More', exact: true } )
				.click();
			await page.getByRole( 'menuitem', { name: 'Add note' } ).click();

			await page
				.getByRole( 'textbox', { name: 'New note', exact: true } )
				.fill( 'Color me' );
			await page
				.getByRole( 'region', { name: 'Editor settings' } )
				.getByRole( 'button', { name: 'Add note', exact: true } )
				.click();

			// Wait for the annotation `<mark>` to appear in the canvas; the
			// `annotation-text-core-note` class is added by the annotations
			// API for any annotation whose `source` is `core-note`.
			const mark = editor.canvas
				.locator( 'mark.annotation-text-core-note' )
				.first();
			await expect( mark ).toBeVisible();

			// Browsers report the per-author tint as an rgba() value with
			// alpha ≈ 0x40/255. Allow a small alpha tolerance (browsers
			// round differently) but require an exact RGB match — the prior
			// admin-theme fallback can never satisfy this assertion.
			const bg = await mark.evaluate(
				( el ) => window.getComputedStyle( el ).backgroundColor
			);
			const match = bg.match(
				/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/
			);
			expect( match ).not.toBeNull();
			expect( Number( match[ 1 ] ) ).toBe( r );
			expect( Number( match[ 2 ] ) ).toBe( g );
			expect( Number( match[ 3 ] ) ).toBe( b );
			const alpha = match[ 4 ] ? Number( match[ 4 ] ) : 1;
			expect( alpha ).toBeGreaterThan( 0.2 );
			expect( alpha ).toBeLessThan( 0.35 );
		} );
	} );

	test.describe( 'Sidebar UI polish', () => {
		test( 'shows an anchor excerpt preview on inline note threads', async ( {
			editor,
			page,
			blockNoteUtils,
		} ) => {
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: {
					content: 'The quick brown fox jumps over the lazy dog.',
				},
			} );

			await blockNoteUtils.addInlineNote( {
				anchor: 'lazy dog',
				comment: 'Anchor preview test',
			} );

			const preview = page
				.getByRole( 'region', { name: 'Editor settings' } )
				.getByRole( 'blockquote', {
					name: 'Anchored to: lazy dog',
				} );

			await expect( preview ).toBeVisible();
			await expect( preview ).toHaveText( 'lazy dog' );
		} );

		test( 'does not render an anchor preview for block-level notes', async ( {
			page,
			blockNoteUtils,
		} ) => {
			await blockNoteUtils.addBlockWithNote( {
				type: 'core/paragraph',
				attributes: { content: 'Block-level only.' },
				comment: 'Block note has no anchor',
			} );

			const preview = page
				.getByRole( 'region', { name: 'Editor settings' } )
				.locator(
					'.editor-collab-sidebar-panel__inline-anchor-preview'
				);

			await expect( preview ).toHaveCount( 0 );
		} );

		test( 'separates unresolved and resolved threads with a Resolved divider in the All notes sidebar', async ( {
			page,
			blockNoteUtils,
		} ) => {
			await blockNoteUtils.addBlockWithNote( {
				type: 'core/paragraph',
				attributes: { content: 'Unresolved block' },
				comment: 'Unresolved comment',
			} );
			await blockNoteUtils.addBlockWithNote( {
				type: 'core/paragraph',
				attributes: { content: 'Will resolve block' },
				comment: 'Will-be-resolved comment',
			} );

			// Resolve the most recently added note (currently active).
			await page.getByRole( 'button', { name: 'Resolve' } ).click();
			await expect(
				page
					.getByRole( 'button', { name: 'Dismiss this notice' } )
					.filter( { hasText: 'Note marked as resolved.' } )
			).toBeVisible();

			await blockNoteUtils.openBlockNoteSidebar();

			const settings = page.getByRole( 'region', {
				name: 'Editor settings',
			} );

			// The "Resolved" divider must appear once, between threads.
			const divider = settings.locator(
				'.editor-collab-sidebar-panel__resolved-divider'
			);
			await expect( divider ).toHaveCount( 1 );
			await expect( divider ).toHaveText( 'Resolved' );

			// Match treeitems by their accessible name; the resolved thread
			// collapses into a "Marked as resolved" tombstone whose visible
			// text no longer contains the original comment body.
			const unresolvedThread = settings.getByRole( 'treeitem', {
				name: 'Note: Unresolved comment',
			} );
			const resolvedThread = settings.getByRole( 'treeitem', {
				name: 'Note: Will-be-resolved comment',
			} );
			await expect( unresolvedThread ).toBeVisible();
			await expect( resolvedThread ).toBeVisible();

			// Unresolved → divider → resolved, verified by sibling DOM order.
			const dividerBeforeResolved = settings.locator(
				'.editor-collab-sidebar-panel__resolved-divider + [role="treeitem"]'
			);
			await expect( dividerBeforeResolved ).toHaveAttribute(
				'aria-label',
				'Note: Will-be-resolved comment'
			);
		} );

		test( 'omits the Resolved divider when no resolved threads exist', async ( {
			page,
			blockNoteUtils,
		} ) => {
			await blockNoteUtils.addBlockWithNote( {
				type: 'core/paragraph',
				attributes: { content: 'Only unresolved' },
				comment: 'Only unresolved comment',
			} );
			await blockNoteUtils.openBlockNoteSidebar();

			const divider = page
				.getByRole( 'region', { name: 'Editor settings' } )
				.locator( '.editor-collab-sidebar-panel__resolved-divider' );
			await expect( divider ).toHaveCount( 0 );
		} );
	} );
} );

class BlockNoteUtils {
	/** @type {import('@playwright/test').Page} */
	#page;
	/** @type {import('@wordpress/e2e-test-utils-playwright').Editor} */
	#editor;

	constructor( { page, editor } ) {
		this.#page = page;
		this.#editor = editor;
	}

	async openBlockNoteSidebar() {
		const toggleButton = this.#page
			.getByRole( 'region', { name: 'Editor top bar' } )
			.getByRole( 'button', { name: 'All notes', exact: true } );

		const isClosed =
			( await toggleButton.getAttribute( 'aria-expanded' ) ) === 'false';

		if ( isClosed ) {
			await toggleButton.click();
			await this.#page
				.getByRole( 'region', { name: 'Editor settings' } )
				.getByRole( 'button', { name: 'Close Notes' } )
				.waitFor();
		}

		return toggleButton;
	}

	async addBlockWithNote( { type, attributes = {}, comment } ) {
		await test.step(
			`Insert a ${ type } block with a note`,
			async () => {
				await this.#editor.insertBlock( {
					name: type,
					attributes,
				} );
				await this.addNote( comment );
			},
			{ box: true }
		);
	}

	async addNote( content ) {
		await this.#editor.clickBlockOptionsMenuItem( 'Add note' );
		await this.#page
			.getByRole( 'textbox', { name: 'New note', exact: true } )
			.fill( content );
		await this.#page
			.getByRole( 'region', { name: 'Editor settings' } )
			.getByRole( 'button', { name: 'Add note', exact: true } )
			.click();
		// Wait for the new thread to appear before returning.
		await expect(
			this.#page
				.getByRole( 'region', { name: 'Editor settings' } )
				.getByRole( 'treeitem', { name: `Note: ${ content }` } )
		).toBeVisible();
	}

	async addInlineNote( { anchor, comment } ) {
		// Select the anchor substring inside the most recently inserted block.
		// Programmatic selection is more reliable than keyboard navigation
		// across iframes and matches the same path Gutenberg's RichText uses.
		await this.#editor.canvas
			.locator( '[contenteditable="true"]' )
			.last()
			.evaluate( ( block, anchorText ) => {
				const doc = block.ownerDocument;
				const walker = doc.createTreeWalker(
					block,
					NodeFilter.SHOW_TEXT
				);
				let textNode;
				while ( ( textNode = walker.nextNode() ) ) {
					const idx = textNode.textContent.indexOf( anchorText );
					if ( idx >= 0 ) {
						const range = doc.createRange();
						range.setStart( textNode, idx );
						range.setEnd( textNode, idx + anchorText.length );
						const sel = doc.defaultView.getSelection();
						sel.removeAllRanges();
						sel.addRange( range );
						doc.dispatchEvent( new Event( 'selectionchange' ) );
						return;
					}
				}
				throw new Error(
					`Anchor text "${ anchorText }" not found in block`
				);
			}, anchor );

		// Open the block toolbar's "More" formats menu, then trigger the inline
		// "Add note" rich-text format.
		await this.#page
			.getByRole( 'region', { name: 'Editor content' } )
			.getByRole( 'button', { name: 'More', exact: true } )
			.click();
		await this.#page
			.getByRole( 'menuitem', { name: 'Add note', exact: true } )
			.click();

		await this.#page
			.getByRole( 'textbox', { name: 'New note', exact: true } )
			.fill( comment );
		await this.#page
			.getByRole( 'region', { name: 'Editor settings' } )
			.getByRole( 'button', { name: 'Add note', exact: true } )
			.click();
		await expect(
			this.#page
				.getByRole( 'region', { name: 'Editor settings' } )
				.getByRole( 'treeitem', { name: `Note: ${ comment }` } )
		).toBeVisible();
	}

	async clickBlockNoteActionMenuItem( actionName, index = 0 ) {
		await this.#page
			.getByRole( 'region', { name: 'Editor settings' } )
			.getByRole( 'button', { name: 'Actions' } )
			.nth( index )
			.click();
		await this.#page.getByRole( 'menuitem', { name: actionName } ).click();
	}
}
