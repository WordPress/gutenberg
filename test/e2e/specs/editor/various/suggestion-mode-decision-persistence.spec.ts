/**
 * E2E: a Suggestion mode decision is provisional until the post is saved
 * (#73411, reported by tyxla).
 *
 * Accept and Reject change the content as an unsaved edit and record a
 * provisional status (`applied-unsaved` / `rejected-unsaved`) on the note.
 * The save pass makes it final once a saved post no longer carries the
 * suggestion's anchor. So each case is a pair:
 *
 * - decide, then leave without saving: the marker is still in the post, so
 *   the suggestion comes back pending, with Accept and Reject, and a hint that
 *   the decision was not saved;
 * - decide, then save: the decision is final and the post reflects it.
 *
 * Notes left final with their marker still in the post (by an editor from
 * before the save pass) can be rescued with Apply again, Reject again or
 * Reopen.
 */
import { test, expect } from '@wordpress/e2e-test-utils-playwright';

const NOT_SAVED_HINT = /this suggestion, but the post was not saved\./;

async function switchIntent( page: any, intentLabel: string ) {
	await page
		.getByRole( 'region', { name: 'Editor top bar' } )
		.getByRole( 'button', { name: 'Options' } )
		.click();
	const menuItem = page.getByRole( 'menuitemradio', {
		name: new RegExp( `^${ intentLabel }` ),
	} );
	await menuItem.waitFor( { state: 'visible', timeout: 10000 } );
	await menuItem.click();
	// `MenuItemsChoice` doesn't auto-close its dropdown on selection.
	await page.keyboard.press( 'Escape' );
}

/*
 * Returns a promise for the debounced suggestion auto-save REST call. Call
 * this BEFORE performing the edit that triggers the auto-save.
 */
function suggestionSavedPromise( page: any ) {
	return page.waitForResponse(
		( response: any ) =>
			/\/wp\/v2\/comments(\?|$|\/)/.test( response.url() ) &&
			[ 'POST', 'PUT' ].includes( response.request().method() ) &&
			response.ok()
	);
}

async function openNotesSidebar( page: any ) {
	const topBar = page.getByRole( 'region', { name: 'Editor top bar' } );
	const allNotesToggle = topBar.getByRole( 'button', {
		name: 'All notes',
		exact: true,
	} );
	if (
		( await allNotesToggle.getAttribute( 'aria-expanded' ) ) === 'false'
	) {
		await allNotesToggle.click();
	}
	return page.getByRole( 'region', { name: 'Editor settings' } );
}

async function decideSuggestion( page: any, action: 'Accept' | 'Reject' ) {
	const sidebar = await openNotesSidebar( page );
	await sidebar
		.getByRole( 'button', { name: `${ action } suggestion` } )
		.click();
	await expect(
		page
			.locator( '.components-snackbar-list' )
			.getByText(
				action === 'Accept'
					? 'Suggestion applied.'
					: 'Suggestion rejected.'
			)
	).toBeVisible();
}

async function currentPostId( page: any ): Promise< number > {
	return page.evaluate( () =>
		( window as any ).wp.data.select( 'core/editor' ).getCurrentPostId()
	);
}

async function waitForEditor( page: any ) {
	await page.waitForFunction(
		() =>
			( window as any ).wp?.data
				?.select( 'core/editor' )
				?.getCurrentPostId?.() &&
			( window as any ).wp.data.select( 'core/block-editor' ).getBlocks()
				.length > 0
	);
}

/**
 * Leaves the editor without saving, accepting the unsaved-changes prompt.
 * Ends on a freshly loaded editor.
 *
 * @param page Playwright page.
 */
async function leaveWithoutSaving( page: any ) {
	const onDialog = async ( dialog: any ) => {
		await dialog.accept();
	};
	page.on( 'dialog', onDialog );
	await page.reload();
	await waitForEditor( page );
	page.off( 'dialog', onDialog );
}

/**
 * The reviewer's half: a fresh session on the saved post decides in Editing,
 * then either saves or leaves without saving. Ends on a freshly loaded
 * editor.
 *
 * @param args        Arguments.
 * @param args.page   Playwright page.
 * @param args.editor Editor fixture.
 * @param args.action The decision.
 * @param args.save   Whether to save the post after deciding.
 */
async function decideAndReopen( {
	page,
	editor,
	action,
	save,
}: {
	page: any;
	editor: any;
	action: 'Accept' | 'Reject';
	save: boolean;
} ) {
	await page.reload();
	await waitForEditor( page );
	await switchIntent( page, 'Editing' );
	await decideSuggestion( page, action );
	if ( save ) {
		await editor.saveDraft();
		await page.reload();
		await waitForEditor( page );
	} else {
		await leaveWithoutSaving( page );
	}
}

/**
 * The post and its note as the server has them, and the front end.
 *
 * @param args              Arguments.
 * @param args.page         Playwright page.
 * @param args.requestUtils Request utils fixture.
 * @param args.postId       Post id.
 * @return The observations.
 */
async function readServerState( { page, requestUtils, postId }: any ) {
	const post: any = await requestUtils.rest( {
		path: `/wp/v2/posts/${ postId }`,
		params: { context: 'edit' },
	} );
	const notes: any[] = await requestUtils.rest( {
		path: '/wp/v2/comments',
		params: {
			post: postId,
			type: 'note',
			status: 'all',
			context: 'edit',
			per_page: 50,
		},
	} );
	const frontEnd = await readFrontEnd( page, postId );
	return {
		rawPostContent: post.content.raw as string,
		note: notes.find( ( note ) => note.parent === 0 ),
		frontEnd,
	};
}

async function readFrontEnd( page: any, postId: number ) {
	const preview = await page.context().newPage();
	await preview.goto( `/?p=${ postId }&preview=true` );
	const html = (
		( await preview
			.locator( '.wp-block-post-content, .entry-content' )
			.first()
			.innerHTML()
			.catch( () => '' ) ) as string
	 )
		.replace( /\s+/g, ' ' )
		.trim();
	await preview.close();
	return html;
}

/**
 * Asserts the sidebar offers the decision again, with the not-saved hint.
 *
 * @param page Playwright page.
 */
async function expectPendingAgain( page: any ) {
	const sidebar = await openNotesSidebar( page );
	await expect( sidebar.getByText( NOT_SAVED_HINT ) ).toBeVisible();
	await expect(
		sidebar.getByRole( 'button', { name: 'Accept suggestion' } )
	).toBeVisible();
	await expect(
		sidebar.getByRole( 'button', { name: 'Reject suggestion' } )
	).toBeVisible();
}

async function suggestAddition( { editor, page }: any ) {
	await editor.insertBlock( {
		name: 'core/paragraph',
		attributes: { content: 'Hello' },
	} );
	await switchIntent( page, 'Suggesting' );
	const paragraph = editor.canvas
		.getByRole( 'document', { name: 'Block: Paragraph' } )
		.first();
	await paragraph.click();
	await page.keyboard.press( 'End' );
	await page.keyboard.type( ' world' );
	await expect(
		paragraph.locator( 'mark.wp-suggestion-add' )
	).toHaveAttribute( 'data-suggestion-id', /\d/ );
	await editor.saveDraft();
	return currentPostId( page );
}

async function suggestDeletion( { editor, page, pageUtils }: any ) {
	await editor.insertBlock( {
		name: 'core/paragraph',
		attributes: { content: 'Hello world' },
	} );
	await switchIntent( page, 'Suggesting' );
	const paragraph = editor.canvas
		.getByRole( 'document', { name: 'Block: Paragraph' } )
		.first();
	await paragraph.click();
	await page.keyboard.press( 'End' );
	await pageUtils.pressKeys( 'shift+ArrowLeft', { times: 5 } );
	await page.keyboard.press( 'Backspace' );
	await expect(
		paragraph.locator( 'mark.wp-suggestion-del' )
	).toHaveAttribute( 'data-suggestion-id', /\d/ );
	await editor.saveDraft();
	return currentPostId( page );
}

async function suggestBlockInsertion( { editor, page }: any ) {
	await editor.insertBlock( {
		name: 'core/paragraph',
		attributes: { content: 'Existing paragraph' },
	} );
	await switchIntent( page, 'Suggesting' );
	await editor.canvas
		.getByRole( 'document', { name: 'Block: Paragraph' } )
		.first()
		.click();
	await page.keyboard.press( 'End' );
	const suggestionSaved = suggestionSavedPromise( page );
	await page.keyboard.press( 'Enter' );
	await page.keyboard.type( 'Brand new suggested paragraph' );
	await expect(
		editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.nth( 1 )
	).toHaveClass( /is-suggestion-pending-insert/ );
	await suggestionSaved;
	await editor.saveDraft();
	return currentPostId( page );
}

async function suggestHeadingLevel( { editor, page }: any ) {
	await editor.insertBlock( {
		name: 'core/heading',
		attributes: { content: 'My Heading', level: 2 },
	} );
	await switchIntent( page, 'Suggesting' );
	await editor.canvas
		.getByRole( 'document', { name: 'Block: Heading' } )
		.first()
		.click();
	await page
		.getByRole( 'toolbar', { name: 'Block tools' } )
		.getByRole( 'button', { name: /^Heading 2$/ } )
		.click();
	const suggestionSaved = suggestionSavedPromise( page );
	await page.getByRole( 'menuitem', { name: /^Heading 3/ } ).click();
	await suggestionSaved;
	await editor.saveDraft();
	return currentPostId( page );
}

test.describe( 'Suggestion mode decisions are provisional until the post is saved', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.setGutenbergExperiments( [
			'gutenberg-suggestion-mode',
		] );
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllComments( 'note' );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deactivatePlugin(
			'gutenberg-test-suggestion-final-status-seed'
		);
		await requestUtils.setGutenbergExperiments( [] );
	} );

	test.describe( 'accepted inline addition', () => {
		test( 'leave without saving: pending again', async ( {
			editor,
			page,
			requestUtils,
		} ) => {
			const postId = await suggestAddition( { editor, page } );
			await decideAndReopen( {
				page,
				editor,
				action: 'Accept',
				save: false,
			} );

			await expectPendingAgain( page );
			const state = await readServerState( {
				page,
				requestUtils,
				postId,
			} );
			expect( state.note.status ).toBe( 'hold' );
			expect( state.note.meta._wp_suggestion_status ).toBe(
				'applied-unsaved'
			);
			expect( state.rawPostContent ).toContain(
				'data-suggestion-type="add"'
			);
			expect( state.frontEnd ).toContain( 'Hello' );
			expect( state.frontEnd ).not.toContain( 'world' );
		} );

		test( 'decide and save: final', async ( {
			editor,
			page,
			requestUtils,
		} ) => {
			const postId = await suggestAddition( { editor, page } );
			await decideAndReopen( {
				page,
				editor,
				action: 'Accept',
				save: true,
			} );

			const state = await readServerState( {
				page,
				requestUtils,
				postId,
			} );
			expect( state.note.status ).toBe( 'approved' );
			expect( state.note.meta._wp_suggestion_status ).toBe( 'applied' );
			expect( state.rawPostContent ).toContain( 'Hello world' );
			expect( state.rawPostContent ).not.toContain( 'data-suggestion' );
			expect( state.frontEnd ).toContain( 'Hello world' );
		} );
	} );

	test.describe( 'rejected inline addition', () => {
		test( 'leave without saving: pending again', async ( {
			editor,
			page,
			requestUtils,
		} ) => {
			const postId = await suggestAddition( { editor, page } );
			await decideAndReopen( {
				page,
				editor,
				action: 'Reject',
				save: false,
			} );

			await expectPendingAgain( page );
			const state = await readServerState( {
				page,
				requestUtils,
				postId,
			} );
			expect( state.note.status ).toBe( 'hold' );
			expect( state.note.meta._wp_suggestion_status ).toBe(
				'rejected-unsaved'
			);
			expect( state.rawPostContent ).toContain(
				'data-suggestion-type="add"'
			);
		} );

		test( 'decide and save: final', async ( {
			editor,
			page,
			requestUtils,
		} ) => {
			const postId = await suggestAddition( { editor, page } );
			await decideAndReopen( {
				page,
				editor,
				action: 'Reject',
				save: true,
			} );

			const state = await readServerState( {
				page,
				requestUtils,
				postId,
			} );
			expect( state.note.status ).toBe( 'approved' );
			expect( state.note.meta._wp_suggestion_status ).toBe( 'rejected' );
			expect( state.rawPostContent ).not.toContain( 'world' );
			expect( state.rawPostContent ).not.toContain( 'data-suggestion' );
		} );
	} );

	test.describe( 'accepted inline deletion', () => {
		test( 'leave without saving: pending again', async ( {
			editor,
			page,
			pageUtils,
			requestUtils,
		} ) => {
			const postId = await suggestDeletion( { editor, page, pageUtils } );
			await decideAndReopen( {
				page,
				editor,
				action: 'Accept',
				save: false,
			} );

			await expectPendingAgain( page );
			const state = await readServerState( {
				page,
				requestUtils,
				postId,
			} );
			expect( state.note.status ).toBe( 'hold' );
			expect( state.note.meta._wp_suggestion_status ).toBe(
				'applied-unsaved'
			);
			expect( state.rawPostContent ).toContain(
				'data-suggestion-type="del"'
			);
			expect( state.frontEnd ).toContain( 'world' );
		} );

		test( 'decide and save: final', async ( {
			editor,
			page,
			pageUtils,
			requestUtils,
		} ) => {
			const postId = await suggestDeletion( { editor, page, pageUtils } );
			await decideAndReopen( {
				page,
				editor,
				action: 'Accept',
				save: true,
			} );

			const state = await readServerState( {
				page,
				requestUtils,
				postId,
			} );
			expect( state.note.status ).toBe( 'approved' );
			expect( state.note.meta._wp_suggestion_status ).toBe( 'applied' );
			expect( state.rawPostContent ).not.toContain( 'world' );
			expect( state.rawPostContent ).not.toContain( 'data-suggestion' );
			expect( state.frontEnd ).not.toContain( 'world' );
		} );
	} );

	test.describe( 'accepted block insertion', () => {
		test( 'leave without saving: pending again', async ( {
			editor,
			page,
			requestUtils,
		} ) => {
			const postId = await suggestBlockInsertion( { editor, page } );
			await decideAndReopen( {
				page,
				editor,
				action: 'Accept',
				save: false,
			} );

			await expectPendingAgain( page );
			const state = await readServerState( {
				page,
				requestUtils,
				postId,
			} );
			expect( state.note.status ).toBe( 'hold' );
			expect( state.note.meta._wp_suggestion_status ).toBe(
				'applied-unsaved'
			);
			expect( state.rawPostContent ).toContain( 'pending-insert' );
			expect( state.frontEnd ).not.toContain(
				'Brand new suggested paragraph'
			);
		} );

		test( 'decide and save: final', async ( {
			editor,
			page,
			requestUtils,
		} ) => {
			const postId = await suggestBlockInsertion( { editor, page } );
			await decideAndReopen( {
				page,
				editor,
				action: 'Accept',
				save: true,
			} );

			const state = await readServerState( {
				page,
				requestUtils,
				postId,
			} );
			expect( state.note.status ).toBe( 'approved' );
			expect( state.note.meta._wp_suggestion_status ).toBe( 'applied' );
			expect( state.rawPostContent ).toContain(
				'Brand new suggested paragraph'
			);
			expect( state.rawPostContent ).not.toContain( 'pending-insert' );
			expect( state.frontEnd ).toContain(
				'Brand new suggested paragraph'
			);
		} );
	} );

	test.describe( 'accepted heading level', () => {
		test( 'leave without saving: pending again', async ( {
			editor,
			page,
			requestUtils,
		} ) => {
			const postId = await suggestHeadingLevel( { editor, page } );
			await decideAndReopen( {
				page,
				editor,
				action: 'Accept',
				save: false,
			} );

			await expectPendingAgain( page );
			const state = await readServerState( {
				page,
				requestUtils,
				postId,
			} );
			expect( state.note.status ).toBe( 'hold' );
			expect( state.note.meta._wp_suggestion_status ).toBe(
				'applied-unsaved'
			);
			expect( state.rawPostContent ).toContain( 'pending-attributes' );
			expect( state.frontEnd ).toContain( '<h2' );
		} );

		test( 'decide and save: final', async ( {
			editor,
			page,
			requestUtils,
		} ) => {
			const postId = await suggestHeadingLevel( { editor, page } );
			await decideAndReopen( {
				page,
				editor,
				action: 'Accept',
				save: true,
			} );

			const state = await readServerState( {
				page,
				requestUtils,
				postId,
			} );
			expect( state.note.status ).toBe( 'approved' );
			expect( state.note.meta._wp_suggestion_status ).toBe( 'applied' );
			expect( state.rawPostContent ).toContain( '"level":3' );
			expect( state.rawPostContent ).not.toContain(
				'pending-attributes'
			);
			expect( state.frontEnd ).toContain( '<h3' );
		} );
	} );

	test.describe( 'a note left final with its marker still in the post', () => {
		/**
		 * Seeds the state an editor from before the save pass left behind:
		 * the note says Applied, the post still carries the marker.
		 *
		 * @param args              Arguments.
		 * @param args.editor       Editor fixture.
		 * @param args.page         Playwright page.
		 * @param args.requestUtils Request utils fixture.
		 * @return The post id.
		 */
		async function seedStuckNote( { editor, page, requestUtils }: any ) {
			const postId = await suggestAddition( { editor, page } );
			const notes: any[] = await requestUtils.rest( {
				path: '/wp/v2/comments',
				params: { post: postId, type: 'note', status: 'all' },
			} );
			await requestUtils.activatePlugin(
				'gutenberg-test-suggestion-final-status-seed'
			);
			await requestUtils.rest( {
				method: 'PUT',
				path: `/wp/v2/comments/${ notes[ 0 ].id }`,
				data: {
					status: 'approved',
					meta: { _wp_suggestion_status: 'applied' },
				},
			} );
			await requestUtils.deactivatePlugin(
				'gutenberg-test-suggestion-final-status-seed'
			);
			await page.reload();
			await waitForEditor( page );
			await switchIntent( page, 'Editing' );
			return postId;
		}

		test( 'Apply again lands the decision, and a save finalizes it', async ( {
			editor,
			page,
			requestUtils,
		} ) => {
			const postId = await seedStuckNote( {
				editor,
				page,
				requestUtils,
			} );
			const sidebar = await openNotesSidebar( page );
			await expect(
				sidebar.getByText(
					'Applied, but the change is not in the post.'
				)
			).toBeVisible();
			await expect(
				sidebar.getByRole( 'button', { name: 'Reject again' } )
			).toBeVisible();
			await sidebar
				.getByRole( 'button', { name: 'Apply again' } )
				.click();
			await expect(
				page
					.locator( '.components-snackbar-list' )
					.getByText( 'Suggestion applied.' )
			).toBeVisible();
			await editor.saveDraft();

			const state = await readServerState( {
				page,
				requestUtils,
				postId,
			} );
			expect( state.note.status ).toBe( 'approved' );
			expect( state.note.meta._wp_suggestion_status ).toBe( 'applied' );
			expect( state.rawPostContent ).toContain( 'Hello world' );
			expect( state.rawPostContent ).not.toContain( 'data-suggestion' );
		} );

		test( 'Reopen brings Accept and Reject back', async ( {
			editor,
			page,
			requestUtils,
		} ) => {
			const postId = await seedStuckNote( {
				editor,
				page,
				requestUtils,
			} );
			const sidebar = await openNotesSidebar( page );
			await sidebar.getByRole( 'button', { name: 'Reopen' } ).click();
			await expect(
				sidebar.getByRole( 'button', { name: 'Accept suggestion' } )
			).toBeVisible();
			await expect(
				sidebar.getByRole( 'button', { name: 'Reject suggestion' } )
			).toBeVisible();

			await expect
				.poll( async () => {
					const { note } = await readServerState( {
						page,
						requestUtils,
						postId,
					} );
					return [ note.status, note.meta._wp_suggestion_status ];
				} )
				.toEqual( [ 'hold', 'pending' ] );
		} );
	} );
} );
