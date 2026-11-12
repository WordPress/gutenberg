const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );
const {
	BlockNoteUtils,
	getAuthorTint,
	getThreadToggle,
} = require( './block-notes-utils' );

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
		await blockNoteUtils.insertBlockWithNote( {
			content: 'Howdy!',
			note: 'Test comment',
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

	test( 'shows the toolbar button once the post has a note', async ( {
		editor,
		page,
		blockNoteUtils,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'First block' },
		} );
		const addNoteButton = page
			.getByRole( 'toolbar', { name: 'Block tools' } )
			.getByRole( 'button', { name: 'Add note', exact: true } );

		await expect(
			page
				.getByRole( 'toolbar', { name: 'Block tools' } )
				.getByRole( 'button', { name: 'Options' } )
		).toBeVisible();
		await expect( addNoteButton ).toBeHidden();

		await blockNoteUtils.addNote( 'First note' );
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Second block' },
		} );

		await expect( addNoteButton ).toBeVisible();
		await addNoteButton.click();
		await expect(
			page.getByRole( 'textbox', { name: 'New note', exact: true } )
		).toBeFocused();

		await test.step( 'Hints at the notes a block already has', async () => {
			await editor.selectBlocks(
				editor.canvas
					.getByRole( 'document', { name: 'Block: Paragraph' } )
					.filter( { hasText: 'First block' } )
			);
			const hintedButton = page
				.getByRole( 'toolbar', { name: 'Block tools' } )
				.getByRole( 'button', {
					name: 'Add note (1 note)',
					exact: true,
				} );
			await expect( hintedButton ).toBeVisible();
			await expect( hintedButton ).toHaveText( '' );
		} );
	} );

	test( 'can add a note to a block', async ( {
		editor,
		page,
		blockNoteUtils,
	} ) => {
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
		const thread = blockNoteUtils.getThread( 'A test comment' );

		await expect( thread ).toBeVisible();
		// Should focus the newly added note thread.
		await expect( getThreadToggle( thread ) ).toBeFocused();
		await expect( thread ).toHaveClass( /is-selected/ );
		// Screen readers handle a label on a list item inconsistently, so
		// the thread is announced from its content instead.
		await expect( thread ).not.toHaveAttribute( 'aria-label' );
	} );

	test( 'can reply to a block note', async ( { page, blockNoteUtils } ) => {
		await blockNoteUtils.insertBlockWithNote( {
			content: 'Testing block comments',
			note: 'Test comment',
		} );
		const replyTextbox = page.getByRole( 'textbox', { name: 'Reply to' } );

		/*
		 * Selecting a thread renders its reply field but deliberately keeps
		 * focus on the thread itself so keyboard navigation between threads is
		 * preserved. The reply field must not steal focus on mount.
		 */
		await expect(
			getThreadToggle( blockNoteUtils.getThread( 'Test comment' ) )
		).toBeFocused();
		await expect( replyTextbox ).toBeVisible();
		await expect( replyTextbox ).not.toBeFocused();

		await blockNoteUtils.addReply( 'Test reply' );
		await expect(
			blockNoteUtils.getNotice( 'Reply added.' )
		).toBeVisible();
	} );

	test( 'can edit a block note @firefox @webkit', async ( {
		page,
		blockNoteUtils,
	} ) => {
		await blockNoteUtils.insertBlockWithNote( {
			name: 'core/heading',
			content: 'Testing block comments',
			note: 'test comment before edit',
		} );
		const sidebar = page.getByRole( 'region', { name: 'Editor settings' } );
		const actionsButton = sidebar.getByRole( 'button', {
			name: 'Actions',
		} );
		const actionsMenu = page.getByRole( 'menu', { name: 'Actions' } );
		const editTextbox = page.getByRole( 'textbox', { name: 'Edit note' } );

		await test.step( 'Focuses the actions button after cancelling', async () => {
			await blockNoteUtils.clickBlockNoteActionMenuItem( 'Edit' );
			await expect( actionsMenu ).toBeHidden();
			await expect( editTextbox ).toBeFocused();
			await sidebar
				.getByRole( 'button', { name: 'Cancel' } )
				.first()
				.click();
			await expect( actionsButton ).toBeFocused();
		} );

		await test.step( 'Updates the note from the keyboard', async () => {
			await actionsButton.press( 'ArrowDown' );
			await page
				.getByRole( 'menuitem', { name: 'Edit', exact: true } )
				.press( 'Enter' );
			await expect( actionsMenu ).toBeHidden();
			await expect( editTextbox ).toBeFocused();
			await editTextbox.fill( 'Test comment after edit.' );
			await sidebar
				.getByRole( 'button', { name: 'Update', exact: true } )
				.click();

			await expect( actionsButton ).toBeFocused();
			await expect(
				blockNoteUtils.getThread( 'Test comment after edit.' )
			).toBeVisible();
			await expect(
				blockNoteUtils.getNotice( 'Note updated.' )
			).toBeVisible();
		} );
	} );

	test( 'can delete a block note', async ( { blockNoteUtils } ) => {
		await blockNoteUtils.insertBlockWithNote( {
			content: 'Testing block comments',
			note: 'Test comment to delete.',
		} );
		await blockNoteUtils.deleteNote();

		await expect(
			blockNoteUtils.getThread( 'Test comment to delete.' )
		).toBeHidden();
	} );

	test( 'can resolve and reopen a block note', async ( {
		page,
		blockNoteUtils,
	} ) => {
		await blockNoteUtils.insertBlockWithNote( {
			name: 'core/heading',
			content: 'Testing block comments',
			note: 'Test comment to resolve.',
		} );
		await blockNoteUtils.openBlockNoteSidebar();

		const thread = blockNoteUtils.getThread( 'Test comment to resolve.' );
		await thread.click();
		await expect( thread ).toHaveClass( /is-selected/ );

		const resolveButton = page.getByRole( 'button', { name: 'Resolve' } );
		await resolveButton.click();
		await expect( getThreadToggle( thread ) ).toBeFocused();
		await expect( thread ).not.toHaveClass( /is-selected/ );

		await thread.click();
		await expect( resolveButton ).toBeDisabled();

		await test.step( 'Reopens from the actions menu', async () => {
			await blockNoteUtils.clickBlockNoteActionMenuItem( 'Reopen' );
			await expect( resolveButton ).toBeEnabled();
		} );

		await test.step( 'Reopens when adding a reply', async () => {
			await resolveButton.click();
			await thread.click();
			await expect( resolveButton ).toBeDisabled();
			await page
				.getByRole( 'textbox', { name: 'Reply to' } )
				.fill( 'Test reply that reopens the comment.' );
			await page
				.getByRole( 'region', { name: 'Editor settings' } )
				.getByRole( 'button', { name: 'Reopen & Reply', exact: true } )
				.click();
			await expect( resolveButton ).toBeEnabled();
		} );
	} );

	test( 'shows a "Resolved" divider between active and resolved notes', async ( {
		editor,
		page,
		blockNoteUtils,
	} ) => {
		// First block: this note stays active and unresolved.
		await blockNoteUtils.insertBlockWithNote( {
			content: 'Stays active.',
			note: 'Active note.',
		} );
		// Second block: this note will be resolved.
		await blockNoteUtils.insertBlockWithNote( {
			content: 'Resolve me.',
			note: 'Note to resolve.',
		} );
		// Third block: its note is orphaned when the block is deleted.
		await blockNoteUtils.insertBlockWithNote( {
			content: 'Orphan me.',
			note: 'Note losing its block.',
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
		const resolvedThread = blockNoteUtils.getThread( 'Note to resolve.' );
		await resolvedThread.click();
		await expect( resolvedThread ).toHaveClass( /is-selected/ );
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
			sidebar
				.getByRole( 'listitem' )
				.filter( { hasText: 'Original block deleted.' } )
				.filter( { hasText: 'Note losing its block.' } )
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

	test( 'can search and filter notes in the "All notes" sidebar', async ( {
		editor,
		page,
		blockNoteUtils,
	} ) => {
		await blockNoteUtils.insertBlockWithNote( {
			content: 'First block.',
			note: 'Fix the heading.',
		} );
		await blockNoteUtils.insertBlockWithNote( {
			content: 'Second block.',
			note: 'Swap the image.',
		} );

		await blockNoteUtils.openBlockNoteSidebar();
		const sidebar = page.getByRole( 'region', {
			name: 'Editor settings',
		} );
		const headingThread = blockNoteUtils.getThread( 'Fix the heading.' );
		const imageThread = blockNoteUtils.getThread( 'Swap the image.' );

		await test.step( 'Moves focus to the next note when resolving one hides it', async () => {
			await sidebar.getByRole( 'button', { name: 'Filter' } ).click();
			await page.getByRole( 'menuitemradio', { name: 'Open' } ).click();
			await page.keyboard.press( 'Escape' );

			await headingThread.click();
			await sidebar.getByRole( 'button', { name: 'Resolve' } ).click();
			await expect( headingThread ).toBeHidden();
			await expect( getThreadToggle( imageThread ) ).toBeFocused();

			await sidebar
				.getByRole( 'button', { name: 'Filter: Open' } )
				.click();
			await page.getByRole( 'menuitemradio', { name: 'All' } ).click();
			await page.keyboard.press( 'Escape' );
			await expect(
				sidebar.locator(
					'.editor-collab-sidebar-panel__status-separator'
				)
			).toBeVisible();
		} );

		const search = sidebar.getByRole( 'searchbox', {
			name: 'Search notes',
		} );
		await search.fill( 'HEADING' );
		await expect( headingThread ).toBeVisible();
		await expect( imageThread ).toBeHidden();

		await editor.canvas.getByText( 'Second block.' ).click();
		await expect( imageThread ).toBeVisible();
		await blockNoteUtils.deselect();
		await expect( imageThread ).toBeHidden();

		await search.fill( 'admin' );
		await expect( headingThread ).toBeVisible();
		await expect( imageThread ).toBeVisible();

		await search.fill( 'nothing matches' );
		await expect( sidebar.getByText( 'No notes found.' ) ).toBeVisible();

		await search.fill( '' );
		await sidebar.getByRole( 'button', { name: 'Filter' } ).click();
		await page.getByRole( 'menuitemradio', { name: 'Resolved' } ).click();
		await expect( headingThread ).toBeVisible();
		await expect( imageThread ).toBeHidden();
		await expect(
			sidebar.locator( '.editor-collab-sidebar-panel__status-separator' )
		).toBeHidden();

		await page.getByRole( 'menuitemradio', { name: 'Open' } ).click();
		await expect( imageThread ).toBeVisible();
		await expect( headingThread ).toBeHidden();

		await page.keyboard.press( 'Escape' );
		await expect(
			sidebar.getByRole( 'button', { name: 'Filter: Open' } )
		).toBeVisible();
		await sidebar.getByRole( 'button', { name: 'Filter: Open' } ).click();
		await page.getByRole( 'menuitemradio', { name: 'All' } ).click();
		await page.keyboard.press( 'Escape' );
		await expect(
			sidebar.getByRole( 'button', { name: 'Filter', exact: true } )
		).toBeVisible();
	} );

	test( 'expands collapsed replies while searching or on request', async ( {
		page,
		blockNoteUtils,
	} ) => {
		await blockNoteUtils.insertBlockWithNote( {
			content: 'Testing block comments',
			note: 'Test comment',
		} );
		const sidebar = page.getByRole( 'region', {
			name: 'Editor settings',
		} );
		await blockNoteUtils.addReply( 'Check the table.' );
		await blockNoteUtils.addReply( 'Last reply' );

		// Deselect the note so its middle reply collapses.
		await blockNoteUtils.deselect();
		const thread = blockNoteUtils.getThread( 'Test comment' );
		const moreReplies = thread.getByRole( 'button', {
			name: '1 more reply',
		} );
		await expect( moreReplies ).toBeVisible();
		await expect( thread.getByText( 'Check the table.' ) ).toBeHidden();

		const search = sidebar.getByRole( 'searchbox', {
			name: 'Search notes',
		} );
		await search.fill( 'table' );
		await expect( thread.getByText( 'Check the table.' ) ).toBeVisible();
		await expect( moreReplies ).toBeHidden();

		await search.fill( '' );
		await expect( moreReplies ).toBeVisible();

		await test.step( 'Expands and focuses the thread from the "x more replies" button', async () => {
			await moreReplies.click();
			await expect( thread ).toHaveClass( /is-selected/ );
			await expect( getThreadToggle( thread ) ).toBeFocused();
		} );
	} );

	test( 'exposes each thread state through a disclosure button', async ( {
		page,
		blockNoteUtils,
	} ) => {
		await blockNoteUtils.insertBlockWithNote( {
			content: 'Testing block comments',
			note: 'Disclosed note',
		} );
		await blockNoteUtils.deselect();
		const thread = blockNoteUtils.getThread( 'Disclosed note' );
		const toggle = getThreadToggle( thread );

		// The list item is structure; the toggle is the focusable control.
		await expect( thread ).not.toHaveAttribute( 'tabindex' );
		await expect( toggle ).toHaveAccessibleName( 'Note by admin' );
		await expect( toggle ).toHaveAttribute( 'aria-expanded', 'false' );
		await expect( toggle ).toHaveAccessibleDescription( 'Disclosed note' );

		await toggle.focus();
		await page.keyboard.press( 'Enter' );
		await expect( thread ).toHaveClass( /is-selected/ );
		await expect( toggle ).toHaveAttribute( 'aria-expanded', 'true' );
		await expect( toggle ).toBeFocused();

		await page.keyboard.press( 'Space' );
		await expect( thread ).not.toHaveClass( /is-selected/ );
		await expect( toggle ).toHaveAttribute( 'aria-expanded', 'false' );
		await expect( toggle ).toBeFocused();
	} );

	test( 'exposes the note threads as a list rather than a tree', async ( {
		page,
		blockNoteUtils,
	} ) => {
		await blockNoteUtils.addBlockWithNote( {
			type: 'core/paragraph',
			attributes: { content: 'First block' },
			comment: 'First note',
		} );
		await blockNoteUtils.addBlockWithNote( {
			type: 'core/paragraph',
			attributes: { content: 'Second block' },
			comment: 'Second note',
		} );

		const sidebar = page.getByRole( 'region', {
			name: 'Editor settings',
		} );

		// The panel is a plain list, so a screen reader stays in browse mode
		// and its reading keys are free to read the note text.
		const list = sidebar.getByRole( 'list' );
		await expect( list ).toBeVisible();
		await expect( list ).toHaveAccessibleName( 'All notes' );
		await expect( sidebar.getByRole( 'tree' ) ).toHaveCount( 0 );
		await expect( sidebar.getByRole( 'treeitem' ) ).toHaveCount( 0 );

		// Each thread is one item of that list.
		await expect(
			list.getByRole( 'listitem' ).filter( { hasText: 'First note' } )
		).toBeVisible();
		await expect(
			list.getByRole( 'listitem' ).filter( { hasText: 'Second note' } )
		).toBeVisible();

		// A reply is prose inside its thread, not a nested item of its own.
		const secondThread = list
			.getByRole( 'listitem' )
			.filter( { hasText: 'Second note' } );
		const replyForm = secondThread.getByRole( 'textbox', {
			name: 'Reply to',
		} );
		await replyForm.click();
		await replyForm.pressSequentially( 'A reply' );
		await secondThread
			.getByRole( 'button', { name: 'Reply', exact: true } )
			.click();
		await expect( secondThread ).toContainText( 'A reply' );
		await expect( secondThread.getByRole( 'listitem' ) ).toHaveCount( 0 );

		// VoiceOver repeats `aria-current` on every element in the thread.
		await expect( secondThread ).toHaveClass( /is-selected/ );
		await expect( secondThread ).not.toHaveAttribute( 'aria-current' );

		// Only the selected thread has a reply field for the skip link to
		// reach; elsewhere it would open every thread's announcement.
		const skipLinkName = { name: 'Add new reply' };
		await expect(
			secondThread.getByRole( 'button', skipLinkName )
		).toHaveCount( 1 );
		await expect(
			list
				.getByRole( 'listitem' )
				.filter( { hasText: 'First note' } )
				.getByRole( 'button', skipLinkName )
		).toHaveCount( 0 );
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
		await blockNoteUtils.insertBlockWithNote( {
			content: 'Orphan me.',
			note: 'Orphaned note.',
		} );

		// Delete the noted block, orphaning its note.
		await editor.clickBlockOptionsMenuItem( 'Delete' );

		// Only the "All notes" sidebar lists orphaned notes.
		await blockNoteUtils.openBlockNoteSidebar();
		const sidebar = page.getByRole( 'region', {
			name: 'Editor settings',
		} );
		await expect(
			sidebar
				.getByRole( 'listitem' )
				.filter( { hasText: 'Original block deleted.' } )
				.filter( { hasText: 'Orphaned note.' } )
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
			sidebar.locator(
				'.editor-collab-sidebar-panel__thread.is-selected'
			)
		).toHaveCount( 0 );
	} );

	test( 'selecting a block or note marks it as an active', async ( {
		editor,
		page,
		blockNoteUtils,
	} ) => {
		await blockNoteUtils.insertBlockWithNote( {
			name: 'core/heading',
			content: 'First block',
			note: 'First block comment',
		} );
		await blockNoteUtils.insertBlockWithNote( {
			content: 'Second block',
			note: 'Second block comment',
		} );
		await editor.insertBlock( { name: 'core/spacer' } );
		await blockNoteUtils.insertBlockWithNote( {
			name: 'core/heading',
			content: 'Third block',
			note: 'Third block comment',
		} );

		const threadsContainer = page
			.getByRole( 'region', {
				name: 'Editor settings',
			} )
			.getByRole( 'list' );
		const threads = threadsContainer.getByRole( 'listitem' );
		const activeThread = threadsContainer.locator(
			'.editor-collab-sidebar-panel__thread.is-selected'
		);
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
		await blockNoteUtils.insertBlockWithNote( {
			content: 'First block',
			note: 'First block comment',
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
			.getByRole( 'list' )
			.getByRole( 'listitem' )
			.filter( { hasText: 'First block comment' } );

		// Clicking the existing thread selects it and closes the new-note form.
		await existingThread.click();
		await expect( newNoteForm ).toBeHidden();

		/*
		 * The form unmounts on selection, but `useFocusOutside` still runs its
		 * queued blur callback. It must not clear the newly selected thread.
		 */
		await expect( existingThread ).toHaveClass( /is-selected/ );
	} );

	test.describe( 'Keyboard', () => {
		test( 'should expand or collapse a note with Enter or arrow keys', async ( {
			page,
			editor,
			blockNoteUtils,
		} ) => {
			await blockNoteUtils.insertBlockWithNote( {
				name: 'core/heading',
				content: 'Testing block comments',
				note: 'Test comment',
			} );
			await blockNoteUtils.deselect();
			const thread = blockNoteUtils.getThread( 'Test comment' );

			for ( const [ keyToExpand, keyToCollapse ] of [
				[ 'Enter', 'Enter' ],
				[ 'ArrowRight', 'ArrowLeft' ],
			] ) {
				await test.step( `${ keyToExpand } and ${ keyToCollapse }`, async () => {
					await getThreadToggle( thread ).focus();
					await page.keyboard.press( keyToExpand );
					await expect( thread ).toHaveClass( /is-selected/ );

					// The related block should be selected, but the focus should remain on the note.
					await expect(
						editor.canvas.getByText( 'Testing block comments' )
					).toHaveClass( /is-selected/ );
					await expect( getThreadToggle( thread ) ).toBeFocused();

					await page.keyboard.press( keyToCollapse );
					await expect( thread ).not.toHaveClass( /is-selected/ );
				} );
			}
		} );

		test( 'should move between notes with arrow, Home and End keys', async ( {
			page,
			blockNoteUtils,
		} ) => {
			for ( const note of [ 'One', 'Two', 'Three' ] ) {
				await blockNoteUtils.insertBlockWithNote( {
					content: 'Testing block comments',
					note,
				} );
			}

			const firstThread = blockNoteUtils.getThread( 'One' );
			const secondThread = blockNoteUtils.getThread( 'Two' );
			const lastThread = blockNoteUtils.getThread( 'Three' );

			await getThreadToggle( firstThread ).focus();
			await page.keyboard.press( 'ArrowDown' );
			await expect( getThreadToggle( secondThread ) ).toBeFocused();
			await page.keyboard.press( 'ArrowUp' );
			await expect( getThreadToggle( firstThread ) ).toBeFocused();

			await page.keyboard.press( 'End' );
			await expect( getThreadToggle( lastThread ) ).toBeFocused();
			await page.keyboard.press( 'Home' );
			await expect( getThreadToggle( firstThread ) ).toBeFocused();
		} );

		test( 'should collapse a note with Escape key and keep it collapsed while editing the same block', async ( {
			editor,
			page,
			blockNoteUtils,
		} ) => {
			await blockNoteUtils.insertBlockWithNote( {
				content: 'Sticky collapse',
				note: 'Sticky collapse note',
			} );

			const thread = blockNoteUtils.getThread( 'Sticky collapse note' );

			await thread.click();
			await expect( thread ).toHaveClass( /is-selected/ );
			await page.keyboard.press( 'Escape' );
			await expect( thread ).not.toHaveClass( /is-selected/ );

			await editor.canvas
				.getByRole( 'document', { name: 'Block: Paragraph' } )
				.click();
			await page.keyboard.type( ' edited' );
			await expect( thread ).not.toHaveClass( /is-selected/ );
		} );

		test( 'should collapse a note after canceling note form', async ( {
			blockNoteUtils,
		} ) => {
			await blockNoteUtils.insertBlockWithNote( {
				name: 'core/heading',
				content: 'Testing block comments',
				note: 'Test comment',
			} );

			const thread = blockNoteUtils.getThread( 'Test comment' );

			await thread.click();
			await expect( thread ).toHaveClass( /is-selected/ );
			await thread.getByRole( 'button', { name: 'Cancel' } ).click();
			await expect( thread ).not.toHaveClass( /is-selected/ );
			await expect( getThreadToggle( thread ) ).toBeFocused();
		} );

		test( 'should collapse a note when the focus moves outside the note', async ( {
			editor,
			page,
			blockNoteUtils,
		} ) => {
			await blockNoteUtils.insertBlockWithNote( {
				name: 'core/heading',
				content: 'Testing block comments',
				note: 'Test comment',
			} );

			const thread = blockNoteUtils.getThread( 'Test comment' );
			const block = editor.canvas.getByRole( 'document', {
				name: 'Block: Heading',
			} );

			await thread.click();
			await expect( thread ).toHaveClass( /is-selected/ );
			await expect( block ).toHaveClass( /is-highlighted/ );
			await page.keyboard.press( 'Shift+Tab' );
			await expect( getThreadToggle( thread ) ).not.toBeFocused();
			await expect( thread ).not.toHaveClass( /is-selected/ );
			await expect( block ).not.toHaveClass( /is-highlighted/ );
		} );

		test( 'should focus appropriate element when note is deleted', async ( {
			page,
			editor,
			blockNoteUtils,
		} ) => {
			await blockNoteUtils.insertBlockWithNote( {
				content: 'First block content',
				note: 'First block comment',
			} );
			await blockNoteUtils.insertBlockWithNote( {
				content: 'Second block content',
				note: 'Second block comment',
			} );
			await blockNoteUtils.insertBlockWithNote( {
				content: 'Third block content',
				note: 'Third block comment',
			} );
			const firstThread = blockNoteUtils.getThread(
				'First block comment'
			);
			const secondThread = blockNoteUtils.getThread(
				'Second block comment'
			);
			const thirdThread = blockNoteUtils.getThread(
				'Third block comment'
			);

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
				getThreadToggle( secondThread ),
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
				getThreadToggle( secondThread ),
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
			blockNoteUtils,
		} ) => {
			await blockNoteUtils.insertBlockWithNote( {
				content: 'Testing block comments',
				note: 'Test note',
			} );
			await blockNoteUtils.insertBlockWithNote( {
				content: 'Testing block comments',
				note: 'Test comment',
			} );
			await blockNoteUtils.addReply( 'Test reply' );
			await blockNoteUtils.deleteNote( 1 );
			const thread = blockNoteUtils.getThread( 'Test comment' );

			await expect( getThreadToggle( thread ) ).toBeFocused();
		} );

		test( 'should move focus with the "Add new reply" and "Back to block" skip links', async ( {
			editor,
			page,
			blockNoteUtils,
		} ) => {
			await blockNoteUtils.insertBlockWithNote( {
				content: 'Testing block comments',
				note: 'Test comment',
			} );
			const thread = blockNoteUtils.getThread( 'Test comment' );

			await test.step( 'Add new reply', async () => {
				await getThreadToggle( thread ).focus();
				await page.keyboard.press( 'Tab' );
				await expect(
					thread.getByRole( 'button', { name: 'Add new reply' } )
				).toBeFocused();
				await page.keyboard.press( 'Enter' );
				await expect(
					page.getByRole( 'textbox', { name: 'Reply to' } )
				).toBeFocused();
			} );

			await test.step( 'Back to block', async () => {
				await thread
					.getByRole( 'button', { name: 'Reply', exact: true } )
					.focus();
				await page.keyboard.press( 'Tab' );
				await expect(
					thread.getByRole( 'button', { name: 'Back to block' } )
				).toBeFocused();
				await page.keyboard.press( 'Enter' );
				await expect(
					editor.canvas.getByRole( 'document', {
						name: 'Block: Paragraph',
					} )
				).toBeFocused();
			} );
		} );

		test( 'can add a note using keyboard shortcuts', async ( {
			editor,
			page,
			pageUtils,
			blockNoteUtils,
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
			const thread = blockNoteUtils.getThread( 'A test comment' );

			await textbox.click();
			await pageUtils.pressKeys( 'primary+Enter' );
			await expect(
				textbox,
				`doesn't submit an empty form and focus remains in the textbox`
			).toBeFocused();

			await textbox.pressSequentially( 'A test comment' );
			await pageUtils.pressKeys( 'primary+Enter' );

			await expect( thread ).toBeVisible();
			await expect( getThreadToggle( thread ) ).toBeFocused();
		} );
	} );

	test.describe( 'Emoji Reactions', () => {
		test( 'can add, remove and re-add a reaction', async ( {
			page,
			blockNoteUtils,
		} ) => {
			await blockNoteUtils.insertBlockWithNote( {
				content: 'Testing re-add reaction',
				note: 'Re-add reaction',
			} );

			await blockNoteUtils.addReactionToComment( 'Heart' );
			const reactionButton = page.getByRole( 'button', {
				// The pointer can rest on the pill, which then names the
				// reactors: "admin reacted with heart".
				name: /heart/i,
			} );
			await expect( reactionButton ).toBeVisible();
			await expect( reactionButton ).toContainText( '1' );
			await expect( reactionButton ).toHaveAttribute(
				'aria-pressed',
				'true'
			);

			await test.step( 'Shows who reacted on hover', async () => {
				await reactionButton.hover();
				// The Design System tooltip popup carries no `tooltip` role, so
				// match its text. The pill's own label is an `aria-label`, not
				// text, so this only matches the popup.
				await expect(
					page.getByText( /reacted with heart/ )
				).toBeVisible();
			} );

			// Remove the reaction by keyboard. The pill unmounts, so focus
			// moves to the thread's toggle rather than dropping to the body.
			await reactionButton.focus();
			await page.keyboard.press( 'Enter' );
			await expect( reactionButton ).toBeHidden();
			await expect(
				getThreadToggle( blockNoteUtils.getThread( 'Re-add reaction' ) )
			).toBeFocused();

			// Add the same reaction again. This used to fail two ways:
			// 1) the parent note's cached `reaction_summary` still
			//    reported the removed heart as `reacted`, so the toggle
			//    attempted to delete a now-missing comment record
			//    instead of routing to add; and 2) the server's
			//    duplicate-reaction guard included trashed comments,
			//    so the just-removed reaction blocked the re-add with
			//    `rest_comment_duplicate_reaction` ("You have already
			//    reacted with this emoji"). Reactions aren't optimistic,
			//    so either failure leaves the pill hidden.
			await blockNoteUtils.addReactionToComment( 'Heart' );
			await expect( reactionButton ).toBeVisible();
			await expect( reactionButton ).toContainText( '❤' );
			await expect( reactionButton ).toContainText( '1' );

			await test.step( 'Keeps the note text when editing it', async () => {
				await blockNoteUtils.clickBlockNoteActionMenuItem( 'Edit' );
				await expect(
					page.getByRole( 'textbox', { name: 'Edit note' } )
				).toHaveText( 'Re-add reaction' );
				await page
					.getByRole( 'region', { name: 'Editor settings' } )
					.getByRole( 'button', { name: 'Cancel' } )
					.first()
					.click();
			} );

			await test.step( 'Stays visible once the thread is deselected', async () => {
				// The pills carry information about the note, so unlike its
				// actions they survive being deselected.
				await blockNoteUtils.deselect();
				await expect(
					page.getByRole( 'button', { name: 'Add reaction' } )
				).toHaveCount( 0 );
				await expect( reactionButton ).toBeVisible();
			} );
		} );

		test( 'the reaction menu is keyboard accessible', async ( {
			page,
			blockNoteUtils,
		} ) => {
			await blockNoteUtils.insertBlockWithNote( {
				content: 'Testing keyboard accessibility',
				note: 'Test comment for keyboard access',
			} );

			const trigger = page.getByRole( 'button', {
				name: 'Add reaction',
			} );
			const menu = page.getByRole( 'menu', { name: 'Add reaction' } );

			// Escape closes the menu and hands focus back to the trigger.
			await trigger.focus();
			await page.keyboard.press( 'Enter' );
			await expect( menu ).toBeVisible();
			await page.keyboard.press( 'Escape' );
			await expect( menu ).toBeHidden();
			await expect( trigger ).toBeFocused();

			// The arrow keys move through the emoji, and Enter picks one.
			await page.keyboard.press( 'Enter' );
			await expect(
				menu.getByRole( 'menuitemcheckbox', { name: 'Thumbs up' } )
			).toBeFocused();
			await page.keyboard.press( 'ArrowRight' );
			await expect(
				menu.getByRole( 'menuitemcheckbox', { name: 'Plus' } )
			).toBeFocused();
			await page.keyboard.press( 'Enter' );

			await expect(
				page.getByRole( 'button', { name: /Plus/ } )
			).toContainText( '1' );

			// The menu marks the emoji the user has already reacted with.
			await trigger.click();
			// Focus has moved into the portaled menu, but its focus events
			// still bubble to the thread's `useFocusOutside` through the
			// React tree, so the thread stays selected and the trigger mounted.
			await expect(
				blockNoteUtils.getThread( 'Test comment for keyboard access' )
			).toHaveClass( /is-selected/ );
			await expect(
				menu.getByRole( 'menuitemcheckbox', { name: 'Plus' } )
			).toBeChecked();
			await expect(
				menu.getByRole( 'menuitemcheckbox', { name: 'Thumbs up' } )
			).not.toBeChecked();

			// The emoji name shows in a tooltip, and one Escape closes both.
			await menu
				.getByRole( 'menuitemcheckbox', { name: 'Heart' } )
				.hover();
			await expect(
				page.getByText( 'Heart', { exact: true } )
			).toBeVisible();
			await page.keyboard.press( 'Escape' );
			await expect( menu ).toBeHidden();
			await expect(
				page.getByText( 'Heart', { exact: true } )
			).toBeHidden();
		} );

		test( 'resolving a thread locks its reactions', async ( {
			page,
			blockNoteUtils,
		} ) => {
			await blockNoteUtils.insertBlockWithNote( {
				content: 'Testing resolved reactions',
				note: 'Test comment for resolved reactions',
			} );

			// The floating overlay hides a resolved thread, so drive this
			// through the sidebar where it stays reachable.
			await blockNoteUtils.openBlockNoteSidebar();
			const sidebar = page.getByRole( 'region', {
				name: 'Editor settings',
			} );
			const thread = blockNoteUtils.getThread(
				'Test comment for resolved reactions'
			);
			await thread.click();
			await expect( thread ).toHaveClass( /is-selected/ );

			await blockNoteUtils.addReactionToComment( 'Heart' );
			const reactionPill = sidebar.getByRole( 'button', {
				name: /Heart/,
			} );
			await expect( reactionPill ).toBeVisible();

			const addReaction = sidebar.getByRole( 'button', {
				name: 'Add reaction',
			} );
			const resolveButton = sidebar.getByRole( 'button', {
				name: 'Resolve',
			} );

			// Resolving collapses the thread, so re-select it to reach the
			// reaction controls again.
			await resolveButton.click();
			await thread.click();
			await expect( resolveButton ).toBeDisabled();

			// A resolved thread is an archived conversation: the add trigger
			// is gone and the existing pill can no longer mutate reactions.
			await expect( addReaction ).toHaveCount( 0 );
			await expect( reactionPill ).toBeDisabled();

			// Reopening the thread unlocks them again.
			await blockNoteUtils.clickBlockNoteActionMenuItem( 'Reopen' );
			await expect( resolveButton ).toBeEnabled();
			await expect( addReaction.first() ).toBeEnabled();
			await expect( reactionPill ).toBeEnabled();
		} );

		test( 'the add-reaction trigger is revealed on hover and focus', async ( {
			page,
			blockNoteUtils,
		} ) => {
			await blockNoteUtils.insertBlockWithNote( {
				content: 'Testing the hover trigger',
				note: 'Test comment for the hover trigger',
			} );

			const trigger = page.getByRole( 'button', {
				name: 'Add reaction',
			} );
			// The reply composer shares the note class, so match only notes
			// that carry a reaction trigger.
			const note = page
				.locator( '.editor-collab-sidebar-panel__note' )
				.filter( { has: trigger } );

			// Park the pointer outside the sidebar: adding the note leaves it
			// over the thread, which would hold the trigger open.
			await page.mouse.move( 0, 0 );
			await expect( trigger ).toHaveCSS( 'opacity', '0' );

			await note.hover();
			await expect( trigger ).toHaveCSS( 'opacity', '1' );

			// Keyboard reaches it too: the reveal hangs off the trigger, not
			// the thread, which stays focused for as long as it is selected.
			await page.mouse.move( 0, 0 );
			await expect( trigger ).toHaveCSS( 'opacity', '0' );
			await trigger.focus();
			await expect( trigger ).toHaveCSS( 'opacity', '1' );
		} );
	} );

	test.describe( 'Multiple notes per block', () => {
		test( 'handles several notes on the same block', async ( {
			editor,
			page,
			blockNoteUtils,
		} ) => {
			await blockNoteUtils.insertBlockWithNote( {
				content: 'Block with multiple notes',
				note: 'First note on block',
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

			await expect(
				blockNoteUtils.getThread( 'First note on block' )
			).toBeVisible();
			await expect(
				blockNoteUtils.getThread( 'Second note on block' )
			).toBeVisible();

			// noteId is stored as an array; the array shape (vs. a child
			// comment) proves the second add went through the new-note path.
			const getNoteIds = async () =>
				( await editor.getBlocks() ).find(
					( b ) => b.name === 'core/paragraph'
				)?.attributes?.metadata?.noteId;
			expect( await getNoteIds() ).toHaveLength( 2 );

			await test.step( 'Resolving one note keeps the other', async () => {
				await blockNoteUtils.getThread( 'First note on block' ).click();
				await page.getByRole( 'button', { name: 'Resolve' } ).click();
				await expect(
					page
						.getByRole( 'region', { name: 'Editor settings' } )
						.locator(
							'.editor-collab-sidebar-panel__status-separator'
						)
				).toBeVisible();
				await expect(
					blockNoteUtils.getThread( 'Second note on block' )
				).toBeVisible();
				expect( await getNoteIds() ).toHaveLength( 2 );
			} );

			await test.step( 'Selecting the block selects its first unresolved note', async () => {
				await blockNoteUtils.deselect();
				await editor.canvas
					.getByRole( 'document', { name: 'Block: Paragraph' } )
					.click();
				await expect(
					blockNoteUtils.getThread( 'Second note on block' )
				).toHaveClass( /is-selected/ );
			} );

			await test.step( 'Deleting one note preserves the other', async () => {
				await blockNoteUtils
					.getThread( 'Second note on block' )
					.click();
				await blockNoteUtils.deleteNote();
				await expect(
					blockNoteUtils.getThread( 'First note on block' )
				).toBeVisible();
				await expect(
					blockNoteUtils.getThread( 'Second note on block' )
				).toBeHidden();
				expect( await getNoteIds() ).toHaveLength( 1 );
			} );
		} );

		test( 'keeps the clicked note selected on a block with several notes', async ( {
			editor,
			blockNoteUtils,
		} ) => {
			await blockNoteUtils.insertBlockWithNote( {
				content: 'Block with notes',
				note: 'First note',
			} );
			await blockNoteUtils.addNote( 'Second note' );
			// Move the block selection away, so clicking a thread also selects its block.
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: { content: 'Another block' },
			} );

			const firstThread = blockNoteUtils.getThread( 'First note' );
			const secondThread = blockNoteUtils.getThread( 'Second note' );

			await secondThread.click();

			await expect( secondThread ).toHaveClass( /is-selected/ );
			await expect( firstThread ).not.toHaveClass( /is-selected/ );
		} );

		test( 'keeps a clicked inline note selected', async ( {
			editor,
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

			const thread = blockNoteUtils.getThread( 'Alpha note' );
			await expect( thread ).not.toHaveClass( /is-selected/ );

			await thread.click();
			await expect( thread ).toHaveClass( /is-selected/ );
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
			blockNoteUtils,
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
				blockNoteUtils.getThread( 'Second draft' )
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

		test( 'keeps the new note form open while its block is edited', async ( {
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
			await page.keyboard.press( 'End' );
			await page.keyboard.type( ' edited' );
			await expect(
				editor.canvas.getByText( 'First block edited' )
			).toBeVisible();
			await expect( newNoteForm ).toBeVisible();
		} );

		test( 'closes the new note form on focus-out only when empty', async ( {
			editor,
			page,
		} ) => {
			const newNoteForm = page.getByRole( 'textbox', {
				name: 'New note',
				exact: true,
			} );
			const optionsButton = page
				.getByRole( 'region', { name: 'Editor top bar' } )
				.getByRole( 'button', { name: 'Options' } );

			await editor.canvas.getByText( 'First block' ).click();
			await editor.clickBlockOptionsMenuItem( 'Add note' );
			await expect( newNoteForm ).toBeFocused();
			await optionsButton.focus();
			await expect( newNoteForm ).toBeHidden();

			await editor.clickBlockOptionsMenuItem( 'Add note' );
			await newNoteForm.pressSequentially( 'Unsent draft' );
			await optionsButton.focus();
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
			await blockNoteUtils.insertBlockWithNote( {
				content: 'Noted block',
				note: 'Test comment',
			} );

			const thread = blockNoteUtils.getThread( 'Test comment' );
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
		test( 'highlights an inline marker in the author color and thickens its underline when selected', async ( {
			editor,
			requestUtils,
			blockNoteUtils,
		} ) => {
			const tint = await getAuthorTint( requestUtils );

			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: { content: 'Select me for a note.' },
			} );

			// Select all of the paragraph text so the inline path is taken:
			// "Add note" creates an inline note whenever a non-collapsed
			// rich-text selection is active, and a block-level note otherwise.
			await editor.canvas
				.getByRole( 'document', { name: 'Block: Paragraph' } )
				.click();
			await blockNoteUtils.selectBlockText();
			await blockNoteUtils.addNote( 'Color me' );

			// The draft marker shows while the note is saved; wait for the
			// saved note's id so the thread focus that follows has settled.
			const mark = editor.canvas.locator( 'mark.wp-note' ).first();
			await expect( mark ).toHaveAttribute( 'data-id', /^\d+$/ );

			// Creating a note auto-selects it. Focus the title to deselect it.
			await editor.canvas
				.getByRole( 'textbox', { name: 'Add title' } )
				.click();
			await expect( mark ).toHaveCSS( 'background-color', tint );
			await expect( mark ).toHaveCSS(
				'text-decoration-line',
				'underline'
			);
			await expect( mark ).toHaveCSS(
				'text-decoration-thickness',
				'1.5px'
			);

			await blockNoteUtils.getThread( 'Color me' ).click();
			await expect( mark ).toHaveCSS(
				'text-decoration-thickness',
				'3px'
			);
			await expect( mark ).toHaveCSS( 'background-color', tint );
		} );

		test( 'keeps the inline marker highlighted after a code-editor round-trip', async ( {
			editor,
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

			await blockNoteUtils.addNote( 'Survive the toggle' );

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

			await blockNoteUtils.addNote( 'Anchored to text' );

			await expect(
				editor.canvas.locator( 'mark.wp-note' ).first()
			).toBeVisible();

			const thread = blockNoteUtils.getThread( 'Anchored to text' );
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

		test( 'adds, resolves and deletes inline notes in merged text', async ( {
			editor,
			page,
			blockNoteUtils,
		} ) => {
			const paragraph = editor.canvas.getByRole( 'document', {
				name: 'Block: Paragraph',
			} );
			const marker = editor.canvas.locator( 'mark.wp-note' );

			// Each note action writes rich text data back, so each step merges
			// again to get an HTML string.
			async function appendAndMerge( content ) {
				await editor.insertBlock( {
					name: 'core/paragraph',
					attributes: { content },
				} );
				await paragraph.last().click();
				await blockNoteUtils.selectBlockText();
				await page.keyboard.press( 'ArrowLeft' );
				await page.keyboard.press( 'Backspace' );
				await expect( paragraph ).toHaveCount( 1 );
			}

			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: { content: 'One' },
			} );

			await test.step( 'Add a note', async () => {
				await appendAndMerge( ' two' );
				await blockNoteUtils.selectBlockText();
				await blockNoteUtils.addNote( 'First note' );
				await expect( marker ).toHaveText( 'One two' );
			} );

			await test.step( 'Resolve the note', async () => {
				await appendAndMerge( ' three' );
				await blockNoteUtils.getThread( 'First note' ).click();
				await page.getByRole( 'button', { name: 'Resolve' } ).click();
				await expect( marker ).toHaveCount( 0 );
			} );

			await test.step( 'Delete a note', async () => {
				await paragraph.click();
				await blockNoteUtils.selectBlockText();
				await blockNoteUtils.addNote( 'Second note' );
				await appendAndMerge( ' four' );
				await blockNoteUtils.getThread( 'Second note' ).click();
				await blockNoteUtils.deleteNote();
				await expect( marker ).toHaveCount( 0 );
			} );

			await expect( paragraph ).toHaveText( 'One two three four' );
		} );

		for ( const { first, second } of [
			{
				first: { name: 'core/paragraph', label: 'Block: Paragraph' },
				second: { name: 'core/paragraph', label: 'Block: Paragraph' },
			},
			{
				first: { name: 'core/heading', label: 'Block: Heading' },
				second: { name: 'core/paragraph', label: 'Block: Paragraph' },
			},
		] ) {
			test( `keeps the notes of both blocks when a ${ second.name } block is merged into a ${ first.name } block`, async ( {
				editor,
				page,
				blockNoteUtils,
			} ) => {
				const firstBlock = editor.canvas
					.getByRole( 'document', { name: first.label } )
					.first();
				const secondBlock = editor.canvas
					.getByRole( 'document', { name: second.label } )
					.last();

				await blockNoteUtils.insertBlockWithNote( {
					name: first.name,
					content: 'One',
					note: 'First block note',
				} );
				await firstBlock.click();
				await blockNoteUtils.selectBlockText();
				await blockNoteUtils.addNote( 'First block inline note' );
				await blockNoteUtils.insertBlockWithNote( {
					name: second.name,
					content: 'two',
					note: 'Second block note',
				} );
				await secondBlock.click();
				await blockNoteUtils.selectBlockText();
				await blockNoteUtils.addNote( 'Second block inline note' );
				const blocks = await editor.getBlocks();
				const noteId = blocks.flatMap(
					( { attributes } ) => attributes.metadata.noteId
				);
				expect( noteId ).toHaveLength( 4 );

				await secondBlock.click();
				await blockNoteUtils.selectBlockText();
				await page.keyboard.press( 'ArrowLeft' );
				await page.keyboard.press( 'Backspace' );

				await expect(
					editor.canvas.getByRole( 'document', { name: first.label } )
				).toHaveText( 'Onetwo' );
				await expect(
					editor.canvas.locator( 'mark.wp-note' )
				).toHaveText( [ 'One', 'two' ] );
				await expect.poll( editor.getBlocks ).toMatchObject( [
					{
						name: first.name,
						attributes: { metadata: { noteId } },
					},
				] );
				for ( const note of [
					'First block note',
					'First block inline note',
					'Second block note',
					'Second block inline note',
				] ) {
					await expect(
						blockNoteUtils.getThread( note )
					).toBeVisible();
				}
			} );
		}

		test( 'anchors an inline note to selected accordion heading text after reloading', async ( {
			editor,
			page,
			blockNoteUtils,
		} ) => {
			await editor.insertBlock( {
				name: 'core/accordion',
				innerBlocks: [
					{
						name: 'core/accordion-item',
						innerBlocks: [
							{
								name: 'core/accordion-heading',
								attributes: { title: 'Hello brave new world.' },
							},
							{
								name: 'core/accordion-panel',
								innerBlocks: [
									{
										name: 'core/paragraph',
										attributes: {
											content: 'Accordion panel content.',
										},
									},
								],
							},
						],
					},
				],
			} );
			const headingTitle = editor.canvas.locator(
				'.wp-block-accordion-heading__toggle-title'
			);
			await headingTitle.focus();
			await expect( headingTitle ).toBeFocused();
			await blockNoteUtils.selectBlockText( { start: 6, length: 5 } );
			await blockNoteUtils.addNote( 'Just this accordion word' );

			const marker = editor.canvas.locator( 'mark.wp-note' );
			await expect( marker ).toHaveCount( 1 );
			await expect( marker ).toHaveText( 'brave' );
			await expect( marker ).toHaveAttribute( 'data-id', /^\d+$/ );
			await expect( headingTitle ).toHaveText( 'Hello brave new world.' );
			const noteId = await marker.getAttribute( 'data-id' );

			await editor.saveDraft();
			await page.reload();
			await blockNoteUtils.openBlockNoteSidebar();

			await expect( marker ).toHaveCount( 1 );
			await expect( marker ).toHaveText( 'brave' );
			await expect( marker ).toHaveAttribute( 'data-id', noteId );
			await expect( headingTitle ).toHaveText( 'Hello brave new world.' );
			await expect(
				blockNoteUtils.getThread( 'Just this accordion word' )
			).toBeVisible();
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
			blockNoteUtils,
		} ) => {
			await blockNoteUtils.insertBlockWithNote( {
				content: 'Hello brave new world.',
				note: 'Block note',
			} );
			const paragraph = editor.canvas.getByRole( 'document', {
				name: 'Block: Paragraph',
			} );
			const blockThread = blockNoteUtils.getThread( 'Block note' );

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

		test( 'clicking between inline markers selects the matching note', async ( {
			editor,
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

			const alphaThread = blockNoteUtils.getThread( 'Alpha note' );
			const charlieThread = blockNoteUtils.getThread( 'Charlie note' );
			const alphaMark = editor.canvas
				.locator( 'mark.wp-note' )
				.filter( { hasText: 'Alpha' } );
			const charlieMark = editor.canvas
				.locator( 'mark.wp-note' )
				.filter( { hasText: 'charlie' } );

			// Creating a note selects it, so the last-added note starts selected.
			await expect( alphaThread ).toHaveClass( /is-selected/ );

			// Placing the caret inside a marker syncs the open sidebar to that
			// note; clicking between the two markers flips the selection.
			await charlieMark.click();
			await expect( charlieThread ).toHaveClass( /is-selected/ );
			await expect( alphaThread ).not.toHaveClass( /is-selected/ );

			await alphaMark.click();
			await expect( alphaThread ).toHaveClass( /is-selected/ );
			await expect( charlieThread ).not.toHaveClass( /is-selected/ );
		} );

		test( 'selects no note while the caret is outside the inline highlights', async ( {
			editor,
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

			const alphaThread = blockNoteUtils.getThread( 'Alpha note' );
			await expect( alphaThread ).toHaveClass( /is-selected/ );

			// The block's only note is inline, so a click past the end of its
			// text selects the block but no note.
			await paragraph.click();
			await expect( paragraph ).toBeFocused();
			await expect( alphaThread ).not.toHaveClass( /is-selected/ );

			// Into the marker and out again.
			await pageUtils.pressKeys( 'ArrowLeft', { times: 18 } );
			await expect( alphaThread ).toHaveClass( /is-selected/ );
			await pageUtils.pressKeys( 'ArrowRight', { times: 8 } );
			await expect( alphaThread ).not.toHaveClass( /is-selected/ );
		} );

		test( 'selects the block-level note when the caret leaves an inline highlight', async ( {
			editor,
			pageUtils,
			blockNoteUtils,
		} ) => {
			await blockNoteUtils.insertBlockWithNote( {
				content: 'Alpha bravo charlie.',
				note: 'Block note',
			} );
			const paragraph = editor.canvas.getByRole( 'document', {
				name: 'Block: Paragraph',
			} );
			await paragraph.click();
			await blockNoteUtils.selectBlockText( { start: 0, length: 5 } );
			await blockNoteUtils.addNote( 'Alpha note' );

			const blockThread = blockNoteUtils.getThread( 'Block note' );
			const alphaThread = blockNoteUtils.getThread( 'Alpha note' );
			await expect( alphaThread ).toHaveClass( /is-selected/ );

			// Focus leaves the thread for its own block: the caret, inside the
			// marker, keeps the note selected.
			await editor.canvas
				.locator( 'mark.wp-note' )
				.filter( { hasText: 'Alpha' } )
				.click();
			await expect( alphaThread ).toHaveClass( /is-selected/ );
			await expect( blockThread ).not.toHaveClass( /is-selected/ );

			// Past the marker, the block-level note stands for the caret.
			await pageUtils.pressKeys( 'ArrowRight', { times: 8 } );
			await expect( blockThread ).toHaveClass( /is-selected/ );
			await expect( alphaThread ).not.toHaveClass( /is-selected/ );
		} );
	} );

	test.describe( 'Block-level note highlight', () => {
		test( 'tints a noted block and keeps the tint when the block or note is selected', async ( {
			editor,
			requestUtils,
			blockNoteUtils,
		} ) => {
			const tint = await getAuthorTint( requestUtils );

			await editor.insertBlock( {
				name: 'core/image',
				attributes: { url: 'https://cldup.com/cXyG__fTLN.jpg' },
			} );
			await blockNoteUtils.addNote( 'Whole image note' );

			const image = editor.canvas.getByRole( 'document', {
				name: 'Block: Image',
			} );
			const expectOverlay = async ( outlineStyle ) => {
				await expect( image ).toHaveCSS( 'background-color', tint, {
					pseudo: 'after',
				} );
				await expect( image ).toHaveCSS(
					'outline-style',
					outlineStyle,
					{
						pseudo: 'after',
					}
				);
			};

			await editor.canvas
				.getByRole( 'textbox', { name: 'Add title' } )
				.click();
			await expectOverlay( 'none' );

			// The selection outline shows without deepening the tint.
			await blockNoteUtils.getThread( 'Whole image note' ).click();
			await expectOverlay( 'solid' );

			await editor.canvas
				.getByRole( 'textbox', { name: 'Add title' } )
				.click();
			await expectOverlay( 'none' );
			await editor.selectBlocks( image );
			await expectOverlay( 'solid' );
		} );

		test( 'clears the tint when the block-level note is deleted', async ( {
			editor,
			requestUtils,
			blockNoteUtils,
		} ) => {
			const tint = await getAuthorTint( requestUtils );

			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: { content: 'Tint goes away.' },
			} );
			await blockNoteUtils.addNote( 'Temporary note' );

			const paragraph = editor.canvas.getByRole( 'document', {
				name: 'Block: Paragraph',
			} );
			await expect( paragraph ).toHaveCSS( 'background-color', tint, {
				pseudo: 'after',
			} );

			await blockNoteUtils.getThread( 'Temporary note' ).click();
			await blockNoteUtils.deleteNote();
			await expect( paragraph ).toHaveCSS(
				'background-color',
				'rgba(0, 0, 0, 0)',
				{ pseudo: 'after' }
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
			await blockNoteUtils.insertBlockWithNote( {
				content: 'Saved with a note.',
				note: 'Saved note',
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
			await blockNoteUtils.insertBlockWithNote( {
				content: 'Reply to me.',
				note: 'Parent note',
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
			await blockNoteUtils.insertBlockWithNote( {
				content: 'Orphan me.',
				note: 'Orphaned note',
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
		test( 'formats text in the new note textbox', async ( {
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

			await test.step( 'Cmd+B toggles bold', async () => {
				await page.keyboard.type( 'hello world' );
				await pageUtils.pressKeys( 'primary+a' );
				await pageUtils.pressKeys( 'primary+b' );
				await expect(
					textbox.locator( 'strong' ),
					'Selection should be wrapped in <strong> after primary+b'
				).toHaveText( 'hello world' );
				await page.keyboard.press( 'Backspace' );
			} );

			await test.step( 'Cmd+K opens the inline link popover for the selected text', async () => {
				await page.keyboard.type( 'visit example' );
				await pageUtils.pressKeys( 'primary+a' );

				/*
				 * Cmd+K should open the inline link UI rather than the
				 * WordPress command palette. The command palette has the
				 * "Command palette" accessible name; the inline link UI
				 * surfaces the LinkControl search combobox.
				 */
				await pageUtils.pressKeys( 'primary+k' );
				const linkInput = page.getByRole( 'combobox', {
					name: 'Search or type URL',
				} );
				await expect(
					linkInput,
					'Inline link search input should be visible'
				).toBeVisible();
				await expect(
					page.getByRole( 'dialog', { name: 'Command palette' } ),
					'Command palette should not have opened'
				).toBeHidden();

				// The popover moves focus to the search input asynchronously;
				// Escape must reach the popover rather than the note field.
				await expect( linkInput ).toBeFocused();

				/*
				 * Pressing Escape closes the link popover and leaves the note
				 * form intact; focus does not get yanked out of the editor, and
				 * the selection is restored rather than left collapsed.
				 */
				await page.keyboard.press( 'Escape' );
				await expect( linkInput ).toBeHidden();
				await expect( textbox ).toBeFocused();
				await expect
					.poll( () =>
						page.evaluate( () => window.getSelection().toString() )
					)
					.toBe( 'visit example' );
				await page.keyboard.press( 'Backspace' );
			} );

			await test.step( 'Backtick wrapping applies core/code inline format', async () => {
				// `core/code` applies through its `__unstableInputRule`.
				await page.keyboard.type( '`code` after' );
				await expect( textbox.locator( 'code' ) ).toHaveText( 'code' );
			} );
		} );

		test( 'Cmd+K opens an unclipped link popover in the reply form', async ( {
			page,
			pageUtils,
			blockNoteUtils,
		} ) => {
			await blockNoteUtils.insertBlockWithNote( {
				content: 'Reply link host',
				note: 'Reply link note',
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

			// Clicks in the portaled popover must not pull focus back to the thread.
			await linkInput.click();
			await expect( linkInput ).toBeFocused();

			// Escape closes the popover and keeps the reply form intact.
			await page.keyboard.press( 'Escape' );
			await expect( linkInput ).toBeHidden();
			await expect( replyTextbox ).toBeVisible();
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
			const suggestions = page.getByRole( 'listbox' );

			await test.step( 'Cancels the suggestions', async () => {
				await expect( suggestions ).toBeVisible();
				await page.keyboard.press( 'Escape' );
				await expect( suggestions ).toBeHidden();
				await expect( textbox ).toBeFocused();
			} );

			await page.keyboard.press( 'Backspace' );
			await page.keyboard.type( '@' );
			await expect( suggestions ).toBeVisible();

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
				.getByRole( 'list' )
				.getByRole( 'listitem' )
				.locator( 'span.wp-note-mention' );
			await expect( savedChip ).toHaveText( '@Mentionable Teammate' );
			await expect( savedChip ).toHaveClass( mentionClasses );
		} );
	} );

	test.describe( 'Notes shared by several blocks', () => {
		test( 'shows, moves, deletes and restores a note on duplicated blocks', async ( {
			editor,
			page,
			pageUtils,
			blockNoteUtils,
		} ) => {
			// Keeps the toolbar button once the shared note is deleted.
			await blockNoteUtils.insertBlockWithNote( {
				name: 'core/heading',
				content: 'Other block',
				note: 'Other note',
			} );
			await blockNoteUtils.insertBlockWithNote( {
				content: 'Duplicate me',
				note: 'Shared note',
			} );
			const paragraphs = editor.canvas.getByRole( 'document', {
				name: 'Block: Paragraph',
			} );
			const thread = blockNoteUtils.getThread( 'Shared note' );
			// Moves focus out of the new thread, so only the caret selects notes.
			await editor.canvas
				.getByRole( 'textbox', { name: 'Add title' } )
				.click();
			await paragraphs.click();
			await expect( thread ).toHaveClass( /is-selected/ );
			await pageUtils.pressKeys( 'primary+shift+d' );
			await expect( paragraphs ).toHaveCount( 2 );

			const toolbar = page.getByRole( 'toolbar', {
				name: 'Block tools',
			} );

			await test.step( 'Keeps the note selected on the copy', async () => {
				await expect( thread ).toHaveClass( /is-selected/ );
			} );

			await test.step( 'Lists the note once', async () => {
				await expect( thread ).toHaveCount( 1 );
			} );

			await test.step( 'Counts the note on each copy', async () => {
				for ( const index of [ 0, 1 ] ) {
					await editor.selectBlocks( paragraphs.nth( index ) );
					await expect(
						toolbar.getByRole( 'button', {
							name: 'Add note (1 note)',
							exact: true,
						} )
					).toBeVisible();
				}
			} );

			await test.step( 'Goes back to the first copy', async () => {
				for ( const index of [ 0, 1 ] ) {
					await editor.selectBlocks( paragraphs.nth( index ) );
					await thread.click();
					await expect( thread ).toHaveClass( /is-selected/ );
					await thread
						.getByRole( 'button', { name: 'Back to block' } )
						.focus();
					await page.keyboard.press( 'Enter' );
					await expect( paragraphs.first() ).toHaveClass(
						/is-selected/
					);
				}
			} );

			await test.step( 'Deletes the note from every copy', async () => {
				await thread.click();
				await blockNoteUtils.deleteNote();
				await expect( thread ).toBeHidden();
				for ( const index of [ 0, 1 ] ) {
					await editor.selectBlocks( paragraphs.nth( index ) );
					await expect(
						toolbar.getByRole( 'button', {
							name: 'Add note',
							exact: true,
						} )
					).toBeVisible();
				}
			} );

			await test.step( 'Restores the note on every copy', async () => {
				await blockNoteUtils
					.getNotice( 'Note deleted.' )
					.getByRole( 'button', { name: 'Undo' } )
					.click();
				await expect(
					blockNoteUtils.getNotice( 'Note restored.' )
				).toBeVisible();
				await expect( thread ).toHaveCount( 1 );
				for ( const index of [ 0, 1 ] ) {
					await editor.selectBlocks( paragraphs.nth( index ) );
					await expect(
						toolbar.getByRole( 'button', {
							name: 'Add note (1 note)',
							exact: true,
						} )
					).toBeVisible();
				}
			} );
		} );

		test( 'selects and resolves an inline note split across blocks', async ( {
			editor,
			page,
			blockNoteUtils,
		} ) => {
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: { content: 'Hello world' },
			} );
			const paragraphs = editor.canvas.getByRole( 'document', {
				name: 'Block: Paragraph',
			} );
			await paragraphs.click();
			await blockNoteUtils.selectBlockText();
			await blockNoteUtils.addNote( 'Split note' );
			const marks = editor.canvas.locator( 'mark.wp-note' );
			await expect( marks ).toHaveAttribute( 'data-id', /^\d+$/ );

			await paragraphs.click();
			await blockNoteUtils.selectBlockText( { start: 5, length: 0 } );
			await page.keyboard.press( 'Enter' );
			await expect( paragraphs ).toHaveCount( 2 );
			await expect( marks ).toHaveCount( 2 );

			const thread = blockNoteUtils.getThread( 'Split note' );

			await test.step( 'Lists the note once', async () => {
				await expect( thread ).toHaveCount( 1 );
			} );

			await test.step( "Selects the note from the first half's marker", async () => {
				// Moves the block toolbar off the first marker.
				await editor.canvas
					.getByRole( 'textbox', { name: 'Add title' } )
					.click();
				await marks.first().click();
				await expect( thread ).toHaveClass( /is-selected/ );
				await page.keyboard.type( '!' );
				await expect( paragraphs.first() ).toContainText( '!' );
				await expect( paragraphs.nth( 1 ) ).not.toContainText( '!' );
			} );

			await test.step( 'Resolves the note in both halves', async () => {
				await page.getByRole( 'button', { name: 'Resolve' } ).click();
				await expect( marks ).toHaveCount( 0 );
			} );
		} );

		test( 'selects a note only from blocks that hold it', async ( {
			editor,
			blockNoteUtils,
		} ) => {
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: { content: 'one' },
			} );
			const paragraphs = editor.canvas.getByRole( 'document', {
				name: 'Block: Paragraph',
			} );
			await paragraphs.click();
			await blockNoteUtils.selectBlockText();
			await blockNoteUtils.addNote( 'Inline note' );
			// A split can leave a copy with the note's id but none of its text.
			const [ { attributes } ] = await editor.getBlocks();
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: { metadata: attributes.metadata },
			} );

			await test.step( 'Not from a text block without its marker', async () => {
				const thread = blockNoteUtils.getThread( 'Inline note' );
				await blockNoteUtils.deselect();
				await expect( thread ).not.toHaveClass( /is-selected/ );
				const copy = editor.canvas.getByRole( 'document', {
					name: /^Empty block/,
				} );
				await copy.click();
				await expect( copy ).toHaveClass( /is-selected/ );
				await expect( thread ).not.toHaveClass( /is-selected/ );
			} );

			await test.step( 'From an empty block with a block-level note', async () => {
				await blockNoteUtils.insertBlockWithNote( {
					name: 'core/heading',
					content: '',
					note: 'Heading note',
				} );
				const thread = blockNoteUtils.getThread( 'Heading note' );
				await blockNoteUtils.deselect();
				await expect( thread ).not.toHaveClass( /is-selected/ );
				await editor.canvas
					.getByRole( 'document', { name: 'Block: Heading' } )
					.click();
				await expect( thread ).toHaveClass( /is-selected/ );
			} );
		} );
	} );

	test.describe( 'Notes spanning blocks', () => {
		async function insertParagraphs( editor ) {
			for ( let i = 0; i < 3; i++ ) {
				await editor.insertBlock( {
					name: 'core/paragraph',
					attributes: { content: 'abcdef' },
				} );
			}
		}

		// The same text on each line, so the caret lands between the same
		// letters two lines up.
		async function selectAcrossBlocks( {
			editor,
			pageUtils,
			blockNoteUtils,
		} ) {
			await editor.canvas
				.getByRole( 'document', { name: 'Block: Paragraph' } )
				.last()
				.click();
			await blockNoteUtils.selectBlockText( { start: 3, length: 0 } );
			await pageUtils.pressKeys( 'shift+ArrowUp', { times: 2 } );
		}

		async function getNoteIds( editor ) {
			return ( await editor.getBlocks() ).map(
				( block ) => block.attributes.metadata?.noteId
			);
		}

		test( 'adds one note to every selected block', async ( {
			editor,
			page,
			pageUtils,
			blockNoteUtils,
		} ) => {
			await insertParagraphs( editor );
			const paragraphs = editor.canvas.getByRole( 'document', {
				name: 'Block: Paragraph',
			} );
			const marks = editor.canvas.locator( 'mark.wp-note' );
			const sidebar = page.getByRole( 'region', {
				name: 'Editor settings',
			} );

			await test.step( 'Cancel removes the draft from every block', async () => {
				await selectAcrossBlocks( {
					editor,
					pageUtils,
					blockNoteUtils,
				} );
				await editor.clickBlockOptionsMenuItem( 'Add note' );
				await expect( marks ).toHaveText( [ 'def', 'abcdef', 'abc' ] );
				await sidebar.getByRole( 'button', { name: 'Cancel' } ).click();
				await expect( marks ).toHaveCount( 0 );
			} );

			await test.step( 'Adds one note to every block', async () => {
				await selectAcrossBlocks( {
					editor,
					pageUtils,
					blockNoteUtils,
				} );
				await blockNoteUtils.addNote( 'Spanning note' );
				await expect(
					blockNoteUtils.getThread( 'Spanning note' )
				).toHaveCount( 1 );
				await expect( marks ).toHaveText( [ 'def', 'abcdef', 'abc' ] );
				const noteIds = await getNoteIds( editor );
				expect( noteIds[ 0 ] ).toHaveLength( 1 );
				expect( noteIds ).toEqual( [
					noteIds[ 0 ],
					noteIds[ 0 ],
					noteIds[ 0 ],
				] );
			} );

			await test.step( 'Deletes the note from every block', async () => {
				await blockNoteUtils.getThread( 'Spanning note' ).click();
				await blockNoteUtils.deleteNote();
				await expect( marks ).toHaveCount( 0 );
				await expect( paragraphs ).toHaveText( [
					'abcdef',
					'abcdef',
					'abcdef',
				] );
			} );

			await test.step( 'Leaves out a block the selection gives no text', async () => {
				await paragraphs.first().click();
				await blockNoteUtils.selectBlockText( { start: 6, length: 0 } );
				await pageUtils.pressKeys( 'shift+ArrowDown' );
				await blockNoteUtils.addNote( 'Second block note' );
				await expect( marks ).toHaveText( [ 'abcdef' ] );
				const noteIds = await getNoteIds( editor );
				expect( noteIds[ 1 ] ).toHaveLength( 1 );
				expect( noteIds ).toEqual( [
					undefined,
					noteIds[ 1 ],
					undefined,
				] );
				await blockNoteUtils.getThread( 'Second block note' ).click();
				await blockNoteUtils.deleteNote();
			} );

			await test.step( 'Adds a block-level note to blocks selected as a whole', async () => {
				await editor.selectBlocks(
					paragraphs.first(),
					paragraphs.nth( 1 )
				);
				await blockNoteUtils.addNote( 'Block note' );
				await expect(
					blockNoteUtils.getThread( 'Block note' )
				).toHaveCount( 1 );
				await expect( marks ).toHaveCount( 0 );
				const noteIds = await getNoteIds( editor );
				expect( noteIds[ 0 ] ).toHaveLength( 1 );
				expect( noteIds ).toEqual( [
					noteIds[ 0 ],
					noteIds[ 0 ],
					undefined,
				] );
			} );
		} );

		test( 'keeps unsent drafts across blocks', async ( {
			editor,
			page,
			pageUtils,
			blockNoteUtils,
		} ) => {
			await insertParagraphs( editor );
			const paragraphs = editor.canvas.getByRole( 'document', {
				name: 'Block: Paragraph',
			} );
			const marks = editor.canvas.locator( 'mark.wp-note' );
			const form = page.getByRole( 'textbox', {
				name: 'New note',
				exact: true,
			} );
			const title = editor.canvas.getByRole( 'textbox', {
				name: 'Add title',
			} );

			await test.step( 'Leaves the form when an end of the selection moves', async () => {
				await selectAcrossBlocks( {
					editor,
					pageUtils,
					blockNoteUtils,
				} );
				await editor.clickBlockOptionsMenuItem( 'Add note' );
				await form.fill( 'Draft' );
				await expect( marks ).toHaveText( [ 'def', 'abcdef', 'abc' ] );

				const box = await paragraphs.first().boundingBox();
				await paragraphs.first().click( {
					modifiers: [ 'Shift' ],
					position: { x: box.width - 2, y: box.height / 2 },
				} );
				await expect( form ).toBeHidden();
				await expect( marks ).toHaveCount( 0 );

				// The text is kept under the first block.
				await title.click();
				await paragraphs.first().click();
				await expect( form ).toHaveText( 'Draft' );
			} );

			await test.step( "Keeps another block's draft out of a note on whole blocks", async () => {
				// Moves the block toolbar off the middle paragraph.
				await title.click();
				await paragraphs.nth( 1 ).click();
				await blockNoteUtils.selectBlockText( { start: 1, length: 3 } );
				await editor.clickBlockOptionsMenuItem( 'Add note' );
				await form.fill( 'Unsent' );
				await title.click();

				await editor.selectBlocks(
					paragraphs.first(),
					paragraphs.last()
				);
				await blockNoteUtils.addNote( 'Whole blocks note' );
				await expect( marks ).toHaveCount( 0 );
				const noteIds = await getNoteIds( editor );
				expect( noteIds[ 0 ] ).toHaveLength( 1 );
				expect( noteIds ).toEqual( [
					noteIds[ 0 ],
					noteIds[ 0 ],
					noteIds[ 0 ],
				] );
			} );
		} );

		test( 'tints and selects a block without text between the noted text', async ( {
			editor,
			requestUtils,
			blockNoteUtils,
		} ) => {
			const tint = await getAuthorTint( requestUtils );
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: { content: 'abcdef' },
			} );
			await editor.insertBlock( {
				name: 'core/image',
				attributes: { url: 'https://cldup.com/cXyG__fTLN.jpg' },
			} );
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: { content: 'abcdef' },
			} );
			const paragraphs = editor.canvas.getByRole( 'document', {
				name: 'Block: Paragraph',
			} );
			const image = editor.canvas.getByRole( 'document', {
				name: 'Block: Image',
			} );
			await paragraphs.last().click();
			await blockNoteUtils.selectBlockText( { start: 3, length: 0 } );
			await paragraphs
				.first()
				.click( { modifiers: [ 'Shift' ], position: { x: 1, y: 5 } } );
			await blockNoteUtils.addNote( 'Note around an image' );
			await expect( editor.canvas.locator( 'mark.wp-note' ) ).toHaveText(
				[ 'abcdef', 'abc' ]
			);

			await blockNoteUtils.deselect();
			await expect( image ).toHaveCSS( 'background-color', tint, {
				pseudo: 'after',
			} );
			await expect( paragraphs.first() ).not.toHaveCSS(
				'background-color',
				tint,
				{ pseudo: 'after' }
			);

			const thread = blockNoteUtils.getThread( 'Note around an image' );
			await expect( thread ).not.toHaveClass( /is-selected/ );
			await image.click();
			await expect( thread ).toHaveClass( /is-selected/ );
		} );
	} );
} );
