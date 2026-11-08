const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

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

/**
 * The current user's author color at the note highlight's 0x40 alpha.
 *
 * @param {import('@wordpress/e2e-test-utils-playwright').RequestUtils} requestUtils
 */
async function getAuthorTint( requestUtils ) {
	const { id } = await requestUtils.rest( { path: '/wp/v2/users/me' } );
	const hex = AVATAR_BORDER_COLORS[ id % AVATAR_BORDER_COLORS.length ];
	const [ r, g, b ] = [ 1, 3, 5 ].map( ( i ) =>
		parseInt( hex.slice( i, i + 2 ), 16 )
	);
	return `rgba(${ r }, ${ g }, ${ b }, 0.25)`;
}

class BlockNoteUtils {
	/** @type {import('@playwright/test').Page} */
	#page;
	/** @type {import('@wordpress/e2e-test-utils-playwright').Editor} */
	#editor;
	/** @type {import('@wordpress/e2e-test-utils-playwright').PageUtils} */
	#pageUtils;

	constructor( { page, editor, pageUtils } ) {
		this.#page = page;
		this.#editor = editor;
		this.#pageUtils = pageUtils;
	}

	/**
	 * Selects text inside the focused block, replacing the noisy select-all +
	 * arrow-key dance the inline-note tests use to anchor a marker. The caller
	 * still focuses the block (e.g. by clicking it) first.
	 *
	 * @param {Object}  [range]         Range to select. Omit to select the whole block.
	 * @param {number}  [range.start]   Characters to skip from the block start.
	 * @param {number}  [range.length]  Characters to select. Omit to select all.
	 * @param {boolean} [range.fromEnd] Anchor `length` at the block end instead of `start`.
	 */
	async selectBlockText( { start = 0, length, fromEnd = false } = {} ) {
		// The first `primary+a` selects the block's text.
		await this.#pageUtils.pressKeys( 'primary+a' );
		if ( length === undefined ) {
			return;
		}

		// ArrowLeft/Right collapse the select-all to an edge (cross-platform;
		// `Home`/`End` don't move the caret on macOS) to anchor from there.
		if ( fromEnd ) {
			await this.#pageUtils.pressKeys( 'ArrowRight' );
			await this.#pageUtils.pressKeys( 'Shift+ArrowLeft', {
				times: length,
			} );
			return;
		}

		await this.#pageUtils.pressKeys( 'ArrowLeft' );
		if ( start > 0 ) {
			await this.#pageUtils.pressKeys( 'ArrowRight', { times: start } );
		}
		await this.#pageUtils.pressKeys( 'Shift+ArrowRight', {
			times: length,
		} );
	}

	// Floating notes or the "All notes" sidebar.
	#getNotesSurface() {
		return this.#page.getByRole( 'region', {
			name: /^(Notes|Editor settings)$/,
		} );
	}

	// Focusing the post title clears the block selection, and with it the
	// selected note.
	async deselect() {
		await this.#editor.canvas
			.getByRole( 'textbox', { name: 'Add title' } )
			.focus();
	}

	// "All notes" has no toggle before the first note.
	async showAllNotes() {
		await this.#page.evaluate( () =>
			window.wp.data
				.dispatch( 'core/interface' )
				.enableComplementaryArea(
					'core',
					'edit-post/collab-history-sidebar'
				)
		);
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

	/**
	 * Clicks an item in the "Notes" submenu of the editor's Options menu.
	 *
	 * @param {string} name Name of the item.
	 */
	async clickNotesMenuItem( name ) {
		await this.#page
			.getByRole( 'region', { name: 'Editor top bar' } )
			.getByRole( 'button', { name: 'Options' } )
			.click();
		const notesItem = this.#page.getByRole( 'menuitem', {
			name: 'Notes',
			exact: true,
		} );
		await notesItem.click();
		const item = this.#page
			.getByRole( 'menuitemradio', { name } )
			.or( this.#page.getByRole( 'menuitemcheckbox', { name } ) );
		await item.click();
		// Items keep the menu and its submenu open.
		await this.#page.keyboard.press( 'Escape' );
		await expect( item ).toBeHidden();
		await this.#page.keyboard.press( 'Escape' );
		await expect( notesItem ).toBeHidden();
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

	/**
	 * Inserts a block with a block-level note without going through the
	 * notes UI. For tests that need notes but don't test adding them. Leaves
	 * the note selected, as adding it through the UI does.
	 *
	 * @param {Object}   options
	 * @param {string}   [options.name]    Block name, a paragraph by default.
	 * @param {string}   options.content   Block content.
	 * @param {string}   options.note      Text of the note.
	 * @param {string[]} [options.replies] Texts of the note's replies.
	 */
	async insertBlockWithNote( {
		name = 'core/paragraph',
		content,
		note,
		replies = [],
	} ) {
		// Saves the way the notes UI does, so the notes list picks it up.
		const noteId = await this.#page.evaluate(
			async ( { noteContent, replyContents } ) => {
				const { dispatch, select } = window.wp.data;
				const save = ( text, parent = 0 ) =>
					dispatch( 'core' ).saveEntityRecord(
						'root',
						'comment',
						{
							post: select( 'core/editor' ).getCurrentPostId(),
							content: text,
							status: 'hold',
							type: 'note',
							parent,
						},
						{ throwOnError: true }
					);
				const { id } = await save( noteContent );
				for ( const reply of replyContents ) {
					await save( reply, id );
				}
				return id;
			},
			{ noteContent: note, replyContents: replies }
		);
		await this.#editor.insertBlock( {
			name,
			attributes: { content, metadata: { noteId: [ noteId ] } },
		} );
		// The caret entered the block before the notes list had the note.
		const thread = this.getThread( note );
		await thread.click();
		await expect( thread ).toHaveAttribute( 'aria-expanded', 'true' );
	}

	async addNote( content ) {
		await this.#editor.clickBlockOptionsMenuItem( 'Add note' );
		await this.#page
			.getByRole( 'textbox', { name: 'New note', exact: true } )
			.fill( content );
		await this.#getNotesSurface()
			.getByRole( 'button', { name: 'Add note', exact: true } )
			.click();
		// Wait for the new thread to appear before returning.
		await expect( this.getThread( content ) ).toBeVisible();
	}

	/**
	 * Locates a note thread in the notes sidebar or floating notes.
	 *
	 * @param {string} content Text of the thread's root note.
	 */
	getThread( content ) {
		return this.#getNotesSurface().getByRole( 'treeitem', {
			name: `Note: ${ content }`,
		} );
	}

	/**
	 * Locates a snackbar notice.
	 *
	 * @param {string} text Text of the notice.
	 */
	getNotice( text ) {
		return this.#page
			.getByRole( 'button', { name: 'Dismiss this notice' } )
			.filter( { hasText: text } );
	}

	/**
	 * Replies to the selected note and waits for the reply form to reset.
	 *
	 * @param {string} content Reply text.
	 */
	async addReply( content ) {
		const sidebar = this.#getNotesSurface();
		const replyForm = sidebar.getByRole( 'textbox', { name: 'Reply to' } );
		await replyForm.fill( content );
		await sidebar
			.getByRole( 'button', { name: 'Reply', exact: true } )
			.click();
		await expect(
			sidebar.getByText( content, { exact: true } )
		).toBeVisible();
		// The form clears once the reply saves.
		await expect( replyForm ).toHaveText( '' );
	}

	async clickBlockNoteActionMenuItem( actionName, index = 0 ) {
		await this.#getNotesSurface()
			.getByRole( 'button', { name: 'Actions' } )
			.nth( index )
			.click();
		await this.#page.getByRole( 'menuitem', { name: actionName } ).click();
	}

	async addReactionToComment( emoji ) {
		await this.#page
			.getByRole( 'combobox', { name: 'Add reaction' } )
			.click();
		await this.waitForFullPicker();

		// Curated reactions carry their own exact labels (e.g. "Heart")
		// and are seeded into the "Frequently used" section, so an
		// exact-name gridcell lookup finds them
		// without matching Emojibase labels that merely contain the name
		// (e.g. "smiling face with hearts").
		await this.#page
			.getByRole( 'gridcell', { name: emoji, exact: true } )
			.first()
			.click();
	}

	/**
	 * Wait for the emoji picker popup to open and the Emojibase data to
	 * fill its grid with at least one cell.
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
	 * Open the emoji picker, search by name, and click the first
	 * matching emoji.
	 *
	 * @param {string} search Search term (matched against Emojibase
	 *                        labels, e.g. "red heart" or "thumbs up").
	 */
	async pickFullPickerEmojiBySearch( search ) {
		await this.#page
			.getByRole( 'combobox', { name: 'Add reaction' } )
			.click();
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

	/**
	 * Deletes a note through its actions menu and waits for the delete to
	 * finish.
	 *
	 * @param {number} [index] Index of the note's "Actions" button.
	 */
	async deleteNote( index = 0 ) {
		await this.clickBlockNoteActionMenuItem( 'Delete', index );
		await this.#page
			.getByRole( 'dialog' )
			.getByRole( 'button', { name: 'Delete' } )
			.click();
		await expect( this.getNotice( 'Note deleted.' ) ).toBeVisible();
	}
}

module.exports = { BlockNoteUtils, getAuthorTint };
