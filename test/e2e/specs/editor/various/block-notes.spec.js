const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );
const { BlockNoteUtils } = require( './block-notes-utils' );

test.use( {
	blockNoteUtils: async ( { page, editor, pageUtils }, use ) => {
		await use( new BlockNoteUtils( { page, editor, pageUtils } ) );
	},
} );

test.describe( 'Block Notes', () => {
	test.beforeEach( async ( { admin, blockNoteUtils } ) => {
		await admin.createNewPost();
		await blockNoteUtils.showAllNotes();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllComments( 'note' );
		await requestUtils.resetPreferences();
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
			.pressSequentially( 'A test comment' );
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
		const commentForm = page.getByRole( 'textbox', {
			name: 'Reply to',
		} );
		const commentText = page
			.locator( '.editor-collab-sidebar-panel__note-content' )
			.last();

		/*
		 * The reply form intentionally does not focus on mount, so click into
		 * it before typing the same way the edit flow does. This keeps the
		 * test focused on reply behavior rather than auto-focus.
		 */
		await commentForm.click();
		await commentForm.pressSequentially( 'Test reply' );
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

	test( 'selecting a note keeps focus on the thread, not the reply field', async ( {
		page,
		blockNoteUtils,
	} ) => {
		await blockNoteUtils.addBlockWithNote( {
			type: 'core/paragraph',
			attributes: { content: 'Focus behaviour host' },
			comment: 'Focus test note',
		} );

		const thread = page
			.getByRole( 'region', { name: 'Editor settings' } )
			.getByRole( 'treeitem', { name: 'Note: Focus test note' } );
		const replyTextbox = page.getByRole( 'textbox', { name: 'Reply to' } );

		/*
		 * Selecting a thread renders its reply field but deliberately keeps
		 * focus on the thread itself so keyboard navigation between threads is
		 * preserved. The reply field is available (the "Add new reply" skip
		 * link moves focus into it, covered separately) but must not steal
		 * focus on mount.
		 */
		await expect( thread ).toBeFocused();
		await expect( replyTextbox ).toBeVisible();
		await expect( replyTextbox ).not.toBeFocused();
	} );

	test( 'can edit a block note @firefox @webkit', async ( {
		page,
		blockNoteUtils,
	} ) => {
		await blockNoteUtils.addBlockWithNote( {
			type: 'core/heading',
			attributes: { content: 'Testing block comments' },
			comment: 'test comment before edit',
		} );
		await blockNoteUtils.clickBlockNoteActionMenuItem( 'Edit' );
		await expect(
			page.getByRole( 'menu', { name: 'Actions' } )
		).toBeHidden();
		await expect(
			page.getByRole( 'textbox', { name: 'Edit note' } )
		).toBeFocused();
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
		await expect( thread ).toBeFocused();
		await expect( thread ).toHaveAttribute( 'aria-expanded', 'false' );

		await thread.click();
		await expect( resolveButton ).toBeDisabled();

		await blockNoteUtils.clickBlockNoteActionMenuItem( 'Reopen' );
		await expect( resolveButton ).toBeEnabled();
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

		const resolveButton = page.getByRole( 'button', {
			name: 'Resolve',
		} );
		await resolveButton.click();

		await blockNoteUtils.openBlockNoteSidebar();
		await page.locator( '.editor-collab-sidebar-panel__thread' ).click();
		// Re-selecting the thread shows the Resolve button, now disabled,
		// confirming the note was resolved.
		await expect( resolveButton ).toBeDisabled();
		const commentForm = page.getByRole( 'textbox', {
			name: 'Reply to',
		} );
		/*
		 * The reply form intentionally does not focus on mount, so click
		 * into the contenteditable to place the caret before typing.
		 */
		await commentForm.click();
		await commentForm.pressSequentially(
			'Test reply that reopens the comment.'
		);
		await page
			.getByRole( 'region', { name: 'Editor settings' } )
			.getByRole( 'button', { name: 'Reopen & Reply', exact: true } )
			.click();

		await expect( resolveButton ).toBeEnabled();
	} );

	test( 'shows a "Resolved" divider between active and resolved notes', async ( {
		editor,
		page,
		blockNoteUtils,
	} ) => {
		// First block: this note stays active and unresolved.
		await blockNoteUtils.addBlockWithNote( {
			type: 'core/paragraph',
			attributes: { content: 'Stays active.' },
			comment: 'Active note.',
		} );
		// Second block: this note will be resolved.
		await blockNoteUtils.addBlockWithNote( {
			type: 'core/paragraph',
			attributes: { content: 'Resolve me.' },
			comment: 'Note to resolve.',
		} );
		// Third block: its note is orphaned when the block is deleted.
		await blockNoteUtils.addBlockWithNote( {
			type: 'core/paragraph',
			attributes: { content: 'Orphan me.' },
			comment: 'Note losing its block.',
		} );

		await blockNoteUtils.openBlockNoteSidebar();
		const sidebar = page.getByRole( 'region', {
			name: 'Editor settings',
		} );
		const separator = sidebar.locator(
			'.editor-collab-sidebar-panel__status-separator'
		);

		// No resolved notes yet, so the divider is absent.
		await expect( separator ).toBeHidden();

		// Resolve the second note.
		const resolvedThread = sidebar.getByRole( 'treeitem', {
			name: 'Note: Note to resolve.',
		} );
		await resolvedThread.click();
		await expect( resolvedThread ).toHaveAttribute(
			'aria-expanded',
			'true'
		);
		await page.getByRole( 'button', { name: 'Resolve' } ).click();

		// The divider appearing confirms the resolve completed and now labels
		// the resolved section.
		await expect( separator ).toBeVisible();
		await expect( separator ).toHaveText( 'Resolved' );

		// Delete the second block via the store, orphaning its note. Clicking
		// the block in the canvas is unreliable here because the selected
		// note's block toolbar popover overlaps it.
		const orphanBlock = editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.filter( { hasText: 'Orphan me.' } );
		const orphanClientId = await orphanBlock.getAttribute( 'data-block' );
		await page.evaluate(
			( clientId ) =>
				window.wp.data
					.dispatch( 'core/block-editor' )
					.removeBlock( clientId ),
			orphanClientId
		);

		// The orphaned note persists and is flagged as detached, rather than
		// being auto-deleted or moved into the resolved section.
		await expect(
			sidebar.getByRole( 'treeitem', {
				name: 'Original block deleted. Note: Note losing its block.',
			} )
		).toBeVisible();

		// Rows render in DOM order: unresolved notes first, then orphaned ones,
		// both above the divider, with the resolved note below it.
		await expect(
			sidebar.locator( '.editor-collab-sidebar-panel > *' )
		).toContainText( [
			'Active note.',
			'Note losing its block.',
			'Resolved',
			'Note to resolve.',
		] );
	} );

	test( 'clearing the block selection does not select an orphaned note', async ( {
		editor,
		page,
		blockNoteUtils,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Another block' },
		} );
		await blockNoteUtils.addBlockWithNote( {
			type: 'core/paragraph',
			attributes: { content: 'Orphan me.' },
			comment: 'Orphaned note.',
		} );

		// Delete the noted block, orphaning its note.
		await editor.clickBlockOptionsMenuItem( 'Delete' );

		// Only the "All notes" sidebar lists orphaned notes.
		await blockNoteUtils.openBlockNoteSidebar();
		const sidebar = page.getByRole( 'region', {
			name: 'Editor settings',
		} );
		await expect(
			sidebar.getByRole( 'treeitem', {
				name: 'Original block deleted. Note: Orphaned note.',
			} )
		).toBeVisible();

		const anotherBlock = editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.filter( { hasText: 'Another block' } );
		await anotherBlock.click();
		await expect( anotherBlock ).toHaveClass( /is-selected/ );

		await editor.canvas
			.getByRole( 'textbox', { name: 'Add title' } )
			.click();
		await expect( anotherBlock ).not.toHaveClass( /is-selected/ );

		await expect(
			sidebar.getByRole( 'treeitem', { expanded: true } )
		).toHaveCount( 0 );
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

	test( 'selecting note marks it as active and closes add new note form', async ( {
		editor,
		page,
		blockNoteUtils,
	} ) => {
		// An existing thread to select later.
		await blockNoteUtils.addBlockWithNote( {
			type: 'core/paragraph',
			attributes: { content: 'First block' },
			comment: 'First block comment',
		} );

		// Open a new-note form on a second block and move focus into it.
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Second block' },
		} );
		await editor.clickBlockOptionsMenuItem( 'Add note' );
		const newNoteForm = page.getByRole( 'textbox', {
			name: 'New note',
			exact: true,
		} );
		await newNoteForm.click();

		const existingThread = page
			.getByRole( 'region', { name: 'Editor settings' } )
			.getByRole( 'tree' )
			.getByRole( 'treeitem', { name: 'Note: First block comment' } );

		// Clicking the existing thread selects it and closes the new-note form.
		await existingThread.click();
		await expect( newNoteForm ).toBeHidden();

		/*
		 * The form unmounts on selection, but `useFocusOutside` still runs its
		 * queued blur callback. It must not clear the newly selected thread.
		 */
		await expect( existingThread ).toHaveAttribute(
			'aria-expanded',
			'true'
		);
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
			editor,
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
			const block = editor.canvas.getByRole( 'document', {
				name: 'Block: Heading',
			} );

			await thread.click();
			await expect( thread ).toHaveAttribute( 'aria-expanded', 'true' );
			await expect( block ).toHaveClass( /is-highlighted/ );
			await page.keyboard.press( 'Shift+Tab' );
			await expect( thread ).not.toBeFocused();
			await expect( thread ).toHaveAttribute( 'aria-expanded', 'false' );
			await expect( block ).not.toHaveClass( /is-highlighted/ );
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
			const replyForm = page.getByRole( 'textbox', {
				name: 'Reply to',
			} );
			const replyButton = page
				.getByRole( 'region', { name: 'Editor settings' } )
				.getByRole( 'button', { name: 'Reply', exact: true } );

			/*
			 * The reply form intentionally does not focus on mount, so
			 * click into the contenteditable to place the caret before
			 * typing each reply.
			 */
			await replyForm.click();
			await replyForm.pressSequentially( 'First reply' );
			await replyButton.click();
			await replyForm.click();
			await replyForm.pressSequentially( 'Second reply' );
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

			const secondBlock = editor.canvas
				.getByRole( 'document', {
					name: 'Block: Paragraph',
				} )
				.nth( 1 );

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
			await expect(
				secondBlock,
				"the next note's block should be selected"
			).toHaveClass( /is-selected/ );

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
			await expect(
				secondBlock,
				"the previous note's block should be selected"
			).toHaveClass( /is-selected/ );

			await secondThread.click();
			await blockNoteUtils.clickBlockNoteActionMenuItem( 'Delete' );
			await page
				.getByRole( 'dialog' )
				.getByRole( 'button', { name: 'Delete' } )
				.click();
			await expect
				.poll(
					() => editor.ownsSelection( secondBlock ),
					"focus should move to the block if there isn't a next or previous note"
				)
				.toBe( true );
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
			/*
			 * The reply form intentionally does not focus on mount, so
			 * click into the contenteditable to place the caret before
			 * typing.
			 */
			await commentForm.click();
			await commentForm.pressSequentially( 'Test reply' );
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

		test( 'should focus action button when note editing is cancelled or note is updated @firefox @webkit', async ( {
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

			// Reopen with the keyboard and move focus into the edit field.
			await page
				.getByRole( 'button', { name: 'Actions' } )
				.press( 'ArrowDown' );
			await page
				.getByRole( 'menuitem', { name: 'Edit', exact: true } )
				.press( 'Enter' );
			await expect(
				page.getByRole( 'menu', { name: 'Actions' } )
			).toBeHidden();
			await expect(
				page.getByRole( 'textbox', { name: 'Edit note' } )
			).toBeFocused();
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

			await textbox.click();
			await pageUtils.pressKeys( 'primary+Enter' );
			await expect(
				textbox,
				`doesn't submit an empty form and focus remains in the textbox`
			).toBeFocused();

			await textbox.pressSequentially( 'A test comment' );
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

			await textbox.pressSequentially( 'A test comment' );
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
			await newNoteForm.pressSequentially( 'Second note on block' );
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

		test( 'keeps the clicked note selected on a block with several notes', async ( {
			editor,
			page,
			blockNoteUtils,
		} ) => {
			await blockNoteUtils.addBlockWithNote( {
				type: 'core/paragraph',
				attributes: { content: 'Block with notes' },
				comment: 'First note',
			} );
			await blockNoteUtils.addNote( 'Second note' );
			// Move the block selection away, so clicking a thread also selects its block.
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: { content: 'Another block' },
			} );

			const settings = page.getByRole( 'region', {
				name: 'Editor settings',
			} );
			const firstThread = settings.getByRole( 'treeitem', {
				name: 'Note: First note',
			} );
			const secondThread = settings.getByRole( 'treeitem', {
				name: 'Note: Second note',
			} );

			await secondThread.click();

			await expect( secondThread ).toHaveAttribute(
				'aria-expanded',
				'true'
			);
			await expect( firstThread ).toHaveAttribute(
				'aria-expanded',
				'false'
			);
		} );

		test( 'keeps a clicked inline note selected', async ( {
			editor,
			page,
			blockNoteUtils,
		} ) => {
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: { content: 'Alpha bravo charlie.' },
			} );
			await editor.canvas
				.getByRole( 'document', { name: 'Block: Paragraph' } )
				.click();
			await blockNoteUtils.selectBlockText( { start: 0, length: 5 } );
			await blockNoteUtils.addNote( 'Alpha note' );
			// Move the block selection away, so clicking the thread also selects its block.
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: { content: 'Another block' },
			} );

			const thread = page
				.getByRole( 'region', { name: 'Editor settings' } )
				.getByRole( 'treeitem', { name: 'Note: Alpha note' } );
			await expect( thread ).toHaveAttribute( 'aria-expanded', 'false' );

			await thread.click();
			await expect( thread ).toHaveAttribute( 'aria-expanded', 'true' );
		} );
	} );

	test.describe( 'Draft persistence', () => {
		test.beforeEach( async ( { editor } ) => {
			/*
			 * The middle block keeps the selected block's toolbar from covering
			 * the other block's click target.
			 */
			for ( const content of [
				'First block',
				'Middle block',
				'Second block',
			] ) {
				await editor.insertBlock( {
					name: 'core/paragraph',
					attributes: { content },
				} );
			}
		} );

		test( 'preserves an unsent draft per block when switching blocks', async ( {
			editor,
			page,
		} ) => {
			const newNoteForm = page.getByRole( 'textbox', {
				name: 'New note',
				exact: true,
			} );

			await editor.canvas.getByText( 'First block' ).click();
			await editor.clickBlockOptionsMenuItem( 'Add note' );
			await newNoteForm.pressSequentially( 'First draft' );

			await editor.canvas.getByText( 'Second block' ).click();
			await expect( newNoteForm ).toBeHidden();
			await editor.clickBlockOptionsMenuItem( 'Add note' );
			await expect( newNoteForm ).toHaveText( '' );
			await newNoteForm.pressSequentially( 'Second draft' );

			await editor.canvas.getByText( 'First block' ).click();
			await expect( newNoteForm ).toHaveText( 'First draft' );
			await editor.canvas.getByText( 'Second block' ).click();
			await expect( newNoteForm ).toHaveText( 'Second draft' );

			await page
				.getByRole( 'region', { name: 'Editor settings' } )
				.getByRole( 'button', { name: 'Add note', exact: true } )
				.click();
			await expect(
				page
					.getByRole( 'region', { name: 'Editor settings' } )
					.getByRole( 'treeitem', { name: 'Note: Second draft' } )
			).toBeVisible();
		} );

		test( 'preserves an unsent draft across the code editor', async ( {
			editor,
			page,
			pageUtils,
		} ) => {
			const newNoteForm = page.getByRole( 'textbox', {
				name: 'New note',
				exact: true,
			} );

			await editor.canvas.getByText( 'First block' ).click();
			await editor.clickBlockOptionsMenuItem( 'Add note' );
			await newNoteForm.pressSequentially( 'Unsent draft' );

			await pageUtils.pressKeys( 'secondary+m' );
			await expect( newNoteForm ).toBeHidden();
			await pageUtils.pressKeys( 'secondary+m' );

			await editor.canvas.getByText( 'Second block' ).click();
			await editor.canvas.getByText( 'First block' ).click();
			await expect( newNoteForm ).toHaveText( 'Unsent draft' );
		} );

		test( 'closes the new note form on focus-out only when empty', async ( {
			editor,
			page,
		} ) => {
			const newNoteForm = page.getByRole( 'textbox', {
				name: 'New note',
				exact: true,
			} );

			await editor.canvas.getByText( 'First block' ).click();
			await editor.clickBlockOptionsMenuItem( 'Add note' );
			await expect( newNoteForm ).toBeFocused();
			await editor.canvas.getByText( 'First block' ).click();
			await expect( newNoteForm ).toBeHidden();

			await editor.clickBlockOptionsMenuItem( 'Add note' );
			await newNoteForm.pressSequentially( 'Unsent draft' );
			await editor.canvas.getByText( 'First block' ).click();
			await expect( newNoteForm ).toHaveText( 'Unsent draft' );
		} );

		test( 'discards a draft when the form is cancelled', async ( {
			editor,
			page,
		} ) => {
			const newNoteForm = page.getByRole( 'textbox', {
				name: 'New note',
				exact: true,
			} );

			await editor.canvas.getByText( 'First block' ).click();
			await editor.clickBlockOptionsMenuItem( 'Add note' );
			await newNoteForm.pressSequentially( 'Discarded draft' );
			await page
				.getByRole( 'region', { name: 'Editor settings' } )
				.getByRole( 'button', { name: 'Cancel' } )
				.click();
			await expect( newNoteForm ).toBeHidden();

			await editor.clickBlockOptionsMenuItem( 'Add note' );
			await expect( newNoteForm ).toHaveText( '' );
		} );

		test( 'preserves an unsent reply draft when the thread is deselected', async ( {
			editor,
			page,
			blockNoteUtils,
		} ) => {
			await blockNoteUtils.addBlockWithNote( {
				type: 'core/paragraph',
				attributes: { content: 'Noted block' },
				comment: 'Test comment',
			} );

			const thread = page
				.getByRole( 'region', { name: 'Editor settings' } )
				.getByRole( 'treeitem', { name: 'Note: Test comment' } );
			const replyForm = page.getByRole( 'textbox', {
				name: 'Reply to',
			} );

			await thread.click();
			await replyForm.click();
			await replyForm.pressSequentially( 'Unsent reply' );

			await editor.canvas.getByText( 'First block' ).click();
			await expect( replyForm ).toBeHidden();

			await editor.canvas.getByText( 'Noted block' ).click();
			await expect( replyForm ).toHaveText( 'Unsent reply' );
		} );
	} );

	test.describe( 'Inline notes', () => {
		// Mirrors AVATAR_BORDER_COLORS in packages/editor/src/components/
		// collab-sidebar/utils.js. Duplicated so the test fails loudly if the
		// palette is changed without updating the e2e expectation.
		const AVATAR_BORDER_COLORS = [
			'#6F42C1',
			'#D94145',
			'#FBBF24',
			'#FF35EE',
			'#879F11',
			'#0F766E',
			'#00CFFF',
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
			blockNoteUtils,
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

			// Select all of the paragraph text so the inline path is taken:
			// "Add note" creates an inline note whenever a non-collapsed
			// rich-text selection is active, and a block-level note otherwise.
			const paragraph = editor.canvas.getByRole( 'document', {
				name: 'Block: Paragraph',
			} );
			await paragraph.click();
			await blockNoteUtils.selectBlockText();

			await editor.clickBlockOptionsMenuItem( 'Add note' );

			await page
				.getByRole( 'textbox', { name: 'New note', exact: true } )
				.fill( 'Color me' );
			await page
				.getByRole( 'region', { name: 'Editor settings' } )
				.getByRole( 'button', { name: 'Add note', exact: true } )
				.click();

			// The draft marker shows while the note is saved; wait for the
			// saved note's id so the thread focus that follows has settled.
			const mark = editor.canvas.locator( 'mark.wp-note' ).first();
			await expect( mark ).toHaveAttribute( 'data-id', /^\d+$/ );

			// Creating a note auto-selects it, which renders the marker at the
			// active opacity. Move focus to the title to deselect so the marker
			// settles back to its rest tint.
			await editor.canvas
				.getByRole( 'textbox', { name: 'Add title' } )
				.click();

			// Browsers report the per-author tint as an rgba() value with
			// alpha ≈ 0x40/255. Require an exact RGB match (the prior
			// admin-theme fallback can never satisfy it) with a small alpha
			// tolerance, and poll since the tint transitions over ~0.1s.
			await expect
				.poll( async () => {
					const bg = await mark.evaluate(
						( el ) => window.getComputedStyle( el ).backgroundColor
					);
					const m = bg.match(
						/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/
					);
					if ( ! m ) {
						return bg;
					}
					const alpha = m[ 4 ] ? Number( m[ 4 ] ) : 1;
					const isRest =
						Number( m[ 1 ] ) === r &&
						Number( m[ 2 ] ) === g &&
						Number( m[ 3 ] ) === b &&
						alpha > 0.2 &&
						alpha < 0.35;
					return isRest
						? 'rest'
						: `${ m[ 1 ] },${ m[ 2 ] },${ m[ 3 ] } a=${ alpha }`;
				} )
				.toBe( 'rest' );
		} );

		test( 'keeps the inline marker highlighted after a code-editor round-trip', async ( {
			editor,
			page,
			pageUtils,
			blockNoteUtils,
		} ) => {
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: { content: 'Round-trip me for a note.' },
			} );

			const paragraph = editor.canvas.getByRole( 'document', {
				name: 'Block: Paragraph',
			} );
			await paragraph.click();
			await blockNoteUtils.selectBlockText();

			await editor.clickBlockOptionsMenuItem( 'Add note' );
			await page
				.getByRole( 'textbox', { name: 'New note', exact: true } )
				.fill( 'Survive the toggle' );
			await page
				.getByRole( 'region', { name: 'Editor settings' } )
				.getByRole( 'button', { name: 'Add note', exact: true } )
				.click();

			// The `core/note` marker serializes as a `<mark>`; confirm it is
			// present before the round-trip.
			await expect(
				editor.canvas.locator( 'mark.wp-note' ).first()
			).toBeVisible();

			// Switch to the code editor and back. The visual editor unmounts and
			// remounts; because the marker lives in the block content (not a
			// runtime decoration), the highlight must survive the round-trip
			// rather than silently vanish. https://github.com/WordPress/gutenberg/pull/78218
			await pageUtils.pressKeys( 'secondary+M' );
			await pageUtils.pressKeys( 'secondary+M' );

			await expect(
				editor.canvas.locator( 'mark.wp-note' ).first()
			).toBeVisible();
		} );

		test( 'falls back to a block-level note when its inline marker is removed', async ( {
			editor,
			page,
			blockNoteUtils,
		} ) => {
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: { content: 'Delete my marker.' },
			} );

			const paragraph = editor.canvas.getByRole( 'document', {
				name: 'Block: Paragraph',
			} );
			await paragraph.click();
			await blockNoteUtils.selectBlockText();

			await editor.clickBlockOptionsMenuItem( 'Add note' );
			await page
				.getByRole( 'textbox', { name: 'New note', exact: true } )
				.fill( 'Anchored to text' );
			await page
				.getByRole( 'region', { name: 'Editor settings' } )
				.getByRole( 'button', { name: 'Add note', exact: true } )
				.click();

			await expect(
				editor.canvas.locator( 'mark.wp-note' ).first()
			).toBeVisible();

			const thread = page
				.getByRole( 'region', { name: 'Editor settings' } )
				.getByRole( 'treeitem', { name: 'Note: Anchored to text' } );
			await expect( thread ).toBeVisible();

			// Remove the marked text. The marker disappears, but the note must
			// not be auto-deleted: deleting a note is destructive and not easily
			// undone, unlike a content edit. Instead it falls back to a
			// block-level note, mirroring how a removed block orphans (rather
			// than deletes) its note.
			await paragraph.click();
			await blockNoteUtils.selectBlockText();
			await page.keyboard.press( 'Delete' );

			await expect( editor.canvas.locator( 'mark.wp-note' ) ).toHaveCount(
				0
			);
			await expect( thread ).toBeVisible();
		} );

		test( 'removes the inline marker when the note is deleted', async ( {
			editor,
			page,
			blockNoteUtils,
		} ) => {
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: { content: 'Delete the whole note.' },
			} );

			const paragraph = editor.canvas.getByRole( 'document', {
				name: 'Block: Paragraph',
			} );
			await paragraph.click();
			await blockNoteUtils.selectBlockText();

			await editor.clickBlockOptionsMenuItem( 'Add note' );
			await page
				.getByRole( 'textbox', { name: 'New note', exact: true } )
				.fill( 'Remove my marker on delete' );
			await page
				.getByRole( 'region', { name: 'Editor settings' } )
				.getByRole( 'button', { name: 'Add note', exact: true } )
				.click();

			await expect(
				editor.canvas.locator( 'mark.wp-note' ).first()
			).toBeVisible();

			// Deleting the note strips its inline marker from the content (rather
			// than leaving a stray highlight behind) while keeping the text.
			await blockNoteUtils.clickBlockNoteActionMenuItem( 'Delete' );
			await page
				.getByRole( 'dialog' )
				.getByRole( 'button', { name: 'Delete' } )
				.click();

			await expect( editor.canvas.locator( 'mark.wp-note' ) ).toHaveCount(
				0
			);
			await expect( paragraph ).toHaveText( 'Delete the whole note.' );
		} );

		test( 'removes the inline marker when the note is resolved', async ( {
			editor,
			page,
			blockNoteUtils,
		} ) => {
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: { content: 'Resolve this note.' },
			} );

			const paragraph = editor.canvas.getByRole( 'document', {
				name: 'Block: Paragraph',
			} );
			await paragraph.click();
			await blockNoteUtils.selectBlockText();

			await editor.clickBlockOptionsMenuItem( 'Add note' );
			await page
				.getByRole( 'textbox', { name: 'New note', exact: true } )
				.fill( 'Resolve removes my marker' );
			await page
				.getByRole( 'region', { name: 'Editor settings' } )
				.getByRole( 'button', { name: 'Add note', exact: true } )
				.click();

			await expect(
				editor.canvas.locator( 'mark.wp-note' ).first()
			).toBeVisible();

			// Resolving drops the highlight, so the marker is removed from the
			// content and the note settles back to a block-level note.
			await page.getByRole( 'button', { name: 'Resolve' } ).click();

			await expect( editor.canvas.locator( 'mark.wp-note' ) ).toHaveCount(
				0
			);
			await expect( paragraph ).toHaveText( 'Resolve this note.' );
		} );

		test( 'anchors the marker to only the selected text', async ( {
			editor,
			page,
			blockNoteUtils,
		} ) => {
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: { content: 'Hello brave new world.' },
			} );

			const paragraph = editor.canvas.getByRole( 'document', {
				name: 'Block: Paragraph',
			} );

			// Select just the word "brave" (offsets 6-11) so the inline note
			// wraps a sub-range rather than the whole block.
			await paragraph.click();
			await blockNoteUtils.selectBlockText( { start: 6, length: 5 } );

			await editor.clickBlockOptionsMenuItem( 'Add note' );
			await page
				.getByRole( 'textbox', { name: 'New note', exact: true } )
				.fill( 'Just this word' );
			await page
				.getByRole( 'region', { name: 'Editor settings' } )
				.getByRole( 'button', { name: 'Add note', exact: true } )
				.click();

			// The marker wraps only "brave", and the rest of the sentence stays
			// outside it.
			const mark = editor.canvas.locator( 'mark.wp-note' );
			await expect( mark ).toHaveCount( 1 );
			await expect( mark ).toHaveText( 'brave' );
			await expect( paragraph ).toHaveText( 'Hello brave new world.' );
		} );

		test( 'highlights the drafted text and anchors the note to it across a block switch', async ( {
			editor,
			page,
			blockNoteUtils,
		} ) => {
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: { content: 'Hello brave new world.' },
			} );
			// The middle block keeps the selected block's toolbar from
			// covering the other block's click target.
			for ( const content of [ 'Middle block', 'Another block' ] ) {
				await editor.insertBlock( {
					name: 'core/paragraph',
					attributes: { content },
				} );
			}
			const paragraph = editor.canvas.getByText(
				'Hello brave new world.'
			);
			const newNoteForm = page.getByRole( 'textbox', {
				name: 'New note',
				exact: true,
			} );
			const draftMark = editor.canvas.locator(
				'mark.wp-note[data-id="new"]'
			);

			await paragraph.click();
			await blockNoteUtils.selectBlockText( { start: 6, length: 5 } );
			await editor.clickBlockOptionsMenuItem( 'Add note' );
			await expect( draftMark ).toHaveText( 'brave' );
			await newNoteForm.pressSequentially( 'Still brave' );

			// Leaving collapses the canvas selection; the marker stays.
			await editor.canvas.getByText( 'Another block' ).click();
			await expect( newNoteForm ).toBeHidden();
			await expect( draftMark ).toHaveText( 'brave' );
			await paragraph.click();
			await expect( newNoteForm ).toHaveText( 'Still brave' );
			await page
				.getByRole( 'region', { name: 'Editor settings' } )
				.getByRole( 'button', { name: 'Add note', exact: true } )
				.click();

			const mark = editor.canvas.locator( 'mark.wp-note' );
			await expect( mark ).toHaveCount( 1 );
			await expect( mark ).toHaveText( 'brave' );
			await expect( mark ).toHaveAttribute( 'data-id', /^\d+$/ );
		} );

		test( 'removes the draft marker when the empty form is dismissed', async ( {
			editor,
			page,
			blockNoteUtils,
		} ) => {
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: { content: 'Hello brave new world.' },
			} );
			// The middle block keeps the selected block's toolbar from
			// covering the other block's click target.
			for ( const content of [ 'Middle block', 'Another block' ] ) {
				await editor.insertBlock( {
					name: 'core/paragraph',
					attributes: { content },
				} );
			}
			const paragraph = editor.canvas.getByText(
				'Hello brave new world.'
			);
			const mark = editor.canvas.locator( 'mark.wp-note' );

			await paragraph.click();
			await blockNoteUtils.selectBlockText( { start: 6, length: 5 } );
			await editor.clickBlockOptionsMenuItem( 'Add note' );
			await expect( mark ).toHaveText( 'brave' );
			await page
				.getByRole( 'region', { name: 'Editor settings' } )
				.getByRole( 'button', { name: 'Cancel' } )
				.click();
			await expect( mark ).toHaveCount( 0 );
			expect( await editor.getEditedPostContent() ).not.toContain(
				'wp-note'
			);

			// A click past the end of the text moves the caret out of the
			// marker, which closes the form.
			await paragraph.click();
			await blockNoteUtils.selectBlockText( { start: 6, length: 5 } );
			await editor.clickBlockOptionsMenuItem( 'Add note' );
			await expect( mark ).toHaveText( 'brave' );
			await paragraph.click();
			await expect( mark ).toHaveCount( 0 );

			// Selecting another block closes the form before its own
			// focus-out runs.
			await paragraph.click();
			await blockNoteUtils.selectBlockText( { start: 6, length: 5 } );
			await editor.clickBlockOptionsMenuItem( 'Add note' );
			await expect( mark ).toHaveText( 'brave' );
			await editor.canvas.getByText( 'Another block' ).click();
			await expect( mark ).toHaveCount( 0 );
		} );

		test( 'removes the draft marker when another note in the block is picked', async ( {
			editor,
			page,
			blockNoteUtils,
		} ) => {
			await blockNoteUtils.addBlockWithNote( {
				type: 'core/paragraph',
				attributes: { content: 'Hello brave new world.' },
				comment: 'Block note',
			} );
			const paragraph = editor.canvas.getByRole( 'document', {
				name: 'Block: Paragraph',
			} );
			const blockThread = page
				.getByRole( 'region', { name: 'Editor settings' } )
				.getByRole( 'treeitem', { name: 'Note: Block note' } );

			await paragraph.click();
			await blockNoteUtils.selectBlockText( { start: 6, length: 5 } );
			await editor.clickBlockOptionsMenuItem( 'Add note' );
			await expect(
				editor.canvas.locator( 'mark.wp-note[data-id="new"]' )
			).toHaveText( 'brave' );

			await blockThread.click();
			await expect( editor.canvas.locator( 'mark.wp-note' ) ).toHaveCount(
				0
			);
			expect( await editor.getEditedPostContent() ).not.toContain(
				'wp-note'
			);
		} );

		test( 'moves the draft marker to a new selection when Add note runs again', async ( {
			editor,
			page,
			blockNoteUtils,
		} ) => {
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: { content: 'Hello brave new world.' },
			} );
			const paragraph = editor.canvas.getByRole( 'document', {
				name: 'Block: Paragraph',
			} );
			const newNoteForm = page.getByRole( 'textbox', {
				name: 'New note',
				exact: true,
			} );
			const draftMark = editor.canvas.locator(
				'mark.wp-note[data-id="new"]'
			);

			await paragraph.click();
			await blockNoteUtils.selectBlockText( { start: 6, length: 5 } );
			await editor.clickBlockOptionsMenuItem( 'Add note' );
			await newNoteForm.pressSequentially( 'Second thoughts' );

			// Select a word before the marker: stepping across its boundary
			// would skew keyboard offsets.
			await paragraph.click();
			await blockNoteUtils.selectBlockText( { start: 0, length: 5 } );
			await editor.clickBlockOptionsMenuItem( 'Add note' );
			await expect( draftMark ).toHaveCount( 1 );
			await expect( draftMark ).toHaveText( 'Hello' );
			await expect( newNoteForm ).toHaveText( 'Second thoughts' );
			await page
				.getByRole( 'region', { name: 'Editor settings' } )
				.getByRole( 'button', { name: 'Add note', exact: true } )
				.click();

			const mark = editor.canvas.locator( 'mark.wp-note' );
			await expect( mark ).toHaveCount( 1 );
			await expect( mark ).toHaveText( 'Hello' );
		} );

		test( 'boosts the marker opacity when its note is selected', async ( {
			editor,
			page,
			blockNoteUtils,
		} ) => {
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: { content: 'Select my note.' },
			} );

			const paragraph = editor.canvas.getByRole( 'document', {
				name: 'Block: Paragraph',
			} );
			await paragraph.click();
			await blockNoteUtils.selectBlockText();

			await editor.clickBlockOptionsMenuItem( 'Add note' );
			await page
				.getByRole( 'textbox', { name: 'New note', exact: true } )
				.fill( 'Pick me' );
			await page
				.getByRole( 'region', { name: 'Editor settings' } )
				.getByRole( 'button', { name: 'Add note', exact: true } )
				.click();

			const mark = editor.canvas.locator( 'mark.wp-note' ).first();
			await expect( mark ).toBeVisible();

			const alphaOf = async () => {
				const bg = await mark.evaluate(
					( el ) => window.getComputedStyle( el ).backgroundColor
				);
				const match = bg.match(
					/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/
				);
				return match && match[ 4 ] ? Number( match[ 4 ] ) : 1;
			};

			// Deselect the freshly added note (focus the title) so the marker
			// drops to its rest tint (≈0x40/255).
			await editor.canvas
				.getByRole( 'textbox', { name: 'Add title' } )
				.click();
			await expect.poll( alphaOf ).toBeLessThan( 0.35 );

			// Selecting the note from the sidebar promotes its marker to the
			// stronger active alpha (≈0x80/255) via the selected-note rule.
			await page
				.getByRole( 'region', { name: 'Editor settings' } )
				.getByRole( 'treeitem', { name: 'Note: Pick me' } )
				.click();

			await expect.poll( alphaOf ).toBeGreaterThan( 0.4 );
		} );

		test( 'clicking between inline markers selects the matching note', async ( {
			editor,
			page,
			blockNoteUtils,
		} ) => {
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: { content: 'Alpha bravo charlie delta.' },
			} );

			const paragraph = editor.canvas.getByRole( 'document', {
				name: 'Block: Paragraph',
			} );

			// Two inline notes on the same paragraph, each wrapping one word.
			// addNote waits for the thread, so the second note isn't created
			// until the first has settled the (now floating) sidebar.
			async function addInlineNote( { skip, length, content } ) {
				await paragraph.click();
				await blockNoteUtils.selectBlockText( {
					start: skip,
					length,
				} );
				await blockNoteUtils.addNote( content );
			}

			// "Alpha" (offsets 0-5) and "charlie" (offsets 12-19). Wrap the
			// later word first so neither selection has to move the caret across
			// an existing marker's boundary, which adds an extra caret stop.
			await addInlineNote( {
				skip: 12,
				length: 7,
				content: 'Charlie note',
			} );
			await addInlineNote( {
				skip: 0,
				length: 5,
				content: 'Alpha note',
			} );

			const settings = page.getByRole( 'region', {
				name: 'Editor settings',
			} );
			const alphaThread = settings.getByRole( 'treeitem', {
				name: 'Note: Alpha note',
			} );
			const charlieThread = settings.getByRole( 'treeitem', {
				name: 'Note: Charlie note',
			} );
			const alphaMark = editor.canvas
				.locator( 'mark.wp-note' )
				.filter( { hasText: 'Alpha' } );
			const charlieMark = editor.canvas
				.locator( 'mark.wp-note' )
				.filter( { hasText: 'charlie' } );

			// Creating a note selects it, so the last-added note starts selected.
			await expect( alphaThread ).toHaveAttribute(
				'aria-expanded',
				'true'
			);

			// Placing the caret inside a marker syncs the open sidebar to that
			// note; clicking between the two markers flips the selection.
			await charlieMark.click();
			await expect( charlieThread ).toHaveAttribute(
				'aria-expanded',
				'true'
			);
			await expect( alphaThread ).toHaveAttribute(
				'aria-expanded',
				'false'
			);

			await alphaMark.click();
			await expect( alphaThread ).toHaveAttribute(
				'aria-expanded',
				'true'
			);
			await expect( charlieThread ).toHaveAttribute(
				'aria-expanded',
				'false'
			);
		} );

		test( 'selects no note while the caret is outside the inline highlights', async ( {
			editor,
			page,
			pageUtils,
			blockNoteUtils,
		} ) => {
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: { content: 'Alpha bravo charlie.' },
			} );
			const paragraph = editor.canvas.getByRole( 'document', {
				name: 'Block: Paragraph',
			} );
			await paragraph.click();
			await blockNoteUtils.selectBlockText( { start: 0, length: 5 } );
			await blockNoteUtils.addNote( 'Alpha note' );

			const alphaThread = page
				.getByRole( 'region', { name: 'Editor settings' } )
				.getByRole( 'treeitem', { name: 'Note: Alpha note' } );
			await expect( alphaThread ).toHaveAttribute(
				'aria-expanded',
				'true'
			);

			// The block's only note is inline, so a click past the end of its
			// text selects the block but no note.
			await paragraph.click();
			await expect( paragraph ).toBeFocused();
			await expect( alphaThread ).toHaveAttribute(
				'aria-expanded',
				'false'
			);

			// Into the marker and out again.
			await pageUtils.pressKeys( 'ArrowLeft', { times: 18 } );
			await expect( alphaThread ).toHaveAttribute(
				'aria-expanded',
				'true'
			);
			await pageUtils.pressKeys( 'ArrowRight', { times: 8 } );
			await expect( alphaThread ).toHaveAttribute(
				'aria-expanded',
				'false'
			);
		} );

		test( 'selects the block-level note when the caret leaves an inline highlight', async ( {
			editor,
			page,
			pageUtils,
			blockNoteUtils,
		} ) => {
			await blockNoteUtils.addBlockWithNote( {
				type: 'core/paragraph',
				attributes: { content: 'Alpha bravo charlie.' },
				comment: 'Block note',
			} );
			const paragraph = editor.canvas.getByRole( 'document', {
				name: 'Block: Paragraph',
			} );
			await paragraph.click();
			await blockNoteUtils.selectBlockText( { start: 0, length: 5 } );
			await blockNoteUtils.addNote( 'Alpha note' );

			const settings = page.getByRole( 'region', {
				name: 'Editor settings',
			} );
			const blockThread = settings.getByRole( 'treeitem', {
				name: 'Note: Block note',
			} );
			const alphaThread = settings.getByRole( 'treeitem', {
				name: 'Note: Alpha note',
			} );
			await expect( alphaThread ).toHaveAttribute(
				'aria-expanded',
				'true'
			);

			// Focus leaves the thread for its own block: the caret, inside the
			// marker, keeps the note selected.
			await editor.canvas
				.locator( 'mark.wp-note' )
				.filter( { hasText: 'Alpha' } )
				.click();
			await expect( alphaThread ).toHaveAttribute(
				'aria-expanded',
				'true'
			);
			await expect( blockThread ).toHaveAttribute(
				'aria-expanded',
				'false'
			);

			// Past the marker, the block-level note stands for the caret.
			await pageUtils.pressKeys( 'ArrowRight', { times: 8 } );
			await expect( blockThread ).toHaveAttribute(
				'aria-expanded',
				'true'
			);
			await expect( alphaThread ).toHaveAttribute(
				'aria-expanded',
				'false'
			);
		} );
	} );

	test( 'keeps note anchors out of the undo history', async ( {
		editor,
		page,
		pageUtils,
		blockNoteUtils,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Keep my anchor.' },
		} );
		// Start with an empty undo stack, so the shortcut can only reach the
		// note's anchor.
		await editor.saveDraft();
		await page.reload();
		await blockNoteUtils.showAllNotes();

		const paragraph = editor.canvas.getByRole( 'document', {
			name: 'Block: Paragraph',
		} );
		await paragraph.click();
		await blockNoteUtils.selectBlockText();
		await blockNoteUtils.addNote( 'Stay attached' );
		const marker = editor.canvas.locator( 'mark.wp-note' );

		// Undo doesn't detach the new note from its block.
		await pageUtils.pressKeys( 'primary+z' );
		await expect( marker ).toHaveText( 'Keep my anchor.' );
		const [ block ] = await editor.getBlocks();
		expect( block.attributes.metadata?.noteId ).toHaveLength( 1 );

		// Undo doesn't bring back the marker of a resolved note.
		await blockNoteUtils.getThread( 'Stay attached' ).click();
		await page.getByRole( 'button', { name: 'Resolve' } ).click();
		await expect( marker ).toHaveCount( 0 );
		await pageUtils.pressKeys( 'primary+z' );
		await expect( marker ).toHaveCount( 0 );
		await expect( paragraph ).toHaveText( 'Keep my anchor.' );
	} );

	test.describe( 'Restoring a deleted note', () => {
		async function addInlineNote( { editor, blockNoteUtils }, note ) {
			const paragraph = editor.canvas.getByRole( 'document', {
				name: 'Block: Paragraph',
			} );
			await paragraph.click();
			await blockNoteUtils.selectBlockText();
			await blockNoteUtils.addNote( note );
			await expect( editor.canvas.locator( 'mark.wp-note' ) ).toHaveCount(
				1
			);
		}

		async function clickUndo( blockNoteUtils ) {
			await blockNoteUtils
				.getNotice( 'Note deleted.' )
				.getByRole( 'button', { name: 'Undo' } )
				.click();
			await expect(
				blockNoteUtils.getNotice( 'Note restored.' )
			).toBeVisible();
		}

		async function getNoteIds( editor ) {
			const [ block ] = await editor.getBlocks();
			return block.attributes.metadata?.noteId;
		}

		test( 'restores the note and its inline marker from the snackbar', async ( {
			editor,
			page,
			blockNoteUtils,
		} ) => {
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: { content: 'Bring me back.' },
			} );
			await addInlineNote( { editor, blockNoteUtils }, 'Restore me' );
			const [ noteId ] = await getNoteIds( editor );

			await blockNoteUtils.deleteNote();
			await expect(
				blockNoteUtils.getThread( 'Restore me' )
			).toBeHidden();
			await expect( editor.canvas.locator( 'mark.wp-note' ) ).toHaveCount(
				0
			);
			expect( await getNoteIds( editor ) ).toBeUndefined();

			// Typing after the delete survives the restore.
			const paragraph = editor.canvas.getByRole( 'document', {
				name: 'Block: Paragraph',
			} );
			await paragraph.click();
			await blockNoteUtils.selectBlockText();
			await page.keyboard.press( 'ArrowRight' );
			await page.keyboard.type( ' More.' );

			await clickUndo( blockNoteUtils );
			await expect(
				blockNoteUtils.getThread( 'Restore me' )
			).toBeVisible();
			await expect( paragraph ).toHaveText( 'Bring me back. More.' );
			await expect(
				editor.canvas.locator( `mark.wp-note[data-id="${ noteId }"]` )
			).toHaveText( 'Bring me back.' );
			expect( await getNoteIds( editor ) ).toEqual( [ noteId ] );

			await editor.saveDraft();
			await page.reload();
			await blockNoteUtils.openBlockNoteSidebar();
			await expect(
				blockNoteUtils.getThread( 'Restore me' )
			).toBeVisible();
			await expect(
				editor.canvas.locator( `mark.wp-note[data-id="${ noteId }"]` )
			).toHaveText( 'Bring me back.' );
		} );

		test( 'does not restore the marker with the undo shortcut', async ( {
			editor,
			page,
			pageUtils,
			blockNoteUtils,
		} ) => {
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: { content: 'Undo after delete.' },
			} );
			// Start with an empty undo stack, so the shortcut can't undo the
			// block insertion instead.
			await editor.saveDraft();
			await page.reload();
			await blockNoteUtils.showAllNotes();
			await addInlineNote( { editor, blockNoteUtils }, 'Stay deleted' );

			await blockNoteUtils.deleteNote();
			await pageUtils.pressKeys( 'primary+z' );

			await expect(
				blockNoteUtils.getThread( 'Stay deleted' )
			).toBeHidden();
			await expect( editor.canvas.locator( 'mark.wp-note' ) ).toHaveCount(
				0
			);
			expect( await getNoteIds( editor ) ).toBeUndefined();

			await editor.saveDraft();
			await page.reload();
			await expect( editor.canvas.locator( 'mark.wp-note' ) ).toHaveCount(
				0
			);
			expect( await getNoteIds( editor ) ).toBeUndefined();
		} );

		test( 'enables saving after deleting and restoring a block-level note', async ( {
			editor,
			page,
			blockNoteUtils,
		} ) => {
			await blockNoteUtils.addBlockWithNote( {
				type: 'core/paragraph',
				attributes: { content: 'Saved with a note.' },
				comment: 'Saved note',
			} );
			await editor.saveDraft();
			await page.reload();
			await blockNoteUtils.openBlockNoteSidebar();
			await blockNoteUtils.getThread( 'Saved note' ).click();

			const topBar = page.getByRole( 'region', {
				name: 'Editor top bar',
			} );
			const saveDraftButton = topBar.getByRole( 'button', {
				name: 'Save draft',
			} );
			const savedButton = topBar.getByRole( 'button', { name: 'Saved' } );
			await expect( savedButton ).toBeDisabled();

			await blockNoteUtils.deleteNote();
			await expect( saveDraftButton ).toBeEnabled();
			await editor.saveDraft();
			await expect( savedButton ).toBeDisabled();

			await clickUndo( blockNoteUtils );
			await expect( saveDraftButton ).toBeEnabled();
		} );

		test( 'restores a block-level note when its text changed', async ( {
			editor,
			page,
			blockNoteUtils,
		} ) => {
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: { content: 'Change me.' },
			} );
			await addInlineNote( { editor, blockNoteUtils }, 'Text is gone' );
			const [ noteId ] = await getNoteIds( editor );

			await blockNoteUtils.deleteNote();
			const paragraph = editor.canvas.getByRole( 'document', {
				name: 'Block: Paragraph',
			} );
			await paragraph.click();
			await blockNoteUtils.selectBlockText();
			await page.keyboard.type( 'Changed.' );

			await clickUndo( blockNoteUtils );
			await expect(
				blockNoteUtils.getThread( 'Text is gone' )
			).toBeVisible();
			await expect( paragraph ).toHaveText( 'Changed.' );
			await expect( editor.canvas.locator( 'mark.wp-note' ) ).toHaveCount(
				0
			);
			expect( await getNoteIds( editor ) ).toEqual( [ noteId ] );
		} );

		test( 'does not duplicate a marker the undo shortcut brought back', async ( {
			editor,
			page,
			pageUtils,
			blockNoteUtils,
		} ) => {
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: { content: 'Typed' },
			} );
			await addInlineNote( { editor, blockNoteUtils }, 'Come back once' );
			const [ noteId ] = await getNoteIds( editor );

			// Typing after the note leaves an undo level that holds the marker.
			const paragraph = editor.canvas.getByRole( 'document', {
				name: 'Block: Paragraph',
			} );
			await paragraph.click();
			await blockNoteUtils.selectBlockText();
			await page.keyboard.press( 'ArrowRight' );
			await page.keyboard.type( 'More' );
			await expect( paragraph ).toHaveText( 'TypedMore' );

			// The caret left the marker, collapsing the thread.
			await blockNoteUtils.getThread( 'Come back once' ).click();
			await blockNoteUtils.deleteNote();
			await pageUtils.pressKeys( 'primary+z' );

			// The marker returns, but without its note it stays inert.
			const mark = editor.canvas.locator( 'mark.wp-note' );
			await expect( mark ).toHaveCount( 1 );
			await expect(
				blockNoteUtils.getThread( 'Come back once' )
			).toBeHidden();
			await expect( mark ).toHaveCSS(
				'background-color',
				'rgba(0, 0, 0, 0)'
			);

			await clickUndo( blockNoteUtils );
			await expect(
				blockNoteUtils.getThread( 'Come back once' )
			).toBeVisible();
			await expect( mark ).toHaveCount( 1 );
			expect( await getNoteIds( editor ) ).toEqual( [ noteId ] );
		} );

		test( 'restores a deleted reply', async ( {
			page,
			blockNoteUtils,
		} ) => {
			await blockNoteUtils.addBlockWithNote( {
				type: 'core/paragraph',
				attributes: { content: 'Reply to me.' },
				comment: 'Parent note',
			} );
			await blockNoteUtils.addReply( 'Restore this reply' );
			const reply = page
				.getByRole( 'region', { name: 'Editor settings' } )
				.getByText( 'Restore this reply', { exact: true } );

			await blockNoteUtils.deleteNote( 1 );
			await expect( reply ).toBeHidden();

			await clickUndo( blockNoteUtils );
			await expect( reply ).toBeVisible();
		} );

		test( 'restores a deleted orphaned note', async ( {
			editor,
			blockNoteUtils,
		} ) => {
			await blockNoteUtils.addBlockWithNote( {
				type: 'core/paragraph',
				attributes: { content: 'Orphan me.' },
				comment: 'Orphaned note',
			} );
			await editor.clickBlockOptionsMenuItem( 'Delete' );
			await blockNoteUtils.openBlockNoteSidebar();
			const thread = blockNoteUtils.getThread( 'Orphaned note' );
			await thread.click();

			await blockNoteUtils.deleteNote();
			await expect( thread ).toBeHidden();

			await clickUndo( blockNoteUtils );
			await expect( thread ).toBeVisible();
			await expect( editor.canvas.locator( 'mark.wp-note' ) ).toHaveCount(
				0
			);
		} );
	} );

	test.describe( 'Rich text formatting in the note form', () => {
		test( 'Cmd+B toggles bold in the new note textbox', async ( {
			editor,
			page,
			pageUtils,
		} ) => {
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: { content: 'Note rich text host' },
			} );
			await editor.clickBlockOptionsMenuItem( 'Add note' );
			const textbox = page.getByRole( 'textbox', {
				name: 'New note',
				exact: true,
			} );
			await textbox.click();
			await page.keyboard.type( 'hello world' );
			// Select all text and toggle bold.
			await pageUtils.pressKeys( 'primary+a' );
			await pageUtils.pressKeys( 'primary+b' );
			await expect(
				textbox.locator( 'strong' ),
				'Selection should be wrapped in <strong> after primary+b'
			).toHaveText( 'hello world' );
		} );

		test( 'Cmd+K opens the inline link popover for the selected text', async ( {
			editor,
			page,
			pageUtils,
		} ) => {
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: { content: 'Note rich text host' },
			} );
			await editor.clickBlockOptionsMenuItem( 'Add note' );
			const textbox = page.getByRole( 'textbox', {
				name: 'New note',
				exact: true,
			} );
			await textbox.click();
			await page.keyboard.type( 'visit example' );
			// Select all text in the note form.
			await pageUtils.pressKeys( 'primary+a' );

			/*
			 * Cmd+K should open the inline link UI rather than the
			 * WordPress command palette. The command palette has the
			 * "Command palette" accessible name; the inline link UI
			 * surfaces the LinkControl search combobox.
			 */
			await pageUtils.pressKeys( 'primary+k' );
			await expect(
				page.getByRole( 'combobox', {
					name: 'Search or type URL',
				} ),
				'Inline link search input should be visible'
			).toBeVisible();
			await expect(
				page.getByRole( 'dialog', { name: 'Command palette' } ),
				'Command palette should not have opened'
			).toBeHidden();

			// The popover moves focus to the search input asynchronously;
			// Escape must reach the popover rather than the reply field.
			await expect(
				page.getByRole( 'combobox', { name: 'Search or type URL' } )
			).toBeFocused();

			/*
			 * Pressing Escape closes the link popover and leaves the note
			 * form intact; focus does not get yanked out of the editor, and
			 * the selection is restored rather than left collapsed.
			 */
			await page.keyboard.press( 'Escape' );
			await expect(
				page.getByRole( 'combobox', { name: 'Search or type URL' } )
			).toBeHidden();
			await expect( textbox ).toBeFocused();
			await expect
				.poll( () =>
					page.evaluate( () => window.getSelection().toString() )
				)
				.toBe( 'visit example' );
		} );

		test( 'Cmd+K opens an unclipped link popover in the reply form', async ( {
			page,
			pageUtils,
			blockNoteUtils,
		} ) => {
			await blockNoteUtils.addBlockWithNote( {
				type: 'core/paragraph',
				attributes: { content: 'Reply link host' },
				comment: 'Reply link note',
			} );
			const replyTextbox = page.getByRole( 'textbox', {
				name: 'Reply to',
			} );
			await replyTextbox.click();
			await page.keyboard.type( 'visit example' );
			await pageUtils.pressKeys( 'primary+a' );
			await pageUtils.pressKeys( 'primary+k' );

			/*
			 * The link popover portals out of the note card. Focus moving
			 * into it must not deselect the thread (which would unmount the
			 * reply form and the popover with it), and the popover must not
			 * be clipped by the note card's overflow: it has to lie fully
			 * within the viewport.
			 */
			const linkInput = page.getByRole( 'combobox', {
				name: 'Search or type URL',
			} );
			await expect(
				linkInput,
				'Inline link search input should be visible'
			).toBeVisible();
			await expect( replyTextbox ).toBeVisible();

			const inputBox = await linkInput.boundingBox();
			const viewport = page.viewportSize();
			expect( inputBox.x ).toBeGreaterThanOrEqual( 0 );
			expect( inputBox.x + inputBox.width ).toBeLessThanOrEqual(
				viewport.width
			);

			// The popover moves focus to the search input asynchronously;
			// Escape must reach the popover rather than the reply field.
			await expect( linkInput ).toBeFocused();

			// Escape closes the popover and keeps the reply form intact.
			await page.keyboard.press( 'Escape' );
			await expect( linkInput ).toBeHidden();
			await expect( replyTextbox ).toBeVisible();
		} );

		test( 'backtick wrapping applies core/code inline format', async ( {
			editor,
			page,
		} ) => {
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: { content: 'Note rich text host' },
			} );
			await editor.clickBlockOptionsMenuItem( 'Add note' );
			const textbox = page.getByRole( 'textbox', {
				name: 'New note',
				exact: true,
			} );
			await textbox.click();
			/*
			 * Typing `code` (backtick-wrapped) should auto-apply
			 * `core/code`'s inline format via its `__unstableInputRule`.
			 */
			await page.keyboard.type( '`code` after' );
			await expect( textbox.locator( 'code' ) ).toHaveText( 'code' );
		} );
	} );

	test.describe( 'Mentions in the note form', () => {
		let mentionedUserId;

		test.beforeAll( async ( { requestUtils } ) => {
			const user = await requestUtils.createUser( {
				username: 'notementions',
				email: 'notementions@example.com',
				firstName: 'Mentionable',
				lastName: 'Teammate',
				password: 'iLoVeE2EtEsTs',
			} );
			mentionedUserId = user.id;
		} );

		test.afterAll( async ( { requestUtils } ) => {
			await requestUtils.deleteAllUsers();
		} );

		test( 'inserts a mention chip that survives saving the note', async ( {
			editor,
			page,
		} ) => {
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: { content: 'Mention host' },
			} );
			await editor.clickBlockOptionsMenuItem( 'Add note' );
			const textbox = page.getByRole( 'textbox', {
				name: 'New note',
				exact: true,
			} );
			await textbox.click();
			await page.keyboard.type( 'Ping @' );

			await expect( page.getByRole( 'listbox' ) ).toBeVisible();

			// Narrow the suggestions and pick the teammate.
			await page.keyboard.type( 'Menti' );
			await expect(
				page.getByRole( 'option', {
					name: 'Mentionable Teammate',
					selected: true,
				} )
			).toBeVisible();
			await page.keyboard.press( 'Enter' );

			/*
			 * The completer inserts the mention as a chip: a `span` (not a
			 * link, so the Link format UI cannot break it) whose `user-N`
			 * class carries the mentioned user's ID.
			 */
			const mentionClasses = new RegExp(
				`^wp-note-mention user-${ mentionedUserId }$`
			);
			const draftChip = textbox.locator( 'span.wp-note-mention' );
			await expect( draftChip ).toHaveText( '@Mentionable Teammate' );
			await expect( draftChip ).toHaveClass( mentionClasses );

			await page.keyboard.type( 'please review' );
			await page
				.getByRole( 'region', { name: 'Editor settings' } )
				.getByRole( 'button', { name: 'Add note', exact: true } )
				.click();

			/*
			 * The saved thread renders the content returned by the REST API,
			 * so an intact chip here proves the mention markup survived
			 * server-side sanitization.
			 */
			const savedChip = page
				.getByRole( 'region', { name: 'Editor settings' } )
				.getByRole( 'treeitem' )
				.locator( 'span.wp-note-mention' );
			await expect( savedChip ).toHaveText( '@Mentionable Teammate' );
			await expect( savedChip ).toHaveClass( mentionClasses );
		} );

		test( 'can cancel mentions popover', async ( { editor, page } ) => {
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: { content: 'Mention host' },
			} );
			await editor.clickBlockOptionsMenuItem( 'Add note' );
			const textbox = page.getByRole( 'textbox', {
				name: 'New note',
				exact: true,
			} );
			await textbox.pressSequentially( 'Ping @' );

			await expect( page.getByRole( 'listbox' ) ).toBeVisible();
			await page.keyboard.press( 'Escape' );
			await expect( page.getByRole( 'listbox' ) ).toBeHidden();
			await expect( textbox ).toBeFocused();
		} );
	} );
} );
