/**
 * External dependencies
 */
import * as Y from 'yjs';
import { Awareness } from 'y-protocols/awareness';
import * as fun from 'lib0/function';
import {
	describe,
	expect,
	it,
	jest,
	beforeEach,
	afterEach,
} from '@jest/globals';

/**
 * Internal dependencies
 */
import { createSyncManager } from '../manager';
import {
	CRDT_RECORD_MAP_KEY,
	CRDT_RECORD_METADATA_MAP_KEY as RECORD_METADATA_MAP_KEY,
	CRDT_RECORD_METADATA_SAVED_AT_KEY as SAVED_AT_KEY,
	CRDT_RECORD_METADATA_SAVED_BY_KEY as SAVED_BY_KEY,
	WORDPRESS_META_KEY_FOR_CRDT_DOC_PERSISTENCE,
} from '../config';
import { createPersistedCRDTDoc } from '../persistence';
import { getProviderCreators } from '../providers';
import type {
	CRDTDoc,
	ObjectData,
	ProviderCreator,
	ProviderCreatorResult,
	RecordHandlers,
	SyncConfig,
} from '../types';

// Mock dependencies.
jest.mock( '../providers', () => ( {
	getProviderCreators: jest.fn(),
} ) );
const mockGetProviderCreators = jest.mocked( getProviderCreators );

describe( 'SyncManager', () => {
	let mockHandlers: jest.MockedObject< RecordHandlers >;
	let mockProviderCreator: jest.Mock< ProviderCreator >;
	let mockProviderResult: ProviderCreatorResult;
	let mockRecord: ObjectData;
	let mockSyncConfig: jest.MockedObject< SyncConfig >;

	beforeEach( () => {
		// Reset all mocks
		jest.clearAllMocks();

		mockRecord = {
			id: '123',
			title: 'Test Post',
		};

		mockProviderResult = {
			destroy: jest.fn(),
		};
		mockProviderCreator = jest.fn( () =>
			Promise.resolve( mockProviderResult )
		);
		mockGetProviderCreators.mockReturnValue( [ mockProviderCreator ] );

		mockSyncConfig = {
			applyChangesToCRDTDoc: jest.fn(),
			getChangesFromCRDTDoc: jest.fn(
				( ydoc: CRDTDoc, editedRecord: ObjectData ) => {
					const ymap = ydoc.getMap( CRDT_RECORD_MAP_KEY );

					// Simple deep equality check.
					return Object.fromEntries(
						Object.entries( ymap.toJSON() ).filter(
							( [ key, newValue ] ) =>
								! fun.equalityDeep(
									editedRecord[ key ],
									newValue
								)
						)
					);
				}
			),
			supports: {},
		};

		mockHandlers = {
			editRecord: jest.fn(),
			getEditedRecord: jest.fn( async () =>
				Promise.resolve( mockRecord )
			),
			refetchRecord: jest.fn( async () => Promise.resolve() ),
			saveRecord: jest.fn( async () => Promise.resolve() ),
		};
	} );

	afterEach( () => {
		jest.restoreAllMocks();
	} );

	describe( 'load', () => {
		it( 'creates a sync manager with load method', () => {
			const manager = createSyncManager();

			expect( manager ).toHaveProperty( 'load' );
			expect( typeof manager.load ).toBe( 'function' );
		} );

		it( 'loads an entity and applies changes to CRDT document', async () => {
			const manager = createSyncManager();

			await manager.load(
				mockSyncConfig,
				'post',
				'123',
				mockRecord,
				mockHandlers
			);

			// Verify that applyChangesToCRDTDoc was called with the record data
			expect( mockSyncConfig.applyChangesToCRDTDoc ).toHaveBeenCalledWith(
				expect.any( Y.Doc ),
				mockRecord
			);
		} );

		it( 'creates providers for the entity', async () => {
			const manager = createSyncManager();

			await manager.load(
				mockSyncConfig,
				'postType/post',
				'123',
				mockRecord,
				mockHandlers
			);

			expect( mockProviderCreator ).toHaveBeenCalledTimes( 1 );
			expect( mockProviderCreator ).toHaveBeenCalledWith(
				'postType/post',
				'123',
				expect.any( Y.Doc ),
				expect.any( Awareness )
			);
		} );

		it( 'does not load entity when no providers are available', async () => {
			mockGetProviderCreators.mockReturnValue( [] );

			const manager = createSyncManager();

			await manager.load(
				mockSyncConfig,
				'post',
				'123',
				mockRecord,
				mockHandlers
			);

			expect(
				mockSyncConfig.applyChangesToCRDTDoc
			).not.toHaveBeenCalled();
			expect( mockProviderCreator ).not.toHaveBeenCalled();
		} );

		it( 'does not load entity twice if already loaded', async () => {
			const manager = createSyncManager();

			await manager.load(
				mockSyncConfig,
				'post',
				'123',
				mockRecord,
				mockHandlers
			);

			await manager.load(
				mockSyncConfig,
				'post',
				'123',
				mockRecord,
				mockHandlers
			);

			// Should only be called once despite two load attempts
			expect(
				mockSyncConfig.applyChangesToCRDTDoc
			).toHaveBeenCalledTimes( 1 );
			expect( mockProviderCreator ).toHaveBeenCalledTimes( 1 );
		} );

		it( 'loads multiple entities independently', async () => {
			const manager = createSyncManager();

			const record1 = { id: '123', title: 'Post 1' };
			const record2 = { id: '456', title: 'Post 2' };

			await manager.load(
				mockSyncConfig,
				'post',
				'123',
				record1,
				mockHandlers
			);

			await manager.load(
				mockSyncConfig,
				'post',
				'456',
				record2,
				mockHandlers
			);

			expect(
				mockSyncConfig.applyChangesToCRDTDoc
			).toHaveBeenCalledTimes( 2 );
			expect( mockProviderCreator ).toHaveBeenCalledTimes( 2 );
		} );

		describe( 'persisted CRDT doc behavior', () => {
			function createRecordWithPersistedCRDTDoc(
				record: ObjectData,
				persistedRecord: ObjectData = record
			): ObjectData {
				const persistedDoc = new Y.Doc();
				const persistedRecordMap =
					persistedDoc.getMap( CRDT_RECORD_MAP_KEY );
				Object.entries( persistedRecord ).forEach(
					( [ key, value ] ) => {
						persistedRecordMap.set( key, value );
					}
				);

				const persistedMeta = createPersistedCRDTDoc( persistedDoc );
				persistedDoc.destroy();

				return {
					...record,
					meta: {
						...record.meta,
						...persistedMeta,
					},
				};
			}

			it( 'applies the current record when no persisted CRDT doc exists', async () => {
				mockSyncConfig = {
					...mockSyncConfig,
					supports: { crdtPersistence: true },
				};

				const manager = createSyncManager();

				await manager.load(
					mockSyncConfig,
					'post',
					'123',
					mockRecord,
					mockHandlers
				);

				// Current record should be applied as changes since the persisted doc does not exist.
				expect(
					mockSyncConfig.applyChangesToCRDTDoc
				).toHaveBeenCalledTimes( 1 );
				expect(
					mockSyncConfig.applyChangesToCRDTDoc
				).toHaveBeenCalledWith( expect.any( Y.Doc ), mockRecord );

				// Changes should be correctly applied.
				const mockCall =
					mockSyncConfig.applyChangesToCRDTDoc.mock.calls[ 0 ];
				const targetDoc = mockCall[ 0 ] as Y.Doc;
				const appliedChanges = mockCall[ 1 ] as ObjectData;
				expect(
					targetDoc.getMap( CRDT_RECORD_MAP_KEY ).get( 'title' )
				).toBeUndefined();
				expect( appliedChanges.title ).toStrictEqual( 'Test Post' );

				// getChangesFromCRDTDoc should not be called since there was no persisted doc.
				expect(
					mockSyncConfig.getChangesFromCRDTDoc
				).not.toHaveBeenCalled();

				// Verify a save operation occurred.
				expect( mockHandlers.editRecord ).toHaveBeenCalledTimes( 1 );
				expect( mockHandlers.editRecord ).toHaveBeenCalledWith( {
					meta: {
						[ WORDPRESS_META_KEY_FOR_CRDT_DOC_PERSISTENCE ]:
							expect.any( String ),
					},
				} );
				expect( mockHandlers.saveRecord ).toHaveBeenCalledTimes( 1 );
			} );

			it( 'applies a valid persisted CRDT doc without applying the current record', async () => {
				const record = createRecordWithPersistedCRDTDoc( mockRecord );

				mockSyncConfig = {
					...mockSyncConfig,
					supports: { crdtPersistence: true },
				};

				const manager = createSyncManager();

				await manager.load(
					mockSyncConfig,
					'post',
					'123',
					record,
					mockHandlers
				);

				// Current record should NOT be applied since the persisted doc is valid.
				expect(
					mockSyncConfig.applyChangesToCRDTDoc
				).not.toHaveBeenCalled();

				// getChangesFromCRDTDoc should be called with the persisted doc and record.
				expect(
					mockSyncConfig.getChangesFromCRDTDoc
				).toHaveBeenCalledTimes( 1 );
				expect(
					mockSyncConfig.getChangesFromCRDTDoc
				).toHaveBeenCalledWith( expect.any( Y.Doc ), record );

				// Verify no save operation occurred
				expect( mockHandlers.editRecord ).not.toHaveBeenCalled();
				expect( mockHandlers.saveRecord ).not.toHaveBeenCalled();
			} );

			it( 'applies an invalid persisted CRDT doc, then applies the current record', async () => {
				const record = createRecordWithPersistedCRDTDoc( mockRecord, {
					title: 'Title from persisted CRDT doc',
				} );

				mockSyncConfig = {
					...mockSyncConfig,
					supports: { crdtPersistence: true },
				};

				const manager = createSyncManager();

				await manager.load(
					mockSyncConfig,
					'post',
					'123',
					record,
					mockHandlers
				);

				// Current record should be applied since the persisted doc is invalid.
				expect(
					mockSyncConfig.applyChangesToCRDTDoc
				).toHaveBeenCalledTimes( 1 );
				expect(
					mockSyncConfig.applyChangesToCRDTDoc
				).toHaveBeenCalledWith( expect.any( Y.Doc ), record );

				// Changes should be correctly applied.
				const mockCall =
					mockSyncConfig.applyChangesToCRDTDoc.mock.calls[ 0 ];
				const targetDoc = mockCall[ 0 ] as Y.Doc;
				const appliedChanges = mockCall[ 1 ] as ObjectData;
				expect(
					targetDoc.getMap( CRDT_RECORD_MAP_KEY ).get( 'title' )
				).toStrictEqual( 'Title from persisted CRDT doc' );
				expect( appliedChanges.title ).toStrictEqual( 'Test Post' );

				// getChangesFromCRDTDoc should be called with the persisted doc and record.
				expect(
					mockSyncConfig.getChangesFromCRDTDoc
				).toHaveBeenCalledTimes( 1 );
				expect(
					mockSyncConfig.getChangesFromCRDTDoc
				).toHaveBeenCalledWith( expect.any( Y.Doc ), record );

				// Verify a save operation occurred.
				expect( mockHandlers.editRecord ).toHaveBeenCalledTimes( 1 );
				expect( mockHandlers.editRecord ).toHaveBeenCalledWith( {
					meta: {
						[ WORDPRESS_META_KEY_FOR_CRDT_DOC_PERSISTENCE ]:
							expect.any( String ),
					},
				} );
				expect( mockHandlers.saveRecord ).toHaveBeenCalledTimes( 1 );
			} );

			it( 'ignores a persisted CRDT doc when CRDT persistence is not supported', async () => {
				const record = createRecordWithPersistedCRDTDoc( mockRecord, {
					title: 'Persisted Title',
				} );

				const manager = createSyncManager();

				await manager.load(
					mockSyncConfig,
					'post',
					'123',
					record,
					mockHandlers
				);

				// Current record should be applied since the persisted doc does not exist.
				expect(
					mockSyncConfig.applyChangesToCRDTDoc
				).toHaveBeenCalledTimes( 1 );
				expect(
					mockSyncConfig.applyChangesToCRDTDoc
				).toHaveBeenCalledWith( expect.any( Y.Doc ), record );

				// Changes should be correctly applied.
				const mockCall =
					mockSyncConfig.applyChangesToCRDTDoc.mock.calls[ 0 ];
				const targetDoc = mockCall[ 0 ] as Y.Doc;
				const appliedChanges = mockCall[ 1 ] as ObjectData;
				expect(
					targetDoc.getMap( CRDT_RECORD_MAP_KEY ).get( 'title' )
				).toBeUndefined();
				expect( appliedChanges.title ).toStrictEqual( 'Test Post' );

				// getChangesFromCRDTDoc should not be called since the persisted doc is igored.
				expect(
					mockSyncConfig.getChangesFromCRDTDoc
				).not.toHaveBeenCalled();

				// Verify a save operation occurred.
				expect( mockHandlers.editRecord ).toHaveBeenCalledTimes( 1 );
				expect( mockHandlers.editRecord ).toHaveBeenCalledWith( {
					meta: {},
				} );
				expect( mockHandlers.saveRecord ).toHaveBeenCalledTimes( 1 );
			} );
		} );
	} );

	describe( 'unload', () => {
		it( 'unloads an entity and destroys its state', async () => {
			const manager = createSyncManager();

			await manager.load(
				mockSyncConfig,
				'post',
				'123',
				mockRecord,
				mockHandlers
			);

			manager.unload( 'post', '123' );

			expect( mockProviderResult.destroy ).toHaveBeenCalled();
		} );

		it( 'does not throw when unloading non-existent entity', () => {
			const manager = createSyncManager();

			expect( () => {
				manager.unload( 'post', '999' );
			} ).not.toThrow();
		} );

		it( 'allows reloading after unloading', async () => {
			const manager = createSyncManager();

			await manager.load(
				mockSyncConfig,
				'post',
				'123',
				mockRecord,
				mockHandlers
			);

			manager.unload( 'post', '123' );

			jest.clearAllMocks();

			await manager.load(
				mockSyncConfig,
				'post',
				'123',
				mockRecord,
				mockHandlers
			);

			expect(
				mockSyncConfig.applyChangesToCRDTDoc
			).toHaveBeenCalledTimes( 1 );
			expect( mockProviderCreator ).toHaveBeenCalledTimes( 1 );
		} );

		it( 'unloads specific entity without affecting others', async () => {
			const manager = createSyncManager();

			await manager.load(
				mockSyncConfig,
				'post',
				'123',
				mockRecord,
				mockHandlers
			);

			await manager.load(
				mockSyncConfig,
				'post',
				'456',
				mockRecord,
				mockHandlers
			);

			manager.unload( 'post', '123' );

			// Only one provider should be destroyed
			expect( mockProviderResult.destroy ).toHaveBeenCalledTimes( 1 );

			// Should still be able to update the other entity
			jest.clearAllMocks();
			manager.update( 'post', '456', { title: 'Updated' }, 'local' );

			expect( mockSyncConfig.applyChangesToCRDTDoc ).toHaveBeenCalled();
		} );
	} );

	describe( 'update', () => {
		it( 'updates CRDT document with local changes', async () => {
			// Capture the Y.Doc from provider creator
			let capturedDoc: Y.Doc | null = null;
			mockProviderCreator.mockImplementation(
				async (
					_objectType: string,
					_objectId: string,
					ydoc: Y.Doc
				) => {
					capturedDoc = ydoc;
					return mockProviderResult;
				}
			);

			const manager = createSyncManager();

			await manager.load(
				mockSyncConfig,
				'post',
				'123',
				mockRecord,
				mockHandlers
			);

			jest.clearAllMocks();

			const changes = { title: 'Updated Title' };
			manager.update( 'post', '123', changes, 'local-editor' );

			// Verify that applyChangesToCRDTDoc was called with the changes.
			expect( mockSyncConfig.applyChangesToCRDTDoc ).toHaveBeenCalledWith(
				expect.any( Y.Doc ),
				changes
			);

			// Verify that the record metadata was not updated.
			const ydoc = capturedDoc as unknown as Y.Doc;
			const metadataMap = ydoc.getMap( RECORD_METADATA_MAP_KEY );
			expect( metadataMap.get( SAVED_AT_KEY ) ).toBeUndefined();
			expect( metadataMap.get( SAVED_BY_KEY ) ).toBeUndefined();
		} );

		it( 'does not update when entity is not loaded', () => {
			const manager = createSyncManager();

			const changes = { title: 'Updated Title' };
			manager.update( 'post', '999', changes, 'local-editor' );

			expect(
				mockSyncConfig.applyChangesToCRDTDoc
			).not.toHaveBeenCalled();
		} );

		it( 'applies changes with specified origin', async () => {
			// Capture the Y.Doc from provider creator
			let capturedDoc: Y.Doc | null = null;
			mockProviderCreator.mockImplementation(
				async (
					_objectType: string,
					_objectId: string,
					ydoc: Y.Doc
				) => {
					capturedDoc = ydoc;
					return mockProviderResult;
				}
			);

			const manager = createSyncManager();

			await manager.load(
				mockSyncConfig,
				'post',
				'123',
				mockRecord,
				mockHandlers
			);

			// Get the captured Y.Doc
			expect( capturedDoc ).not.toBeNull();

			// Spy on transact to verify origin is passed
			const transactSpy = jest.spyOn(
				capturedDoc as unknown as Y.Doc,
				'transact'
			);

			const changes = { title: 'Updated Title' };
			const customOrigin = 'custom-origin';

			manager.update( 'post', '123', changes, customOrigin );

			expect( transactSpy ).toHaveBeenCalledWith(
				expect.any( Function ),
				customOrigin
			);
		} );

		it( 'updates the record metadata when the update is associated with a save', async () => {
			// Capture the Y.Doc from provider creator.
			let capturedDoc: Y.Doc | null = null;
			mockProviderCreator.mockImplementation(
				async (
					_objectType: string,
					_objectId: string,
					ydoc: Y.Doc
				) => {
					capturedDoc = ydoc;
					return mockProviderResult;
				}
			);

			const manager = createSyncManager();

			await manager.load(
				mockSyncConfig,
				'post',
				'123',
				mockRecord,
				mockHandlers
			);

			jest.clearAllMocks();

			const changes = { title: 'Updated Title' };
			const now = Date.now();

			manager.update( 'post', '123', changes, 'local-editor', true );

			// Verify that applyChangesToCRDTDoc was called with the changes.
			expect( mockSyncConfig.applyChangesToCRDTDoc ).toHaveBeenCalledWith(
				expect.any( Y.Doc ),
				changes
			);

			// Verify that the record metadata was updated.
			const ydoc = capturedDoc as unknown as Y.Doc;
			const metadataMap = ydoc.getMap( RECORD_METADATA_MAP_KEY );
			expect( metadataMap.get( SAVED_AT_KEY ) ).toBeGreaterThanOrEqual(
				now
			);
			expect( metadataMap.get( SAVED_BY_KEY ) ).toBe( ydoc.clientID );
		} );
	} );

	describe( 'CRDT doc observation', () => {
		it( 'edits the local entity record when remote updates arrive', async () => {
			// Capture the Y.Doc from provider creator.
			let capturedDoc: Y.Doc | null = null;
			mockProviderCreator.mockImplementation(
				async (
					_objectType: string,
					_objectId: string,
					ydoc: Y.Doc
				) => {
					capturedDoc = ydoc;
					return mockProviderResult;
				}
			);

			const manager = createSyncManager();

			await manager.load(
				mockSyncConfig,
				'post',
				'123',
				mockRecord,
				mockHandlers
			);

			// Clear calls of editRecord, which is called during load.
			mockHandlers.editRecord.mockClear();

			expect( capturedDoc ).not.toBeNull();

			// Simulate a remote change.
			const remoteDoc = new Y.Doc();
			remoteDoc
				.getMap( CRDT_RECORD_MAP_KEY )
				.set( 'title', 'Title from remote peer' );
			Y.applyUpdateV2(
				capturedDoc as unknown as Y.Doc,
				Y.encodeStateAsUpdateV2( remoteDoc )
			);
			remoteDoc.destroy();

			// Wait a tick.
			await new Promise( ( resolve ) => setTimeout( resolve, 0 ) );

			expect( mockHandlers.editRecord ).toHaveBeenCalledTimes( 1 );
			expect( mockHandlers.editRecord ).toHaveBeenCalledWith( {
				title: 'Title from remote peer',
			} );
		} );

		it( 'does not edit the local record for local transactions', async () => {
			// Capture the Y.Doc from provider creator.
			let capturedDoc: Y.Doc | null = null;
			mockProviderCreator.mockImplementation(
				async (
					_objectType: string,
					_objectId: string,
					ydoc: Y.Doc
				) => {
					capturedDoc = ydoc;
					return mockProviderResult;
				}
			);

			const manager = createSyncManager();

			await manager.load(
				mockSyncConfig,
				'post',
				'123',
				mockRecord,
				mockHandlers
			);

			// Clear calls of editRecord, which is called during load.
			mockHandlers.editRecord.mockClear();

			expect( capturedDoc ).not.toBeNull();
			const ydoc = capturedDoc as unknown as Y.Doc;

			const recordMap = ydoc.getMap( CRDT_RECORD_MAP_KEY );

			// Clear previous calls
			jest.clearAllMocks();

			// Simulate a local update with sync manager origin
			ydoc.transact( () => {
				recordMap.set( 'title', 'Local Update' );
			} );

			// Wait a tick.
			await new Promise( ( resolve ) => setTimeout( resolve, 0 ) );

			// Should not trigger record update for local sync manager origin
			expect( mockHandlers.editRecord ).not.toHaveBeenCalled();
		} );
	} );
} );
