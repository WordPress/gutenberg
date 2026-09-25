const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

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
			.pressSequentially( content );
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

	/**
	 * Replies to the selected note and waits for the reply form to reset.
	 *
	 * @param {string} content Reply text.
	 */
	async addReply( content ) {
		const sidebar = this.#page.getByRole( 'region', {
			name: 'Editor settings',
		} );
		const replyForm = sidebar.getByRole( 'textbox', { name: 'Reply to' } );
		// The reply form doesn't focus on mount.
		await replyForm.click();
		await replyForm.pressSequentially( content );
		await sidebar
			.getByRole( 'button', { name: 'Reply', exact: true } )
			.click();
		await expect(
			sidebar.getByText( content, { exact: true } )
		).toBeVisible();
		// The form clears after the reply saves; typing earlier appends to it.
		await expect( replyForm ).toHaveText( '' );
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
		await this.waitForFullPicker();

		// Curated and filter-provided reactions carry exact label
		// overrides (e.g. "Heart") and are seeded into the "Frequently
		// used" section, so an exact-name gridcell lookup finds them
		// without matching Emojibase labels that merely contain the name
		// (e.g. "smiling face with hearts").
		await this.#page
			.getByRole( 'gridcell', { name: emoji, exact: true } )
			.first()
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
	 * Open the emoji picker, search by name, and click the first
	 * matching emoji.
	 *
	 * @param {string} search Search term (matched against Emojibase
	 *                        labels, e.g. "red heart" or "thumbs up").
	 */
	async pickFullPickerEmojiBySearch( search ) {
		await this.#page
			.getByRole( 'button', { name: 'Add reaction' } )
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
	 * Open the block toolbar's reaction picker for the selected block and
	 * pick an emoji by its exact label.
	 *
	 * @param {string} emoji Exact emoji label, e.g. "Heart".
	 */
	async addReactionToBlock( emoji ) {
		await this.#editor.clickBlockToolbarButton( 'React to block' );
		await this.waitForFullPicker();
		await this.#page
			.getByRole( 'gridcell', { name: emoji, exact: true } )
			.first()
			.click();
	}

	/**
	 * The sidebar entry listing a block's reactions when the block has no
	 * note of its own.
	 *
	 * @param {string} blockTitle The block's display title, e.g. "Paragraph".
	 * @return {import('@playwright/test').Locator} The entry.
	 */
	blockReactionsEntry( blockTitle ) {
		return this.#page
			.getByRole( 'region', { name: 'Editor settings' } )
			.getByRole( 'treeitem', {
				name: `Reactions on ${ blockTitle }`,
				exact: true,
			} );
	}

	/**
	 * The reaction anchor written to the first block's metadata, if any.
	 *
	 * @return {Promise<string|undefined>} The anchor.
	 */
	async getReactionsId() {
		const blocks = await this.#editor.getBlocks();
		return blocks[ 0 ]?.attributes?.metadata?.reactionsId;
	}
}

module.exports = { BlockNoteUtils };
