import * as Y from 'yjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	createDeferredUpdateQueue,
	rebaseDeferredUpdates,
} from '../deferred-updates';

describe( 'createDeferredUpdateQueue', () => {
	beforeEach( () => {
		vi.useFakeTimers();
	} );

	afterEach( () => {
		vi.useRealTimers();
	} );

	it( 'applies the items on the next tick, in the order they were added', () => {
		const applied: string[] = [];
		const queue = createDeferredUpdateQueue< string >( ( item ) =>
			applied.push( item )
		);

		queue.defer( 'a', 'a1' );
		queue.defer( 'b', 'b1' );
		queue.defer( 'a', 'a2' );
		expect( applied ).toEqual( [] );

		vi.runAllTimers();
		expect( applied ).toEqual( [ 'a1', 'b1', 'a2' ] );
	} );

	it( 'applies the items one time when flushed before the tick', () => {
		const applied: string[] = [];
		const queue = createDeferredUpdateQueue< string >( ( item ) =>
			applied.push( item )
		);

		queue.defer( 'a', 'a1' );
		queue.flush();
		expect( applied ).toEqual( [ 'a1' ] );

		vi.runAllTimers();
		expect( applied ).toEqual( [ 'a1' ] );
	} );

	it( 'keeps the order when applying an item asks for a flush', () => {
		const applied: string[] = [];
		const queue = createDeferredUpdateQueue< string >( ( item ) => {
			queue.flush();
			applied.push( item );
		} );

		queue.defer( 'a', 'a1' );
		queue.defer( 'a', 'a2' );
		queue.flush();

		expect( applied ).toEqual( [ 'a1', 'a2' ] );
	} );

	it( 'takes the items of one key and leaves the others', () => {
		const applied: string[] = [];
		const queue = createDeferredUpdateQueue< string >( ( item ) =>
			applied.push( item )
		);

		queue.defer( 'a', 'a1' );
		queue.defer( 'b', 'b1' );
		queue.defer( 'a', 'a2' );

		expect( queue.take( 'a' ) ).toEqual( [ 'a1', 'a2' ] );
		expect( queue.take( 'a' ) ).toEqual( [] );

		vi.runAllTimers();
		expect( applied ).toEqual( [ 'b1' ] );
	} );
} );

describe( 'rebaseDeferredUpdates', () => {
	// Replaces the text with the smallest change, as a sync config does.
	function applyChanges( ydoc: Y.Doc, changes: Record< string, unknown > ) {
		const text = ydoc.getText( 'content' );
		const from = text.toString();
		const to = String( changes.content );
		let start = 0;
		while (
			start < from.length &&
			start < to.length &&
			from[ start ] === to[ start ]
		) {
			start++;
		}
		text.delete( start, from.length - start );
		text.insert( start, to.slice( start ) );
	}

	function createDocWithPeer() {
		const ydoc = new Y.Doc();
		ydoc.getText( 'content' ).insert( 0, 'Hello' );

		const peer = new Y.Doc();
		Y.applyUpdateV2( peer, Y.encodeStateAsUpdateV2( ydoc ) );
		const stateVector = Y.encodeStateVector( peer );
		peer.getText( 'content' ).insert( 0, 'Peer ' );

		return {
			ydoc,
			remoteUpdate: Y.encodeStateAsUpdateV2( peer, stateVector ),
		};
	}

	it( 'does not change the document', () => {
		const { ydoc } = createDocWithPeer();
		const before = Y.encodeStateVector( ydoc );

		rebaseDeferredUpdates( ydoc, applyChanges, [
			{ changes: { content: 'Hello!' }, origin: 'local', options: {} },
		] );

		expect( ydoc.getText( 'content' ).toString() ).toBe( 'Hello' );
		expect( Y.encodeStateVector( ydoc ) ).toEqual( before );
	} );

	it( 'returns operations that merge with a remote change applied first', () => {
		const { ydoc, remoteUpdate } = createDocWithPeer();

		const rebased = rebaseDeferredUpdates( ydoc, applyChanges, [
			{ changes: { content: 'Hello!' }, origin: 'local', options: {} },
			{
				changes: { content: 'Hello!?' },
				origin: 'local',
				options: { isNewUndoLevel: true },
			},
		] );

		Y.applyUpdateV2( ydoc, remoteUpdate );
		expect( ydoc.getText( 'content' ).toString() ).toBe( 'Peer Hello' );

		Y.applyUpdateV2( ydoc, rebased[ 0 ].update );
		expect( ydoc.getText( 'content' ).toString() ).toBe( 'Peer Hello!' );

		Y.applyUpdateV2( ydoc, rebased[ 1 ].update );
		expect( ydoc.getText( 'content' ).toString() ).toBe( 'Peer Hello!?' );

		expect(
			rebased.map( ( { origin, options } ) => [ origin, options ] )
		).toEqual( [
			[ 'local', {} ],
			[ 'local', { isNewUndoLevel: true } ],
		] );
	} );
} );
