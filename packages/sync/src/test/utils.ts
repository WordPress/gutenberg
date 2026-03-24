/**
 * External dependencies
 */
import * as Y from '@y/y';
import * as buffer from 'lib0/buffer';
import { describe, expect, it, beforeEach } from '@jest/globals';

/**
 * Internal dependencies
 */
import {
	createYjsDoc,
	initializeYjsDoc,
	markEntityAsSaved,
	serializeCrdtDoc,
	deserializeCrdtDoc,
} from '../utils';
import {
	CRDT_DOC_META_PERSISTENCE_KEY,
	CRDT_DOC_VERSION,
	CRDT_STATE_MAP_KEY,
	CRDT_STATE_MAP_SAVED_AT_KEY as SAVED_AT_KEY,
	CRDT_STATE_MAP_SAVED_BY_KEY as SAVED_BY_KEY,
	CRDT_STATE_MAP_VERSION_KEY as VERSION_KEY,
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

		it( 'does not advance the state vector when creating the doc', () => {
			const ydoc = createYjsDoc();
			const sv = Y.decodeStateVector( Y.encodeStateVector( ydoc ) );

			// createYjsDoc does not make any updates to the doc, so the state
			// vector for the doc's client ID should be undefined.
			expect( sv.get( ydoc.clientID ) ).toBeUndefined();
		} );
	} );

	describe( 'initializeYjsDoc', () => {
		it( 'sets the CRDT document version in the state map', () => {
			const ydoc = new Y.Doc( {} );
			const stateMap = ydoc.get( CRDT_STATE_MAP_KEY );

			initializeYjsDoc( ydoc );

			expect( stateMap.getAttr( VERSION_KEY ) ).toBe( CRDT_DOC_VERSION );
		} );

		it( 'advances the state vector when setting the version key', () => {
			const ydoc = new Y.Doc();

			initializeYjsDoc( ydoc );

			const sv = Y.decodeStateVector( Y.encodeStateVector( ydoc ) );

			// createYjsDoc sets VERSION_KEY via stateMap.set(), which creates
			// a Yjs operation. This advances the state vector for the doc's
			// client ID to clock 1.
			expect( sv.get( ydoc.clientID ) ).toBe( 1 );
		} );

		it( 'fires an update event when setting the version key', () => {
			const updates: Uint8Array[] = [];
			const ydoc = new Y.Doc();

			ydoc.on( 'update', ( update: Uint8Array ) => {
				updates.push( update );
			} );

			initializeYjsDoc( ydoc );

			expect( updates ).toHaveLength( 1 );
		} );
	} );

	describe( 'markEntityAsSaved', () => {
		it( 'sets the saved-at timestamp and saved-by client ID', () => {
			const ydoc = createYjsDoc();
			const before = Date.now();

			markEntityAsSaved( ydoc );

			const stateMap = ydoc.get( CRDT_STATE_MAP_KEY );
			const savedAt = stateMap.getAttr( SAVED_AT_KEY ) as number;
			const savedBy = stateMap.getAttr( SAVED_BY_KEY );

			expect( savedAt ).toBeGreaterThanOrEqual( before );
			expect( savedAt ).toBeLessThanOrEqual( Date.now() );
			expect( savedBy ).toBe( ydoc.clientID );
		} );

		it( 'updates the timestamp on subsequent calls', () => {
			const ydoc = createYjsDoc();

			markEntityAsSaved( ydoc );
			const stateMap = ydoc.get( CRDT_STATE_MAP_KEY );
			const firstSavedAt = stateMap.getAttr( SAVED_AT_KEY ) as number;

			// Small delay to ensure timestamp changes.
			markEntityAsSaved( ydoc );
			const secondSavedAt = stateMap.getAttr( SAVED_AT_KEY ) as number;

			expect( secondSavedAt ).toBeGreaterThanOrEqual( firstSavedAt );
		} );
	} );

	describe( 'serializeCrdtDoc', () => {
		let testDoc: Y.Doc;

		beforeEach( () => {
			testDoc = createYjsDoc();
		} );

		it( 'serializes a CRDT doc with data', () => {
			const ymap = testDoc.get( 'testMap' );
			ymap.setAttr( 'title', 'Test Title' );
			ymap.setAttr( 'content', 'Test Content' );

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
			initializeYjsDoc( originalDoc );

			const ymap = originalDoc.get( 'testMap' );
			ymap.setAttr( 'title', 'Test Title' );
			ymap.setAttr( 'count', 42 );
			serialized = serializeCrdtDoc( originalDoc );
		} );

		it( 'restores the data from the serialized doc', () => {
			const deserialized = deserializeCrdtDoc( serialized );

			expect( deserialized ).toBeInstanceOf( Y.Doc );

			const ymap = deserialized!.get( 'testMap' );
			expect( ymap.getAttr( 'title' ) ).toBe( 'Test Title' );
			expect( ymap.getAttr( 'count' ) ).toBe( 42 );
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

		it( 'preserves the CRDT state version', () => {
			const deserialized = deserializeCrdtDoc( serialized );

			expect( deserialized ).toBeInstanceOf( Y.Doc );

			const stateMap = deserialized!.get( CRDT_STATE_MAP_KEY );
			expect( stateMap.getAttr( VERSION_KEY ) ).toBe( CRDT_DOC_VERSION );
		} );
	} );

	describe( 'serialization round-trip', () => {
		it( 'maintains data integrity through serialize/deserialize cycle', () => {
			const originalDoc = createYjsDoc( {} );
			const ymap = originalDoc.get( 'data' );
			ymap.setAttr( 'string', 'value' );
			ymap.setAttr( 'number', 123 );
			ymap.setAttr( 'boolean', true );

			const serialized = serializeCrdtDoc( originalDoc );
			const deserialized = deserializeCrdtDoc( serialized );

			expect( deserialized ).not.toBeNull();

			const deserializedMap = deserialized!.get( 'data' );
			expect( deserializedMap.getAttr( 'string' ) ).toBe( 'value' );
			expect( deserializedMap.getAttr( 'number' ) ).toBe( 123 );
			expect( deserializedMap.getAttr( 'boolean' ) ).toBe( true );
		} );

		it( 'handles multiple serialize/deserialize cycles', () => {
			const doc = createYjsDoc();
			doc.get( 'test' ).setAttr( 'value', 'original' );

			// Cycle 1
			let serialized = serializeCrdtDoc( doc );
			let deserialized = deserializeCrdtDoc( serialized );
			expect( deserialized ).not.toBeNull();

			// Cycle 2
			serialized = serializeCrdtDoc( deserialized! );
			deserialized = deserializeCrdtDoc( serialized );
			expect( deserialized ).not.toBeNull();

			// Verify data is still intact
			expect( deserialized!.get( 'test' ).getAttr( 'value' ) ).toBe(
				'original'
			);
		} );
	} );
} );
