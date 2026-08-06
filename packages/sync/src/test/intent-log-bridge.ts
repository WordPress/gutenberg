/**
 * External dependencies
 */
import { describe, expect, it } from '@jest/globals';

/**
 * Internal dependencies
 */
import {
	blockToEngineSpec,
	deriveIntents,
	engineDocumentToBlocks,
	type BridgeBlock,
} from '../engines/intent-log-bridge';
import {
	createIntentLogSession,
	INTENT_LOG_UPDATE_TYPES,
} from '../engines/intent-log-session';
import {
	createDocument,
	canonicalJson,
} from '../engines/intent-log/document.js';
import { htmlToField } from '../engines/intent-log/rich-text.js';
import {
	createServer,
	serverDocAt,
	serverIngestBatch,
} from '../engines/intent-log/rebase.js';
import type { EngineDocument } from '../engines/intent-log/engine-types';

const paragraph = (
	syncId: string,
	content: string,
	extra: Record< string, unknown > = {}
): BridgeBlock => ( {
	name: 'core/paragraph',
	attributes: { ...extra, content, metadata: { syncId } },
	innerBlocks: [],
} );

function docFromBlocks( blocks: BridgeBlock[] ): EngineDocument {
	return createDocument(
		blocks.map( ( block ) => blockToEngineSpec( block ) )
	);
}

describe( 'intent-log bridge', () => {
	describe( 'block mapping', () => {
		it( 'round-trips blocks with syncId in metadata and content as a field', () => {
			const blocks = [
				paragraph( 'p1', 'Hello <em>there</em>', { align: 'wide' } ),
				{
					name: 'core/group',
					attributes: { metadata: { syncId: 'g1', name: 'Kept' } },
					innerBlocks: [ paragraph( 'p2', 'Nested' ) ],
				},
			];
			const doc = docFromBlocks( blocks );
			expect( doc.root[ 0 ].syncId ).toBe( 'p1' );
			// Plain-text coordinates: no tag characters in field text.
			expect( doc.root[ 0 ].fields.content ).toEqual( {
				text: 'Hello there',
				formats: [ { start: 6, end: 11, format: 'em' } ],
			} );
			expect( doc.root[ 0 ].attrs.align ).toBe( 'wide' );
			expect( doc.root[ 0 ].attrs.metadata ).toBeUndefined();
			expect( doc.root[ 1 ].attrs.metadata ).toEqual( { name: 'Kept' } );

			const back = engineDocumentToBlocks( doc );
			expect( back[ 0 ].attributes.metadata ).toEqual( {
				syncId: 'p1',
			} );
			expect( back[ 0 ].attributes.content ).toBe(
				'Hello <em>there</em>'
			);
			expect( back[ 1 ].attributes.metadata ).toEqual( {
				syncId: 'g1',
				name: 'Kept',
			} );
			expect( back[ 1 ].innerBlocks[ 0 ].attributes.metadata ).toEqual( {
				syncId: 'p2',
			} );
		} );

		it( 'converts rich-text values through the codec and mints ids for new blocks', () => {
			const spec = blockToEngineSpec( {
				name: 'core/paragraph',
				attributes: {
					content: { toHTMLString: () => 'so <em>Rich</em>' },
				},
				innerBlocks: [],
			} );
			expect( spec.fields ).toEqual( {
				content: {
					text: 'so Rich',
					formats: [ { start: 3, end: 7, format: 'em' } ],
				},
			} );
			expect( typeof spec.syncId ).toBe( 'string' );
			expect( ( spec.syncId as string ).length ).toBeGreaterThan( 8 );
		} );
	} );

	describe( 'deriveIntents', () => {
		it( 'returns null when nothing changed', () => {
			const blocks = [ paragraph( 'p1', 'Hello' ) ];
			expect(
				deriveIntents( docFromBlocks( blocks ), blocks )
			).toBeNull();
		} );

		it( 'derives a single text intent from an edit', () => {
			const doc = docFromBlocks( [ paragraph( 'p1', 'Hello world' ) ] );
			const derived = deriveIntents( doc, [
				paragraph( 'p1', 'Hello brave world' ),
			] )!;
			expect( derived.coarseBlockCount ).toBe( 0 );
			expect( derived.intents ).toEqual( [
				{
					type: 'insert_text',
					payload: {
						syncId: 'p1',
						field: 'content',
						offset: 6,
						text: 'brave ',
					},
				},
			] );
		} );

		it( 'derives attr set/remove with observed versions from the document', () => {
			const doc = docFromBlocks( [
				paragraph( 'p1', 'Hi', { align: 'wide', dropCap: true } ),
			] );
			// Simulate a prior remote write bumping the register.
			doc.root[ 0 ].attrVersions.align = 3;
			const derived = deriveIntents( doc, [
				paragraph( 'p1', 'Hi', { align: 'full' } ),
			] )!;
			expect( derived.intents ).toEqual(
				expect.arrayContaining( [
					{
						type: 'set_attr',
						payload: {
							syncId: 'p1',
							key: 'align',
							value: 'full',
							observedVersion: 3,
						},
					},
					{
						type: 'remove_attr',
						payload: {
							syncId: 'p1',
							key: 'dropCap',
							observedVersion: 0,
						},
					},
				] )
			);
			expect( derived.coarseBlockCount ).toBe( 0 );
		} );

		it( 'derives insert_block with anchors, one intent per new subtree', () => {
			const doc = docFromBlocks( [ paragraph( 'p1', 'First' ) ] );
			const derived = deriveIntents( doc, [
				paragraph( 'p1', 'First' ),
				{
					name: 'core/group',
					attributes: {},
					innerBlocks: [
						{
							name: 'core/paragraph',
							attributes: { content: 'Inside' },
							innerBlocks: [],
						},
					],
				},
			] )!;
			expect( derived.intents ).toHaveLength( 1 );
			expect( derived.intents[ 0 ].type ).toBe( 'insert_block' );
			expect( derived.intents[ 0 ].payload.parentId ).toBeNull();
			expect( derived.intents[ 0 ].payload.afterSiblingId ).toBe( 'p1' );
			const block = derived.intents[ 0 ].payload.block as {
				children: unknown[];
			};
			expect( block.children ).toHaveLength( 1 );
			expect( derived.coarseBlockCount ).toBe( 0 );
		} );

		it( 'derives a move (not remove+insert) for a reorder', () => {
			const doc = docFromBlocks( [
				paragraph( 'p1', 'A' ),
				paragraph( 'p2', 'B' ),
				paragraph( 'p3', 'C' ),
			] );
			const derived = deriveIntents( doc, [
				paragraph( 'p3', 'C' ),
				paragraph( 'p1', 'A' ),
				paragraph( 'p2', 'B' ),
			] )!;
			const types = derived.intents.map( ( intent ) => intent.type );
			expect( types ).not.toContain( 'remove_block' );
			expect( types ).not.toContain( 'insert_block' );
			expect( types ).toContain( 'move_block' );
			expect( derived.coarseBlockCount ).toBe( 0 );
		} );

		it( 'derives remove_block and transform_block', () => {
			const doc = docFromBlocks( [
				paragraph( 'p1', 'A' ),
				paragraph( 'p2', 'B' ),
			] );
			const derived = deriveIntents( doc, [
				{
					...paragraph( 'p1', 'A' ),
					name: 'core/heading',
				},
			] )!;
			expect( derived.intents ).toEqual(
				expect.arrayContaining( [
					{ type: 'remove_block', payload: { syncId: 'p2' } },
					{
						type: 'transform_block',
						payload: { syncId: 'p1', newBlockType: 'core/heading' },
					},
				] )
			);
			expect( derived.coarseBlockCount ).toBe( 0 );
		} );

		it( 'verifies combined edits (structure + attrs + text in one batch)', () => {
			const doc = docFromBlocks( [
				paragraph( 'p1', 'Alpha' ),
				paragraph( 'p2', 'Beta' ),
				paragraph( 'p3', 'Gamma' ),
			] );
			const derived = deriveIntents( doc, [
				paragraph( 'p2', 'Beta amended', { align: 'wide' } ),
				paragraph( 'p1', 'Alpha' ),
				paragraph( 'new-block', 'Fresh' ),
			] )!;
			expect( derived.coarseBlockCount ).toBe( 0 );
			expect( derived.intents.length ).toBeGreaterThanOrEqual( 4 );
		} );

		it( 'duplicate syncIds re-mint: the first occurrence keeps the identity', () => {
			// Gutenberg's split (and duplication) copies metadata.syncId to
			// the new block. The head keeps the identity; the copy re-mints
			// and inserts as a new block — never a throw, never divergence.
			const doc = docFromBlocks( [ paragraph( 'p1', 'A' ) ] );
			const derived = deriveIntents( doc, [
				paragraph( 'p1', 'A' ),
				paragraph( 'p1', 'A copy' ),
			] )!;
			expect( derived.specs[ 0 ].syncId ).toBe( 'p1' );
			expect( derived.specs[ 1 ].syncId ).not.toBe( 'p1' );
			expect( derived.intents ).toHaveLength( 1 );
			expect( derived.intents[ 0 ].type ).toBe( 'insert_block' );
			expect( derived.intents[ 0 ].payload.afterSiblingId ).toBe( 'p1' );
		} );

		it( 'a split with copied metadata (duplicate ids, id-carrying tree) keeps head and sibling identities', () => {
			// The durable-id shape of the split bug: ids ARE present, and
			// the split's second half carries the HEAD's id verbatim.
			const doc = docFromBlocks( [
				paragraph( 'p1', 'HelloWorld' ),
				paragraph( 'p2', 'SecondBlock' ),
			] );
			const derived = deriveIntents( doc, [
				paragraph( 'p1', 'Hello' ),
				paragraph( 'p1', 'World' ), // duplicate id from split
				paragraph( 'p2', 'SecondBlock' ),
			] )!;
			const specIds = derived.specs.map( ( spec ) => spec.syncId );
			expect( specIds[ 0 ] ).toBe( 'p1' );
			expect( specIds[ 2 ] ).toBe( 'p2' );
			expect( specIds[ 1 ] ).not.toBe( 'p1' );
			expect( specIds[ 1 ] ).not.toBe( 'p2' );
			expect( derived.coarseBlockCount ).toBe( 0 );
		} );

		it( 'editor-stamped ids unknown to the document adopt matching document identities', () => {
			// An id stamper assigns random creation ids in the editor before
			// the server snapshot (deterministic genesis ids) arrives. The
			// content is the same; the unknown ids must reconcile onto the
			// document's identities instead of deriving remove+insert churn.
			const doc = docFromBlocks( [
				paragraph( 'genesis-1', 'Alpha' ),
				paragraph( 'genesis-2', 'Beta' ),
			] );
			const derived = deriveIntents( doc, [
				paragraph( 'stamped-a', 'Alpha' ),
				paragraph( 'stamped-b', 'Beta edited' ),
			] )!;
			expect( derived.specs[ 0 ].syncId ).toBe( 'genesis-1' );
			expect( derived.specs[ 1 ].syncId ).toBe( 'genesis-2' );
			expect( derived.intents.map( ( intent ) => intent.type ) ).toEqual(
				[ 'insert_text' ]
			);
		} );
	} );

	describe( 'end to end through a session', () => {
		it( 'derived intents are valid vocabulary and converge two sessions', () => {
			const genesisBlocks = [
				paragraph( 'p1', 'Hello world' ),
				paragraph( 'p2', 'Second' ),
			];
			const initialDoc = docFromBlocks( genesisBlocks );
			const server = createServer( initialDoc );
			const snapshotRow = {
				data: JSON.stringify( { doc: initialDoc } ),
				type: INTENT_LOG_UPDATE_TYPES.SNAPSHOT,
			};

			const alice = createIntentLogSession( { userId: 1, clientId: 11 } );
			const bob = createIntentLogSession( { userId: 2, clientId: 22 } );
			alice.receiveUpdate( snapshotRow );
			bob.receiveUpdate( snapshotRow );

			// Alice's editor produces a new tree: edited text, new block,
			// reorder. The bridge derives intents; the session validates and
			// authors each one (createIntent throws on vocabulary errors).
			const derived = deriveIntents( alice.getDocument()!, [
				paragraph( 'p2', 'Second, edited' ),
				paragraph( 'p1', 'Hello brave world' ),
				{
					name: 'core/quote',
					attributes: { content: 'New quote' },
					innerBlocks: [],
				},
			] )!;
			expect( derived.coarseBlockCount ).toBe( 0 );
			const sent = derived.intents.map( ( intent ) =>
				alice.author( intent.type, intent.payload )
			);

			// Wire round trip: server plans, both sessions receive rows.
			const dispositions = serverIngestBatch( server, sent );
			expect(
				dispositions.every( ( d ) => 'applied' === d.status )
			).toBe( true );
			for ( const entry of server.log ) {
				const row = {
					data: JSON.stringify( entry ),
					type: INTENT_LOG_UPDATE_TYPES.INTENT,
				};
				alice.receiveUpdate( row );
				bob.receiveUpdate( row );
			}

			const serverJson = canonicalJson(
				serverDocAt( server, server.log.length )
			);
			expect( canonicalJson( alice.getDocument()! ) ).toBe( serverJson );
			expect( canonicalJson( bob.getDocument()! ) ).toBe( serverJson );

			// And the converged document maps back to editor blocks.
			const back = engineDocumentToBlocks( bob.getDocument()! );
			expect( back.map( ( block ) => block.attributes.content ) ).toEqual(
				[ 'Second, edited', 'Hello brave world', 'New quote' ]
			);
		} );
	} );
} );

describe( 'identity adoption under splits', () => {
	it( 'REGRESSION: splitting the first of two id-less blocks does not steal the sibling identity', () => {
		// The active tab's tree carries no syncIds (write-back does not
		// stick while typing). A mid-text split turns [HelloWorld, Second]
		// into [Hello, World, Second]; blind positional adoption made
		// "World" steal Second's identity and re-minted Second — concurrent
		// edits to Second then landed under the stolen id (content
		// duplication in the field).
		const doc = docFromBlocks( [
			paragraph( 'p1', 'HelloWorld' ),
			paragraph( 'p2', 'SecondBlock' ),
		] );
		const idless = ( content: string ) => ( {
			name: 'core/paragraph',
			attributes: { content },
			innerBlocks: [],
		} );
		const derived = deriveIntents( doc, [
			idless( 'Hello' ),
			idless( 'World' ),
			idless( 'SecondBlock' ),
		] )!;

		expect( derived.coarseBlockCount ).toBe( 0 );
		const specIds = derived.specs.map( ( spec ) => spec.syncId );
		// Head keeps p1 (similar text), Second keeps p2 (exact text), the
		// split's second half mints a NEW id.
		expect( specIds[ 0 ] ).toBe( 'p1' );
		expect( specIds[ 2 ] ).toBe( 'p2' );
		expect( specIds[ 1 ] ).not.toBe( 'p2' );
		expect( specIds[ 1 ] ).not.toBe( 'p1' );
		// And no destructive or content intent targets p2 (a redundant
		// identity-addressed move is tolerable; deletions/rewrites are not).
		const destructive = derived.intents
			.filter( ( intent ) => 'move_block' !== intent.type )
			.flatMap( ( intent ) => [
				intent.payload.syncId,
				( intent.payload.block as { syncId?: string } | undefined )
					?.syncId,
			] );
		expect( destructive ).not.toContain( 'p2' );
	} );

	it( 'a fully rewritten id-less block re-mints instead of adopting unrelated content', () => {
		const doc = docFromBlocks( [ paragraph( 'p1', 'HelloWorld' ) ] );
		const derived = deriveIntents( doc, [
			{
				name: 'core/paragraph',
				attributes: { content: 'zzz' },
				innerBlocks: [],
			},
		] )!;
		expect( derived.specs[ 0 ].syncId ).not.toBe( 'p1' );
		expect(
			derived.intents.map( ( intent ) => intent.type ).sort()
		).toEqual( [ 'insert_block', 'remove_block' ] );
	} );
} );

describe( 'adoption edge cases', () => {
	const idless = ( content: string ): BridgeBlock => ( {
		name: 'core/paragraph',
		attributes: { content },
		innerBlocks: [],
	} );

	it( 'two empty id-less paragraphs against one empty doc block stay stable', () => {
		// Repeated Enter creates empty paragraphs with identical (empty)
		// content. Exact-content adoption must claim at most one doc
		// identity; the second mints — and repeating the derivation is
		// deterministic (no oscillation).
		const doc = docFromBlocks( [ paragraph( 'p1', '' ) ] );
		const derived = deriveIntents( doc, [ idless( '' ), idless( '' ) ] )!;
		expect( derived.specs[ 0 ].syncId ).toBe( 'p1' );
		expect( derived.specs[ 1 ].syncId ).not.toBe( 'p1' );
		expect( derived.intents.map( ( intent ) => intent.type ) ).toEqual( [
			'insert_block',
		] );
	} );

	it( 'split at the END (empty tail) keeps the head identity and mints the tail', () => {
		const doc = docFromBlocks( [
			paragraph( 'p1', 'HelloWorld' ),
			paragraph( 'p2', 'Second' ),
		] );
		const derived = deriveIntents( doc, [
			idless( 'HelloWorld' ),
			idless( '' ),
			idless( 'Second' ),
		] )!;
		const ids = derived.specs.map( ( spec ) => spec.syncId );
		expect( ids[ 0 ] ).toBe( 'p1' );
		expect( ids[ 2 ] ).toBe( 'p2' );
		expect( ids[ 1 ] ).not.toBe( 'p1' );
		expect( ids[ 1 ] ).not.toBe( 'p2' );
		expect( derived.coarseBlockCount ).toBe( 0 );
	} );

	it( 'split at the START anchors identity to the surviving content', () => {
		// With no ids anywhere, identity follows CONTENT: the (empty) new
		// head mints, the tail carrying the original text keeps the
		// original identity — anchors and history stay with the words.
		const doc = docFromBlocks( [
			paragraph( 'p1', 'HelloWorld' ),
			paragraph( 'p2', 'Second' ),
		] );
		const derived = deriveIntents( doc, [
			idless( '' ),
			idless( 'HelloWorld' ),
			idless( 'Second' ),
		] )!;
		const ids = derived.specs.map( ( spec ) => spec.syncId );
		expect( ids[ 1 ] ).toBe( 'p1' );
		expect( ids[ 2 ] ).toBe( 'p2' );
		expect( ids[ 0 ] ).not.toBe( 'p1' );
		expect( derived.coarseBlockCount ).toBe( 0 );
	} );

	it( 'derivation is idempotent: re-deriving the converged tree is a no-op', () => {
		// After any derivation, applying the intents and re-deriving with
		// the resulting specs must produce null — the fixed point that
		// prevents capture oscillation.
		const doc = docFromBlocks( [
			paragraph( 'p1', 'HelloWorld' ),
			paragraph( 'p2', 'Second' ),
		] );
		const derived = deriveIntents( doc, [
			idless( 'Hello' ),
			idless( 'World' ),
			idless( 'Second' ),
		] )!;
		const echo = derived.specs.map( ( spec ) => ( {
			name: 'core/paragraph',
			attributes: {
				content: ( spec.fields as Record< string, { text: string } > )
					.content.text,
				metadata: { syncId: spec.syncId as string },
			},
			innerBlocks: [],
		} ) );
		// Simulate the post-apply document: apply the derived intents.
		const server = createServer( doc );
		serverIngestBatch(
			server,
			derived.intents.map( ( intent, index ) => ( {
				intentId: `i-${ index }`,
				actorId: 'a',
				baseSeq: 0,
				txnId: null,
				type: intent.type,
				payload: intent.payload,
			} ) )
		);
		const applied = serverDocAt( server, server.log.length );
		expect( deriveIntents( applied, echo ) ).toBeNull();
	} );
} );

describe( 'rich-text coordinate capture', () => {
	const idless = ( content: string ): BridgeBlock => ( {
		name: 'core/paragraph',
		attributes: { content },
		innerBlocks: [],
	} );

	it( 'derives split_block from the Enter-in-a-paragraph tree shape', () => {
		const doc = docFromBlocks( [ paragraph( 'p1', 'HelloWorld' ) ] );
		const derived = deriveIntents( doc, [
			paragraph( 'p1', 'Hello' ),
			idless( 'World' ),
		] )!;

		const types = derived.intents.map( ( intent ) => intent.type );
		expect( types ).toContain( 'split_block' );
		expect( types ).not.toContain( 'insert_block' );
		expect( types ).not.toContain( 'remove_block' );
		const split = derived.intents.find(
			( intent ) => 'split_block' === intent.type
		)!;
		expect( split.payload ).toMatchObject( {
			syncId: 'p1',
			field: 'content',
			offset: 5,
		} );
		// The tail's identity is the split's newSyncId — agreed before the
		// server ever sees the block.
		expect( split.payload.newSyncId ).toBe( derived.specs[ 1 ].syncId );
		expect( derived.coarseBlockCount ).toBe( 0 );
	} );

	it( 'derives merge_blocks from the Backspace-join tree shape', () => {
		const doc = docFromBlocks( [
			paragraph( 'p1', 'Hello' ),
			paragraph( 'p2', 'World' ),
		] );
		const derived = deriveIntents(
			doc,
			[ paragraph( 'p1', 'HelloWorld' ) ],
			{ removableIds: new Set( [ 'p1', 'p2' ] ) }
		)!;

		const types = derived.intents.map( ( intent ) => intent.type );
		expect( types ).toContain( 'merge_blocks' );
		expect( types ).not.toContain( 'remove_block' );
		expect( types ).not.toContain( 'insert_text' );
		const merge = derived.intents.find(
			( intent ) => 'merge_blocks' === intent.type
		)!;
		expect( merge.payload ).toEqual( {
			survivorId: 'p1',
			absorbedId: 'p2',
			field: 'content',
			joinOffset: 5,
		} );
		expect( derived.coarseBlockCount ).toBe( 0 );
	} );

	it( 'derives format_text for a newly bolded range, no text intents', () => {
		const doc = docFromBlocks( [ paragraph( 'p1', 'Hello World' ) ] );
		const derived = deriveIntents( doc, [
			paragraph( 'p1', 'Hello <strong>World</strong>' ),
		] )!;

		expect( derived.intents ).toEqual( [
			{
				type: 'format_text',
				payload: {
					syncId: 'p1',
					field: 'content',
					start: 6,
					end: 11,
					format: 'strong',
					on: true,
				},
			},
		] );
		expect( derived.coarseBlockCount ).toBe( 0 );
	} );

	it( 'existing spans shift through a text edit without redundant format intents', () => {
		const doc = docFromBlocks( [
			paragraph( 'p1', 'Hello <strong>World</strong>' ),
		] );
		const derived = deriveIntents( doc, [
			paragraph( 'p1', 'Hey <strong>World</strong>' ),
		] )!;

		const types = derived.intents.map( ( intent ) => intent.type );
		expect( types ).toContain( 'replace_text' );
		// The reducer shifts the strong span through the replacement; the
		// target agrees, so no format churn.
		expect( types ).not.toContain( 'format_text' );
		expect( derived.coarseBlockCount ).toBe( 0 );
	} );

	it( 'unformatting derives format_text off', () => {
		const doc = docFromBlocks( [
			paragraph( 'p1', 'Hello <em>World</em>' ),
		] );
		const derived = deriveIntents( doc, [
			paragraph( 'p1', 'Hello World' ),
		] )!;
		expect( derived.intents ).toEqual( [
			{
				type: 'format_text',
				payload: {
					syncId: 'p1',
					field: 'content',
					start: 6,
					end: 11,
					format: 'em',
					on: false,
				},
			},
		] );
	} );

	it( 'a resolver-less field stays engine-side in both directions', () => {
		// A block whose resolver names NO rich-text attributes (e.g. an
		// image): its genesis content field must be neither captured over
		// nor serialized into an editor attribute.
		const resolver = ( blockName: string ) =>
			'core/image' === blockName ? [] : [ 'content' ];
		const doc = createDocument( [
			{
				syncId: 'img1',
				blockType: 'core/image',
				attrs: { url: 'a.png' },
				fields: {
					content: htmlToField( '<img src="a.png">' ),
				},
			},
		] );
		const back = engineDocumentToBlocks( doc, resolver );
		expect( back[ 0 ].attributes.content ).toBeUndefined();

		const derived = deriveIntents(
			doc,
			[
				{
					name: 'core/image',
					attributes: {
						url: 'b.png',
						metadata: { syncId: 'img1' },
					},
					innerBlocks: [],
				},
			],
			{ richTextFields: resolver }
		)!;
		const types = derived.intents.map( ( intent ) => intent.type );
		expect( types ).toEqual( [ 'set_attr' ] );
	} );
} );
