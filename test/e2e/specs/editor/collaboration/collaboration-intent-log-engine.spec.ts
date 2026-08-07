/**
 * WordPress dependencies
 */
import type { RequestUtils } from '@wordpress/e2e-test-utils-playwright';

/**
 * Internal dependencies
 */
import { test, expect } from './fixtures';
// The engine's deterministic genesis id function (vector-pinned against the
// PHP twin) — imported directly so the spec asserts EXACT id agreement.
import { genesisSyncId } from '../../../../../packages/sync/src/engines/intent-log/sync-id.js';

/**
 * Two-client collaboration through the intent-log sync engine.
 *
 * These specs flip the site's `wp_sync_engine` option to `intent-log` (the
 * server announces it; clients resolve the intent-log adapter) and exercise
 * the full stack: capture bridge → session → polling transport →
 * WP_Intent_Log_Engine → back. The suite restores the default engine when
 * done so the remaining collaboration specs keep exercising the yjs relay.
 */

async function setSyncEngine(
	requestUtils: RequestUtils,
	engine: string | null
) {
	if ( null === engine ) {
		// Nulling an already-absent option 500s (rest_invalid_stored_value:
		// the settings controller validates the stored value first, and an
		// absent row reads as `false`). Restore only when our flip is still
		// in effect — e.g. the engine-flip spec already deleted the option
		// mid-test.
		const settings = await requestUtils.rest( {
			path: '/wp/v2/settings',
		} );
		if ( 'intent-log' !== settings.wp_sync_engine ) {
			return;
		}
	}
	await requestUtils.rest( {
		method: 'POST',
		path: '/wp/v2/settings',
		data: { wp_sync_engine: engine },
	} );
}

test.describe( 'Collaboration - intent-log engine', () => {
	// Per TEST, after fixture setup: the collaboration fixture's
	// writing-form toggle must never be able to wipe the engine selection
	// between the flip and the pages loading.
	test.beforeEach( async ( { requestUtils } ) => {
		await setSyncEngine( requestUtils, 'intent-log' );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await setSyncEngine( requestUtils, null );
	} );

	test( 'syncs text edits between two users', async ( {
		collaborationUtils,
		requestUtils,
		editor,
	} ) => {
		const post = await requestUtils.createPost( {
			title: 'Intent Log Sync Test',
			status: 'draft',
			content:
				'<!-- wp:paragraph -->\n<p>Existing content</p>\n<!-- /wp:paragraph -->',
			date_gmt: new Date().toISOString(),
		} );

		await collaborationUtils.openCollaborativeSession( post.id );
		const { editor2 } = collaborationUtils;

		// User 1 appends a paragraph.
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Written by user one' },
		} );

		// User 2 sees both paragraphs.
		await expect( async () => {
			const blocks = await editor2.getBlocks();
			expect( blocks ).toMatchObject( [
				{
					name: 'core/paragraph',
					attributes: { content: 'Existing content' },
				},
				{
					name: 'core/paragraph',
					attributes: { content: 'Written by user one' },
				},
			] );
		} ).toPass( { timeout: 10000 } );

		// User 2 edits the first paragraph; user 1 sees the edit.
		await editor2.canvas
			.locator( '[data-type="core/paragraph"]' )
			.first()
			.click();
		await collaborationUtils.page2.keyboard.press( 'End' );
		await collaborationUtils.page2.keyboard.type( ' plus user two' );

		await expect( async () => {
			const blocks = await editor.getBlocks();
			expect( blocks[ 0 ].attributes.content ).toBe(
				'Existing content plus user two'
			);
		} ).toPass( { timeout: 10000 } );
	} );

	test( 'appending to an existing paragraph keeps it visible and identity-stable on the peer', async ( {
		collaborationUtils,
		requestUtils,
		editor,
	} ) => {
		// Regression: id-less editor blocks (freshly parsed post content)
		// used to re-mint a syncId every capture cycle, deriving
		// remove_block + insert_block per keystroke — the paragraph
		// flickered out of existence on the peer's CANVAS even though
		// store-level polling assertions eventually converged.
		const post = await requestUtils.createPost( {
			title: 'Intent Log Append Test',
			status: 'draft',
			content:
				'<!-- wp:paragraph -->\n<p>Steady paragraph</p>\n<!-- /wp:paragraph -->',
			date_gmt: new Date().toISOString(),
		} );

		await collaborationUtils.openCollaborativeSession( post.id );
		const { editor2 } = collaborationUtils;
		const page1 = editor.page;

		await editor.canvas
			.locator( '[data-type="core/paragraph"]' )
			.first()
			.click();
		await page1.keyboard.press( 'End' );
		await page1.keyboard.type( ' appended' );

		// The peer's CANVAS shows the appended text…
		await expect(
			editor2.canvas.locator( '[data-type="core/paragraph"]' ).first()
		).toContainText( 'Steady paragraph appended', { timeout: 10000 } );
		// …and exactly one paragraph exists (no remove/insert churn residue).
		await expect(
			editor2.canvas.locator( '[data-type="core/paragraph"]' )
		).toHaveCount( 1 );

		// A second append still targets the SAME block (identity adoption is
		// stable across capture cycles): the paragraph neither duplicates
		// nor flickers, and both canvases converge on the full text.
		await page1.keyboard.type( ' again' );
		await expect(
			editor2.canvas.locator( '[data-type="core/paragraph"]' ).first()
		).toContainText( 'Steady paragraph appended again', {
			timeout: 10000,
		} );
		await expect(
			editor2.canvas.locator( '[data-type="core/paragraph"]' )
		).toHaveCount( 1 );
		await expect(
			editor.canvas.locator( '[data-type="core/paragraph"]' )
		).toHaveCount( 1 );
	} );

	test( 'both users typing on an EMPTY post converge without deleting each other', async ( {
		collaborationUtils,
		requestUtils,
		editor,
	} ) => {
		// Regression: on a fresh post (empty genesis) each client seeds its
		// own paragraph; the peer's paragraph lands in the shared document
		// before the local editor renders it, and a stale capture used to
		// interpret its absence as a deletion — the clients silently deleted
		// each other's content forever.
		const post = await requestUtils.createPost( {
			title: 'Intent Log Empty Post Test',
			status: 'draft',
			content: '',
			date_gmt: new Date().toISOString(),
		} );

		await collaborationUtils.openCollaborativeSession( post.id );
		const { editor2, page2 } = collaborationUtils;
		const page1 = editor.page;

		// Both users type into the empty canvas at once.
		await editor.canvas
			.locator( 'role=button[name="Add default block"i]' )
			.click();
		await page1.keyboard.type( 'First author paragraph' );
		await editor2.canvas
			.locator( 'role=button[name="Add default block"i]' )
			.click();
		await page2.keyboard.type( 'Second author paragraph' );

		// Both editors converge on BOTH paragraphs (order may vary by
		// arrival; neither may vanish).
		for ( const currentEditor of [ editor, editor2 ] ) {
			await expect( async () => {
				const blocks = await currentEditor.getBlocks();
				const contents = blocks.map(
					( block ) => block.attributes.content
				);
				expect( contents ).toEqual(
					expect.arrayContaining( [
						'First author paragraph',
						'Second author paragraph',
					] )
				);
			} ).toPass( { timeout: 15000 } );
		}

		// And they STAY converged (no delete/reinsert war): after a settle
		// window, both canvases still show both paragraphs.
		await page1.waitForTimeout( 3000 );
		for ( const currentEditor of [ editor, editor2 ] ) {
			await expect(
				currentEditor.canvas.locator( '[data-type="core/paragraph"]' )
			).toHaveCount( 2 );
		}
	} );

	test( 'a passive reader on an EMPTY post receives typed content', async ( {
		collaborationUtils,
		requestUtils,
		editor,
	} ) => {
		// Field scenario: user A types into a brand-new empty post while
		// user B just watches. B authors nothing (no rows, no awareness
		// churn) — pure receive path over an empty genesis.
		const post = await requestUtils.createPost( {
			title: 'Intent Log Passive Reader Test',
			status: 'draft',
			content: '',
			date_gmt: new Date().toISOString(),
		} );

		await collaborationUtils.openCollaborativeSession( post.id );
		const { editor2, page2 } = collaborationUtils;
		const page1 = editor.page;

		const pageErrors: string[] = [];
		page2.on( 'pageerror', ( error ) =>
			pageErrors.push( String( error ) )
		);
		page2.on( 'console', ( message ) => {
			// Resource-load 403s are generic editor noise for the second
			// user's capabilities, not sync errors.
			if (
				'error' === message.type() &&
				! message.text().includes( 'Failed to load resource' )
			) {
				pageErrors.push( message.text() );
			}
		} );

		await editor.canvas
			.locator( 'role=button[name="Add default block"i]' )
			.click();
		await page1.keyboard.type( 'paragraph added by admin' );

		await expect(
			editor2.canvas.locator( '[data-type="core/paragraph"]' ).first()
		).toContainText( 'paragraph added by admin', { timeout: 15000 } );

		expect( pageErrors ).toEqual( [] );
	} );

	test( 'reader-first ordering: the post creator sees content typed by a later joiner', async ( {
		collaborationUtils,
		requestUtils,
		editor,
	} ) => {
		// Field scenario inverted roles: the READER opens the empty post
		// first (as its creator would from post-new.php) and idles; the
		// WRITER joins second and types. The first client's initial poll
		// initializes the room (stores the empty snapshot); its editor must
		// still render content that arrives later.
		const post = await requestUtils.createPost( {
			title: 'Intent Log Reader First Test',
			status: 'draft',
			content: '',
			date_gmt: new Date().toISOString(),
		} );

		await collaborationUtils.openCollaborativeSession( post.id );
		const { editor2, page2 } = collaborationUtils;
		const page1 = editor.page;

		const pageErrors: string[] = [];
		page1.on( 'pageerror', ( error ) =>
			pageErrors.push( String( error ) )
		);
		page1.on( 'console', ( message ) => {
			if ( 'error' === message.type() ) {
				pageErrors.push( message.text() );
			}
		} );

		// Editor1 (opened first) idles; editor2 (joined second) types.
		await editor2.canvas
			.locator( 'role=button[name="Add default block"i]' )
			.click();
		await page2.keyboard.type( 'typed by the second user' );

		await expect(
			editor.canvas.locator( '[data-type="core/paragraph"]' ).first()
		).toContainText( 'typed by the second user', { timeout: 15000 } );

		expect( pageErrors ).toEqual( [] );
	} );

	test( 'splitting a settled paragraph converges with stable identities while the peer edits the sibling', async ( {
		collaborationUtils,
		requestUtils,
		editor,
	} ) => {
		// The durable-id split regression: once the stamper has assigned
		// metadata.syncIds, Gutenberg's split copies ALL attributes — the
		// syncId included — onto the second half. The head must keep its
		// identity, the second half must re-mint, and the FOLLOWING block's
		// identity must survive untouched even while the peer is typing
		// into it (the stolen-identity bug duplicated content here).
		const post = await requestUtils.createPost( {
			title: 'Intent Log Durable Split Test',
			status: 'draft',
			content: '',
			date_gmt: new Date().toISOString(),
		} );

		await collaborationUtils.openCollaborativeSession( post.id );
		const { editor2, page2 } = collaborationUtils;
		const page1 = editor.page;

		await editor.canvas
			.locator( 'role=button[name="Add default block"i]' )
			.click();
		await page1.keyboard.type( 'HelloWorld' );
		await page1.keyboard.press( 'Enter' );
		await page1.keyboard.type( 'SecondBlock' );

		// Wait for identity to become DURABLE: both blocks stamped, and the
		// peer converged on the same ids.
		const idsOf = async ( targetEditor: typeof editor ) => {
			const blocks = await targetEditor.getBlocks();
			return blocks.map(
				( block ) =>
					( block.attributes.metadata as { syncId?: string } )?.syncId
			);
		};
		let settledIds: Array< string | undefined > = [];
		await expect( async () => {
			settledIds = await idsOf( editor );
			expect( settledIds ).toHaveLength( 2 );
			expect( settledIds.every( Boolean ) ).toBe( true );
			expect( await idsOf( editor2 ) ).toEqual( settledIds );
		} ).toPass( { timeout: 15000 } );

		// Split the first paragraph mid-text while the peer edits the
		// second block.
		await editor.canvas
			.locator( '[data-type="core/paragraph"]' )
			.first()
			.click();
		await page1.keyboard.press( 'End' );
		for ( let i = 0; i < 5; i++ ) {
			await page1.keyboard.press( 'ArrowLeft' );
		}
		await page1.keyboard.press( 'Enter' );
		await editor2.canvas
			.locator( '[data-type="core/paragraph"]' )
			.nth( 1 )
			.click();
		await page2.keyboard.press( 'End' );
		await page2.keyboard.type( '-B' );

		// Both editors converge on the same 3 blocks with correct texts…
		for ( const currentEditor of [ editor, editor2 ] ) {
			await expect( async () => {
				const blocks = await currentEditor.getBlocks();
				expect(
					blocks.map( ( block ) => block.attributes.content )
				).toEqual( [ 'Hello', 'World', 'SecondBlock-B' ] );
			} ).toPass( { timeout: 15000 } );
		}
		// …and identities. The engine contract: both editors agree on every
		// id; the SIBLING's identity survives the split untouched (the
		// stolen-identity bug landed the peer's edits in the wrong block
		// here); and the split resolves to exactly one half continuing the
		// settled identity plus one freshly minted — which half continues
		// is Gutenberg's split implementation detail, not pinned.
		await expect( async () => {
			const ids1 = await idsOf( editor );
			const ids2 = await idsOf( editor2 );
			expect( ids1 ).toEqual( ids2 );
			expect( ids1.every( Boolean ) ).toBe( true );
			expect( ids1[ 2 ] ).toBe( settledIds[ 1 ] );
			const halves = [ ids1[ 0 ], ids1[ 1 ] ];
			expect( halves ).toContain( settledIds[ 0 ] );
			expect(
				halves.filter( ( id ) => ! settledIds.includes( id ) )
			).toHaveLength( 1 );
		} ).toPass( { timeout: 15000 } );
	} );

	test( 'splitting immediately while typing (pre-stamp window) converges without duplication', async ( {
		collaborationUtils,
		requestUtils,
		editor,
	} ) => {
		// The id-less split shape: the capture may run before the stamper
		// assigns ids, so identity is inferred. Adoption must keep the
		// following block's identity by content, never positionally.
		const post = await requestUtils.createPost( {
			title: 'Intent Log Fast Split Test',
			status: 'draft',
			content: '',
			date_gmt: new Date().toISOString(),
		} );

		await collaborationUtils.openCollaborativeSession( post.id );
		const { editor2 } = collaborationUtils;
		const page1 = editor.page;

		await editor.canvas
			.locator( 'role=button[name="Add default block"i]' )
			.click();
		await page1.keyboard.type( 'HelloWorld' );
		await page1.keyboard.press( 'Enter' );
		await page1.keyboard.type( 'SecondBlock' );
		// No settle wait: split immediately.
		await editor.canvas
			.locator( '[data-type="core/paragraph"]' )
			.first()
			.click();
		await page1.keyboard.press( 'End' );
		for ( let i = 0; i < 5; i++ ) {
			await page1.keyboard.press( 'ArrowLeft' );
		}
		await page1.keyboard.press( 'Enter' );

		for ( const currentEditor of [ editor, editor2 ] ) {
			await expect( async () => {
				const blocks = await currentEditor.getBlocks();
				expect(
					blocks.map( ( block ) => block.attributes.content )
				).toEqual( [ 'Hello', 'World', 'SecondBlock' ] );
			} ).toPass( { timeout: 15000 } );
		}
		// Sustained: no delete/reinsert war after a settle window.
		await page1.waitForTimeout( 3000 );
		for ( const currentEditor of [ editor, editor2 ] ) {
			await expect(
				currentEditor.canvas.locator( '[data-type="core/paragraph"]' )
			).toHaveCount( 3 );
		}
	} );

	test( 'syncIds are durable: they persist into saved content and survive reload', async ( {
		collaborationUtils,
		requestUtils,
		editor,
	} ) => {
		const post = await requestUtils.createPost( {
			title: 'Intent Log Durable Ids Test',
			status: 'draft',
			content: '',
			date_gmt: new Date().toISOString(),
		} );

		await collaborationUtils.openCollaborativeSession( post.id );
		const page1 = editor.page;

		await editor.canvas
			.locator( 'role=button[name="Add default block"i]' )
			.click();
		await page1.keyboard.type( 'Durable paragraph' );

		const idsOf = async () => {
			const blocks = await editor.getBlocks();
			return blocks.map(
				( block ) =>
					( block.attributes.metadata as { syncId?: string } )?.syncId
			);
		};
		/*
		 * Wait for the SETTLED identity, not the first stamped one: the
		 * stamper assigns a tab-local id immediately, then the shared
		 * document's identity wins during settle. The durable invariant is
		 * about the converged id — stable across consecutive reads.
		 */
		let stampedId: string | undefined;
		await expect( async () => {
			const [ current ] = await idsOf();
			expect( current ).toBeTruthy();
			await page1.waitForTimeout( 2000 );
			const [ settled ] = await idsOf();
			expect( settled ).toBe( current );
			stampedId = settled;
		} ).toPass( { timeout: 30000 } );

		await editor.saveDraft();

		// The id rides the block delimiter into persisted content…
		const saved = await requestUtils.rest< { content: { raw: string } } >( {
			path: `/wp/v2/posts/${ post.id }`,
			params: { context: 'edit' },
		} );
		expect( saved.content.raw ).toContain( `"syncId":"${ stampedId }"` );

		// …and survives a full reload unchanged.
		await page1.reload();
		await expect( async () => {
			expect( ( await idsOf() )[ 0 ] ).toBe( stampedId );
		} ).toPass( { timeout: 15000 } );
	} );

	test( 'a save captures both users’ settled edits and persists clean content', async ( {
		collaborationUtils,
		requestUtils,
		editor,
	} ) => {
		const post = await requestUtils.createPost( {
			title: 'Intent Log Save Flow Test',
			status: 'draft',
			content:
				'<!-- wp:paragraph -->\n<p>Shared start</p>\n<!-- /wp:paragraph -->',
			date_gmt: new Date().toISOString(),
		} );

		await collaborationUtils.openCollaborativeSession( post.id );
		const { editor2, page2 } = collaborationUtils;

		// User 2 extends the existing paragraph; user 1 adds a new one.
		await editor2.canvas
			.locator( '[data-type="core/paragraph"]' )
			.first()
			.click();
		await page2.keyboard.press( 'End' );
		await page2.keyboard.type( ' plus user two' );

		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Added by admin' },
		} );

		// Both editors converge before the save.
		for ( const currentEditor of [ editor, editor2 ] ) {
			await expect( async () => {
				const blocks = await currentEditor.getBlocks();
				expect( blocks ).toMatchObject( [
					{
						attributes: {
							content: 'Shared start plus user two',
						},
					},
					{ attributes: { content: 'Added by admin' } },
				] );
			} ).toPass( { timeout: 15000 } );
		}

		await editor.saveDraft();

		// The persisted content carries BOTH users' settled work…
		const saved = await requestUtils.rest< { content: { raw: string } } >( {
			path: `/wp/v2/posts/${ post.id }`,
			params: { context: 'edit' },
		} );
		expect( saved.content.raw ).toContain( 'Shared start plus user two' );
		expect( saved.content.raw ).toContain( 'Added by admin' );

		// …and no engine-internal state leaks into it.
		expect( saved.content.raw ).not.toContain( '_wrapper' );
		expect( saved.content.raw ).not.toContain( 'attrVersions' );

		// The non-saving peer's editor is unaffected by the save.
		const peerBlocks = await editor2.getBlocks();
		expect( peerBlocks ).toMatchObject( [
			{ attributes: { content: 'Shared start plus user two' } },
			{ attributes: { content: 'Added by admin' } },
		] );
	} );

	test( 'concurrent edits to different blocks both survive', async ( {
		collaborationUtils,
		requestUtils,
		editor,
	} ) => {
		const post = await requestUtils.createPost( {
			title: 'Intent Log Concurrency Test',
			status: 'draft',
			content:
				'<!-- wp:paragraph -->\n<p>First</p>\n<!-- /wp:paragraph -->\n\n<!-- wp:paragraph -->\n<p>Second</p>\n<!-- /wp:paragraph -->',
			date_gmt: new Date().toISOString(),
		} );

		await collaborationUtils.openCollaborativeSession( post.id );
		const { editor2, page2 } = collaborationUtils;
		const page1 = editor.page;

		// User 1 edits the first block, user 2 the second, immediately.
		await editor.canvas
			.locator( '[data-type="core/paragraph"]' )
			.first()
			.click();
		await page1.keyboard.press( 'End' );
		await editor2.canvas
			.locator( '[data-type="core/paragraph"]' )
			.nth( 1 )
			.click();
		await page2.keyboard.press( 'End' );

		await page1.keyboard.type( ' from one' );
		await page2.keyboard.type( ' from two' );

		// Both editors converge on both edits.
		for ( const currentEditor of [ editor, editor2 ] ) {
			await expect( async () => {
				const blocks = await currentEditor.getBlocks();
				expect( blocks[ 0 ].attributes.content ).toBe(
					'First from one'
				);
				expect( blocks[ 1 ].attributes.content ).toBe(
					'Second from two'
				);
			} ).toPass( { timeout: 10000 } );
		}
	} );

	test( 'concurrent same-paragraph edits surface an escalation notice instead of silently merging', async ( {
		collaborationUtils,
		requestUtils,
		editor,
	} ) => {
		const post = await requestUtils.createPost( {
			title: 'Intent Log Escalation Test',
			status: 'draft',
			content:
				'<!-- wp:paragraph -->\n<p>Contested paragraph</p>\n<!-- /wp:paragraph -->',
			date_gmt: new Date().toISOString(),
		} );

		await collaborationUtils.openCollaborativeSession( post.id );
		const { editor2, page2 } = collaborationUtils;
		const page1 = editor.page;

		// Both users type into the SAME paragraph simultaneously. Sustained
		// overlapping writes to one text frame guarantee that at least one
		// client authors against a stale sequence, which the engine sets
		// aside for review (frame-conflict) rather than silently merging.
		await editor.canvas
			.locator( '[data-type="core/paragraph"]' )
			.first()
			.click();
		await page1.keyboard.press( 'End' );
		await editor2.canvas
			.locator( '[data-type="core/paragraph"]' )
			.first()
			.click();
		await page2.keyboard.press( 'Home' );

		await Promise.all( [
			page1.keyboard.type( ' one one one one one', { delay: 100 } ),
			page2.keyboard.type( 'two two two two two ', { delay: 100 } ),
		] );

		// At least one side surfaces the escalation: per-item notices below
		// the aggregation threshold, one counter notice above it.
		let noticePage = page1;
		let noticeEditor = editor;
		await expect( async () => {
			const counts = await Promise.all( [
				page1.getByText( /set aside/ ).count(),
				page2.getByText( /set aside/ ).count(),
			] );
			expect( counts[ 0 ] + counts[ 1 ] ).toBeGreaterThan( 0 );
			noticePage = counts[ 0 ] > 0 ? page1 : page2;
			noticeEditor = counts[ 0 ] > 0 ? editor : editor2;
		} ).toPass( { timeout: 15000 } );

		/*
		 * The conflicts anchor IN CONTEXT: the contested paragraph gets a
		 * marker badge (rendered in the editor chrome, anchored to the
		 * block), which opens the conflict card with Restore/Discard.
		 */
		const markerChip = noticePage.locator(
			'.editor-collaboration-conflict-marker__chip'
		);
		await expect( markerChip.first() ).toBeVisible( { timeout: 15000 } );
		await markerChip.first().click();
		const markerCard = noticePage.locator(
			'.editor-collaboration-conflict-marker__card'
		);
		await expect( markerCard ).toBeVisible();
		await expect(
			markerCard
				.getByRole( 'button', { name: 'Discard', exact: true } )
				.first()
		).toBeVisible();
		// Resolve one conflict group in place; the rest go through the panel.
		await markerCard
			.getByRole( 'button', { name: 'Discard', exact: true } )
			.first()
			.click();

		/*
		 * The review panel in the document sidebar lists every parked edit
		 * regardless of how many notices were shown. Discarding closes each
		 * proposal for every collaborator, durably — after a reload the
		 * resolved conflicts must NOT resurface (the resolution rows settle
		 * the bootstrap replay). A sustained typing race parks many edits;
		 * discard them all through the panel.
		 */
		await noticeEditor.openDocumentSettingsSidebar();
		// The sidebar auto-switches to the Block tab while a block is
		// selected; the review panel lives in the document (Post) tab.
		await noticePage
			.getByRole( 'tab', { name: 'Post', exact: true } )
			.click();
		const panel = noticePage.locator(
			'.editor-collaboration-review-panel'
		);
		await expect( panel ).toBeVisible( { timeout: 15000 } );
		await expect( async () => {
			// Discard everything currently parked. "Discard all" appears
			// with 2+ conflict groups; otherwise use the single group's
			// Discard.
			for ( let i = 0; i < 40; i++ ) {
				const discardAll = panel.getByRole( 'button', {
					name: 'Discard all',
				} );
				if ( ( await discardAll.count() ) > 0 ) {
					await discardAll.click();
					continue;
				}
				const discard = panel
					.getByRole( 'button', { name: 'Discard', exact: true } )
					.first();
				if ( ( await discard.count() ) > 0 ) {
					await discard.click();
					continue;
				}
				break;
			}
			// Quiescence, not just momentary emptiness: in-flight pushes
			// from the typing race can escalate MORE edits after the list
			// first empties. Only settled-and-still-empty after a full
			// poll/flush cycle counts — otherwise discard again.
			await noticePage.waitForTimeout( 3000 );
			expect( await panel.count() ).toBe( 0 );
			// The in-canvas markers unmount with the list.
			expect( await markerChip.count() ).toBe( 0 );
			// Resolving through the panel also clears the notices
			// (per-item and aggregate alike).
			expect(
				await noticePage
					.locator( '.components-notice' )
					.filter( { hasText: 'set aside' } )
					.count()
			).toBe( 0 );
		} ).toPass( { timeout: 60000 } );

		// Let the resolution rows flush to the server (the list shrinks
		// optimistically; durability needs the wire round trip) before
		// testing persistence across a reload.
		await noticePage.waitForTimeout( 4000 );

		await noticePage.reload();
		await expect(
			noticePage.locator( 'iframe[name="editor-canvas"]' )
		).toBeVisible( { timeout: 30000 } );
		// Allow the bootstrap replay to settle; a resolved proposal must
		// not re-notify or repopulate the review panel.
		await noticePage.waitForTimeout( 4000 );
		await expect(
			noticePage
				.locator( '.components-notice' )
				.filter( { hasText: 'set aside' } )
		).toHaveCount( 0 );
		await noticeEditor.openDocumentSettingsSidebar();
		// The sidebar remembers the Block tab across reloads; the panel
		// (were it wrongly present) would live in the Post tab.
		await noticePage
			.getByRole( 'tab', { name: 'Post', exact: true } )
			.click();
		await expect(
			noticePage.locator( '.editor-collaboration-review-panel' )
		).toHaveCount( 0 );
		await expect(
			noticePage.locator( '.editor-collaboration-conflict-marker__chip' )
		).toHaveCount( 0 );
	} );

	test( 'custom HTML blocks sync between users and persist through save', async ( {
		collaborationUtils,
		requestUtils,
		editor,
	} ) => {
		const post = await requestUtils.createPost( {
			title: 'Intent Log Custom HTML Test',
			status: 'draft',
			content:
				'<!-- wp:paragraph -->\n<p>Before the raw block</p>\n<!-- /wp:paragraph -->',
			date_gmt: new Date().toISOString(),
		} );

		await collaborationUtils.openCollaborativeSession( post.id );
		const { page2 } = collaborationUtils;
		const page1 = editor.page;

		/*
		 * REGRESSION: Custom HTML keeps its markup in innerContent
		 * fragments (no content attribute), which the capture bridge used
		 * to ignore entirely — the block never synced at all. It now rides
		 * the engine's content field through the codec.
		 */
		await page1.evaluate( ( html ) => {
			const block = ( window as any ).wp.blocks.createBlock(
				'core/html',
				{}
			);
			block.innerContent = [ html ];
			( window as any ).wp.data
				.dispatch( 'core/block-editor' )
				.insertBlocks( block );
		}, '<div class="synced-raw">custom markup</div>' );

		// The peer receives the block with its markup.
		await expect( async () => {
			const peerHtml = await page2.evaluate( () =>
				( window as any ).wp.data
					.select( 'core/block-editor' )
					.getBlocks()
					.filter( ( b: { name: string } ) => 'core/html' === b.name )
					.map( ( b: { innerContent?: Array< string | null > } ) =>
						( b.innerContent ?? [] ).join( '' )
					)
			);
			expect( peerHtml ).toEqual( [
				'<div class="synced-raw">custom markup</div>',
			] );
		} ).toPass( { timeout: 15000 } );

		// The markup persists through the author's save.
		await editor.saveDraft();
		const saved = await requestUtils.rest< { content: { raw: string } } >( {
			path: `/wp/v2/posts/${ post.id }`,
			params: { context: 'edit' },
		} );
		expect( saved.content.raw ).toContain(
			'<div class="synced-raw">custom markup</div>'
		);
		expect( saved.content.raw ).toContain( 'wp:html' );
	} );

	test( 'legacy blocks get DETERMINISTIC genesis ids: both tabs and the server mint identical identities with no adoption round-trip', async ( {
		collaborationUtils,
		requestUtils,
		editor,
	} ) => {
		// A legacy post: saved content with NO syncIds.
		const post = await requestUtils.createPost( {
			title: 'Intent Log Deterministic Genesis Test',
			status: 'draft',
			content:
				'<!-- wp:paragraph -->\n<p>First legacy</p>\n<!-- /wp:paragraph -->\n' +
				'<!-- wp:paragraph -->\n<p>Second legacy</p>\n<!-- /wp:paragraph -->\n' +
				'<!-- wp:paragraph -->\n<p>Third legacy</p>\n<!-- /wp:paragraph -->',
			date_gmt: new Date().toISOString(),
		} );

		// The ids every independent minter must derive from this content.
		const expectedIds = [ 0, 1, 2 ].map( ( index ) =>
			genesisSyncId( { postId: post.id, revisionId: 0 }, [ index ] )
		);

		await collaborationUtils.openCollaborativeSession( post.id );
		const { editor2 } = collaborationUtils;

		// Both tabs converge on the EXACT deterministic ids — not merely on
		// matching ids (which adoption could also produce, slower).
		for ( const currentEditor of [ editor, editor2 ] ) {
			await expect( async () => {
				const blocks = await currentEditor.getBlocks();
				const ids = blocks.map(
					( block ) =>
						(
							block.attributes.metadata as {
								syncId?: string;
							}
						 )?.syncId
				);
				expect( ids ).toEqual( expectedIds );
			} ).toPass( { timeout: 15000 } );
		}

		/*
		 * The identities are durable: a real edit + save persists them
		 * verbatim. (Identity stamping alone is deliberately non-persistent
		 * — it must never dirty an untouched post — so the spec makes a
		 * content edit first.)
		 */
		await editor.canvas
			.locator( '[data-type="core/paragraph"]' )
			.first()
			.click();
		await editor.page.keyboard.press( 'End' );
		await editor.page.keyboard.type( ' edited' );
		await editor.saveDraft();
		const saved = await requestUtils.rest< { content: { raw: string } } >( {
			path: `/wp/v2/posts/${ post.id }`,
			params: { context: 'edit' },
		} );
		for ( const id of expectedIds ) {
			expect( saved.content.raw ).toContain( `"syncId":"${ id }"` );
		}
	} );

	test( 'multibyte text syncs and persists intact (UTF-16 code-unit coordinates)', async ( {
		collaborationUtils,
		requestUtils,
		editor,
	} ) => {
		const post = await requestUtils.createPost( {
			title: 'Intent Log Multibyte Test',
			status: 'draft',
			content:
				'<!-- wp:paragraph -->\n<p>Départ 你好</p>\n<!-- /wp:paragraph -->',
			date_gmt: new Date().toISOString(),
		} );

		await collaborationUtils.openCollaborativeSession( post.id );
		const { editor2, page2 } = collaborationUtils;

		// User 2 appends multibyte text to the multibyte paragraph.
		await editor2.canvas
			.locator( '[data-type="core/paragraph"]' )
			.first()
			.click();
		await page2.keyboard.press( 'End' );
		await page2.keyboard.type( ' — café niño 世界' );

		const expected = 'Départ 你好 — café niño 世界';
		await expect( async () => {
			const blocks = await editor.getBlocks();
			expect( blocks[ 0 ].attributes.content ).toBe( expected );
		} ).toPass( { timeout: 10000 } );

		// The author saves; the multibyte content survives the server round
		// trip byte-intact.
		await editor2.saveDraft();
		const saved = await requestUtils.rest< { content: { raw: string } } >( {
			path: `/wp/v2/posts/${ post.id }`,
			params: { context: 'edit' },
		} );
		expect( saved.content.raw ).toContain( expected );
	} );

	test( 'formatted content survives genesis, sync, and save (rich-text coordinates)', async ( {
		collaborationUtils,
		requestUtils,
		editor,
	} ) => {
		const post = await requestUtils.createPost( {
			title: 'Intent Log Formatting Round Trip',
			status: 'draft',
			content:
				'<!-- wp:paragraph -->\n<p>Hello <em>styled</em> world</p>\n<!-- /wp:paragraph -->',
			date_gmt: new Date().toISOString(),
		} );

		await collaborationUtils.openCollaborativeSession( post.id );
		const { editor2, page2 } = collaborationUtils;

		// The peer sees the formatting from genesis.
		await expect( async () => {
			const blocks = await editor2.getBlocks();
			expect( blocks[ 0 ].attributes.content ).toContain(
				'<em>styled</em>'
			);
		} ).toPass( { timeout: 10000 } );

		// The peer appends text; the em span survives untouched on both.
		await editor2.canvas
			.locator( '[data-type="core/paragraph"]' )
			.first()
			.click();
		await page2.keyboard.press( 'End' );
		await page2.keyboard.type( ' indeed' );

		await expect( async () => {
			const blocks = await editor.getBlocks();
			expect( blocks[ 0 ].attributes.content ).toBe(
				'Hello <em>styled</em> world indeed'
			);
		} ).toPass( { timeout: 10000 } );

		await editor2.saveDraft();
		const saved = await requestUtils.rest< { content: { raw: string } } >( {
			path: `/wp/v2/posts/${ post.id }`,
			params: { context: 'edit' },
		} );
		expect( saved.content.raw ).toContain(
			'Hello <em>styled</em> world indeed'
		);
	} );

	test( 'one user bolds a word while the other types in the SAME paragraph: both changes survive', async ( {
		collaborationUtils,
		requestUtils,
		editor,
	} ) => {
		// The marquee capability of rich-text coordinates: a format span and
		// concurrent typing merge in plain-text space — under HTML-string
		// diffing this was an escalation (or worse, markup corruption).
		const post = await requestUtils.createPost( {
			title: 'Intent Log Concurrent Format Test',
			status: 'draft',
			content:
				'<!-- wp:paragraph -->\n<p>Make World bold now</p>\n<!-- /wp:paragraph -->',
			date_gmt: new Date().toISOString(),
		} );

		await collaborationUtils.openCollaborativeSession( post.id );
		const { editor2, page2 } = collaborationUtils;
		const page1 = editor.page;

		// User 1 selects the word "World" and bolds it; user 2 types at the
		// end of the same paragraph at the same time.
		const paragraph1 = editor.canvas
			.locator( '[data-type="core/paragraph"]' )
			.first();
		await paragraph1.dblclick( { position: { x: 60, y: 10 } } );
		// Anchor selection on the exact word regardless of layout: select
		// "World" via the store for precision.
		await page1.evaluate( () => {
			const selectAll = window.getSelection();
			const block = document.querySelector(
				'[data-type="core/paragraph"]'
			);
			const textNode = block?.firstChild;
			if ( ! textNode || ! selectAll ) {
				return;
			}
			const text = textNode.textContent ?? '';
			const start = text.indexOf( 'World' );
			const range = document.createRange();
			range.setStart( textNode, start );
			range.setEnd( textNode, start + 'World'.length );
			selectAll.removeAllRanges();
			selectAll.addRange( range );
		} );

		await editor2.canvas
			.locator( '[data-type="core/paragraph"]' )
			.first()
			.click();
		await page2.keyboard.press( 'End' );

		await Promise.all( [
			page1.keyboard.press( 'ControlOrMeta+b' ),
			page2.keyboard.type( ' please', { delay: 50 } ),
		] );

		// Both changes survive on both editors.
		for ( const currentEditor of [ editor, editor2 ] ) {
			await expect( async () => {
				const blocks = await currentEditor.getBlocks();
				const content = blocks[ 0 ].attributes.content as string;
				expect( content ).toContain( '<strong>World</strong>' );
				expect( content ).toContain( 'now please' );
			} ).toPass( { timeout: 15000 } );
		}
	} );

	test( 'the wpSync console inspector records decoded wire traffic when enabled', async ( {
		collaborationUtils,
		requestUtils,
		editor,
	} ) => {
		const post = await requestUtils.createPost( {
			title: 'Intent Log Inspector Test',
			status: 'draft',
			content:
				'<!-- wp:paragraph -->\n<p>Inspect me</p>\n<!-- /wp:paragraph -->',
			date_gmt: new Date().toISOString(),
		} );

		await collaborationUtils.openCollaborativeSession( post.id );
		const page1 = editor.page;

		type WpSyncWindow = Window & {
			wpSync: {
				enable: () => string;
				untail: () => string;
				log: () => Array< {
					room: string;
					rows: Array< { summary: string } >;
				} >;
				doc: () => { root?: unknown[] } | undefined;
			};
		};
		await page1.evaluate( () => {
			const wpSync = ( window as unknown as WpSyncWindow ).wpSync;
			wpSync.enable();
			wpSync.untail(); // Keep the console quiet for the harness.
		} );

		await editor.canvas
			.locator( '[data-type="core/paragraph"]' )
			.first()
			.click();
		await page1.keyboard.press( 'End' );
		await page1.keyboard.type( ' closely' );

		await expect( async () => {
			const captured = await page1.evaluate( () => {
				const wpSync = ( window as unknown as WpSyncWindow ).wpSync;
				return {
					records: wpSync.log(),
					docBlocks: wpSync.doc()?.root?.length ?? 0,
				};
			} );
			expect( captured.records.length ).toBeGreaterThan( 0 );
			const summaries = captured.records.flatMap( ( record ) =>
				record.rows.map( ( row ) => row.summary )
			);
			expect(
				summaries.some( ( summary ) =>
					summary.includes( 'insert_text' )
				)
			).toBe( true );
			// Session state accessors work too.
			expect( captured.docBlocks ).toBeGreaterThan( 0 );
		} ).toPass( { timeout: 10000 } );

		// Cleanup: the flag persists per browser profile.
		await page1.evaluate( () =>
			window.localStorage.removeItem( 'wp_sync_debug' )
		);
	} );

	test( 'title edits sync between users in both directions', async ( {
		collaborationUtils,
		requestUtils,
		editor,
	} ) => {
		const post = await requestUtils.createPost( {
			title: 'Original Title',
			status: 'draft',
			content:
				'<!-- wp:paragraph -->\n<p>Body</p>\n<!-- /wp:paragraph -->',
			date_gmt: new Date().toISOString(),
		} );

		await collaborationUtils.openCollaborativeSession( post.id );
		const { editor2 } = collaborationUtils;

		// User 1 rewrites the title; user 2 sees it.
		await editor.canvas
			.getByRole( 'textbox', { name: 'Add title' } )
			.fill( 'Title from user one' );
		await expect(
			editor2.canvas.getByRole( 'textbox', { name: 'Add title' } )
		).toHaveText( 'Title from user one', { timeout: 10000 } );

		// User 2 rewrites it back; user 1 sees it (sequential, no conflict).
		await editor2.canvas
			.getByRole( 'textbox', { name: 'Add title' } )
			.fill( 'Title from user two' );
		await expect(
			editor.canvas.getByRole( 'textbox', { name: 'Add title' } )
		).toHaveText( 'Title from user two', { timeout: 10000 } );

		// The synced title persists through a save by the non-author.
		await editor.saveDraft();
		const saved = await requestUtils.rest< { title: { raw: string } } >( {
			path: `/wp/v2/posts/${ post.id }`,
			params: { context: 'edit' },
		} );
		expect( saved.title.raw ).toBe( 'Title from user two' );
	} );

	test( 'concurrent divergent title edits surface an escalation notice, and editors converge', async ( {
		collaborationUtils,
		requestUtils,
		editor,
	} ) => {
		const post = await requestUtils.createPost( {
			title: 'Contested',
			status: 'draft',
			content:
				'<!-- wp:paragraph -->\n<p>Body</p>\n<!-- /wp:paragraph -->',
			date_gmt: new Date().toISOString(),
		} );

		await collaborationUtils.openCollaborativeSession( post.id );
		const { editor2, page2 } = collaborationUtils;
		const page1 = editor.page;

		// Both users rewrite the title at the same moment: one write wins
		// the register, the other is set aside for review.
		await Promise.all( [
			editor.canvas
				.getByRole( 'textbox', { name: 'Add title' } )
				.fill( 'Title A' ),
			editor2.canvas
				.getByRole( 'textbox', { name: 'Add title' } )
				.fill( 'Title B' ),
		] );

		await expect( async () => {
			const counts = await Promise.all( [
				page1.getByText( /was set aside/ ).count(),
				page2.getByText( /was set aside/ ).count(),
			] );
			expect( counts[ 0 ] + counts[ 1 ] ).toBeGreaterThan( 0 );
		} ).toPass( { timeout: 15000 } );

		// Both editors converge on the winning title.
		await expect( async () => {
			const titles = await Promise.all(
				[ editor, editor2 ].map( ( currentEditor ) =>
					currentEditor.canvas
						.getByRole( 'textbox', { name: 'Add title' } )
						.textContent()
				)
			);
			expect( titles[ 0 ] ).toBe( titles[ 1 ] );
			expect( [ 'Title A', 'Title B' ] ).toContain( titles[ 0 ] );
		} ).toPass( { timeout: 15000 } );
	} );

	test( 'a mid-session engine change drops open tabs into the lock modal instead of retry-hammering', async ( {
		collaborationUtils,
		requestUtils,
		editor,
	} ) => {
		const post = await requestUtils.createPost( {
			title: 'Intent Log Engine Flip Test',
			status: 'draft',
			content:
				'<!-- wp:paragraph -->\n<p>Before the flip</p>\n<!-- /wp:paragraph -->',
			date_gmt: new Date().toISOString(),
		} );

		await collaborationUtils.openCollaborativeSession( post.id );
		const { page2 } = collaborationUtils;
		const page1 = editor.page;

		// The site's engine changes back to the default (yjs-relay) while
		// both tabs are mid-session. Their polls still stamp intent-log, so
		// the server fences them with 409 rest_sync_engine_mismatch and the
		// clients must fall into the unrecoverable-mismatch modal — not an
		// endless 409 retry loop.
		await setSyncEngine( requestUtils, null );

		for ( const page of [ page1, page2 ] ) {
			await expect(
				page.getByText( 'Collaboration settings changed' )
			).toBeVisible( { timeout: 15000 } );
		}
	} );
} );
