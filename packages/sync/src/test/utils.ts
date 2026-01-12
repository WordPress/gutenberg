/**
 * External dependencies
 */
import * as Y from 'yjs';
import * as buffer from 'lib0/buffer';
import { describe, expect, it, beforeEach } from '@jest/globals';

/**
 * Internal dependencies
 */
import { createYjsDoc, serializeCrdtDoc, deserializeCrdtDoc } from '../utils';
import {
	CRDT_DOC_META_PERSISTENCE_KEY,
	CRDT_DOC_VERSION,
	CRDT_STATE_MAP_KEY,
	CRDT_STATE_VERSION_KEY,
} from '../config';

describe( 'utils', () => {
	describe( 'createYjsDoc', () => {
		it( 'creates a Y.Doc with metadata', () => {
			const documentMeta = {
				userId: '123',
				entityType: 'post',
			};

			const ydoc = createYjsDoc( documentMeta );

			expect( ydoc ).toBeInstanceOf( Y.Doc );
			expect( ydoc.meta ).toBeDefined();
			expect( ydoc.meta?.get( 'userId' ) ).toBe( '123' );
			expect( ydoc.meta?.get( 'entityType' ) ).toBe( 'post' );
		} );

		it( 'creates a Y.Doc with empty metadata', () => {
			const ydoc = createYjsDoc();

			expect( ydoc ).toBeInstanceOf( Y.Doc );
			expect( ydoc.meta ).toBeDefined();
			expect( ydoc.meta?.size ).toBe( 0 );
		} );
	} );

	describe( 'serializeCrdtDoc', () => {
		let testDoc: Y.Doc;

		beforeEach( () => {
			testDoc = createYjsDoc();
		} );

		it( 'serializes a CRDT doc with data', () => {
			const ymap = testDoc.getMap( 'testMap' );
			ymap.set( 'title', 'Test Title' );
			ymap.set( 'content', 'Test Content' );

			const serialized = serializeCrdtDoc( testDoc );
			const parsed = JSON.parse( serialized );

			expect( parsed ).toHaveProperty( 'document' );
			expect( typeof parsed.document ).toBe( 'string' );
			expect( parsed.document.length ).toBeGreaterThan( 0 );
		} );
	} );

	describe( 'deserializeCrdtDoc', () => {
		let originalDoc: Y.Doc;
		let serialized: string;

		beforeEach( () => {
			originalDoc = createYjsDoc();
			const ymap = originalDoc.getMap( 'testMap' );
			ymap.set( 'title', 'Test Title' );
			ymap.set( 'count', 42 );
			serialized = serializeCrdtDoc( originalDoc );
		} );

		it( 'restores the data from the serialized doc', () => {
			const deserialized = deserializeCrdtDoc( serialized );

			expect( deserialized ).toBeInstanceOf( Y.Doc );

			const ymap = deserialized!.getMap( 'testMap' );
			expect( ymap.get( 'title' ) ).toBe( 'Test Title' );
			expect( ymap.get( 'count' ) ).toBe( 42 );
		} );

		it( 'marks the document as from persistence', () => {
			const deserialized = deserializeCrdtDoc( serialized );

			expect( deserialized ).toBeInstanceOf( Y.Doc );
			expect( deserialized!.meta ).toBeDefined();
			expect(
				deserialized!.meta?.get( CRDT_DOC_META_PERSISTENCE_KEY )
			).toBe( true );
		} );

		it( 'assigns a random client ID to the deserialized document', () => {
			const deserialized = deserializeCrdtDoc( serialized );

			expect( deserialized ).toBeInstanceOf( Y.Doc );

			// Client ID should not match the original.
			expect( deserialized!.clientID ).not.toBe( originalDoc.clientID );
		} );

		it( 'returns null for invalid JSON', () => {
			const result = deserializeCrdtDoc( 'invalid json {' );

			expect( result ).toBeNull();
		} );

		it( 'returns null for JSON missing document property', () => {
			const invalidSerialized = JSON.stringify( { data: 'test' } );
			const result = deserializeCrdtDoc( invalidSerialized );

			expect( result ).toBeNull();
		} );

		it( 'returns null for corrupted CRDT data', () => {
			const corruptedSerialized = JSON.stringify( {
				document: buffer.toBase64(
					new Uint8Array( [ 1, 2, 3, 4, 5 ] )
				),
			} );
			const result = deserializeCrdtDoc( corruptedSerialized );

			expect( result ).toBeNull();
		} );
	} );

	describe( 'serialization round-trip', () => {
		it( 'maintains data integrity through serialize/deserialize cycle', () => {
			const originalDoc = createYjsDoc( {} );
			const ymap = originalDoc.getMap( 'data' );
			ymap.set( 'string', 'value' );
			ymap.set( 'number', 123 );
			ymap.set( 'boolean', true );

			const serialized = serializeCrdtDoc( originalDoc );
			const deserialized = deserializeCrdtDoc( serialized );

			expect( deserialized ).not.toBeNull();

			const deserializedMap = deserialized!.getMap( 'data' );
			expect( deserializedMap.get( 'string' ) ).toBe( 'value' );
			expect( deserializedMap.get( 'number' ) ).toBe( 123 );
			expect( deserializedMap.get( 'boolean' ) ).toBe( true );
		} );

		it( 'handles multiple serialize/deserialize cycles', () => {
			const doc = createYjsDoc();
			doc.getMap( 'test' ).set( 'value', 'original' );

			// Cycle 1
			let serialized = serializeCrdtDoc( doc );
			let deserialized = deserializeCrdtDoc( serialized );
			expect( deserialized ).not.toBeNull();

			// Cycle 2
			serialized = serializeCrdtDoc( deserialized! );
			deserialized = deserializeCrdtDoc( serialized );
			expect( deserialized ).not.toBeNull();

			// Verify data is still intact
			expect( deserialized!.getMap( 'test' ).get( 'value' ) ).toBe(
				'original'
			);
		} );
	} );

	describe( 'version announcement', () => {
		it( 'does not set version in state map during createYjsDoc', () => {
			const ydoc = createYjsDoc();
			const stateMap = ydoc.getMap( CRDT_STATE_MAP_KEY );

			// Version should not be set during document creation
			expect( stateMap.get( CRDT_STATE_VERSION_KEY ) ).toBeUndefined();
		} );

		it( 'allows version to be set via transaction', () => {
			const ydoc = createYjsDoc();
			const stateMap = ydoc.getMap( CRDT_STATE_MAP_KEY );

			// Simulate version announcement
			ydoc.transact( () => {
				stateMap.set( CRDT_STATE_VERSION_KEY, CRDT_DOC_VERSION );
			} );

			expect( stateMap.get( CRDT_STATE_VERSION_KEY ) ).toBe(
				CRDT_DOC_VERSION
			);
		} );

		it( 'detects version changes from remote clients', async () => {
			const localDoc = createYjsDoc();
			const remoteDoc = createYjsDoc();

			const stateMap = localDoc.getMap( CRDT_STATE_MAP_KEY );

			// Set up observer to detect version changes
			const versionDetected = new Promise< number >( ( resolve ) => {
				const observer = (
					event: Y.YMapEvent< unknown >,
					transaction: Y.Transaction
				) => {
					if ( transaction.local ) {
						return;
					}

					event.keysChanged.forEach( ( key ) => {
						if ( key === CRDT_STATE_VERSION_KEY ) {
							const version = stateMap.get(
								CRDT_STATE_VERSION_KEY
							) as number;
							resolve( version );
						}
					} );
				};

				stateMap.observe( observer );
			} );

			// Simulate remote client announcing a higher version
			remoteDoc.transact( () => {
				const remoteStateMap = remoteDoc.getMap( CRDT_STATE_MAP_KEY );
				remoteStateMap.set( CRDT_STATE_VERSION_KEY, 2 );
			} );

			// Apply remote update to local doc
			const update = Y.encodeStateAsUpdate( remoteDoc );
			Y.applyUpdate( localDoc, update );

			const version = await versionDetected;
			expect( version ).toBe( 2 );
		} );
	} );
} );
