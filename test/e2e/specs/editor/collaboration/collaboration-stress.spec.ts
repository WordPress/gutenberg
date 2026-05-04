/**
 * External dependencies
 */
import type { Page } from '@playwright/test';

/**
 * WordPress dependencies
 */
import type { Editor } from '@wordpress/e2e-test-utils-playwright';

/**
 * Internal dependencies
 */
import { test, expect } from './fixtures';
import type { UserCredentials } from './fixtures/collaboration-utils';

/*
 * All non-admin users need at minimum the 'editor' role so they can
 * edit a post created by the admin.  WordPress author / contributor
 * roles lack the `edit_others_posts` capability.
 */
const STRESS_USERS: UserCredentials[] = [
	{
		username: 'stress_editor',
		email: 'stress_editor@example.com',
		firstName: 'Alice',
		lastName: 'Editor',
		password: 'password',
		roles: [ 'editor' ],
	},
	{
		username: 'stress_author',
		email: 'stress_author@example.com',
		firstName: 'Bob',
		lastName: 'Author',
		password: 'password',
		roles: [ 'editor' ],
	},
];

// ── Filler text ─────────────────────────────────────────────────────

const SENTENCES = [
	'The system processes data through multiple layers of abstraction ensuring consistency across all nodes.',
	'Reliability is maintained by distributed components that handle requests efficiently within the network.',
	'Each architecture layer guarantees strict ordering for operations that modify shared state.',
	'Synchronization protocols use vector clocks to track causal dependencies between updates.',
	'Optimistic replication propagates changes using conflict resolution based on deterministic rules.',
	'Concurrent modifications are detected and merged by specialized functions in the coordination layer.',
	'The protocol maintains eventual consistency while minimizing latency for participating clients.',
	'State transitions are validated against invariants before being committed to the distributed log.',
	'Recovery mechanisms restore consistency after partial failures using checkpointed snapshots.',
	'Performance monitoring tracks throughput and latency metrics across all participating services.',
	'The coordination layer batches updates to reduce network overhead during peak traffic periods.',
	'Load balancing distributes requests across available replicas based on current capacity estimates.',
	'Data partitioning strategies ensure that related records are co-located for efficient queries.',
	'The consensus algorithm tolerates up to one third of nodes failing without losing availability.',
	'Background compaction processes reclaim storage space from obsolete versions of modified records.',
	'Event sourcing captures all changes as immutable facts appended to a persistent ordered log.',
	'Materialized views are rebuilt from the event log to provide optimized read access patterns.',
	'Schema evolution is managed through compatible transformations that preserve backward compatibility.',
	'Rate limiting prevents individual clients from consuming disproportionate amounts of shared resources.',
	'Circuit breakers protect downstream services from cascading failures during periods of degradation.',
];

function filler( wordCount: number, seed: number = 0 ): string {
	const words: string[] = [];
	let idx = seed;
	while ( words.length < wordCount ) {
		const sentence = SENTENCES[ idx % SENTENCES.length ];
		for ( const w of sentence.split( /\s+/ ) ) {
			if ( words.length >= wordCount ) {
				break;
			}
			words.push( w );
		}
		idx++;
	}
	return words.join( ' ' );
}

// ── Block markup helpers ────────────────────────────────────────────

function bp( text: string ): string {
	return `<!-- wp:paragraph -->\n<p>${ text }</p>\n<!-- /wp:paragraph -->`;
}

function bh( text: string, level: number = 2 ): string {
	const attrs = level === 2 ? '' : ` {"level":${ level }}`;
	return `<!-- wp:heading${ attrs } -->\n<h${ level } class="wp-block-heading">${ text }</h${ level }>\n<!-- /wp:heading -->`;
}

function bul( items: string[] ): string {
	const inner = items
		.map(
			( item ) =>
				`<!-- wp:list-item -->\n<li>${ item }</li>\n<!-- /wp:list-item -->`
		)
		.join( '\n' );
	return `<!-- wp:list -->\n<ul class="wp-block-list">${ inner }</ul>\n<!-- /wp:list -->`;
}

function bol( items: string[] ): string {
	const inner = items
		.map(
			( item ) =>
				`<!-- wp:list-item -->\n<li>${ item }</li>\n<!-- /wp:list-item -->`
		)
		.join( '\n' );
	return `<!-- wp:list {"ordered":true} -->\n<ol class="wp-block-list">${ inner }</ol>\n<!-- /wp:list -->`;
}

function bgroup( innerBlocks: string[] ): string {
	return `<!-- wp:group {"layout":{"type":"constrained"}} -->\n<div class="wp-block-group">${ innerBlocks.join(
		'\n'
	) }</div>\n<!-- /wp:group -->`;
}

function btable( headers: string[], rows: string[][] ): string {
	const thead = `<thead><tr>${ headers
		.map( ( hdr ) => `<th>${ hdr }</th>` )
		.join( '' ) }</tr></thead>`;
	const tbody = `<tbody>${ rows
		.map(
			( row ) =>
				`<tr>${ row
					.map( ( cell ) => `<td>${ cell }</td>` )
					.join( '' ) }</tr>`
		)
		.join( '' ) }</tbody>`;
	return `<!-- wp:table -->\n<figure class="wp-block-table"><table>${ thead }${ tbody }</table></figure>\n<!-- /wp:table -->`;
}

function bquote( innerBlocks: string[], citation?: string ): string {
	const cite = citation ? `<cite>${ citation }</cite>` : '';
	return `<!-- wp:quote -->\n<blockquote class="wp-block-quote">${ innerBlocks.join(
		'\n'
	) }${ cite }</blockquote>\n<!-- /wp:quote -->`;
}

function bcolumns( cols: string[][] ): string {
	const inner = cols
		.map(
			( blocks ) =>
				`<!-- wp:column -->\n<div class="wp-block-column">${ blocks.join(
					'\n'
				) }</div>\n<!-- /wp:column -->`
		)
		.join( '\n' );
	return `<!-- wp:columns -->\n<div class="wp-block-columns">${ inner }</div>\n<!-- /wp:columns -->`;
}

// ── Content generator (~5 000 words) ────────────────────────────────

function generateStressContent(): string {
	const blocks: string[] = [];
	let seed = 0;

	// Introduction
	blocks.push( bh( 'Introduction' ) );
	for ( let i = 0; i < 5; i++ ) {
		blocks.push( bp( filler( 100, seed++ ) ) );
	}

	// Background
	blocks.push( bh( 'Background' ) );
	for ( let i = 0; i < 3; i++ ) {
		blocks.push( bp( filler( 100, seed++ ) ) );
	}
	blocks.push(
		bul( Array.from( { length: 8 }, ( _, i ) => filler( 25, seed + i ) ) )
	);
	seed += 8;

	// Technical Details
	blocks.push( bh( 'Technical Details', 3 ) );
	for ( let i = 0; i < 4; i++ ) {
		blocks.push( bp( filler( 100, seed++ ) ) );
	}
	blocks.push(
		bol( Array.from( { length: 6 }, ( _, i ) => filler( 25, seed + i ) ) )
	);
	seed += 6;

	// Analysis
	blocks.push( bh( 'Analysis' ) );
	blocks.push(
		bgroup( [
			bp( filler( 100, seed++ ) ),
			bp( filler( 100, seed++ ) ),
			bp( filler( 100, seed++ ) ),
		] )
	);
	blocks.push(
		btable(
			[ 'Metric', 'Baseline', 'Optimized' ],
			Array.from( { length: 4 }, () => [
				filler( 8, seed++ ),
				filler( 8, seed++ ),
				filler( 8, seed++ ),
			] )
		)
	);
	for ( let i = 0; i < 4; i++ ) {
		blocks.push( bp( filler( 100, seed++ ) ) );
	}
	blocks.push( bquote( [ bp( filler( 80, seed++ ) ) ], 'Research Team' ) );

	// Paragraph targeted for concurrent editing (Phase 4).
	blocks.push(
		bp(
			'This paragraph is the shared editing target for concurrent modification testing.'
		)
	);

	// Implementation Notes
	blocks.push( bh( 'Implementation Notes', 3 ) );
	blocks.push(
		bgroup( [
			bp( filler( 100, seed++ ) ),
			bp( filler( 100, seed++ ) ),
			bul(
				Array.from( { length: 5 }, ( _, i ) => filler( 20, seed + i ) )
			),
		] )
	);
	seed += 5;

	// Paragraphs targeted for block movement (Phase 5).
	blocks.push( bp( 'Alpha section content for block movement testing.' ) );
	blocks.push( bp( 'Beta section content for block movement testing.' ) );
	for ( let i = 0; i < 3; i++ ) {
		blocks.push( bp( filler( 100, seed++ ) ) );
	}

	// Results
	blocks.push( bh( 'Results' ) );
	blocks.push(
		bcolumns( [
			[ bp( filler( 100, seed++ ) ) ],
			[ bp( filler( 100, seed++ ) ) ],
		] )
	);
	blocks.push(
		btable(
			[ 'Test', 'Expected', 'Actual', 'Status' ],
			Array.from( { length: 3 }, () => [
				filler( 6, seed++ ),
				filler( 6, seed++ ),
				filler( 6, seed++ ),
				'Passed',
			] )
		)
	);
	for ( let i = 0; i < 4; i++ ) {
		blocks.push( bp( filler( 100, seed++ ) ) );
	}
	blocks.push( bquote( [ bp( filler( 80, seed++ ) ) ], 'Analysis Team' ) );

	// Paragraph targeted for block movement (far from Alpha/Beta).
	blocks.push( bp( 'Gamma section content for block movement testing.' ) );

	// Discussion
	blocks.push( bh( 'Discussion' ) );
	for ( let i = 0; i < 5; i++ ) {
		blocks.push( bp( filler( 100, seed++ ) ) );
	}
	blocks.push(
		bgroup( [
			bp( filler( 100, seed++ ) ),
			bp( filler( 100, seed++ ) ),
			bp( filler( 100, seed++ ) ),
		] )
	);

	// Future Work
	blocks.push( bh( 'Future Work', 3 ) );
	blocks.push(
		bul( Array.from( { length: 6 }, ( _, i ) => filler( 25, seed + i ) ) )
	);
	seed += 6;
	for ( let i = 0; i < 3; i++ ) {
		blocks.push( bp( filler( 100, seed++ ) ) );
	}

	// Conclusion
	blocks.push( bh( 'Conclusion' ) );
	for ( let i = 0; i < 3; i++ ) {
		blocks.push( bp( filler( 100, seed++ ) ) );
	}
	blocks.push( bquote( [ bp( filler( 80, seed++ ) ) ], 'Project Lead' ) );

	return blocks.join( '\n\n' );
}

// ── Test-specific helpers ───────────────────────────────────────────

/**
 * Type a new paragraph after a heading identified by its visible text.
 * Clicks the heading, presses End then Enter (creating a new paragraph
 * below it), and types the given content.
 *
 * @param ed            Editor instance for the user.
 * @param pg            Playwright page for the user.
 * @param headingText   Visible text of the heading to click.
 * @param paragraphText Text to type into the new paragraph.
 */
async function typeNewParagraphAfterHeading(
	ed: Editor,
	pg: Page,
	headingText: string,
	paragraphText: string
) {
	await ed.canvas.getByText( headingText, { exact: true } ).click();
	await pg.keyboard.press( 'End' );
	await pg.keyboard.press( 'Enter' );
	await pg.keyboard.insertText( paragraphText );
}

// ── Tests ───────────────────────────────────────────────────────────

test.describe( 'Collaboration - Stress Test', () => {
	test( 'three users concurrently edit a large post with diverse blocks', async ( {
		collaborationUtils,
		requestUtils,
		editor,
		page,
	} ) => {
		// Create the two additional test users.
		for ( const user of STRESS_USERS ) {
			await requestUtils.createUser( user );
		}

		// Create a large draft post (~5 000 words, diverse block types).
		const content = generateStressContent();
		const post = await requestUtils.createPost( {
			title: 'RTC Stress Test',
			content,
			status: 'draft',
			date_gmt: new Date().toISOString(),
		} );

		// ── Phase 1 — Admin opens the post ──────────────────────
		await collaborationUtils.openPost( post.id );

		// Sanity-check: the large post loaded its blocks.
		const initialBlocks = await editor.getBlocks();
		expect( initialBlocks.length ).toBeGreaterThan( 40 );

		// ── Phase 2 — User 2 (Editor) joins ─────────────────────
		const { page: page2, editor: editor2 } =
			await collaborationUtils.joinUser( post.id, STRESS_USERS[ 0 ] );
		await collaborationUtils.waitForMutualDiscovery();

		// Admin types a new paragraph after the "Conclusion" heading.
		await typeNewParagraphAfterHeading(
			editor,
			page,
			'Conclusion',
			'Admin typed this paragraph in Phase 2.'
		);

		// Editor types a new title.
		await editor2.canvas
			.getByRole( 'textbox', { name: 'Add title' } )
			.click( { clickCount: 3 } );
		await page2.keyboard.insertText( 'RTC Stress Test — Edited by Editor' );

		// Verify Admin's paragraph synced to Editor.
		await expect( async () => {
			const blocks = await editor2.getBlocks();
			const allContent = JSON.stringify( blocks );
			expect( allContent ).toContain(
				'Admin typed this paragraph in Phase 2'
			);
		} ).toPass( { timeout: 10_000 } );

		// ── Phase 3 — Save · User 3 joins · Admin refreshes ────
		await editor.saveDraft();

		const { page: page3, editor: editor3 } =
			await collaborationUtils.joinUser( post.id, STRESS_USERS[ 1 ] );

		// Admin refreshes (first refresh).
		await page.reload( { waitUntil: 'load' } );
		await collaborationUtils.waitForCollaborationReady( page );

		await collaborationUtils.waitForMutualDiscovery();

		// ── Phase 4 — Two users type in the same paragraph ──────
		// Uses insertText (single input event) instead of keyboard.type
		// (character-by-character) to avoid CRDT character interleaving.
		await Promise.all( [
			( async () => {
				await editor.canvas
					.getByText( 'shared editing target' )
					.click();
				await page.keyboard.press( 'End' );
				await page.keyboard.insertText( ' — Admin was here.' );
			} )(),
			( async () => {
				await editor2.canvas
					.getByText( 'shared editing target' )
					.click();
				await page2.keyboard.press( 'End' );
				await page2.keyboard.insertText( ' — Editor was here.' );
			} )(),
		] );

		// All three active users should see both additions.
		for ( const ed of [ editor, editor2, editor3 ] ) {
			await expect( async () => {
				const blocks = await ed.getBlocks();
				const allContent = JSON.stringify( blocks );
				expect( allContent ).toContain( 'Admin was here' );
				expect( allContent ).toContain( 'Editor was here' );
			} ).toPass( { timeout: 10_000 } );
		}

		// ── Phase 5 — Two users move blocks via toolbar ─────────
		// User 2 moves "Alpha" down; User 3 moves "Gamma" up.
		// The blocks are far apart so the moves don't conflict.
		await Promise.all( [
			( async () => {
				await editor2.canvas
					.getByText( 'Alpha section content' )
					.click();
				await editor2.showBlockToolbar();
				await page2
					.locator(
						'role=toolbar[name="Block tools"i] >> role=button[name="Move down"i]'
					)
					.click();
			} )(),
			( async () => {
				await editor3.canvas
					.getByText( 'Gamma section content' )
					.click();
				await editor3.showBlockToolbar();
				await page3
					.locator(
						'role=toolbar[name="Block tools"i] >> role=button[name="Move up"i]'
					)
					.click();
			} )(),
		] );

		// Wait for block-movement changes to propagate.
		await Promise.all(
			collaborationUtils.allPages.map( ( pg ) =>
				collaborationUtils.waitForSyncCycle( pg )
			)
		);

		// Verify Alpha moved below Beta and Gamma moved above the
		// "Analysis Team" blockquote on all users.
		for ( const ed of [ editor, editor2, editor3 ] ) {
			await expect( async () => {
				const blocks = await ed.getBlocks();
				const texts = blocks.map( ( b ) =>
					String( b.attributes.content ?? '' )
				);
				const alphaIdx = texts.findIndex( ( t ) =>
					t.includes( 'Alpha section content' )
				);
				const betaIdx = texts.findIndex( ( t ) =>
					t.includes( 'Beta section content' )
				);
				expect( alphaIdx ).toBeGreaterThan( -1 );
				expect( betaIdx ).toBeGreaterThan( -1 );
				expect( alphaIdx ).toBeGreaterThan( betaIdx );

				// Gamma was moved up, so it should now be above the
				// "Analysis Team" blockquote that was previously above it.
				const gammaIdx = texts.findIndex( ( t ) =>
					t.includes( 'Gamma section content' )
				);
				const quoteIdx = blocks.findIndex( ( b ) =>
					String( b.attributes.citation ?? '' ).includes(
						'Analysis Team'
					)
				);
				expect( gammaIdx ).toBeGreaterThan( -1 );
				expect( quoteIdx ).toBeGreaterThan( -1 );
				expect( gammaIdx ).toBeLessThan( quoteIdx );
			} ).toPass( { timeout: 10_000 } );
		}

		// ── Phase 6 — Second save · all 3 users type concurrently ──
		await editor.saveDraft();

		// Each user clicks on a different heading, presses Enter to
		// create a new paragraph below it, then types their content.
		await Promise.all( [
			typeNewParagraphAfterHeading(
				editor,
				page,
				'Introduction',
				'Final paragraph from Admin.'
			),
			typeNewParagraphAfterHeading(
				editor2,
				page2,
				'Discussion',
				'Final paragraph from Editor.'
			),
			typeNewParagraphAfterHeading(
				editor3,
				page3,
				'Results',
				'Final paragraph from Author.'
			),
		] );

		// All 3 users should see all 3 new paragraphs.
		for ( const ed of collaborationUtils.allEditors ) {
			await expect( async () => {
				const blocks = await ed.getBlocks();
				const allContent = JSON.stringify( blocks );
				expect( allContent ).toContain( 'Final paragraph from Admin' );
				expect( allContent ).toContain( 'Final paragraph from Editor' );
				expect( allContent ).toContain( 'Final paragraph from Author' );
			} ).toPass( { timeout: 10_000 } );
		}

		// ── Phase 7 — Final save and publish ────────────────────
		await editor.saveDraft();
		await editor.publishPost();
	} );

	test( 'two users concurrently move list items', async ( {
		collaborationUtils,
		requestUtils,
		editor,
		page,
	} ) => {
		await requestUtils.createUser( STRESS_USERS[ 0 ] );

		// Create a post with a list of clearly identifiable items.
		const listContent = bul( [
			'Item Alpha',
			'Item Beta',
			'Item Gamma',
			'Item Delta',
			'Item Epsilon',
			'Item Zeta',
		] );
		const post = await requestUtils.createPost( {
			title: 'List Item Movement Test',
			content: listContent,
			status: 'draft',
			date_gmt: new Date().toISOString(),
		} );

		// ── Phase 1 — Both users open the post ──────────────────
		await collaborationUtils.openPost( post.id );

		const { page: page2, editor: editor2 } =
			await collaborationUtils.joinUser( post.id, STRESS_USERS[ 0 ] );
		await collaborationUtils.waitForMutualDiscovery();

		// ── Phase 2 — Concurrent list-item moves ────────────────
		// User 1 moves "Item Beta" down; User 2 moves "Item Epsilon" up.
		// The items are well-separated so the moves don't conflict.
		await Promise.all( [
			( async () => {
				await editor.canvas
					.getByText( 'Item Beta', { exact: true } )
					.click();
				await editor.showBlockToolbar();
				await page
					.locator(
						'role=toolbar[name="Block tools"i] >> role=button[name="Move down"i]'
					)
					.click();
			} )(),
			( async () => {
				await editor2.canvas
					.getByText( 'Item Epsilon', { exact: true } )
					.click();
				await editor2.showBlockToolbar();
				await page2
					.locator(
						'role=toolbar[name="Block tools"i] >> role=button[name="Move up"i]'
					)
					.click();
			} )(),
		] );

		// Verify both moves on both users: Beta after Gamma,
		// Epsilon before Delta.
		const assertMovedOrder = async ( ed: Editor ) => {
			await expect( async () => {
				const blocks = await ed.getBlocks();
				const listBlock = blocks.find(
					( b ) => b.name === 'core/list'
				);
				expect( listBlock ).toBeDefined();
				const items = listBlock!.innerBlocks.map( ( item ) =>
					String( item.attributes.content )
				);
				expect( items ).toHaveLength( 6 );
				const betaIdx = items.indexOf( 'Item Beta' );
				const gammaIdx = items.indexOf( 'Item Gamma' );
				const epsilonIdx = items.indexOf( 'Item Epsilon' );
				const deltaIdx = items.indexOf( 'Item Delta' );
				expect( betaIdx ).toBeGreaterThan( gammaIdx );
				expect( epsilonIdx ).toBeLessThan( deltaIdx );
			} ).toPass( { timeout: 10_000 } );
		};

		for ( const ed of [ editor, editor2 ] ) {
			await assertMovedOrder( ed );
		}

		// ── Phase 3 — Save draft ────────────────────────────────
		await editor.saveDraft();

		// ── Phase 4 — User 1 refreshes ──────────────────────────
		await page.reload( { waitUntil: 'load' } );
		await collaborationUtils.waitForCollaborationReady( page );
		await collaborationUtils.waitForMutualDiscovery();

		// After refresh, User 1 should still see 6 items in the
		// moved order.
		await assertMovedOrder( editor );

		// ── Phase 5 — User 2 refreshes ──────────────────────────
		await page2.reload( { waitUntil: 'load' } );
		await collaborationUtils.waitForCollaborationReady( page2 );
		await collaborationUtils.waitForMutualDiscovery();

		// After refresh, User 2 should also see 6 items in the
		// moved order.
		await assertMovedOrder( editor2 );
	} );
} );
