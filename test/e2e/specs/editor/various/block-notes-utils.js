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
}

module.exports = { BlockNoteUtils };
