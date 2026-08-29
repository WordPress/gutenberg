import * as Y from 'yjs';
import * as buffer from 'lib0/buffer';
import { describe, expect, it } from '@jest/globals';
import { docContainsSnapshot, encodeDocSnapshot } from '../crdt-snapshot';
import { createYjsDoc } from '../utils';

describe( 'encodeDocSnapshot / docContainsSnapshot', () => {
	const TEXT_KEY = 'text';

	/**
	 * Builds a two-peer editing scenario and returns the individual
	 * updates, so a third peer can be reconstructed from any subset.
	 *
	 * Peer B's deletion is captured separately because it removes peer A's
	 * text in a transaction that creates no new structs. A peer holding
	 * every insertion but not that update has a dominating state vector
	 * while still missing content, which is exactly the case a bare state
	 * vector cannot detect.
	 */
	function createScenario() {
		const docA = createYjsDoc();
		const docB = createYjsDoc();

		docA.getText( TEXT_KEY ).insert( 0, 'Hello from A. ' );
		const insertA = Y.encodeStateAsUpdateV2( docA );
		Y.applyUpdateV2( docB, insertA );

		docB.getText( TEXT_KEY ).insert(
			docB.getText( TEXT_KEY ).length,
			'And from B.'
		);
		const insertB = Y.encodeStateAsUpdateV2(
			docB,
			Y.encodeStateVector( docA )
		);
		Y.applyUpdateV2( docA, insertB );

		let deleteB: Uint8Array = new Uint8Array();
		docB.once( 'updateV2', ( update: Uint8Array ) => {
			deleteB = update;
		} );
		docB.getText( TEXT_KEY ).delete( 0, 6 );
		Y.applyUpdateV2( docA, deleteB );

		// docA is the autosaving peer, so its state is what the autosave
		// captured.
		return {
			snapshot: encodeDocSnapshot( docA ),
			insertA,
			insertB,
			deleteB,
		};
	}

	function createPeer( updates: Uint8Array[] ) {
		const ydoc = createYjsDoc();
		updates.forEach( ( update ) => Y.applyUpdateV2( ydoc, update ) );

		return ydoc;
	}

	it( 'returns true for a document holding everything the snapshot describes', () => {
		const { snapshot, insertA, insertB, deleteB } = createScenario();
		const peer = createPeer( [ insertA, insertB, deleteB ] );

		expect( docContainsSnapshot( peer, snapshot ) ).toBe( true );
	} );

	it( 'returns false for a document missing insertions', () => {
		const { snapshot, insertA } = createScenario();
		const peer = createPeer( [ insertA ] );

		expect( docContainsSnapshot( peer, snapshot ) ).toBe( false );
	} );

	it( 'returns false for a document missing only a deletion', () => {
		const { snapshot, insertA, insertB } = createScenario();
		const peer = createPeer( [ insertA, insertB ] );

		// The peer holds every insertion, so its state vector dominates.
		// Only the delete set distinguishes it.
		expect( peer.getText( TEXT_KEY ).toString() ).toBe(
			'Hello from A. And from B.'
		);
		expect( docContainsSnapshot( peer, snapshot ) ).toBe( false );
	} );

	it( 'returns false for a document holding only a prefix of a deletion', () => {
		// Two deletions from one peer, adjacent in clock space, so the
		// autosaving peer's delete set merges them into a single range.
		// A document that received only the first holds a strict prefix of
		// that range, rather than missing the client entirely.
		const docA = createYjsDoc();
		docA.getText( TEXT_KEY ).insert( 0, '0123456789' );
		const insert = Y.encodeStateAsUpdateV2( docA );

		let firstDelete: Uint8Array = new Uint8Array();
		docA.once( 'updateV2', ( update: Uint8Array ) => {
			firstDelete = update;
		} );
		docA.getText( TEXT_KEY ).delete( 0, 5 );

		docA.getText( TEXT_KEY ).delete( 0, 5 );

		const peer = createPeer( [ insert, firstDelete ] );

		// The peer still shows content the autosave had already removed.
		expect( peer.getText( TEXT_KEY ).toString() ).toBe( '56789' );
		expect( docA.getText( TEXT_KEY ).toString() ).toBe( '' );
		expect( docContainsSnapshot( peer, encodeDocSnapshot( docA ) ) ).toBe(
			false
		);
	} );

	it( 'round-trips a document against its own snapshot', () => {
		const ydoc = createYjsDoc();
		ydoc.getText( TEXT_KEY ).insert( 0, 'Some content.' );

		expect( docContainsSnapshot( ydoc, encodeDocSnapshot( ydoc ) ) ).toBe(
			true
		);
	} );

	it( 'returns true for a document ahead of the snapshot', () => {
		const ydoc = createYjsDoc();
		ydoc.getText( TEXT_KEY ).insert( 0, 'Some content.' );
		const snapshot = encodeDocSnapshot( ydoc );

		ydoc.getText( TEXT_KEY ).insert( 0, 'Even more. ' );

		expect( docContainsSnapshot( ydoc, snapshot ) ).toBe( true );
	} );

	it( 'returns true for an empty snapshot of an empty document', () => {
		const ydoc = createYjsDoc();

		expect( docContainsSnapshot( ydoc, encodeDocSnapshot( ydoc ) ) ).toBe(
			true
		);
	} );

	it.each( [
		[ 'an empty string', '' ],
		[ 'a non-base64 string', 'not a snapshot!' ],
		[
			'a truncated snapshot',
			encodeDocSnapshot( createYjsDoc() ).slice( 0, 2 ),
		],
		[
			'unrelated base64',
			buffer.toBase64( new Uint8Array( [ 255, 255, 255, 255 ] ) ),
		],
	] )( 'returns false for %s', ( _label, encodedSnapshot ) => {
		const ydoc = createYjsDoc();

		expect( docContainsSnapshot( ydoc, encodedSnapshot ) ).toBe( false );
	} );
} );
