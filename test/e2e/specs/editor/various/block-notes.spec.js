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
} );

test.describe( 'Multiple notes per block', () => {
	test( 'can add multiple notes to the same block', async ( {
		editor,
		page,
		blockNoteUtils,
	} ) => {
		// Add a block with the first note.
		await blockNoteUtils.addBlockWithNote( {
			type: 'core/paragraph',
			attributes: { content: 'Block with multiple notes' },
			comment: 'First note on block',
		} );

		// Dismiss the first "Note added." snackbar so it won't interfere
		// with the second note's snackbar check.
		await page
			.getByRole( 'button', { name: 'Dismiss this notice' } )
			.filter( { hasText: 'Note added.' } )
			.click();

		// Click "Add note" again to add a second note.
		await editor.clickBlockOptionsMenuItem( 'Add note' );

		// Verify the new note form is shown (not the reply form).
		const newNoteForm = page.getByRole( 'textbox', {
			name: 'New note',
			exact: true,
		} );
		await expect( newNoteForm ).toBeFocused();

		// Add the second note.
		await newNoteForm.fill( 'Second note on block' );
		await page
			.getByRole( 'region', { name: 'Editor settings' } )
			.getByRole( 'button', { name: 'Add note', exact: true } )
			.click();

		// Verify both notes are visible as separate threads.
		const firstThread = page
			.getByRole( 'region', { name: 'Editor settings' } )
			.getByRole( 'treeitem', { name: 'Note: First note on block' } );
		const secondThread = page
			.getByRole( 'region', { name: 'Editor settings' } )
			.getByRole( 'treeitem', { name: 'Note: Second note on block' } );

		await expect( firstThread ).toBeVisible();
		await expect( secondThread ).toBeVisible();

		// Verify "Note added." (not "Reply added.").
		await expect(
			page
				.getByRole( 'button', { name: 'Dismiss this notice' } )
				.filter( { hasText: 'Note added.' } )
		).toBeVisible();
	} );

	test( 'multiple notes on same block are stored as array in metadata', async ( {
		editor,
		page,
		blockNoteUtils,
	} ) => {
		await blockNoteUtils.addBlockWithNote( {
			type: 'core/paragraph',
			attributes: { content: 'Block with multiple notes' },
			comment: 'First note',
		} );
		// Dismiss the first "Note added." so the second toast can be asserted.
		await blockNoteUtils.dismissSnackbar( 'Note added.' );

		await blockNoteUtils.addAnotherNoteToCurrentBlock( 'Second note' );

		await expect(
			page
				.getByRole( 'button', { name: 'Dismiss this notice' } )
				.filter( { hasText: 'Note added.' } )
		).toBeVisible();

		// Verify noteId is an array with 2 elements.
		const blocks = await editor.getBlocks();
		const paragraphBlock = blocks.find(
			( b ) => b.name === 'core/paragraph'
		);
		const noteIds = paragraphBlock?.attributes?.metadata?.noteId;

		expect( Array.isArray( noteIds ) ).toBe( true );
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
		await blockNoteUtils.dismissSnackbar( 'Note added.' );

		await blockNoteUtils.addAnotherNoteToCurrentBlock( 'Note to delete' );

		await expect(
			page
				.getByRole( 'button', { name: 'Dismiss this notice' } )
				.filter( { hasText: 'Note added.' } )
		).toBeVisible();

		// Both notes should be visible.
		const settings = page.getByRole( 'region', {
			name: 'Editor settings',
		} );
		await expect(
			settings.getByRole( 'treeitem', { name: 'Note: Note to keep' } )
		).toBeVisible();
		await expect(
			settings.getByRole( 'treeitem', { name: 'Note: Note to delete' } )
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
			settings.getByRole( 'treeitem', { name: 'Note: Note to delete' } )
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
		await blockNoteUtils.dismissSnackbar( 'Note added.' );

		await blockNoteUtils.addAnotherNoteToCurrentBlock( 'Note B' );

		await expect(
			page
				.getByRole( 'button', { name: 'Dismiss this notice' } )
				.filter( { hasText: 'Note added.' } )
		).toBeVisible();

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
		await blockNoteUtils.dismissSnackbar( 'Note added.' );

		await blockNoteUtils.addAnotherNoteToCurrentBlock( 'Second note' );

		await expect(
			page
				.getByRole( 'button', { name: 'Dismiss this notice' } )
				.filter( { hasText: 'Note added.' } )
		).toBeVisible();

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
		await expect( secondThread ).toHaveAttribute( 'aria-expanded', 'true' );
	} );

	test( 'metadata noteId is cleaned up when all notes are deleted from a block', async ( {
		editor,
		page,
		blockNoteUtils,
	} ) => {
		await blockNoteUtils.addBlockWithNote( {
			type: 'core/paragraph',
			attributes: { content: 'Block to clear notes' },
			comment: 'Only note',
		} );

		const settings = page.getByRole( 'region', {
			name: 'Editor settings',
		} );
		const thread = settings.getByRole( 'treeitem', {
			name: 'Note: Only note',
		} );
		await thread.click();
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

		// noteId should be cleaned up from metadata entirely.
		const blocks = await editor.getBlocks();
		const paragraphBlock = blocks.find(
			( b ) => b.name === 'core/paragraph'
		);
		expect( paragraphBlock?.attributes?.metadata?.noteId ).toBeUndefined();
	} );

	test( 'lazy-migrates a legacy scalar noteId to an array when a second note is added', async ( {
		editor,
		page,
	} ) => {
		// Insert a block whose metadata already carries a scalar noteId, the
		// shape produced by older code before multi-note support shipped. The
		// orphan id (999) does not correspond to a real thread; the test
		// asserts that the lazy migration in addNoteIdToMetadata preserves it
		// rather than silently dropping it on first write.
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: {
				content: 'Block with legacy scalar noteId',
				metadata: { noteId: 999 },
			},
		} );

		await editor.clickBlockOptionsMenuItem( 'Add note' );
		await page
			.getByRole( 'textbox', { name: 'New note', exact: true } )
			.fill( 'New multi-note era note' );
		await page
			.getByRole( 'region', { name: 'Editor settings' } )
			.getByRole( 'button', { name: 'Add note', exact: true } )
			.click();
		await expect(
			page
				.getByRole( 'button', { name: 'Dismiss this notice' } )
				.filter( { hasText: 'Note added.' } )
		).toBeVisible();

		const blocks = await editor.getBlocks();
		const paragraphBlock = blocks.find(
			( b ) => b.name === 'core/paragraph'
		);
		const noteIds = paragraphBlock?.attributes?.metadata?.noteId;

		expect( Array.isArray( noteIds ) ).toBe( true );
		expect( noteIds ).toHaveLength( 2 );
		// Legacy id is preserved as the first entry; the new note id is appended.
		expect( noteIds[ 0 ] ).toBe( 999 );
		expect( typeof noteIds[ 1 ] ).toBe( 'number' );
		expect( noteIds[ 1 ] ).not.toBe( 999 );
	} );

	test( 'multi-note metadata persists across save and reload', async ( {
		editor,
		page,
		blockNoteUtils,
	} ) => {
		await blockNoteUtils.addBlockWithNote( {
			type: 'core/paragraph',
			attributes: { content: 'Block with persisted notes' },
			comment: 'Persisted note A',
		} );
		await blockNoteUtils.dismissSnackbar( 'Note added.' );

		await blockNoteUtils.addAnotherNoteToCurrentBlock( 'Persisted note B' );
		await expect(
			page
				.getByRole( 'button', { name: 'Dismiss this notice' } )
				.filter( { hasText: 'Note added.' } )
		).toBeVisible();

		const beforeIds = ( await editor.getBlocks() ).find(
			( b ) => b.name === 'core/paragraph'
		)?.attributes?.metadata?.noteId;
		expect( beforeIds ).toHaveLength( 2 );

		await editor.saveDraft();
		await page.reload();

		// After reload, both threads should reattach to the block.
		const settings = page.getByRole( 'region', {
			name: 'Editor settings',
		} );
		await expect(
			settings.getByRole( 'treeitem', { name: 'Note: Persisted note A' } )
		).toBeVisible();
		await expect(
			settings.getByRole( 'treeitem', { name: 'Note: Persisted note B' } )
		).toBeVisible();

		// Metadata should still be in array form, with the same ids in the
		// same order — the round-trip through serialize/parse must not lose
		// or reorder the array.
		const afterIds = ( await editor.getBlocks() ).find(
			( b ) => b.name === 'core/paragraph'
		)?.attributes?.metadata?.noteId;
		expect( Array.isArray( afterIds ) ).toBe( true );
		expect( afterIds ).toEqual( beforeIds );
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

	async dismissSnackbar( text ) {
		await this.#page
			.getByRole( 'button', { name: 'Dismiss this notice' } )
			.filter( { hasText: text } )
			.click();
	}

	async addAnotherNoteToCurrentBlock( content ) {
		await this.#editor.clickBlockOptionsMenuItem( 'Add note' );
		await this.#page
			.getByRole( 'textbox', { name: 'New note', exact: true } )
			.fill( content );
		await this.#page
			.getByRole( 'region', { name: 'Editor settings' } )
			.getByRole( 'button', { name: 'Add note', exact: true } )
			.click();
	}
}
