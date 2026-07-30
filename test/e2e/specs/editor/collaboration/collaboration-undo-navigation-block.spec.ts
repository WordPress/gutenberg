/**
 * Internal dependencies
 */
import { test, expect } from './fixtures';
import { type UserCredentials } from './fixtures/collaboration-utils';

/**
 * Regression test for undo failing while a navigation block is present in a
 * collaborative session.
 *
 * Manual reproduction this mirrors:
 *
 * 1. User A opens an empty post alone and builds it interactively: types a
 *    paragraph, inserts a navigation block via the slash inserter, and types
 *    another paragraph. The navigation block is inserted without a `ref`, so
 *    it requests the navigation fallback, which creates a wp_navigation
 *    entity containing a page-list block and assigns its id as the block's
 *    `ref`. This all happens while the collaboration session is live.
 * 2. User B joins the post afterwards and hydrates from the CRDT document.
 * 3. User B appends a single character to the second paragraph.
 * 4. User B pauses a couple of seconds (like a user noticing a typo), then
 *    presses undo once. Expected: the character reverts. With the bug,
 *    nothing visible happens except a brief redo button flicker.
 *
 * Confirmed mechanism (see the [nav-edits] timeline log emitted by this
 * test): User B's navigation block controller re-emits
 * editEntityRecord( wp_navigation, { selection, blocks } ) with
 * undoIgnore=false when the typed character's round-trip echo lands. That
 * tracked transaction targets a DIFFERENT Yjs document (the navigation
 * entity), so it always forms a separate undo stack item on top of the
 * typing item, regardless of the 500ms captureTimeout. The single undo
 * press pops the invisible navigation item instead of the character, and
 * the pop triggers yet another tracked navigation edit, which clears the
 * redo stack (the observed flicker) and keeps the real item buried.
 *
 * Reproduction conditions established empirically:
 *
 * - The pause before undo is essential. Undoing immediately after typing
 *   works, because the echo has not landed a navigation item on the stack
 *   top yet.
 * - Failure correlates exactly with User B firing a tracked wp_navigation
 *   edit shortly after the keystroke. With no WebSocket latency this fires
 *   in most but not all runs; with RTC_WS_DELAY=50 it fired in 12/12 runs.
 *   For a deterministic failure, run:
 *
 *       RTC_WS_DELAY=50 npm run test:e2e:rtc-websocket -- test/e2e/specs/editor/collaboration/collaboration-undo-navigation-block.spec.ts
 *
 * - The collaborator must be an administrator. wp_navigation requires the
 *   edit_theme_options capability, so an editor-role collaborator cannot
 *   read the menu entity (their navigation block renders "Navigation Menu
 *   has been deleted or is unavailable"), no navigation controller runs on
 *   their client, and undo keeps working.
 */

const USER_A_FIRST_PARAGRAPH = 'First paragraph by user A';
const UNDO_TARGET = 'undo-target';

const ADMIN_COLLABORATOR: UserCredentials = {
	username: 'collaboratoradmin',
	email: 'collaborator-admin@example.com',
	firstName: 'Test',
	lastName: 'CollaboratorAdmin',
	password: 'password',
	roles: [ 'administrator' ],
};

test.describe( 'Collaboration - Undo with a navigation block', () => {
	test( 'User B can undo typing in a paragraph with a single undo press', async ( {
		collaborationUtils,
		requestUtils,
		editor,
		page,
	} ) => {
		// Start from a clean slate. Leftover wp_navigation menus from
		// other test runs would be picked up by the navigation fallback
		// instead of a fresh menu being created. deleteAllMenus only
		// removes one REST page worth of menus per call, so repeat until
		// none remain.
		for ( let attempt = 0; attempt < 10; attempt++ ) {
			await requestUtils.deleteAllMenus();
			const remainingMenus = await requestUtils.rest( {
				path: '/wp/v2/navigation/',
				params: { status: 'publish,draft' },
			} );
			if ( remainingMenus.length === 0 ) {
				break;
			}
		}
		await requestUtils.deleteAllPages();

		// Ensure the navigation fallback menu's page-list has real
		// items, so the navigation subtree is non-trivial.
		for ( const title of [ 'Alpha Page', 'Beta Page', 'Gamma Page' ] ) {
			await requestUtils.rest( {
				method: 'POST',
				path: '/wp/v2/pages',
				params: { title, status: 'publish' },
			} );
		}

		const post = await requestUtils.createPost( {
			title: 'Undo Navigation Block Test',
			content: '',
			status: 'draft',
			date_gmt: new Date().toISOString(),
		} );

		// User A opens the post alone and builds the document
		// interactively, like the manual reproduction. The navigation
		// block is inserted via the slash inserter so the fallback menu
		// creation and the `ref` assignment happen inside the live
		// session.
		await collaborationUtils.openPost( post.id );

		// Record editEntityRecord calls targeting wp_navigation. A tracked
		// (undoIgnore=false) entry on User B shortly after the keystroke is
		// the burial mechanism in action.
		const installNavEditCounter = ( target: typeof page ) =>
			target.evaluate( () => {
				const dispatcher = ( window as any ).wp.data.dispatch( 'core' );
				const original = dispatcher.editEntityRecord;
				( window as any ).__navEdits = [];
				dispatcher.editEntityRecord = (
					kind: string,
					name: string,
					id: unknown,
					edits: unknown,
					options: { undoIgnore?: boolean } | undefined
				) => {
					if ( name === 'wp_navigation' ) {
						( window as any ).__navEdits.push( {
							t: Math.round( performance.now() ),
							keys: Object.keys( edits ?? {} ).join( ',' ),
							undoIgnore: options?.undoIgnore ?? false,
						} );
					}
					return original( kind, name, id, edits, options );
				};
			} );
		await installNavEditCounter( page );

		// Type both paragraphs first, then insert the navigation block
		// between them. The root "Add default block" appender only
		// exists in an empty document, so the navigation block cannot
		// be followed by a click on it.
		await editor.canvas
			.getByRole( 'button', { name: 'Add default block' } )
			.click();
		await page.keyboard.type( USER_A_FIRST_PARAGRAPH );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( UNDO_TARGET );

		// Insert the navigation block via the slash inserter in a new
		// empty paragraph after the first one.
		await editor.canvas
			.getByText( USER_A_FIRST_PARAGRAPH, { exact: true } )
			.click();
		await page.keyboard.press(
			process.platform === 'darwin' ? 'Meta+ArrowRight' : 'End'
		);
		await page.keyboard.press( 'Enter' );
		// In the RTC environment the caret does not reliably land in
		// the freshly split paragraph, so click it explicitly before
		// typing the slash command.
		await editor.canvas
			.getByRole( 'document', {
				name: 'Empty block; start writing or type forward slash to choose a block',
			} )
			.click();
		await page.keyboard.type( '/navigation' );
		await expect(
			page.getByRole( 'option', { name: 'Navigation', exact: true } )
		).toBeVisible();
		await page.keyboard.press( 'Enter' );

		// Wait for the navigation fallback to resolve on User A's
		// client: the block gets a `ref` to the created wp_navigation
		// entity and renders its controlled page-list inner blocks.
		await expect( async () => {
			const blocks = await editor.getBlocks();
			const navigation = blocks.find(
				( block: { name: string } ) => block.name === 'core/navigation'
			);
			expect( navigation?.attributes?.ref ).toBeTruthy();
		} ).toPass( { timeout: 20000 } );
		await expect(
			editor.canvas.locator( '.wp-block-pages-list__item' ).first()
		).toBeVisible( { timeout: 20000 } );

		// Deselect the navigation block so User A sits idle without
		// block UI open, like a user who finished writing.
		await page.evaluate( () => {
			window.wp.data.dispatch( 'core/block-editor' ).clearSelectedBlock();
		} );

		// User B joins after the content exists.
		await requestUtils.createUser( ADMIN_COLLABORATOR );
		const { page: page2, editor: editor2 } =
			await collaborationUtils.joinUser( post.id, ADMIN_COLLABORATOR );
		await collaborationUtils.waitForMutualDiscovery();
		await installNavEditCounter( page2 );

		// Wait for User B to render the document, including the
		// navigation block's controlled page-list subtree.
		await expect( async () => {
			const blocks = await editor2.getBlocks();
			expect( JSON.stringify( blocks ) ).toContain( UNDO_TARGET );
		} ).toPass( { timeout: 20000 } );
		await expect(
			editor2.canvas.locator( '.wp-block-pages-list__item' ).first()
		).toBeVisible( { timeout: 20000 } );

		// User B appends a single character to the second paragraph.
		await editor2.canvas
			.getByText( UNDO_TARGET, { exact: true } )
			.click( { timeout: 20000 } );
		await page2.keyboard.press(
			process.platform === 'darwin' ? 'Meta+ArrowRight' : 'End'
		);
		await page2.keyboard.type( 'a' );
		// Mark when the character was typed, for the nav-edit timeline.
		const typedAt = await page2.evaluate( () =>
			Math.round( performance.now() )
		);

		// Wait for the edit to complete the round trip to User A, so
		// the undo references remote state.
		await expect( async () => {
			const blocks = await editor.getBlocks();
			expect( JSON.stringify( blocks ) ).toContain( `${ UNDO_TARGET }a` );
		} ).toPass( { timeout: 15000 } );

		// Pause like a user noticing the typo before reaching for undo.
		// This matters: a navigation echo transaction that lands more
		// than captureTimeout (500ms) after the keystroke forms a
		// separate, invisible undo stack item on top of the real one.
		await page2.waitForTimeout( 2000 );

		// A single undo press must revert the typed character. With the
		// bug, undo pops an invisible navigation noise item (or a dead
		// item) instead, so nothing visible happens no matter how long
		// we wait.
		await page2.keyboard.press(
			process.platform === 'darwin' ? 'Meta+z' : 'Control+z'
		);

		// Log the wp_navigation edit timelines before asserting, so the
		// diagnostics survive a failing run.
		const [ navEditsA, navEditsB ] = await Promise.all( [
			page.evaluate( () => ( window as any ).__navEdits ),
			page2.evaluate( () => ( window as any ).__navEdits ),
		] );
		const formatTimeline = (
			edits: Array< {
				t: number;
				keys: string;
				undoIgnore: boolean;
			} >,
			reference: number | null
		) =>
			edits
				.map( ( edit ) => {
					const offset =
						reference === null
							? `t=${ edit.t }`
							: `${ edit.t - reference }ms`;
					return `[${ offset } keys=${ edit.keys } undoIgnore=${ edit.undoIgnore }]`;
				} )
				.join( ' ' );
		// eslint-disable-next-line no-console
		console.log(
			`[nav-edits] A(${ navEditsA.length })=${ formatTimeline(
				navEditsA,
				null
			) } B(${
				navEditsB.length
			}, relative to keystroke)=${ formatTimeline( navEditsB, typedAt ) }`
		);
		await expect( async () => {
			const blocks = await editor2.getBlocks();
			const serialized = JSON.stringify( blocks );
			expect( serialized ).not.toContain( `${ UNDO_TARGET }a` );
			expect( serialized ).toContain( UNDO_TARGET );
			expect( serialized ).toContain( USER_A_FIRST_PARAGRAPH );
		} ).toPass( { timeout: 10000 } );

		// The revert must also reach User A intact.
		await expect( async () => {
			const blocks = await editor.getBlocks();
			const serialized = JSON.stringify( blocks );
			expect( serialized ).not.toContain( `${ UNDO_TARGET }a` );
			expect( serialized ).toContain( USER_A_FIRST_PARAGRAPH );
		} ).toPass( { timeout: 15000 } );
	} );
} );
