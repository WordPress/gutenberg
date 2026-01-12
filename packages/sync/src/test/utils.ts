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
	WORDPRESS_META_KEY_FOR_CRDT_DOC_PERSISTENCE,
} from '../config';
import { createVersionObserver } from '../manager';
import { getPersistedCrdtDoc } from '../persistence';

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

	describe( 'persisted document version handling', () => {
		it( 'preserves version when serializing and deserializing', () => {
			const doc = createYjsDoc();

			// Set version 2 in the state map
			doc.transact( () => {
				const stateMap = doc.getMap( CRDT_STATE_MAP_KEY );
				stateMap.set( CRDT_STATE_VERSION_KEY, 2 );
			} );

			// Serialize and deserialize
			const serialized = serializeCrdtDoc( doc );
			const deserialized = deserializeCrdtDoc( serialized );

			expect( deserialized ).not.toBeNull();

			// Version should be preserved in the deserialized doc
			const stateMap = deserialized!.getMap( CRDT_STATE_MAP_KEY );
			expect( stateMap.get( CRDT_STATE_VERSION_KEY ) ).toBe( 2 );
		} );

		it( 'can detect when persisted doc has higher version than local', () => {
			// Simulate persisted doc with version 2
			const persistedDoc = createYjsDoc();
			persistedDoc.transact( () => {
				const stateMap = persistedDoc.getMap( CRDT_STATE_MAP_KEY );
				stateMap.set( CRDT_STATE_VERSION_KEY, CRDT_DOC_VERSION + 1 );
			} );

			const serialized = serializeCrdtDoc( persistedDoc );
			const deserialized = deserializeCrdtDoc( serialized );

			expect( deserialized ).not.toBeNull();

			// Check if persisted version is higher than local
			const stateMap = deserialized!.getMap( CRDT_STATE_MAP_KEY );
			const persistedVersion = stateMap.get(
				CRDT_STATE_VERSION_KEY
			) as number;

			expect( persistedVersion ).toBeGreaterThan( CRDT_DOC_VERSION );
		} );

		it( 'can detect when persisted doc has lower version than local', () => {
			// Simulate persisted doc with version 0 (older than current)
			const persistedDoc = createYjsDoc();
			persistedDoc.transact( () => {
				const stateMap = persistedDoc.getMap( CRDT_STATE_MAP_KEY );
				// Use version 0 which should always be less than CRDT_DOC_VERSION
				stateMap.set( CRDT_STATE_VERSION_KEY, 0 );
			} );

			const serialized = serializeCrdtDoc( persistedDoc );
			const deserialized = deserializeCrdtDoc( serialized );

			expect( deserialized ).not.toBeNull();

			// Check if persisted version is lower than local
			const stateMap = deserialized!.getMap( CRDT_STATE_MAP_KEY );
			const persistedVersion = stateMap.get(
				CRDT_STATE_VERSION_KEY
			) as number;

			expect( persistedVersion ).toBeLessThan( CRDT_DOC_VERSION );
		} );

		it( 'applying persisted doc with higher version triggers version observer', () => {
			// Create local doc with version observer from manager.ts
			const localDoc = createYjsDoc();
			const stateMap = localDoc.getMap( CRDT_STATE_MAP_KEY );

			const versionMismatches: Array< {
				current: number;
				persisted: number;
			} > = [];

			// Use the actual createVersionObserver from manager.ts
			const observer = createVersionObserver(
				localDoc,
				( currentVersion, remoteVersion ) => {
					versionMismatches.push( {
						current: currentVersion,
						persisted: remoteVersion,
					} );
				}
			);

			stateMap.observe( observer );

			// Create persisted doc with higher version
			const persistedDoc = createYjsDoc();
			persistedDoc.transact( () => {
				const persistedStateMap =
					persistedDoc.getMap( CRDT_STATE_MAP_KEY );
				persistedStateMap.set(
					CRDT_STATE_VERSION_KEY,
					CRDT_DOC_VERSION + 1
				);
				persistedDoc.getMap( 'data' ).set( 'test', 'value' );
			} );

			// Apply persisted doc update to local doc (simulating applyPersistedCrdtDoc)
			const update = Y.encodeStateAsUpdateV2( persistedDoc );
			Y.applyUpdateV2( localDoc, update );

			// Should have detected the version mismatch
			expect( versionMismatches.length ).toBe( 1 );
			expect( versionMismatches[ 0 ].current ).toBe( CRDT_DOC_VERSION );
			expect( versionMismatches[ 0 ].persisted ).toBe(
				CRDT_DOC_VERSION + 1
			);
		} );

		it( 'applying persisted doc with same or lower version does not trigger observer', () => {
			const localDoc = createYjsDoc();
			const stateMap = localDoc.getMap( CRDT_STATE_MAP_KEY );

			const versionMismatches: Array< {
				current: number;
				persisted: number;
			} > = [];

			// Use the actual createVersionObserver from manager.ts
			const observer = createVersionObserver(
				localDoc,
				( currentVersion, remoteVersion ) => {
					versionMismatches.push( {
						current: currentVersion,
						persisted: remoteVersion,
					} );
				}
			);

			stateMap.observe( observer );

			// Create persisted doc with SAME version
			const persistedDocSame = createYjsDoc();
			persistedDocSame.transact( () => {
				const persistedStateMap =
					persistedDocSame.getMap( CRDT_STATE_MAP_KEY );
				persistedStateMap.set(
					CRDT_STATE_VERSION_KEY,
					CRDT_DOC_VERSION
				);
			} );

			// Apply persisted doc with same version
			let update = Y.encodeStateAsUpdateV2( persistedDocSame );
			Y.applyUpdateV2( localDoc, update );

			// Should NOT have triggered callback (same version)
			expect( versionMismatches.length ).toBe( 0 );

			// Create persisted doc with LOWER version
			const persistedDocLower = createYjsDoc();
			persistedDocLower.transact( () => {
				const persistedStateMap =
					persistedDocLower.getMap( CRDT_STATE_MAP_KEY );
				persistedStateMap.set( CRDT_STATE_VERSION_KEY, 0 );
			} );

			// Apply persisted doc with lower version
			update = Y.encodeStateAsUpdateV2( persistedDocLower );
			Y.applyUpdateV2( localDoc, update );

			// Should still NOT have triggered callback (lower version)
			expect( versionMismatches.length ).toBe( 0 );
		} );
	} );

	describe( 'getPersistedCrdtDoc', () => {
		it( 'returns null when no persisted document exists', () => {
			const record = { id: 1, title: 'Test' };
			const result = getPersistedCrdtDoc( record );

			expect( result ).toBeNull();
		} );

		it( 'returns document when persisted version matches local', () => {
			// Create a doc with matching version
			const doc = createYjsDoc();
			doc.transact( () => {
				const stateMap = doc.getMap( CRDT_STATE_MAP_KEY );
				stateMap.set( CRDT_STATE_VERSION_KEY, CRDT_DOC_VERSION );
				doc.getMap( 'data' ).set( 'test', 'value' );
			} );

			const serialized = serializeCrdtDoc( doc );
			const record = {
				id: 1,
				meta: {
					[ WORDPRESS_META_KEY_FOR_CRDT_DOC_PERSISTENCE ]: serialized,
				},
			};

			const result = getPersistedCrdtDoc( record );

			expect( result ).not.toBeNull();
			expect( result!.getMap( 'data' ).get( 'test' ) ).toBe( 'value' );

			// Clean up
			result!.destroy();
		} );

		it( 'returns document when persisted version is lower than local', () => {
			// Create a doc with lower version
			const doc = createYjsDoc();
			doc.transact( () => {
				const stateMap = doc.getMap( CRDT_STATE_MAP_KEY );
				stateMap.set( CRDT_STATE_VERSION_KEY, 0 );
				doc.getMap( 'data' ).set( 'test', 'old' );
			} );

			const serialized = serializeCrdtDoc( doc );
			const record = {
				id: 1,
				meta: {
					[ WORDPRESS_META_KEY_FOR_CRDT_DOC_PERSISTENCE ]: serialized,
				},
			};

			const result = getPersistedCrdtDoc( record );

			expect( result ).not.toBeNull();
			expect( result!.getMap( 'data' ).get( 'test' ) ).toBe( 'old' );

			// Verify it has the old version
			const stateMap = result!.getMap( CRDT_STATE_MAP_KEY );
			expect( stateMap.get( CRDT_STATE_VERSION_KEY ) ).toBe( 0 );

			// Clean up
			result!.destroy();
		} );

		it( 'returns document even when persisted version is higher than local', () => {
			// Create a doc with higher version
			const doc = createYjsDoc();
			doc.transact( () => {
				const stateMap = doc.getMap( CRDT_STATE_MAP_KEY );
				stateMap.set( CRDT_STATE_VERSION_KEY, CRDT_DOC_VERSION + 1 );
				doc.getMap( 'data' ).set( 'test', 'future' );
			} );

			const serialized = serializeCrdtDoc( doc );
			const record = {
				id: 1,
				meta: {
					[ WORDPRESS_META_KEY_FOR_CRDT_DOC_PERSISTENCE ]: serialized,
				},
			};

			const result = getPersistedCrdtDoc( record );

			// Should return the document (version checking is done by caller)
			expect( result ).not.toBeNull();
			expect( result!.getMap( 'data' ).get( 'test' ) ).toBe( 'future' );

			// Verify it has the higher version
			const stateMap = result!.getMap( CRDT_STATE_MAP_KEY );
			expect( stateMap.get( CRDT_STATE_VERSION_KEY ) ).toBe(
				CRDT_DOC_VERSION + 1
			);

			// Clean up
			result!.destroy();
		} );
	} );
} );
