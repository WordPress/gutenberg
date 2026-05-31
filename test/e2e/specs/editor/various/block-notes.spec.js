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

	test.describe( 'Emoji Reactions', () => {
		test( 'can add an emoji reaction to a note', async ( {
			page,
			blockNoteUtils,
		} ) => {
			await blockNoteUtils.addBlockWithNote( {
				type: 'core/paragraph',
				attributes: { content: 'Testing emoji reactions' },
				comment: 'Test comment for reactions',
			} );

			await blockNoteUtils.addReactionToComment( 'Heart' );

			await expect(
				page
					.getByRole( 'button', { name: 'Dismiss this notice' } )
					.filter( { hasText: 'Reaction added.' } )
			).toBeVisible();

			// Verify the reaction button appears with count.
			const reactionButton = page.locator(
				'.editor-collab-sidebar-panel__reaction-button'
			);
			await expect( reactionButton ).toBeVisible();
			await expect( reactionButton ).toContainText( '1' );
		} );

		test( 'can re-add the same reaction after removing it', async ( {
			page,
			blockNoteUtils,
		} ) => {
			await blockNoteUtils.addBlockWithNote( {
				type: 'core/paragraph',
				attributes: { content: 'Testing re-add reaction' },
				comment: 'Re-add reaction',
			} );

			await blockNoteUtils.addReactionToComment( 'Heart' );
			const reactionButton = page.locator(
				'.editor-collab-sidebar-panel__reaction-button'
			);
			await expect( reactionButton ).toBeVisible();
			await expect( reactionButton ).toContainText( '1' );

			// Remove the reaction.
			await reactionButton.click();
			await expect( reactionButton ).toBeHidden();
			await expect(
				page
					.getByRole( 'button', { name: 'Dismiss this notice' } )
					.filter( { hasText: 'Reaction removed.' } )
			).toBeVisible();

			// Add the same reaction again. This used to fail two ways:
			// 1) the parent note's cached `reaction_summary` still
			//    reported the removed heart as `reacted`, so the toggle
			//    attempted to delete a now-missing comment record
			//    instead of routing to add; and 2) the server's
			//    duplicate-reaction guard included trashed comments,
			//    so the just-removed reaction blocked the re-add with
			//    `rest_comment_duplicate_reaction` ("You have already
			//    reacted with this emoji").
			await blockNoteUtils.addReactionToComment( 'Heart' );
			await expect( reactionButton ).toBeVisible();
			await expect( reactionButton ).toContainText( '❤' );
			await expect( reactionButton ).toContainText( '1' );

			// Both adds must have surfaced a success snackbar (initial
			// add + re-add), and the duplicate-reaction error must
			// never appear — pins both fixes (client refetch + server
			// status='approve' query) against regression.
			await expect(
				page
					.getByRole( 'button', { name: 'Dismiss this notice' } )
					.filter( { hasText: 'Reaction added.' } )
			).toHaveCount( 2 );
			await expect(
				page.locator( '.components-snackbar__content', {
					hasText: /already reacted/i,
				} )
			).toHaveCount( 0 );
		} );

		test( 'can remove own emoji reaction by clicking it', async ( {
			page,
			blockNoteUtils,
		} ) => {
			await blockNoteUtils.addBlockWithNote( {
				type: 'core/paragraph',
				attributes: { content: 'Testing reaction removal' },
				comment: 'Test comment for removing reactions',
			} );

			// Add a reaction.
			await blockNoteUtils.addReactionToComment( 'Heart' );
			await expect(
				page
					.getByRole( 'button', { name: 'Dismiss this notice' } )
					.filter( { hasText: 'Reaction added.' } )
			).toBeVisible();

			// Click the reaction to remove it.
			const reactionButton = page.locator(
				'.editor-collab-sidebar-panel__reaction-button'
			);
			await reactionButton.click();

			await expect(
				page
					.getByRole( 'button', { name: 'Dismiss this notice' } )
					.filter( { hasText: 'Reaction removed.' } )
			).toBeVisible();

			// Verify the reaction button is no longer visible.
			await expect( reactionButton ).toBeHidden();
		} );

		test( 'can see reaction tooltip on hover', async ( {
			page,
			blockNoteUtils,
		} ) => {
			await blockNoteUtils.addBlockWithNote( {
				type: 'core/paragraph',
				attributes: { content: 'Testing reaction tooltip' },
				comment: 'Test comment for reaction tooltip',
			} );

			// Add a reaction.
			await blockNoteUtils.addReactionToComment( 'Celebration' );
			await expect(
				page
					.getByRole( 'button', { name: 'Dismiss this notice' } )
					.filter( { hasText: 'Reaction added.' } )
			).toBeVisible();

			// Hover over the reaction button to trigger tooltip.
			const reactionButton = page.locator(
				'.editor-collab-sidebar-panel__reaction-button'
			);
			await reactionButton.hover();

			// Verify the tooltip is visible and contains expected text.
			const tooltip = page.getByRole( 'tooltip' );
			await expect( tooltip ).toBeVisible();
			await expect( tooltip ).toContainText( 'reacted with' );
			await expect( tooltip ).toContainText( 'Celebration' );
		} );

		test( 'reaction buttons are keyboard accessible', async ( {
			page,
			blockNoteUtils,
		} ) => {
			await blockNoteUtils.addBlockWithNote( {
				type: 'core/paragraph',
				attributes: { content: 'Testing keyboard accessibility' },
				comment: 'Test comment for keyboard access',
			} );

			// Open the emoji picker with keyboard.
			const addReactionButton = page.getByRole( 'button', {
				name: 'Add reaction',
			} );
			await addReactionButton.focus();
			await page.keyboard.press( 'Enter' );

			// Verify the picker is visible.
			const emojiPicker = page.locator(
				'.editor-collab-sidebar-panel__emoji-picker'
			);
			await expect( emojiPicker ).toBeVisible();

			// Navigate with arrow keys and select. The picker is a horizontal
			// listbox, so ArrowRight moves to the next option.
			const firstEmoji = emojiPicker.getByRole( 'option' ).first();
			await firstEmoji.focus();
			await page.keyboard.press( 'ArrowRight' );
			await page.keyboard.press( 'Enter' );

			await expect(
				page
					.getByRole( 'button', { name: 'Dismiss this notice' } )
					.filter( { hasText: 'Reaction added.' } )
			).toBeVisible();
		} );

		test( 'can add multiple different reactions to same note', async ( {
			page,
			blockNoteUtils,
		} ) => {
			await blockNoteUtils.addBlockWithNote( {
				type: 'core/paragraph',
				attributes: { content: 'Testing multiple reactions' },
				comment: 'Test comment for multiple reactions',
			} );

			// Add first reaction.
			await blockNoteUtils.addReactionToComment( 'Smile' );
			await expect(
				page
					.getByRole( 'button', { name: 'Dismiss this notice' } )
					.filter( { hasText: 'Reaction added.' } )
			).toBeVisible();

			// Add second reaction.
			await blockNoteUtils.addReactionToComment( 'Rocket' );
			await expect(
				page
					.getByRole( 'button', { name: 'Dismiss this notice' } )
					.filter( { hasText: 'Reaction added.' } )
			).toBeVisible();

			// Verify both reactions are visible.
			const reactionButtons = page.locator(
				'.editor-collab-sidebar-panel__reaction-button'
			);
			await expect( reactionButtons ).toHaveCount( 2 );
		} );

		test( 'can open the full emoji picker via the + button', async ( {
			page,
			blockNoteUtils,
		} ) => {
			await blockNoteUtils.addBlockWithNote( {
				type: 'core/paragraph',
				attributes: { content: 'Testing full emoji picker' },
				comment: 'Open the full picker',
			} );

			await page.getByRole( 'button', { name: 'More emojis' } ).click();

			await blockNoteUtils.waitForFullPicker();

			// The search field is present.
			await expect(
				page.getByPlaceholder( 'Search emoji' )
			).toBeVisible();
		} );

		test( 'a full-picker pick that matches a curated emoji stores as the curated slug', async ( {
			page,
			blockNoteUtils,
		} ) => {
			await blockNoteUtils.addBlockWithNote( {
				type: 'core/paragraph',
				attributes: { content: 'Curated normalization' },
				comment: 'Pick heart from full picker',
			} );

			// Open the full picker and click the plain heart specifically.
			// "Heart" is a label-overridden curated reaction; the helper's
			// regex-based gridcell lookup would otherwise pick up the
			// first "heart"-containing label (e.g. "smiling face with
			// hearts") instead of the curated red heart.
			await page.getByRole( 'button', { name: 'More emojis' } ).click();
			await blockNoteUtils.waitForFullPicker();
			await page.getByPlaceholder( 'Search emoji' ).fill( 'Heart' );
			await page
				.getByRole( 'gridcell', { name: 'Heart', exact: true } )
				.click();

			await expect(
				page
					.getByRole( 'button', { name: 'Dismiss this notice' } )
					.filter( { hasText: 'Reaction added.' } )
			).toBeVisible();

			// The same reaction button shape that the curated row produces
			// — contains the heart emoji and a count of 1. If storage
			// normalization were broken we'd get a stray hex-key button.
			const reactionButton = page.locator(
				'.editor-collab-sidebar-panel__reaction-button'
			);
			await expect( reactionButton ).toHaveCount( 1 );
			await expect( reactionButton ).toContainText( '❤' );
			await expect( reactionButton ).toContainText( '1' );
		} );

		test( 'a full-picker pick that is not curated renders the chosen emoji', async ( {
			page,
			blockNoteUtils,
		} ) => {
			await blockNoteUtils.addBlockWithNote( {
				type: 'core/paragraph',
				attributes: { content: 'Non-curated emoji' },
				comment: 'Pick thumbs up from full picker',
			} );

			await blockNoteUtils.pickFullPickerEmojiBySearch( 'thumbs up' );

			await expect(
				page
					.getByRole( 'button', { name: 'Dismiss this notice' } )
					.filter( { hasText: 'Reaction added.' } )
			).toBeVisible();

			const reactionButton = page.locator(
				'.editor-collab-sidebar-panel__reaction-button'
			);
			await expect( reactionButton ).toHaveCount( 1 );
			await expect( reactionButton ).toContainText( '👍' );
		} );

		test( 'pressing Escape closes the full-picker popover', async ( {
			page,
			blockNoteUtils,
		} ) => {
			await blockNoteUtils.addBlockWithNote( {
				type: 'core/paragraph',
				attributes: { content: 'Escape closes picker' },
				comment: 'Close picker with Escape',
			} );

			await page.getByRole( 'button', { name: 'More emojis' } ).click();
			await blockNoteUtils.waitForFullPicker();

			await page.keyboard.press( 'Escape' );

			await expect(
				page.getByPlaceholder( 'Search emoji' )
			).toBeHidden();
		} );

		test( 'full picker shows the empty state when search has no matches', async ( {
			page,
			blockNoteUtils,
		} ) => {
			await blockNoteUtils.addBlockWithNote( {
				type: 'core/paragraph',
				attributes: { content: 'Search empty state' },
				comment: 'Empty search state',
			} );

			await page.getByRole( 'button', { name: 'More emojis' } ).click();
			await blockNoteUtils.waitForFullPicker();

			// A query no Emojibase label/tag matches.
			await page
				.getByPlaceholder( 'Search emoji' )
				.fill( 'zzzzzznoresults' );

			// The grid is replaced by an empty-state status message…
			await expect(
				page.locator( '.editor-collab-sidebar-panel__picker-status' )
			).toContainText( 'No emoji found.' );
			// …and no gridcells remain in the DOM.
			await expect(
				page.locator( '.editor-collab-sidebar-panel__picker-emoji' )
			).toHaveCount( 0 );
		} );

		test( 'reaction picker portals outside the collab sidebar', async ( {
			page,
			blockNoteUtils,
		} ) => {
			await blockNoteUtils.addBlockWithNote( {
				type: 'core/paragraph',
				attributes: { content: 'Testing popover portal' },
				comment: 'Popover portal',
			} );

			await page.getByRole( 'button', { name: 'Add reaction' } ).click();

			const popover = page.locator(
				'.editor-collab-sidebar-panel__add-reaction-popover'
			);
			await expect( popover ).toBeVisible();

			// The popover must portal out of the sidebar; otherwise the
			// `overflow: hidden` chain on `.editor-collab-sidebar-panel`
			// (and the framework `.interface-interface-skeleton__sidebar`)
			// would clip the picker. Pin the contract by asserting the
			// popover has no sidebar-panel ancestor.
			await expect( popover ).toHaveCount( 1 );
			const isPortaled = await popover.evaluate(
				( el ) => ! el.closest( '.editor-collab-sidebar-panel' )
			);
			expect( isPortaled ).toBe( true );
		} );

		test( 'note remains selected while reaction picker is open', async ( {
			page,
			blockNoteUtils,
		} ) => {
			await blockNoteUtils.addBlockWithNote( {
				type: 'core/paragraph',
				attributes: { content: 'Testing selection persistence' },
				comment: 'Selection persistence',
			} );

			const thread = page.getByRole( 'treeitem', {
				name: /Note: Selection persistence/,
			} );
			await expect( thread ).toHaveAttribute( 'aria-expanded', 'true' );

			await page.getByRole( 'button', { name: 'Add reaction' } ).click();
			await expect(
				page.locator( '.editor-collab-sidebar-panel__emoji-picker' )
			).toBeVisible();

			// Focus has moved into the portaled popover, but the note's
			// onBlur handler exempts `.components-popover` so the thread
			// stays selected and the trigger stays mounted.
			await expect( thread ).toHaveAttribute( 'aria-expanded', 'true' );
		} );

		test( 'full-picker popover wraps tightly to the picker width', async ( {
			page,
			blockNoteUtils,
		} ) => {
			await blockNoteUtils.addBlockWithNote( {
				type: 'core/paragraph',
				attributes: { content: 'Testing tight popover layout' },
				comment: 'Tight layout',
			} );

			await page.getByRole( 'button', { name: 'More emojis' } ).click();
			await blockNoteUtils.waitForFullPicker();

			const popover = page.locator(
				'.editor-collab-sidebar-panel__picker-popover'
			);
			const picker = page.locator(
				'.editor-collab-sidebar-panel__picker'
			);

			const popoverBox = await popover.boundingBox();
			const pickerBox = await picker.boundingBox();

			// Popover wrapper must wrap tightly to the picker. If the
			// popover is wider, the surface background renders as a
			// visible band beside the picker.
			expect(
				Math.abs( popoverBox.width - pickerBox.width )
			).toBeLessThanOrEqual( 1 );
		} );

		test( 'emoji grid fills the picker width', async ( {
			page,
			blockNoteUtils,
		} ) => {
			await blockNoteUtils.addBlockWithNote( {
				type: 'core/paragraph',
				attributes: { content: 'Testing grid fills picker' },
				comment: 'Grid fill',
			} );

			await page.getByRole( 'button', { name: 'More emojis' } ).click();
			await blockNoteUtils.waitForFullPicker();

			const picker = page.locator(
				'.editor-collab-sidebar-panel__picker'
			);
			const lastEmojiInFirstRow = page
				.locator( '.editor-collab-sidebar-panel__picker-row' )
				.first()
				.locator( '.editor-collab-sidebar-panel__picker-emoji' )
				.last();

			const pickerBox = await picker.boundingBox();
			const emojiBox = await lastEmojiInFirstRow.boundingBox();
			const horizontalSlack =
				pickerBox.x + pickerBox.width - ( emojiBox.x + emojiBox.width );

			// Last emoji in a full row should sit close to the picker's
			// right edge. Tolerance allows for viewport padding (4px)
			// plus a reserved scrollbar gutter (~17px on most
			// platforms). Catches regressions where the picker is sized
			// wider than the emoji grid (buttons fill only the left
			// fraction, with a large empty band to the right — the
			// original bug had ~145px of slack).
			expect( horizontalSlack ).toBeLessThanOrEqual( 24 );
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
				await this.#editor.clickBlockOptionsMenuItem( 'Add note' );
				await this.#page
					.getByRole( 'textbox', {
						name: 'New note',
						exact: true,
					} )
					.fill( comment );
				await this.#page
					.getByRole( 'region', { name: 'Editor settings' } )
					.getByRole( 'button', { name: 'Add note', exact: true } )
					.click();
				await expect(
					this.#page
						.getByRole( 'region', {
							name: 'Editor settings',
						} )
						.getByRole( 'treeitem', {
							name: `Note: ${ comment }`,
						} )
				).toBeVisible();
			},
			{ box: true }
		);
	}

	async clickBlockNoteActionMenuItem( actionName, index = 0 ) {
		await this.#page
			.getByRole( 'region', { name: 'Editor settings' } )
			.getByRole( 'button', { name: 'Actions' } )
			.nth( index )
			.click();
		await this.#page.getByRole( 'menuitem', { name: actionName } ).click();
	}

	async addReactionToComment( emoji ) {
		await this.#page
			.getByRole( 'button', { name: 'Add reaction' } )
			.click();

		// Wait for the emoji picker popover to appear.
		const emojiPicker = this.#page.locator(
			'.editor-collab-sidebar-panel__emoji-picker'
		);
		await expect( emojiPicker ).toBeVisible();

		// Click the specific emoji within the picker.
		await emojiPicker
			.getByRole( 'option', { name: new RegExp( emoji, 'i' ) } )
			.click();
	}

	/**
	 * Wait for the full emoji picker to finish loading its Emojibase
	 * data and render at least one emoji button. The grid / gridcell
	 * roles are stable across className changes.
	 */
	async waitForFullPicker() {
		await expect(
			this.#page.getByPlaceholder( 'Search emoji' )
		).toBeVisible();
		await expect(
			this.#page.getByRole( 'grid' ).getByRole( 'gridcell' ).first()
		).toBeVisible();
	}

	/**
	 * Click the + button to open the full emoji picker, search by name,
	 * and click the first matching emoji.
	 *
	 * @param {string} search Search term (matched against Emojibase
	 *                        labels, e.g. "red heart" or "thumbs up").
	 */
	async pickFullPickerEmojiBySearch( search ) {
		await this.#page.getByRole( 'button', { name: 'More emojis' } ).click();
		await this.waitForFullPicker();

		await this.#page.getByPlaceholder( 'Search emoji' ).fill( search );

		// Wait for the search to actually filter. Each gridcell exposes
		// the emoji label as its accessible name, so once the first cell
		// carries a name matching `search` we know the grid has finished
		// re-laying-out.
		const match = this.#page
			.getByRole( 'gridcell', { name: new RegExp( search, 'i' ) } )
			.first();
		await expect( match ).toBeVisible();
		await match.click();
	}
}
