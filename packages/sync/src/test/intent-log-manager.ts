/**
 * External dependencies
 */
import { afterEach, describe, expect, it, jest } from '@jest/globals';

/**
 * WordPress dependencies
 */
import { addFilter, removeFilter } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import { Awareness } from 'y-protocols/awareness';
import { createIntentLogManager } from '../engines/intent-log-manager';
import {
	INTENT_LOG_UPDATE_TYPES,
	type IntentLogSession,
} from '../engines/intent-log-session';
import {
	getEngineAdapters,
	resetEngineAdaptersForTesting,
	resolveEngineAdapter,
	INTENT_LOG_ENGINE_SLUG,
	INTENT_LOG_ENGINE_PROTOCOL,
} from '../engines';
import { createDocument } from '../engines/intent-log/document.js';
import { resetProviderCreatorsForTesting } from '../providers';
import type { EngineSessionCodec, EngineUpdate } from '../engines/session';
import type { ProviderCreator, RecordHandlers } from '../types';

/**
 * A capturing fake transport provider: records the codec it received and
 * exposes the queued local updates plus a way to push server rows in.
 */
function makeFakeTransport() {
	const captured: {
		session?: EngineSessionCodec;
		sent: EngineUpdate[];
		destroyed: boolean;
	} = { sent: [], destroyed: false };

	const creator: ProviderCreator = async ( options ) => {
		captured.session = options.session;
		options.session.onLocalUpdate( ( update ) =>
			captured.sent.push( update )
		);
		return {
			destroy: () => {
				captured.destroyed = true;
			},
			on: () => {},
		};
	};

	return { captured, creator };
}

function makeHandlers(): RecordHandlers & { edits: unknown[] } {
	const edits: unknown[] = [];
	return {
		edits,
		addUndoMeta: jest.fn() as RecordHandlers[ 'addUndoMeta' ],
		editRecord: ( ( data: unknown ) =>
			edits.push( data ) ) as RecordHandlers[ 'editRecord' ],
		getEditedRecord:
			( async () => ( {} ) ) as RecordHandlers[ 'getEditedRecord' ],
		onStatusChange: jest.fn() as RecordHandlers[ 'onStatusChange' ],
		persistCRDTDoc: jest.fn() as RecordHandlers[ 'persistCRDTDoc' ],
		refetchRecord: ( async () => {} ) as RecordHandlers[ 'refetchRecord' ],
		restoreUndoMeta: jest.fn() as RecordHandlers[ 'restoreUndoMeta' ],
	};
}

const snapshotRow = (
	blocks: Array< Record< string, unknown > >,
	props: Record< string, unknown > = {}
) => ( {
	data: JSON.stringify( { doc: createDocument( blocks, props ) } ),
	type: INTENT_LOG_UPDATE_TYPES.SNAPSHOT,
} );

const FILTER = 'sync.providers';
const HOOK = 'test/intent-log-manager';

describe( 'intent-log manager', () => {
	afterEach( () => {
		removeFilter( FILTER, HOOK );
		resetEngineAdaptersForTesting();
		resetProviderCreatorsForTesting();
		delete window._wpCollaborationEnabled;
		delete window._wpCollaborationSync;
	} );

	async function loadManagedEntity( record: Record< string, unknown > = {} ) {
		const transport = makeFakeTransport();
		window._wpCollaborationEnabled = '1';
		addFilter( FILTER, HOOK, () => [ transport.creator ] );

		const manager = createIntentLogManager();
		const handlers = makeHandlers();
		await manager.load(
			{} as never,
			'postType/post',
			'1',
			record,
			handlers
		);
		return { manager, handlers, transport };
	}

	it( 'registers as a default engine adapter resolvable from the announcement', () => {
		window._wpCollaborationSync = {
			engine: INTENT_LOG_ENGINE_SLUG,
			engineProtocol: INTENT_LOG_ENGINE_PROTOCOL,
			transports: [ 'http-polling' ],
			transportProtocol: 1,
		};
		expect( getEngineAdapters()[ INTENT_LOG_ENGINE_SLUG ] ).toBeDefined();
		expect( resolveEngineAdapter()?.slug ).toBe( INTENT_LOG_ENGINE_SLUG );
	} );

	it( 'hands its session codec to the transport and stays quiet pre-snapshot', async () => {
		const { manager, handlers, transport } = await loadManagedEntity();

		expect( transport.captured.session ).toBeDefined();
		// Editor updates before the snapshot are ignored, not queued.
		manager.update(
			'postType/post',
			'1',
			{
				blocks: [
					{
						name: 'core/paragraph',
						attributes: { content: 'typed early' },
						innerBlocks: [],
					},
				],
			},
			'gutenberg'
		);
		expect( transport.captured.sent ).toHaveLength( 0 );
		expect( handlers.edits ).toHaveLength( 0 );
	} );

	it( 'pushes the snapshot document into the editor, captures edits as intents, and suppresses the echo', async () => {
		const { manager, handlers, transport } = await loadManagedEntity();

		transport.captured.session!.receiveUpdate(
			snapshotRow( [
				{
					syncId: 'p1',
					blockType: 'core/paragraph',
					text: 'Hello world',
				},
			] )
		);

		// Snapshot arrival dispatches the shared document to the editor.
		expect( handlers.edits ).toHaveLength( 1 );
		const pushed = handlers.edits[ 0 ] as {
			blocks: Array< { attributes: Record< string, unknown > } >;
		};
		expect( pushed.blocks[ 0 ].attributes.content ).toBe( 'Hello world' );
		expect( pushed.blocks[ 0 ].attributes.metadata ).toEqual( {
			syncId: 'p1',
		} );

		// The editor echoes the same tree back (as editors do): no intents.
		manager.update(
			'postType/post',
			'1',
			{ blocks: pushed.blocks },
			'gutenberg'
		);
		expect( transport.captured.sent ).toHaveLength( 0 );

		// A real edit derives exactly one intent and does not bounce back.
		const editsBefore = handlers.edits.length;
		manager.update(
			'postType/post',
			'1',
			{
				blocks: [
					{
						name: 'core/paragraph',
						attributes: {
							content: 'Hello brave world',
							metadata: { syncId: 'p1' },
						},
						innerBlocks: [],
					},
				],
			},
			'gutenberg'
		);
		expect( transport.captured.sent ).toHaveLength( 1 );
		const sentIntent = JSON.parse( transport.captured.sent[ 0 ].data );
		expect( sentIntent.type ).toBe( 'insert_text' );
		expect( handlers.edits ).toHaveLength( editsBefore );
	} );

	it( 'applies remote intents to the editor through editRecord', async () => {
		const { handlers, transport } = await loadManagedEntity();
		transport.captured.session!.receiveUpdate(
			snapshotRow( [
				{
					syncId: 'p1',
					blockType: 'core/paragraph',
					text: 'Hello world',
				},
			] )
		);

		transport.captured.session!.receiveUpdate( {
			data: JSON.stringify( {
				intentId: 'remote-1',
				actorId: 'u9c9',
				baseSeq: 0,
				txnId: null,
				type: 'insert_text',
				payload: {
					syncId: 'p1',
					field: 'content',
					offset: 0,
					text: 'Remote: ',
				},
			} ),
			type: INTENT_LOG_UPDATE_TYPES.INTENT,
		} );

		const last = handlers.edits.at( -1 ) as {
			blocks: Array< { attributes: Record< string, unknown > } >;
		};
		expect( last.blocks[ 0 ].attributes.content ).toBe(
			'Remote: Hello world'
		);
	} );

	it( 'REGRESSION: id-less editor blocks keep a stable identity across updates (no insert/remove churn)', async () => {
		// The editor parses post content without metadata.syncId. Repeated
		// update() calls with id-less blocks must adopt the document's
		// existing identities — never mint fresh ids per call, which turns
		// every keystroke into remove_block + insert_block and makes blocks
		// flicker out of existence on peers.
		const { manager, handlers, transport } = await loadManagedEntity();
		transport.captured.session!.receiveUpdate(
			snapshotRow( [
				{
					syncId: 'genesis-p1',
					blockType: 'core/paragraph',
					text: 'Hello world',
				},
			] )
		);

		const editorBlocks = ( content: string ) => [
			{
				name: 'core/paragraph',
				// No metadata.syncId — exactly what a fresh editor holds.
				attributes: { content },
				innerBlocks: [],
			},
		];

		manager.update(
			'postType/post',
			'1',
			{ blocks: editorBlocks( 'Hello world!' ) },
			'gutenberg'
		);
		manager.update(
			'postType/post',
			'1',
			{ blocks: editorBlocks( 'Hello world!!' ) },
			'gutenberg'
		);

		const sentTypes = transport.captured.sent.map(
			( update ) => JSON.parse( update.data ).type
		);
		expect( sentTypes ).toEqual( [ 'insert_text', 'insert_text' ] );
		// Both edits target the genesis identity.
		for ( const update of transport.captured.sent ) {
			expect( JSON.parse( update.data ).payload.syncId ).toBe(
				'genesis-p1'
			);
		}
		// The editor was handed the adopted identity so its next tree
		// carries it (the write-back half of the fix).
		const lastPush = handlers.edits.at( -1 ) as {
			blocks: Array< { attributes: { metadata?: { syncId?: string } } } >;
		};
		expect( lastPush.blocks[ 0 ].attributes.metadata?.syncId ).toBe(
			'genesis-p1'
		);
	} );

	it( 'REGRESSION: a genuinely new id-less block is inserted once and stays stable', async () => {
		const { manager, transport } = await loadManagedEntity();
		transport.captured.session!.receiveUpdate(
			snapshotRow( [
				{
					syncId: 'genesis-p1',
					blockType: 'core/paragraph',
					text: 'Hello',
				},
			] )
		);

		const withNewBlock = ( content: string ) => [
			{
				name: 'core/paragraph',
				attributes: {
					content: 'Hello',
					metadata: { syncId: 'genesis-p1' },
				},
				innerBlocks: [],
			},
			{
				name: 'core/paragraph',
				attributes: { content },
				innerBlocks: [],
			},
		];

		manager.update(
			'postType/post',
			'1',
			{ blocks: withNewBlock( 'typed' ) },
			'gutenberg'
		);
		manager.update(
			'postType/post',
			'1',
			{ blocks: withNewBlock( 'typed more' ) },
			'gutenberg'
		);

		const sent = transport.captured.sent.map( ( update ) =>
			JSON.parse( update.data )
		);
		expect( sent.map( ( intent ) => intent.type ) ).toEqual( [
			'insert_block',
			'insert_text',
		] );
		// The second edit addresses the SAME identity the insert created.
		expect( sent[ 1 ].payload.syncId ).toBe(
			sent[ 0 ].payload.block.syncId
		);
	} );

	it( 'REGRESSION: a stale editor tree does not delete an unseen remote block', async () => {
		// Two clients seed an empty post concurrently. The remote client's
		// paragraph lands in the shared document while the local editor tree
		// (mid-typing) does not contain it yet. Capture must NOT interpret
		// that absence as a user deletion — it must retain the block and
		// push the merged view to the editor.
		const { manager, handlers, transport } = await loadManagedEntity();
		transport.captured.session!.receiveUpdate( snapshotRow( [] ) );

		// The local user types a paragraph of their own (id-less tree).
		manager.update(
			'postType/post',
			'1',
			{
				blocks: [
					{
						name: 'core/paragraph',
						attributes: { content: 'mine' },
						innerBlocks: [],
					},
				],
			},
			'gutenberg'
		);
		const ownInsert = JSON.parse( transport.captured.sent[ 0 ].data );
		expect( ownInsert.type ).toBe( 'insert_block' );

		// A remote client's paragraph arrives.
		transport.captured.session!.receiveUpdate( {
			data: JSON.stringify( {
				intentId: 'remote-1',
				actorId: 'u9c9',
				baseSeq: 0,
				txnId: null,
				type: 'insert_block',
				payload: {
					block: {
						syncId: 'remote-block',
						blockType: 'core/paragraph',
						text: 'theirs',
					},
					parentId: null,
					afterSiblingId: null,
				},
			} ),
			type: INTENT_LOG_UPDATE_TYPES.INTENT,
		} );

		// The local editor, still on its stale tree, types more BEFORE
		// rendering the push (the tree lacks the remote block).
		transport.captured.sent.length = 0;
		manager.update(
			'postType/post',
			'1',
			{
				blocks: [
					{
						name: 'core/paragraph',
						attributes: {
							content: 'mine!',
							metadata: {
								syncId: ownInsert.payload.block.syncId,
							},
						},
						innerBlocks: [],
					},
				],
			},
			'gutenberg'
		);

		const sentTypes = transport.captured.sent.map(
			( update ) => JSON.parse( update.data ).type
		);
		expect( sentTypes ).not.toContain( 'remove_block' );
		// The merged view (both blocks) reached the editor.
		const lastPush = handlers.edits.at( -1 ) as {
			blocks: Array< { attributes: { metadata?: { syncId?: string } } } >;
		};
		const pushedIds = lastPush.blocks.map(
			( block ) => block.attributes.metadata?.syncId
		);
		expect( pushedIds ).toContain( 'remote-block' );
		expect( pushedIds ).toContain( ownInsert.payload.block.syncId );
	} );

	it( 'REGRESSION: a remotely removed block is not resurrected by a stale editor tree', async () => {
		const { manager, transport } = await loadManagedEntity();
		transport.captured.session!.receiveUpdate(
			snapshotRow( [
				{ syncId: 'a1', blockType: 'core/paragraph', text: 'Alpha' },
				{ syncId: 'b1', blockType: 'core/paragraph', text: 'Beta' },
			] )
		);

		// A remote client removes Beta.
		transport.captured.session!.receiveUpdate( {
			data: JSON.stringify( {
				intentId: 'remote-rm',
				actorId: 'u9c9',
				baseSeq: 0,
				txnId: null,
				type: 'remove_block',
				payload: { syncId: 'b1' },
			} ),
			type: INTENT_LOG_UPDATE_TYPES.INTENT,
		} );

		// The local editor, on a stale tree that still shows Beta, edits
		// Alpha. Beta must not be re-inserted.
		transport.captured.sent.length = 0;
		manager.update(
			'postType/post',
			'1',
			{
				blocks: [
					{
						name: 'core/paragraph',
						attributes: {
							content: 'Alpha!',
							metadata: { syncId: 'a1' },
						},
						innerBlocks: [],
					},
					{
						name: 'core/paragraph',
						attributes: {
							content: 'Beta',
							metadata: { syncId: 'b1' },
						},
						innerBlocks: [],
					},
				],
			},
			'gutenberg'
		);

		const sent = transport.captured.sent.map( ( update ) =>
			JSON.parse( update.data )
		);
		expect( sent.map( ( intent ) => intent.type ) ).toEqual( [
			'insert_text',
		] );
		expect( sent[ 0 ].payload.syncId ).toBe( 'a1' );
	} );

	it( 'a block the editor KNEW and dropped is still removed', async () => {
		const { manager, transport } = await loadManagedEntity();
		transport.captured.session!.receiveUpdate(
			snapshotRow( [
				{ syncId: 'a1', blockType: 'core/paragraph', text: 'Alpha' },
				{ syncId: 'b1', blockType: 'core/paragraph', text: 'Beta' },
			] )
		);

		// The editor renders the snapshot push and echoes the full tree —
		// its testimony that it displays both blocks.
		manager.update(
			'postType/post',
			'1',
			{
				blocks: [
					{
						name: 'core/paragraph',
						attributes: {
							content: 'Alpha',
							metadata: { syncId: 'a1' },
						},
						innerBlocks: [],
					},
					{
						name: 'core/paragraph',
						attributes: {
							content: 'Beta',
							metadata: { syncId: 'b1' },
						},
						innerBlocks: [],
					},
				],
			},
			'gutenberg'
		);

		// The user deletes Beta.
		manager.update(
			'postType/post',
			'1',
			{
				blocks: [
					{
						name: 'core/paragraph',
						attributes: {
							content: 'Alpha',
							metadata: { syncId: 'a1' },
						},
						innerBlocks: [],
					},
				],
			},
			'gutenberg'
		);

		const sent = transport.captured.sent.map( ( update ) =>
			JSON.parse( update.data )
		);
		expect( sent.map( ( intent ) => intent.type ) ).toEqual( [
			'remove_block',
		] );
		expect( sent[ 0 ].payload.syncId ).toBe( 'b1' );
	} );

	it( 'REGRESSION: pushed blocks carry stable clientIds so the block editor accepts them', async () => {
		// The block-editor store keys blocks by clientId. Pushing blocks
		// without one makes the canvas silently drop the tree (dev bundles)
		// or remount every block per push. Ids must also be STABLE across
		// pushes for the same syncId so React reconciles in place.
		const { handlers, transport } = await loadManagedEntity();
		transport.captured.session!.receiveUpdate(
			snapshotRow( [
				{ syncId: 'p1', blockType: 'core/paragraph', text: 'Hello' },
			] )
		);

		const firstPush = handlers.edits.at( -1 ) as {
			blocks: Array< { clientId?: string; isValid?: boolean } >;
		};
		expect( firstPush.blocks[ 0 ].clientId ).toBeTruthy();
		expect( firstPush.blocks[ 0 ].isValid ).toBe( true );

		// A remote edit triggers another push: same syncId → same clientId.
		transport.captured.session!.receiveUpdate( {
			data: JSON.stringify( {
				intentId: 'remote-1',
				actorId: 'u9c9',
				baseSeq: 0,
				txnId: null,
				type: 'insert_text',
				payload: {
					syncId: 'p1',
					field: 'content',
					offset: 0,
					text: 'x',
				},
			} ),
			type: INTENT_LOG_UPDATE_TYPES.INTENT,
		} );
		const secondPush = handlers.edits.at( -1 ) as {
			blocks: Array< { clientId?: string } >;
		};
		expect( secondPush.blocks[ 0 ].clientId ).toBe(
			firstPush.blocks[ 0 ].clientId
		);
	} );

	it( 'title: genesis matching the loaded record is NOT re-pushed as an edit', async () => {
		const { handlers, transport } = await loadManagedEntity( {
			title: { raw: 'Same title' },
		} );
		transport.captured.session!.receiveUpdate(
			snapshotRow( [], { title: 'Same title' } )
		);
		expect(
			handlers.edits.filter(
				( edit ) => 'title' in ( edit as Record< string, unknown > )
			)
		).toHaveLength( 0 );
	} );

	it( 'title: a room value newer than the loaded record pushes on snapshot', async () => {
		const { handlers, transport } = await loadManagedEntity( {
			title: { raw: 'Stale title' },
		} );
		transport.captured.session!.receiveUpdate(
			snapshotRow( [], { title: 'Fresh title' } )
		);
		expect( handlers.edits.at( -1 ) ).toEqual( { title: 'Fresh title' } );
	} );

	it( 'title: a remote set_property pushes into the editor; a local edit authors one and suppresses the echo', async () => {
		const { manager, handlers, transport } = await loadManagedEntity( {
			title: { raw: 'Original' },
		} );
		transport.captured.session!.receiveUpdate(
			snapshotRow( [], { title: 'Original' } )
		);

		// Local edit: authors a set_property on the wire…
		manager.update( 'postType/post', '1', { title: 'Locally typed' }, 'e' );
		const sent = transport.captured.sent.map(
			( update ) => JSON.parse( update.data ).type
		);
		expect( sent ).toContain( 'set_property' );
		// …and the session change events it produced do not bounce the
		// value back into the editor.
		expect(
			handlers.edits.filter(
				( edit ) => 'title' in ( edit as Record< string, unknown > )
			)
		).toHaveLength( 0 );

		// Remote title change (sequential: observed our version) pushes.
		transport.captured.session!.receiveUpdate( {
			data: JSON.stringify( {
				intentId: 'remote-title-1',
				actorId: 'u9c9',
				baseSeq: 1,
				txnId: null,
				type: 'set_property',
				payload: {
					name: 'title',
					value: 'Remote title',
					observedVersion: 1,
				},
			} ),
			type: INTENT_LOG_UPDATE_TYPES.INTENT,
		} );
		expect( handlers.edits.at( -1 ) ).toEqual( { title: 'Remote title' } );

		// The push's echo (editor reports the same value back) is inert.
		const editsBefore = handlers.edits.length;
		manager.update( 'postType/post', '1', { title: 'Remote title' }, 'e' );
		const sentAfter = transport.captured.sent.map(
			( update ) => JSON.parse( update.data ).type
		);
		expect(
			sentAfter.filter( ( t ) => 'set_property' === t )
		).toHaveLength( 1 );
		expect( handlers.edits ).toHaveLength( editsBefore );
	} );

	it( 'surfaces proposals through onEscalation with local/remote attribution', async () => {
		const { handlers, transport } = await loadManagedEntity();
		const onEscalation = jest.fn();
		// The manager reads the handler at proposal time, so assigning to
		// the same handlers object after load is sufficient.
		handlers.onEscalation = onEscalation;

		transport.captured.session!.receiveUpdate( snapshotRow( [] ) );

		const proposalRow = ( actorId: string, reason: string ) => ( {
			data: JSON.stringify( {
				intent: {
					intentId: `i-${ reason }`,
					txnId: null,
					type: 'insert_text',
					payload: { text: 'lost words' },
				},
				actorId,
				reason,
				context: { excerpt: 'Around here' },
			} ),
			type: INTENT_LOG_UPDATE_TYPES.PROPOSAL,
		} );

		transport.captured.session!.receiveUpdate(
			proposalRow( 'u999c999', 'frame-conflict' )
		);
		// Notices derive from the settled open list, one microtask later.
		await Promise.resolve();
		expect( onEscalation ).toHaveBeenCalledWith( {
			reason: 'frame-conflict',
			isLocal: false,
			proposalId: 'i-frame-conflict',
			summary: 'lost words',
			excerpt: 'Around here',
		} );

		const ownActorId = ( transport.captured.session as IntentLogSession )
			.actorId;
		transport.captured.session!.receiveUpdate(
			proposalRow( ownActorId, 'merge-dropped-field' )
		);
		await Promise.resolve();
		expect( onEscalation ).toHaveBeenLastCalledWith(
			expect.objectContaining( {
				reason: 'merge-dropped-field',
				isLocal: true,
				proposalId: 'i-merge-dropped-field',
			} )
		);
	} );

	it( 'review items carry the target block identity when the intent addresses one', async () => {
		const { handlers, transport } = await loadManagedEntity();
		const onProposalsChange = jest.fn();
		handlers.onProposalsChange = onProposalsChange;
		handlers.onEscalation = jest.fn();

		transport.captured.session!.receiveUpdate( snapshotRow( [] ) );
		transport.captured.session!.receiveUpdate( {
			data: JSON.stringify( {
				intent: {
					intentId: 'p-anchored',
					txnId: null,
					type: 'insert_text',
					payload: { syncId: 'block-a', text: 'lost' },
				},
				actorId: 'u9c9',
				reason: 'frame-conflict',
			} ),
			type: INTENT_LOG_UPDATE_TYPES.PROPOSAL,
		} );
		await Promise.resolve();
		expect( onProposalsChange ).toHaveBeenLastCalledWith( [
			expect.objectContaining( {
				id: 'p-anchored',
				targetId: 'block-a',
			} ),
		] );

		// Document-level intents (entity properties) have no block target.
		transport.captured.session!.receiveUpdate( {
			data: JSON.stringify( {
				intent: {
					intentId: 'p-property',
					txnId: null,
					type: 'set_property',
					payload: { name: 'title', value: 'Lost title' },
				},
				actorId: 'u9c9',
				reason: 'property-conflict',
			} ),
			type: INTENT_LOG_UPDATE_TYPES.PROPOSAL,
		} );
		await Promise.resolve();
		expect( onProposalsChange ).toHaveBeenLastCalledWith( [
			expect.objectContaining( { id: 'p-anchored' } ),
			expect.objectContaining( {
				id: 'p-property',
				targetId: undefined,
			} ),
		] );
	} );

	it( 'a parked insert_block proposal surfaces its position and decoded content for inline approval', async () => {
		const { handlers, transport } = await loadManagedEntity();
		const onProposalsChange = jest.fn();
		handlers.onProposalsChange = onProposalsChange;
		handlers.onEscalation = jest.fn();

		transport.captured.session!.receiveUpdate(
			snapshotRow( [
				{
					syncId: 'p1',
					blockType: 'core/paragraph',
					text: 'Anchor',
				},
			] )
		);
		transport.captured.session!.receiveUpdate( {
			data: JSON.stringify( {
				intent: {
					intentId: 'ins-1',
					txnId: null,
					type: 'insert_block',
					payload: {
						block: {
							syncId: 'nb',
							blockType: 'core/html',
							fields: {
								content: {
									text: '￼',
									formats: [
										{
											start: 0,
											end: 1,
											format: 'obj|{"html":"<script>x</script>"}',
										},
									],
								},
							},
						},
						parentId: null,
						afterSiblingId: 'p1',
					},
				},
				actorId: 'u9c9',
				reason: 'requires-approval',
			} ),
			type: INTENT_LOG_UPDATE_TYPES.PROPOSAL,
		} );
		await Promise.resolve();

		const [ item ] = onProposalsChange.mock.calls.at( -1 )![ 0 ] as Array< {
			proposedInsertion?: {
				blockType?: string;
				html: string;
				afterSiblingId?: string;
			};
		} >;
		// The card can position itself after 'p1' and preview the DECODED
		// markup (not the object-replacement char).
		expect( item.proposedInsertion ).toEqual( {
			blockType: 'core/html',
			html: '<script>x</script>',
			afterSiblingId: 'p1',
			parentId: undefined,
		} );
	} );

	it( 'a proposal resolved within the same delivery batch never notifies, and resolution round-trips', async () => {
		const { manager, handlers, transport } = await loadManagedEntity();
		const onEscalation = jest.fn();
		const onProposalsChange = jest.fn();
		handlers.onEscalation = onEscalation;
		handlers.onProposalsChange = onProposalsChange;

		transport.captured.session!.receiveUpdate( snapshotRow( [] ) );

		// Bootstrap replay shape: proposal row immediately followed by its
		// resolution row (a long-resolved conflict).
		transport.captured.session!.receiveUpdate( {
			data: JSON.stringify( {
				intent: {
					intentId: 'old-1',
					txnId: null,
					type: 'insert_text',
					payload: { text: 'ancient' },
				},
				actorId: 'u9c9',
				reason: 'frame-conflict',
			} ),
			type: INTENT_LOG_UPDATE_TYPES.PROPOSAL,
		} );
		transport.captured.session!.receiveUpdate( {
			data: JSON.stringify( {
				proposalId: 'old-1',
				resolution: 'dismissed',
			} ),
			type: INTENT_LOG_UPDATE_TYPES.RESOLVED,
		} );
		await Promise.resolve();
		expect( onEscalation ).not.toHaveBeenCalled();
		expect( onProposalsChange ).toHaveBeenLastCalledWith( [] );

		// A live open proposal notifies; resolving it emits the wire row
		// and empties the review list.
		transport.captured.session!.receiveUpdate( {
			data: JSON.stringify( {
				intent: {
					intentId: 'live-1',
					txnId: null,
					type: 'insert_text',
					payload: { text: 'fresh' },
				},
				actorId: 'u9c9',
				reason: 'frame-conflict',
			} ),
			type: INTENT_LOG_UPDATE_TYPES.PROPOSAL,
		} );
		await Promise.resolve();
		expect( onEscalation ).toHaveBeenCalledTimes( 1 );

		manager.resolveProposal!( 'postType/post', '1', 'live-1', 'dismissed' );
		const resolvedRows = transport.captured.sent.filter(
			( update ) => INTENT_LOG_UPDATE_TYPES.RESOLVED === update.type
		);
		expect( resolvedRows ).toHaveLength( 1 );
		expect( JSON.parse( resolvedRows[ 0 ].data ) ).toEqual( {
			proposalId: 'live-1',
			resolution: 'dismissed',
		} );
		await Promise.resolve();
		expect( onProposalsChange ).toHaveBeenLastCalledWith( [] );
	} );

	it( 'restoreProposal re-authors lost text at the current head, then resolves', async () => {
		const { manager, handlers, transport } = await loadManagedEntity();
		handlers.onEscalation = jest.fn();
		transport.captured.session!.receiveUpdate(
			snapshotRow( [
				{
					syncId: 'p1',
					blockType: 'core/paragraph',
					text: 'Existing text',
				},
			] )
		);
		transport.captured.session!.receiveUpdate( {
			data: JSON.stringify( {
				intent: {
					intentId: 'lost-1',
					txnId: null,
					type: 'insert_text',
					payload: {
						syncId: 'p1',
						field: 'content',
						offset: 4,
						text: ' recovered',
					},
				},
				actorId: 'u9c9',
				reason: 'frame-conflict',
			} ),
			type: INTENT_LOG_UPDATE_TYPES.PROPOSAL,
		} );
		await Promise.resolve();

		manager.restoreProposal!( 'postType/post', '1', 'lost-1' );

		// The recovered text was authored as an ORDINARY intent at the end
		// of the target field, and the proposal closed as restored.
		const sentTypes = transport.captured.sent.map( ( update ) => ( {
			type: update.type,
			decoded: JSON.parse( update.data ),
		} ) );
		const authored = sentTypes.find(
			( row ) =>
				INTENT_LOG_UPDATE_TYPES.INTENT === row.type &&
				'insert_text' === row.decoded.type
		);
		expect( authored!.decoded.payload ).toMatchObject( {
			syncId: 'p1',
			field: 'content',
			offset: 'Existing text'.length,
			text: ' recovered',
		} );
		const resolved = sentTypes.find(
			( row ) => INTENT_LOG_UPDATE_TYPES.RESOLVED === row.type
		);
		expect( resolved!.decoded ).toEqual( {
			proposalId: 'lost-1',
			resolution: 'restored',
		} );
		// The restored content reached the editor push path.
		const lastBlocks = handlers.edits.at( -1 ) as {
			blocks: Array< { attributes: { content: string } } >;
		};
		expect( lastBlocks.blocks[ 0 ].attributes.content ).toBe(
			'Existing text recovered'
		);
	} );

	it( 'restoreProposal re-inserts a parked block under fresh identity, then resolves', async () => {
		const { manager, handlers, transport } = await loadManagedEntity();
		handlers.onEscalation = jest.fn();
		transport.captured.session!.receiveUpdate(
			snapshotRow( [
				{
					syncId: 'p1',
					blockType: 'core/paragraph',
					text: 'Existing text',
				},
			] )
		);
		// A requires-approval park of a raw-attr block (core/html shape).
		transport.captured.session!.receiveUpdate( {
			data: JSON.stringify( {
				intent: {
					intentId: 'parked-html',
					txnId: null,
					type: 'insert_block',
					payload: {
						block: {
							syncId: 'nb-original',
							blockType: 'core/html',
							attrs: { content: '<script>x</script>' },
						},
						parentId: null,
						afterSiblingId: 'gone-sibling',
					},
				},
				actorId: 'u9c9',
				reason: 'requires-approval',
			} ),
			type: INTENT_LOG_UPDATE_TYPES.PROPOSAL,
		} );
		await Promise.resolve();

		manager.restoreProposal!( 'postType/post', '1', 'parked-html' );

		const sentTypes = transport.captured.sent.map( ( update ) => ( {
			type: update.type,
			decoded: JSON.parse( update.data ),
		} ) );
		const authored = sentTypes.find(
			( row ) =>
				INTENT_LOG_UPDATE_TYPES.INTENT === row.type &&
				'insert_block' === row.decoded.type
		);
		// Re-authored under a FRESH identity (the original never applied),
		// same spec content, degraded anchor (vanished sibling → end).
		expect( authored ).toBeDefined();
		expect( authored!.decoded.payload.block.blockType ).toBe( 'core/html' );
		expect( authored!.decoded.payload.block.attrs ).toEqual( {
			content: '<script>x</script>',
		} );
		expect( authored!.decoded.payload.block.syncId ).not.toBe(
			'nb-original'
		);
		expect( authored!.decoded.payload.afterSiblingId ).toBe( 'p1' );
		const resolved = sentTypes.find(
			( row ) => INTENT_LOG_UPDATE_TYPES.RESOLVED === row.type
		);
		expect( resolved!.decoded ).toEqual( {
			proposalId: 'parked-html',
			resolution: 'restored',
		} );
	} );

	it( 'attr-lane blocks (core/html) never author a wire-inexpressible undefined set_attr', async () => {
		const transport = makeFakeTransport();
		window._wpCollaborationEnabled = '1';
		addFilter( FILTER, HOOK, () => [ transport.creator ] );
		const manager = createIntentLogManager();
		const handlers = makeHandlers();
		// Live resolver shape: core/html has no html/rich-text-source
		// attributes, so its content rides the ATTR lane.
		await manager.load(
			{
				richTextFields: ( name: string ) =>
					'core/html' === name ? [] : [ 'content' ],
			} as never,
			'postType/post',
			'1',
			{},
			handlers
		);
		transport.captured.session!.receiveUpdate(
			snapshotRow( [
				{
					syncId: 'p1',
					blockType: 'core/paragraph',
					text: 'Shared',
				},
			] )
		);
		const pushed = ( handlers.edits.at( -1 ) as { blocks: unknown[] } )
			.blocks;

		// The user adds a Custom HTML block carrying a script tag.
		manager.update(
			'postType/post',
			'1',
			{
				blocks: [
					...pushed,
					{
						name: 'core/html',
						attributes: { content: '<script>alert(1)</script>' },
						innerBlocks: [],
					},
				],
			},
			'gutenberg'
		);

		/*
		 * REGRESSION: a later capture pass presents the block with content
		 * normalized to an explicit undefined (role:"local" attribute
		 * artifact) and no id write-back yet. This used to derive
		 * `set_attr { value: undefined }` — JSON.stringify drops the key,
		 * the server 400s the batch, and the room's outbox wedges forever.
		 */
		manager.update(
			'postType/post',
			'1',
			{
				blocks: [
					...pushed,
					{
						name: 'core/html',
						attributes: { content: undefined },
						innerBlocks: [],
					},
				],
			},
			'gutenberg'
		);

		const decoded = transport.captured.sent
			.filter(
				( update ) => INTENT_LOG_UPDATE_TYPES.INTENT === update.type
			)
			.map( ( update ) => JSON.parse( update.data ) );
		const insert = decoded.find(
			( intent ) => 'insert_block' === intent.type
		);
		expect( insert.payload.block.blockType ).toBe( 'core/html' );
		expect( insert.payload.block.attrs.content ).toBe(
			'<script>alert(1)</script>'
		);
		// Every attr write must be expressible on the wire, and the
		// undefined artifact must not read as a removal either.
		const setAttrsMissingValue = decoded.filter(
			( intent ) =>
				'set_attr' === intent.type && ! ( 'value' in intent.payload )
		);
		expect( setAttrsMissingValue ).toEqual( [] );
		expect(
			decoded.filter( ( intent ) => 'remove_attr' === intent.type )
		).toEqual( [] );
	} );

	it( 'raw-content blocks (core/html) sync through the content field in both directions', async () => {
		const transport = makeFakeTransport();
		window._wpCollaborationEnabled = '1';
		addFilter( FILTER, HOOK, () => [ transport.creator ] );
		const manager = createIntentLogManager();
		const handlers = makeHandlers();
		await manager.load(
			{
				richTextFields: ( name: string ) =>
					'core/html' === name ? [] : [ 'content' ],
				isRawContentBlock: ( name: string ) => 'core/html' === name,
				serializeRawContent: ( block: {
					innerContent?: Array< string | null >;
				} ) =>
					( block.innerContent ?? [] )
						.filter( ( f ): f is string => 'string' === typeof f )
						.join( '' ),
			} as never,
			'postType/post',
			'1',
			{},
			handlers
		);

		// INBOUND: a server-genesis-form core/html block (innerHTML in the
		// content field, the codec's obj-span form) reaches the editor as
		// innerContent.
		transport.captured.session!.receiveUpdate(
			snapshotRow( [
				{
					syncId: 'p1',
					blockType: 'core/paragraph',
					text: 'Shared',
				},
				{
					syncId: 'h1',
					blockType: 'core/html',
					fields: {
						content: {
							text: '￼',
							formats: [
								{
									start: 0,
									end: 1,
									format: 'obj|{"html":"<marquee>hi</marquee>"}',
								},
							],
						},
					},
				},
			] )
		);
		const pushed = ( handlers.edits.at( -1 ) as { blocks: unknown[] } )
			.blocks as Array< {
			name: string;
			attributes: Record< string, unknown >;
			innerContent?: Array< string | null >;
		} >;
		expect( pushed[ 1 ].name ).toBe( 'core/html' );
		expect( pushed[ 1 ].innerContent ).toEqual( [
			'<marquee>hi</marquee>',
		] );

		// OUTBOUND: the user adds a new Custom HTML block; its innerContent
		// derives an insert_block whose spec carries the content FIELD
		// (obj-span form — the kses lane judges these spans).
		manager.update(
			'postType/post',
			'1',
			{
				blocks: [
					...pushed,
					{
						name: 'core/html',
						attributes: {},
						innerBlocks: [],
						innerContent: [ '<div class="note">new</div>' ],
					},
				],
			},
			'gutenberg'
		);
		const decoded = transport.captured.sent
			.filter(
				( update ) => INTENT_LOG_UPDATE_TYPES.INTENT === update.type
			)
			.map( ( update ) => JSON.parse( update.data ) );
		const insert = decoded.find(
			( intent ) => 'insert_block' === intent.type
		);
		expect( insert ).toBeDefined();
		expect( insert.payload.block.blockType ).toBe( 'core/html' );
		expect( insert.payload.block.fields.content.formats[ 0 ].format ).toBe(
			'obj|{"html":"<div class=\\"note\\">new</div>"}'
		);
	} );

	it( 'classic (core/freeform) blocks hydrate to a raw content attribute', async () => {
		const transport = makeFakeTransport();
		window._wpCollaborationEnabled = '1';
		addFilter( FILTER, HOOK, () => [ transport.creator ] );
		const manager = createIntentLogManager();
		const handlers = makeHandlers();
		await manager.load(
			{
				richTextFields: ( name: string ) =>
					name.startsWith( 'core/f' ) || 'core/html' === name
						? []
						: [ 'content' ],
				isRawContentBlock: ( name: string ) =>
					'core/html' === name || 'core/freeform' === name,
				serializeRawContent: ( block: {
					attributes: Record< string, unknown >;
					innerContent?: Array< string | null >;
				} ) =>
					( block.innerContent ?? [] )
						.filter( ( f ): f is string => 'string' === typeof f )
						.join( '' ) ||
					( ( block.attributes.content as string ) ?? '' ),
				hydrateRawContent: ( name: string, html: string ) =>
					'core/freeform' === name
						? { attributes: { content: html } }
						: { innerContent: [ html ] },
			} as never,
			'postType/post',
			'1',
			{},
			handlers
		);

		transport.captured.session!.receiveUpdate(
			snapshotRow( [
				{
					syncId: 'f1',
					blockType: 'core/freeform',
					fields: {
						content: {
							text: '￼',
							formats: [
								{
									start: 0,
									end: 1,
									format: 'obj|{"html":"<div>classic run</div>"}',
								},
							],
						},
					},
				},
			] )
		);
		const pushed = ( handlers.edits.at( -1 ) as { blocks: unknown[] } )
			.blocks as Array< {
			name: string;
			attributes: Record< string, unknown >;
			innerContent?: Array< string | null >;
		} >;
		// Classic content re-enters through the raw content ATTRIBUTE (its
		// parser source), not innerContent.
		expect( pushed[ 0 ].name ).toBe( 'core/freeform' );
		expect( pushed[ 0 ].attributes.content ).toBe(
			'<div>classic run</div>'
		);
		expect( pushed[ 0 ].innerContent ).toBeUndefined();

		// The echo (editor handing the same tree back) derives nothing.
		manager.update(
			'postType/post',
			'1',
			{
				blocks: pushed.map( ( block ) => ( {
					...block,
					innerBlocks: [],
				} ) ),
			},
			'gutenberg'
		);
		expect( transport.captured.sent ).toHaveLength( 0 );
	} );

	it( 'unload destroys providers and the session', async () => {
		const { manager, transport } = await loadManagedEntity();
		manager.unload( 'postType/post', '1' );
		expect( transport.captured.destroyed ).toBe( true );
	} );
} );

describe( 'intent-log manager awareness', () => {
	afterEach( () => {
		removeFilter( FILTER, HOOK );
		resetEngineAdaptersForTesting();
		resetProviderCreatorsForTesting();
		delete window._wpCollaborationEnabled;
		delete window._wpCollaborationSync;
	} );

	it( 'constructs the syncConfig awareness over a stub doc and bridges it to the wire', async () => {
		const transport = makeFakeTransport();
		window._wpCollaborationEnabled = '1';
		addFilter( FILTER, HOOK, () => [ transport.creator ] );

		const created: Awareness[] = [];
		const syncConfig = {
			createAwareness: ( doc: never ) => {
				const awareness = new Awareness( doc );
				created.push( awareness );
				return awareness;
			},
		} as never;

		const manager = createIntentLogManager();
		await manager.load(
			syncConfig,
			'postType/post',
			'1',
			{},
			makeHandlers()
		);

		// The typed awareness is constructed and exposed.
		expect( created ).toHaveLength( 1 );
		const awareness = manager.getAwareness( 'postType/post', '1' );
		expect( awareness ).toBe( created[ 0 ] );

		// Local presence flows to the wire payload…
		awareness!.setLocalStateField( 'collaboratorInfo', { id: 7 } );
		expect( transport.captured.session!.getLocalAwareness() ).toEqual( {
			collaboratorInfo: { id: 7 },
		} );

		// …and server states flow into the instance with a change event.
		const changes: unknown[] = [];
		awareness!.on( 'change', ( change: unknown ) =>
			changes.push( change )
		);
		transport.captured.session!.applyRemoteAwareness( {
			999: { collaboratorInfo: { id: 42 } },
		} );
		expect( awareness!.getStates().get( 999 ) ).toEqual( {
			collaboratorInfo: { id: 42 },
		} );
		expect( changes.length ).toBeGreaterThan( 0 );

		// Teardown clears the outdated-pruning interval.
		manager.unload( 'postType/post', '1' );
	} );
} );
