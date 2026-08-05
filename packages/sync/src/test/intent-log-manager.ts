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
import { createIntentLogManager } from '../engines/intent-log-manager';
import { INTENT_LOG_UPDATE_TYPES } from '../engines/intent-log-session';
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

const snapshotRow = ( blocks: Array< Record< string, unknown > > ) => ( {
	data: JSON.stringify( { doc: createDocument( blocks ) } ),
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

	async function loadManagedEntity() {
		const transport = makeFakeTransport();
		window._wpCollaborationEnabled = '1';
		addFilter( FILTER, HOOK, () => [ transport.creator ] );

		const manager = createIntentLogManager();
		const handlers = makeHandlers();
		await manager.load( {} as never, 'postType/post', '1', {}, handlers );
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

	it( 'unload destroys providers and the session', async () => {
		const { manager, transport } = await loadManagedEntity();
		manager.unload( 'postType/post', '1' );
		expect( transport.captured.destroyed ).toBe( true );
	} );
} );
