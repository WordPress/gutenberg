/**
 * External dependencies
 */
import { describe, expect, it, jest } from '@jest/globals';
import * as Y from 'yjs';
import { Awareness } from 'y-protocols/awareness';

/**
 * Internal dependencies
 */
import { createYjsSessionCodec } from '../session';
import { SyncUpdateType } from '../../../providers/http-polling/types';
import {
	base64ToUint8Array,
	uint8ArrayToBase64,
} from '../../../providers/http-polling/utils';

describe( 'createYjsSessionCodec', () => {
	it( 'exposes the document clientID as the session clientId', () => {
		const doc = new Y.Doc();
		const session = createYjsSessionCodec( { doc } );

		expect( session.clientId ).toBe( doc.clientID );
	} );

	describe( 'initial sync and update exchange', () => {
		it( 'announces a sync_step1 as its initial update', () => {
			const doc = new Y.Doc();
			const session = createYjsSessionCodec( { doc } );

			const initial = session.getInitialUpdates();

			expect( initial ).toHaveLength( 1 );
			expect( initial[ 0 ].type ).toBe( SyncUpdateType.SYNC_STEP_1 );
			expect( typeof initial[ 0 ].data ).toBe( 'string' );
		} );

		it( 'answers a received sync_step1 with a sync_step2 that syncs the peer', () => {
			const docA = new Y.Doc();
			docA.getMap( 'record' ).set( 'title', 'Hello' );
			const sessionA = createYjsSessionCodec( { doc: docA } );

			const docB = new Y.Doc();
			const sessionB = createYjsSessionCodec( { doc: docB } );

			// B joins: its sync_step1 announcement reaches A, which answers
			// with a sync_step2 carrying the state B is missing.
			const [ step1 ] = sessionB.getInitialUpdates();
			const step2 = sessionA.receiveUpdate( step1 );

			expect( step2 ).toBeDefined();
			expect( step2!.type ).toBe( SyncUpdateType.SYNC_STEP_2 );

			// B applies the sync_step2 (no response needed) and converges.
			expect( sessionB.receiveUpdate( step2! ) ).toBeUndefined();
			expect( docB.getMap( 'record' ).get( 'title' ) ).toBe( 'Hello' );
		} );

		it( 'applies received document updates', () => {
			const docA = new Y.Doc();
			const docB = new Y.Doc();
			createYjsSessionCodec( { doc: docA } );
			const sessionB = createYjsSessionCodec( { doc: docB } );

			docA.getMap( 'record' ).set( 'title', 'From A' );
			const update = {
				data: uint8ArrayToBase64( Y.encodeStateAsUpdateV2( docA ) ),
				type: SyncUpdateType.UPDATE as string,
			};

			expect( sessionB.receiveUpdate( update ) ).toBeUndefined();
			expect( docB.getMap( 'record' ).get( 'title' ) ).toBe( 'From A' );
		} );
	} );

	describe( 'local update subscription', () => {
		it( 'reports local edits as wire-shaped updates with their raw size', () => {
			const doc = new Y.Doc();
			const session = createYjsSessionCodec( { doc } );

			const listener = jest.fn();
			session.onLocalUpdate( listener );

			doc.getMap( 'record' ).set( 'title', 'Local edit' );

			expect( listener ).toHaveBeenCalledTimes( 1 );
			const [ update, sizeInBytes ] = listener.mock.calls[ 0 ] as [
				{ data: string; type: string },
				number,
			];
			expect( update.type ).toBe( SyncUpdateType.UPDATE );
			expect( sizeInBytes ).toBe(
				base64ToUint8Array( update.data ).byteLength
			);

			// The reported update reproduces the edit on another document.
			const other = new Y.Doc();
			Y.applyUpdateV2( other, base64ToUint8Array( update.data ) );
			expect( other.getMap( 'record' ).get( 'title' ) ).toBe(
				'Local edit'
			);
		} );

		it( 'does not report updates the session itself applied', () => {
			const docA = new Y.Doc();
			docA.getMap( 'record' ).set( 'title', 'Remote' );

			const docB = new Y.Doc();
			const sessionB = createYjsSessionCodec( { doc: docB } );
			const listener = jest.fn();
			sessionB.onLocalUpdate( listener );

			sessionB.receiveUpdate( {
				data: uint8ArrayToBase64( Y.encodeStateAsUpdateV2( docA ) ),
				type: SyncUpdateType.UPDATE,
			} );

			expect( docB.getMap( 'record' ).get( 'title' ) ).toBe( 'Remote' );
			expect( listener ).not.toHaveBeenCalled();
		} );

		it( 'stops reporting after destroy and re-attaches on a new subscription', () => {
			const doc = new Y.Doc();
			const session = createYjsSessionCodec( { doc } );

			const listener = jest.fn();
			session.onLocalUpdate( listener );
			session.destroy();

			doc.getMap( 'record' ).set( 'title', 'After destroy' );
			expect( listener ).not.toHaveBeenCalled();

			// Reconnection: a new subscription reports edits again.
			const reconnectListener = jest.fn();
			session.onLocalUpdate( reconnectListener );
			doc.getMap( 'record' ).set( 'title', 'After reconnect' );
			expect( reconnectListener ).toHaveBeenCalledTimes( 1 );
		} );
	} );

	describe( 'awareness', () => {
		it( 'encodes the local awareness state for a request', () => {
			const doc = new Y.Doc();
			const awareness = new Awareness( doc );
			const session = createYjsSessionCodec( { awareness, doc } );

			awareness.setLocalState( { user: 'alice' } );
			expect( session.getLocalAwareness() ).toEqual( { user: 'alice' } );

			// A cleared local state encodes as an empty object, not null.
			awareness.setLocalState( null );
			expect( session.getLocalAwareness() ).toEqual( {} );
		} );

		it( 'creates a standalone awareness when none is provided', () => {
			const doc = new Y.Doc();
			const session = createYjsSessionCodec( { doc } );

			expect( session.getLocalAwareness() ).toEqual( {} );
			expect( () =>
				session.applyRemoteAwareness( { 99: { user: 'bob' } } )
			).not.toThrow();
		} );

		it( 'applies added, updated, and removed remote awareness states', () => {
			const doc = new Y.Doc();
			const awareness = new Awareness( doc );
			const session = createYjsSessionCodec( { awareness, doc } );
			const onChange = jest.fn();
			awareness.on( 'change', onChange );

			// A remote peer appears.
			session.applyRemoteAwareness( { 99: { user: 'bob' } } );
			expect( awareness.getStates().get( 99 ) ).toEqual( {
				user: 'bob',
			} );
			expect( onChange ).toHaveBeenCalledWith( {
				added: [ 99 ],
				updated: [],
				removed: [],
			} );

			// The peer changes state.
			session.applyRemoteAwareness( { 99: { user: 'bob', cursor: 5 } } );
			expect( awareness.getStates().get( 99 ) ).toEqual( {
				user: 'bob',
				cursor: 5,
			} );
			expect( onChange ).toHaveBeenCalledWith( {
				added: [],
				updated: [ 99 ],
				removed: [],
			} );

			// The peer disappears from the server state.
			onChange.mockClear();
			session.applyRemoteAwareness( {} );
			expect( awareness.getStates().has( 99 ) ).toBe( false );
			// Removals go through y-protocols' removeAwarenessStates, which
			// emits with an origin argument.
			expect( onChange ).toHaveBeenCalledWith(
				expect.objectContaining( { removed: [ 99 ] } ),
				expect.anything()
			);
		} );

		it( 'skips its own client state when applying remote awareness', () => {
			const doc = new Y.Doc();
			const awareness = new Awareness( doc );
			const session = createYjsSessionCodec( { awareness, doc } );

			awareness.setLocalState( { user: 'me' } );
			session.applyRemoteAwareness( {
				[ awareness.clientID ]: { user: 'stale-echo' },
			} );

			expect( awareness.getLocalState() ).toEqual( { user: 'me' } );
		} );
	} );

	describe( 'compaction', () => {
		it( 'creates a full-state compaction update', () => {
			const doc = new Y.Doc();
			doc.getMap( 'record' ).set( 'title', 'Everything' );
			doc.getMap( 'record' ).set( 'content', 'All of it' );
			const session = createYjsSessionCodec( { doc } );

			const compaction = session.createCompactionUpdate();
			expect( compaction.type ).toBe( SyncUpdateType.COMPACTION );

			// Applying the compaction to a fresh document reproduces the
			// full state.
			const fresh = new Y.Doc();
			Y.applyUpdateV2( fresh, base64ToUint8Array( compaction.data ) );
			expect( fresh.getMap( 'record' ).toJSON() ).toEqual( {
				title: 'Everything',
				content: 'All of it',
			} );
		} );

		it( 'merges update and compaction payloads, skipping sync steps (deprecated path)', () => {
			const docA = new Y.Doc();
			const sessionA = createYjsSessionCodec( { doc: docA } );

			const source = new Y.Doc();
			source.getMap( 'record' ).set( 'title', 'Merged' );
			const update = {
				data: uint8ArrayToBase64( Y.encodeStateAsUpdateV2( source ) ),
				type: SyncUpdateType.UPDATE as string,
			};
			const [ step1 ] = sessionA.getInitialUpdates();

			const merged = sessionA.createCompactionFromUpdates( [
				step1,
				update,
			] );
			expect( merged.type ).toBe( SyncUpdateType.COMPACTION );

			const fresh = new Y.Doc();
			Y.applyUpdateV2( fresh, base64ToUint8Array( merged.data ) );
			expect( fresh.getMap( 'record' ).get( 'title' ) ).toBe( 'Merged' );
		} );
	} );
} );
