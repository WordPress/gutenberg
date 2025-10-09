/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.use( {
	blockCommentUtils: async ( { page, editor }, use ) => {
		await use( new BlockCommentUtils( { page, editor } ) );
	},
} );

test.describe( 'Block Comments', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.setGutenbergExperiments( [
			'gutenberg-block-comment',
		] );
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await Promise.all( [
			requestUtils.deleteAllComments( 'block_comment' ),
			requestUtils.setGutenbergExperiments( [] ),
		] );
	} );

	test( 'can pin and unpin comments sidebar', async ( {
		page,
		blockCommentUtils,
	} ) => {
		const topBarButton = await blockCommentUtils.openBlockCommentSidebar();
		await page
			.getByRole( 'button', { name: 'Unpin from toolbar' } )
			.click();
		await expect( topBarButton ).toBeHidden();
		await page.getByRole( 'button', { name: 'Pin to toolbar' } ).click();
		await expect( topBarButton ).toBeVisible();
	} );

	test( 'can add a comment to a block', async ( { editor, page } ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Testing block comments' },
		} );
		await editor.clickBlockOptionsMenuItem( 'Comment' );
		await page
			.getByRole( 'textbox', {
				name: 'New Comment',
				exact: true,
			} )
			.fill( 'A test comment' );
		await page
			.getByRole( 'region', { name: 'Editor settings' } )
			.getByRole( 'button', { name: 'Comment', exact: true } )
			.click();
		const thread = page
			.getByRole( 'region', { name: 'Editor settings' } )
			.getByRole( 'listitem', {
				name: 'Comment: A test comment',
			} );

		await expect( thread ).toBeVisible();
		// Should focus the newly added comment thread.
		await expect( thread ).toBeFocused();
	} );

	test( 'can reply to a block comment', async ( {
		page,
		blockCommentUtils,
	} ) => {
		await blockCommentUtils.addBlockWithComment( {
			type: 'core/paragraph',
			attributes: { content: 'Testing block comments' },
			comment: 'Test comment',
		} );
		const commentForm = page.getByRole( 'textbox', { name: 'Reply to' } );
		const commentText = page
			.locator( '.editor-collab-sidebar-panel__user-comment' )
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
				.filter( { hasText: 'Reply added successfully.' } )
		).toBeVisible();
	} );

	test( 'can edit a block comment', async ( { page, blockCommentUtils } ) => {
		await blockCommentUtils.addBlockWithComment( {
			type: 'core/heading',
			attributes: { content: 'Testing block comments' },
			comment: 'test comment before edit',
		} );
		await blockCommentUtils.clickBlockCommentActionMenuItem( 'Edit' );
		await page
			.getByRole( 'textbox', { name: 'Comment' } )
			.first()
			.fill( 'Test comment after edit.' );
		await page
			.getByRole( 'region', { name: 'Editor settings' } )
			.getByRole( 'button', { name: 'Update', exact: true } )
			.click();

		await expect(
			page.locator( '.editor-collab-sidebar-panel__user-comment' )
		).toHaveText( 'Test comment after edit.' );
		await expect(
			page
				.getByRole( 'button', { name: 'Dismiss this notice' } )
				.filter( { hasText: 'Comment updated.' } )
		).toBeVisible();
	} );

	test( 'can delete a block comment', async ( {
		page,
		blockCommentUtils,
	} ) => {
		await blockCommentUtils.addBlockWithComment( {
			type: 'core/paragraph',
			attributes: { content: 'Testing block comments' },
			comment: 'Test comment to delete.',
		} );
		await blockCommentUtils.clickBlockCommentActionMenuItem( 'Delete' );
		await page
			.getByRole( 'dialog' )
			.getByRole( 'button', { name: 'Delete' } )
			.click();

		await expect(
			page.locator( '.editor-collab-sidebar-panel__user-comment' )
		).toBeHidden();
		await expect(
			page
				.getByRole( 'button', { name: 'Dismiss this notice' } )
				.filter( { hasText: 'Comment deleted successfully.' } )
		).toBeVisible();
	} );

	test( 'can resolve and reopen a block comment', async ( {
		page,
		blockCommentUtils,
	} ) => {
		await blockCommentUtils.addBlockWithComment( {
			type: 'core/heading',
			attributes: { content: 'Testing block comments' },
			comment: 'Test comment to resolve.',
		} );

		const thread = page
			.getByRole( 'region', { name: 'Editor settings' } )
			.getByRole( 'listitem', {
				name: 'Comment: Test comment to resolve.',
			} );
		await thread.click();
		await expect( thread ).toHaveAttribute( 'aria-expanded', 'true' );

		const resolveButton = page.getByRole( 'button', { name: 'Resolve' } );
		await resolveButton.click();
		await expect(
			page
				.getByRole( 'button', { name: 'Dismiss this notice' } )
				.filter( { hasText: 'Comment marked as resolved.' } )
		).toBeVisible();
		await expect( thread ).toBeFocused();
		await expect( thread ).toHaveAttribute( 'aria-expanded', 'false' );

		await thread.click();
		await expect( resolveButton ).toBeDisabled();

		await blockCommentUtils.clickBlockCommentActionMenuItem( 'Reopen' );
		await expect( resolveButton ).toBeEnabled();
		await expect(
			page
				.getByRole( 'button', { name: 'Dismiss this notice' } )
				.filter( { hasText: 'Comment reopened.' } )
		).toBeVisible();
	} );

	test( 'can reopen a resolved comment when adding a reply', async ( {
		page,
		blockCommentUtils,
	} ) => {
		await blockCommentUtils.addBlockWithComment( {
			type: 'core/heading',
			attributes: { content: 'Testing block comments' },
			comment: 'Test comment to resolve.',
		} );

		const resolveButton = page.getByRole( 'button', { name: 'Resolve' } );
		await resolveButton.click();
		await expect(
			page
				.getByRole( 'button', { name: 'Dismiss this notice' } )
				.filter( { hasText: 'Comment marked as resolved.' } )
		).toBeVisible();

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
				.filter( { hasText: 'Comment reopened.' } )
		).toBeVisible();
	} );

	test( 'selecting a block or comment marks it as an active', async ( {
		editor,
		page,
		blockCommentUtils,
	} ) => {
		await blockCommentUtils.addBlockWithComment( {
			type: 'core/heading',
			attributes: { content: 'First block' },
			comment: 'First block comment',
		} );
		await blockCommentUtils.addBlockWithComment( {
			type: 'core/paragraph',
			attributes: { content: 'Second block' },
			comment: 'Second block comment',
		} );
		await editor.insertBlock( { name: 'core/spacer' } );
		await blockCommentUtils.addBlockWithComment( {
			type: 'core/heading',
			attributes: { content: 'Third block' },
			comment: 'Third block comment',
		} );

		const threadsContainer = page
			.getByRole( 'region', {
				name: 'Editor settings',
			} )
			.getByRole( 'list' );
		const threads = threadsContainer.getByRole( 'listitem' );
		const activeThread = threadsContainer.locator( '.is-selected' );
		const replyTextbox = activeThread.getByRole( 'textbox', {
			name: 'Reply to',
		} );

		// Comment and reply textbox should active for last inserter block.
		await expect( activeThread ).toContainText( 'Third block comment' );
		await expect( replyTextbox ).toBeVisible();

		// Clicking on a block comment should make it active.
		await threads.last().click();
		await expect( activeThread ).toContainText( 'Third block comment' );
		await expect( replyTextbox ).toBeVisible();

		// Clicking on a block in canvas should make its comment active.
		await editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.click();
		await expect( activeThread ).toContainText( 'Second block comment' );
		await expect( replyTextbox ).toBeVisible();
	} );

	test.describe( 'Keyboard navigation', () => {
		test( 'should expand or collapse a comment with Enter key', async ( {
			editor,
			page,
			blockCommentUtils,
		} ) => {
			await blockCommentUtils.addBlockWithComment( {
				type: 'core/heading',
				attributes: { content: 'Testing block comments' },
				comment: 'Test comment',
			} );

			// Click on the title field to deselect the block and the comment.
			await editor.canvas
				.getByRole( 'textbox', { name: 'Add title' } )
				.focus();

			const thread = page
				.getByRole( 'region', {
					name: 'Editor settings',
				} )
				.getByRole( 'listitem', {
					name: 'Comment: Test comment',
				} );

			// Expand the comment with Enter key.
			await thread.focus();
			await page.keyboard.press( 'Enter' );
			await expect( thread ).toHaveAttribute( 'aria-expanded', 'true' );

			// The related block should be selected, but the focus should remain on the comment.
			await expect(
				editor.canvas.getByText( 'Testing block comments' )
			).toHaveClass( /is-selected/ );
			await expect( thread ).toBeFocused();

			// Collapse the comment with Enter key.
			await page.keyboard.press( 'Enter' );
			await expect( thread ).toHaveAttribute( 'aria-expanded', 'false' );
		} );

		test( 'should collapse a comment with Escape key', async ( {
			page,
			blockCommentUtils,
		} ) => {
			await blockCommentUtils.addBlockWithComment( {
				type: 'core/heading',
				attributes: { content: 'Testing block comments' },
				comment: 'Test comment escape',
			} );

			const thread = page
				.getByRole( 'region', {
					name: 'Editor settings',
				} )
				.getByRole( 'listitem', {
					name: 'Comment: Test comment escape',
				} );

			await thread.click();
			await expect( thread ).toHaveAttribute( 'aria-expanded', 'true' );

			// Collapse the comment with Escape key.
			await page.keyboard.press( 'Escape' );
			await expect( thread ).toHaveAttribute( 'aria-expanded', 'false' );
		} );

		test( 'should collapse a comment after canceling comment form', async ( {
			page,
			blockCommentUtils,
		} ) => {
			await blockCommentUtils.addBlockWithComment( {
				type: 'core/heading',
				attributes: { content: 'Testing block comments' },
				comment: 'Test comment',
			} );

			const thread = page
				.getByRole( 'region', {
					name: 'Editor settings',
				} )
				.getByRole( 'listitem', {
					name: 'Comment: Test comment',
				} );

			await thread.click();
			await expect( thread ).toHaveAttribute( 'aria-expanded', 'true' );
			await thread.getByRole( 'button', { name: 'Cancel' } ).click();
			await expect( thread ).toHaveAttribute( 'aria-expanded', 'false' );
			await expect( thread ).toBeFocused();
		} );

		test( 'should have accessible name for the comment threads', async ( {
			page,
			blockCommentUtils,
		} ) => {
			await blockCommentUtils.addBlockWithComment( {
				type: 'core/heading',
				attributes: { content: 'Testing block comments' },
				comment: 'Test comment',
			} );

			const thread = page
				.getByRole( 'region', {
					name: 'Editor settings',
				} )
				.getByRole( 'listitem' );

			await thread.focus();
			await expect( thread ).toHaveAccessibleName(
				'Comment: Test comment'
			);
		} );

		test( 'should expand and focus the thread after clicking the "x more replies" button', async ( {
			editor,
			page,
			blockCommentUtils,
		} ) => {
			await blockCommentUtils.addBlockWithComment( {
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

			// Check that two replies were added successfully.
			await expect(
				page
					.getByRole( 'button', { name: 'Dismiss this notice' } )
					.filter( { hasText: 'Reply added successfully.' } )
			).toHaveCount( 2 );

			// Click on the title field to deselect the block and the comment.
			await editor.canvas
				.getByRole( 'textbox', { name: 'Add title' } )
				.focus();

			const thread = page
				.getByRole( 'region', {
					name: 'Editor settings',
				} )
				.getByRole( 'listitem', {
					name: 'Comment: Test comment',
				} );

			await thread
				.getByRole( 'button', { name: '1 more reply' } )
				.click();
			await expect( thread ).toHaveAttribute( 'aria-expanded', 'true' );
			await expect( thread ).toBeFocused();
		} );
	} );
} );

class BlockCommentUtils {
	/** @type {import('@playwright/test').Page} */
	#page;
	/** @type {import('@wordpress/e2e-test-utils-playwright').Editor} */
	#editor;

	constructor( { page, editor } ) {
		this.#page = page;
		this.#editor = editor;
	}

	async openBlockCommentSidebar() {
		const toggleButton = this.#page
			.getByRole( 'region', { name: 'Editor top bar' } )
			.getByRole( 'button', { name: 'Comments', exact: true } );

		const isClosed =
			( await toggleButton.getAttribute( 'aria-expanded' ) ) === 'false';

		if ( isClosed ) {
			await toggleButton.click();
			await this.#page
				.getByRole( 'region', { name: 'Editor settings' } )
				.getByRole( 'button', { name: 'Close Comments' } )
				.waitFor();
		}

		return toggleButton;
	}

	async addBlockWithComment( { type, attributes = {}, comment } ) {
		await test.step(
			`Insert a ${ type } block with a comment`,
			async () => {
				await this.#editor.insertBlock( {
					name: type,
					attributes,
				} );
				await this.#editor.clickBlockOptionsMenuItem( 'Comment' );
				await this.#page
					.getByRole( 'textbox', {
						name: 'New Comment',
						exact: true,
					} )
					.fill( comment );
				await this.#page
					.getByRole( 'region', { name: 'Editor settings' } )
					.getByRole( 'button', { name: 'Comment', exact: true } )
					.click();
				await this.#page
					.getByRole( 'button', { name: 'Dismiss this notice' } )
					.filter( { hasText: 'Comment added successfully.' } )
					.click();
			},
			{ box: true }
		);
	}

	async clickBlockCommentActionMenuItem( actionName ) {
		await this.#page
			.getByRole( 'region', { name: 'Editor settings' } )
			.getByRole( 'button', { name: 'Actions' } )
			.click();
		await this.#page.getByRole( 'menuitem', { name: actionName } ).click();
	}
}
