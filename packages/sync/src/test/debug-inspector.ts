/**
 * External dependencies
 */
import { beforeEach, describe, expect, it } from '@jest/globals';

/**
 * Internal dependencies
 */
import {
	installSyncDebug,
	isSyncDebugEnabled,
	recordPoll,
	registerDebugSession,
	syncDebugApi,
} from '../debug/inspector';

const intentRow = (
	type: string,
	payload: Record< string, unknown >,
	envelope: Record< string, unknown > = {}
) => ( {
	type: 'intent',
	data: JSON.stringify( {
		intentId: 'a#1',
		actorId: 'u1c2',
		baseSeq: 7,
		txnId: null,
		type,
		payload,
		...envelope,
	} ),
} );

describe( 'sync inspector', () => {
	beforeEach( () => {
		syncDebugApi.clear();
		window.localStorage.removeItem( 'wp_sync_debug' );
	} );

	it( 'enable/disable persist in localStorage', () => {
		expect( isSyncDebugEnabled() ).toBe( false );
		syncDebugApi.enable();
		expect( isSyncDebugEnabled() ).toBe( true );
		syncDebugApi.disable();
		expect( isSyncDebugEnabled() ).toBe( false );
		syncDebugApi.untail();
	} );

	it( 'decodes wire rows into one-line summaries', () => {
		syncDebugApi.untail();
		recordPoll( {
			room: 'postType/post:1',
			sent: [
				intentRow( 'insert_text', {
					syncId: 'p1',
					field: 'content',
					offset: 5,
					text: ' world',
				} ),
			],
			received: [
				{
					type: 'proposal',
					data: JSON.stringify( {
						intent: { intentId: 'b#9', type: 'set_attr' },
						actorId: 'u2c3',
						reason: 'attr-conflict',
					} ),
				},
				{
					type: 'resolved',
					data: JSON.stringify( {
						proposalId: 'b#9',
						resolution: 'dismissed',
						resolvedBy: 'u1c2',
					} ),
				},
				{ type: 'update', data: 'AAAA====binary' },
			],
			dispositions: [ { intentId: 'a#1', status: 'applied' } ],
			cursorBefore: 10,
			cursorAfter: 13,
			durationMs: 42,
			serverDebug: { head_seq: 9 },
		} );

		const [ record ] = syncDebugApi.log();
		const summaries = record.rows.map( ( row ) => row.summary );
		expect( summaries[ 0 ] ).toBe(
			'insert_text p1.content @5 +" world" (u1c2#a#1 @7)'
		);
		expect( summaries[ 1 ] ).toBe(
			'proposal set_attr b#9 (attr-conflict, by u2c3)'
		);
		expect( summaries[ 2 ] ).toBe( 'resolved b#9 dismissed by u1c2' );
		// Opaque payloads fall back to type + size.
		expect( summaries[ 3 ] ).toBe( 'update (14b)' );
		expect( record.dispositions ).toHaveLength( 1 );
		expect( record.serverDebug ).toEqual( { head_seq: 9 } );
	} );

	it( 'suppresses empty polls and caps the ring buffer', () => {
		syncDebugApi.untail();
		recordPoll( { room: 'r', sent: [], received: [] } );
		expect( syncDebugApi.log() ).toHaveLength( 0 );

		for ( let i = 0; i < 520; i++ ) {
			recordPoll( {
				room: 'r',
				sent: [ intentRow( 'remove_block', { syncId: `b${ i }` } ) ],
				received: [],
			} );
		}
		expect( syncDebugApi.log().length ).toBeLessThanOrEqual( 500 );
	} );

	it( 'filters by type/actor and by syncId history', () => {
		syncDebugApi.untail();
		recordPoll( {
			room: 'r',
			sent: [
				intentRow( 'insert_text', {
					syncId: 'p1',
					field: 'content',
					offset: 0,
					text: 'x',
				} ),
			],
			received: [],
		} );
		recordPoll( {
			room: 'r',
			sent: [ intentRow( 'remove_block', { syncId: 'p2' } ) ],
			received: [],
		} );

		expect( syncDebugApi.log( { type: 'insert_text' } ) ).toHaveLength( 1 );
		expect( syncDebugApi.log( { actor: 'nobody' } ) ).toHaveLength( 0 );
		const p1History = syncDebugApi.intents( 'p1' );
		expect( p1History ).toHaveLength( 1 );
		expect( p1History[ 0 ].rows[ 0 ].summary ).toContain( 'p1.content' );
		expect( syncDebugApi.intents( 'p9' ) ).toHaveLength( 0 );
	} );

	it( 'exposes duck-typed session state and exports the buffer', () => {
		registerDebugSession( 'postType/post:9', {
			getDocument: () => ( { root: [] } ),
			getOpenProposals: () => [ { id: 'x' } ],
			getSeq: () => 12,
		} );
		expect( syncDebugApi.doc( 'postType/post:9' ) ).toEqual( { root: [] } );
		expect( syncDebugApi.proposals( 'postType/post:9' ) ).toHaveLength( 1 );
		expect( syncDebugApi.cursor( 'postType/post:9' ) ).toBe( 12 );

		syncDebugApi.untail();
		recordPoll( {
			room: 'r',
			sent: [ intentRow( 'remove_block', { syncId: 'p1' } ) ],
			received: [],
		} );
		const exported = JSON.parse( syncDebugApi.export() );
		expect( exported.polls ).toHaveLength( 1 );
	} );

	it( 'installs the window stub idempotently', () => {
		installSyncDebug();
		const host = window as unknown as { wpSync?: unknown };
		expect( host.wpSync ).toBe( syncDebugApi );
		installSyncDebug();
		expect( host.wpSync ).toBe( syncDebugApi );
	} );
} );
