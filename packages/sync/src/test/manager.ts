/**
 * External dependencies
 */
import * as Y from 'yjs';
import { Awareness } from 'y-protocols/awareness';
import * as buffer from 'lib0/buffer';
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
	CRDT_STATE_MAP_KEY,
	CRDT_STATE_MAP_SAVED_AT_KEY as SAVED_AT_KEY,
	CRDT_STATE_MAP_SAVED_BY_KEY as SAVED_BY_KEY,
	LOCAL_EDITOR_ORIGIN,
} from '../config';
import { getProviderCreators } from '../providers';
import type {
	CRDTDoc,
	ObjectData,
	ProviderCreator,
	ProviderCreatorResult,
	RecordHandlers,
	SyncConfig,
} from '../types';
import { serializeCrdtDoc } from '../utils';

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
			meta: {},
		};

		mockProviderResult = {
			destroy: jest.fn(),
			on: jest.fn(),
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
			createAwareness: jest.fn(
				( ydoc: Y.Doc ) => new Awareness( ydoc )
			),
			getPersistedCRDTDoc: jest.fn( () => null ),
		};

		mockHandlers = {
			addUndoMeta: jest.fn(),
			editRecord: jest.fn(),
			getEditedRecord: jest.fn( async () =>
				Promise.resolve( mockRecord )
			),
			onStatusChange: jest.fn(),
			persistCRDTDoc: jest.fn(),
			refetchRecord: jest.fn( async () => Promise.resolve() ),
			restoreUndoMeta: jest.fn(),
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
			expect( mockProviderCreator ).toHaveBeenCalledWith( {
				objectType: 'postType/post',
				objectId: '123',
				ydoc: expect.any( Y.Doc ),
				awareness: expect.any( Awareness ),
			} );
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

		it( 'only adds undo metadata for the entity that changed', async () => {
			mockSyncConfig.applyChangesToCRDTDoc = jest.fn(
				( ydoc: CRDTDoc, changes: Partial< ObjectData > ) => {
					const recordMap = ydoc.getMap( CRDT_RECORD_MAP_KEY );
					Object.entries( changes ).forEach( ( [ key, value ] ) => {
						recordMap.set( key, value );
					} );
				}
			);

			const recordA = { id: '123', title: 'Post A', meta: {} };
			const recordB = { id: '456', title: 'Post B', meta: {} };
			const handlersA = {
				...mockHandlers,
				addUndoMeta: jest.fn(),
				getEditedRecord: jest.fn( async () =>
					Promise.resolve( recordA )
				),
				restoreUndoMeta: jest.fn(),
			};
			const handlersB = {
				...mockHandlers,
				addUndoMeta: jest.fn(),
				getEditedRecord: jest.fn( async () =>
					Promise.resolve( recordB )
				),
				restoreUndoMeta: jest.fn(),
			};

			const manager = createSyncManager();

			await manager.load(
				mockSyncConfig,
				'post',
				'123',
				recordA,
				handlersA
			);
			await manager.load(
				mockSyncConfig,
				'post',
				'456',
				recordB,
				handlersB
			);

			handlersA.addUndoMeta.mockClear();
			handlersB.addUndoMeta.mockClear();

			manager.update(
				'post',
				'123',
				{ title: 'Post A updated' },
				LOCAL_EDITOR_ORIGIN,
				{ isNewUndoLevel: true }
			);

			await new Promise( ( resolve ) => setTimeout( resolve, 0 ) );

			expect( handlersA.addUndoMeta ).toHaveBeenCalledTimes( 1 );
			expect( handlersB.addUndoMeta ).not.toHaveBeenCalled();
		} );

		describe( 'persisted CRDT doc behavior', () => {
			function createPersistedCRDTDoc(
				persistedRecord: ObjectData
			): string {
				const persistedDoc = new Y.Doc();
				const persistedRecordMap =
					persistedDoc.getMap( CRDT_RECORD_MAP_KEY );
				Object.entries( persistedRecord ).forEach(
					( [ key, value ] ) => {
						persistedRecordMap.set( key, value );
					}
				);

				return serializeCrdtDoc( persistedDoc );
			}

			it( 'applies the current record when no persisted CRDT doc exists', async () => {
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

				// getChangesFromCRDTDoc should not be called since there was no persisted doc.
				expect(
					mockSyncConfig.getChangesFromCRDTDoc
				).not.toHaveBeenCalled();

				// Verify that the CRDT doc was persisted.
				expect( mockHandlers.persistCRDTDoc ).toHaveBeenCalledTimes(
					1
				);
			} );

			it( 'accepts a valid persisted CRDT doc without applying changes', async () => {
				mockSyncConfig = {
					...mockSyncConfig,
					getPersistedCRDTDoc: jest.fn( () =>
						createPersistedCRDTDoc( mockRecord )
					),
				};

				const manager = createSyncManager();

				await manager.load(
					mockSyncConfig,
					'post',
					'123',
					mockRecord,
					mockHandlers
				);

				// Changes should NOT be applied since the persisted doc is valid.
				expect(
					mockSyncConfig.applyChangesToCRDTDoc
				).not.toHaveBeenCalled();

				// getChangesFromCRDTDoc should be called with the persisted doc and record.
				expect(
					mockSyncConfig.getChangesFromCRDTDoc
				).toHaveBeenCalledTimes( 1 );
				expect(
					mockSyncConfig.getChangesFromCRDTDoc
				).toHaveBeenCalledWith( expect.any( Y.Doc ), mockRecord );

				// Verify that the CRDT doc was persisted.
				expect( mockHandlers.editRecord ).not.toHaveBeenCalled();
				expect( mockHandlers.persistCRDTDoc ).not.toHaveBeenCalled();
			} );

			it( 'applies a persisted CRDT doc with invalidated fields, then applies changes', async () => {
				mockSyncConfig = {
					...mockSyncConfig,
					getPersistedCRDTDoc: jest.fn( () =>
						createPersistedCRDTDoc( {
							...mockRecord,
							title: 'Invalidated title from persisted CRDT doc',
						} )
					),
				};

				const manager = createSyncManager();

				await manager.load(
					mockSyncConfig,
					'post',
					'123',
					mockRecord,
					mockHandlers
				);

				// Changes should be applied for the invalidated properties.
				const expectedChanges = {
					title: mockRecord.title,
				};

				expect(
					mockSyncConfig.applyChangesToCRDTDoc
				).toHaveBeenCalledTimes( 1 );
				expect(
					mockSyncConfig.applyChangesToCRDTDoc
				).toHaveBeenCalledWith( expect.any( Y.Doc ), expectedChanges );

				// getChangesFromCRDTDoc should be called with the persisted doc and record.
				expect(
					mockSyncConfig.getChangesFromCRDTDoc
				).toHaveBeenCalledTimes( 1 );
				expect(
					mockSyncConfig.getChangesFromCRDTDoc
				).toHaveBeenCalledWith( expect.any( Y.Doc ), mockRecord );

				// Verify that the CRDT doc was persisted.
				expect( mockHandlers.persistCRDTDoc ).toHaveBeenCalledTimes(
					1
				);
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

			// Wait a tick for any async follow-up work.
			await new Promise( ( resolve ) => setTimeout( resolve, 0 ) );

			expect( mockSyncConfig.applyChangesToCRDTDoc ).toHaveBeenCalled();
		} );

		it( 'clears the undo manager after unloading all entities', async () => {
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

			expect( manager.undoManager ).toBeDefined();

			manager.unloadAll();

			expect( manager.undoManager ).toBeUndefined();
		} );

		it( 'destroys providers and skips initialization when unload runs during load', async () => {
			// Hold provider creation open so we can interrupt the load between
			// `entityStates.set(...)` and the provider creation resolving.
			let resolveProvider: (
				result: ProviderCreatorResult
			) => void = () => {};
			const providerPromise = new Promise< ProviderCreatorResult >(
				( resolve ) => {
					resolveProvider = resolve;
				}
			);
			mockProviderCreator.mockImplementation( () => providerPromise );

			const manager = createSyncManager();

			// Start the load but do not await it. The async function will run up
			// to the `await Promise.all(...)` and then suspend.
			const loadPromise = manager.load(
				mockSyncConfig,
				'post',
				'123',
				mockRecord,
				mockHandlers
			);

			// Yield so loadEntity reaches its await point.
			await new Promise( ( resolve ) => setTimeout( resolve, 0 ) );

			// At this point providerResults is still unassigned. Trigger unload.
			manager.unload( 'post', '123' );

			// Now resolve provider creation and let the load promise finish.
			resolveProvider( mockProviderResult );
			await loadPromise;

			// The provider that was created after unload should still be
			// destroyed by the post-await guard.
			expect( mockProviderResult.destroy ).toHaveBeenCalledTimes( 1 );

			// Initialization and persistence work should have been skipped: no
			// changes applied to the (now-destroyed) ydoc, no persistCRDTDoc.
			expect(
				mockSyncConfig.applyChangesToCRDTDoc
			).not.toHaveBeenCalled();
			expect( mockHandlers.persistCRDTDoc ).not.toHaveBeenCalled();

			// The entity is fully torn down, so a fresh load should succeed.
			mockProviderCreator.mockImplementation( () =>
				Promise.resolve( mockProviderResult )
			);
			jest.clearAllMocks();

			await manager.load(
				mockSyncConfig,
				'post',
				'123',
				mockRecord,
				mockHandlers
			);

			expect( mockProviderCreator ).toHaveBeenCalledTimes( 1 );
			expect(
				mockSyncConfig.applyChangesToCRDTDoc
			).toHaveBeenCalledTimes( 1 );
		} );
	} );

	describe( 'update', () => {
		it( 'updates CRDT document with local changes', async () => {
			// Capture the Y.Doc from provider creator
			let capturedDoc: Y.Doc | null = null;
			mockProviderCreator.mockImplementation( async ( { ydoc } ) => {
				capturedDoc = ydoc;
				return mockProviderResult;
			} );

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

			// Wait a tick for any async follow-up work.
			await new Promise( ( resolve ) => setTimeout( resolve, 0 ) );

			// Verify that applyChangesToCRDTDoc was called with the changes.
			expect( mockSyncConfig.applyChangesToCRDTDoc ).toHaveBeenCalledWith(
				expect.any( Y.Doc ),
				changes
			);

			// Verify that the record metadata was not updated.
			const ydoc = capturedDoc as unknown as Y.Doc;
			const stateMap = ydoc.getMap( CRDT_STATE_MAP_KEY );
			expect( stateMap.get( SAVED_AT_KEY ) ).toBeUndefined();
			expect( stateMap.get( SAVED_BY_KEY ) ).toBeUndefined();
		} );

		it( 'applies local CRDT updates synchronously before processing remote record updates when collaborating', async () => {
			let capturedDoc: Y.Doc | null = null;
			mockProviderCreator.mockImplementation( async ( { ydoc } ) => {
				capturedDoc = ydoc;
				return mockProviderResult;
			} );

			const initialRecord = {
				id: '123',
				title: 'Initial title',
				content: 'Initial content',
				meta: {},
			};
			const editedRecord = {
				...initialRecord,
				content: 'Local content',
			};
			const syncConfig = {
				...mockSyncConfig,
				applyChangesToCRDTDoc: jest.fn(
					( ydoc: CRDTDoc, changes: Partial< ObjectData > ) => {
						const recordMap = ydoc.getMap( CRDT_RECORD_MAP_KEY );
						Object.entries( changes ).forEach(
							( [ key, value ] ) => {
								recordMap.set( key, value );
							}
						);
					}
				),
			};
			const handlers = {
				...mockHandlers,
				editRecord: jest.fn(),
				getEditedRecord: jest.fn( async () =>
					Promise.resolve( editedRecord )
				),
			};

			const manager = createSyncManager();

			await manager.load(
				syncConfig,
				'post',
				'123',
				initialRecord,
				handlers
			);

			handlers.editRecord.mockClear();

			// Simulate a remote peer so local updates are applied synchronously.
			// (They are only deferred off the hot path when editing alone.)
			const awareness = manager.getAwareness(
				'post',
				'123'
			) as Awareness;
			awareness.setLocalState( {} );
			awareness.states.set( awareness.clientID + 1, {} );

			manager.update(
				'post',
				'123',
				{ content: 'Local content' },
				LOCAL_EDITOR_ORIGIN
			);

			const remoteDoc = new Y.Doc();
			remoteDoc
				.getMap( CRDT_RECORD_MAP_KEY )
				.set( 'remoteField', 'Remote value' );
			Y.applyUpdateV2(
				capturedDoc as unknown as Y.Doc,
				Y.encodeStateAsUpdateV2( remoteDoc )
			);
			remoteDoc.destroy();

			// Wait for the async remote-to-store observer.
			await new Promise( ( resolve ) => setTimeout( resolve, 0 ) );

			expect( handlers.editRecord ).toHaveBeenCalledTimes( 1 );
			expect( handlers.editRecord ).toHaveBeenCalledWith( {
				remoteField: 'Remote value',
			} );
		} );

		it( 'defers local CRDT updates off the hot path when editing alone', async () => {
			const manager = createSyncManager();

			await manager.load(
				mockSyncConfig,
				'post',
				'123',
				mockRecord,
				mockHandlers
			);

			jest.clearAllMocks();

			manager.update(
				'post',
				'123',
				{ title: 'Updated Title' },
				LOCAL_EDITOR_ORIGIN
			);

			// With no remote peers present, the update is deferred so nothing
			// is applied synchronously on the typing hot path.
			expect(
				mockSyncConfig.applyChangesToCRDTDoc
			).not.toHaveBeenCalled();

			// It is applied on the next tick of the event loop.
			await new Promise( ( resolve ) => setTimeout( resolve, 0 ) );
			expect( mockSyncConfig.applyChangesToCRDTDoc ).toHaveBeenCalled();
		} );

		it( 'applies queued solo updates before a synchronous collaborative update', async () => {
			const manager = createSyncManager();

			await manager.load(
				mockSyncConfig,
				'post',
				'123',
				mockRecord,
				mockHandlers
			);

			jest.clearAllMocks();

			// With no remote peers present, the first update is deferred.
			manager.update(
				'post',
				'123',
				{ title: 'First' },
				LOCAL_EDITOR_ORIGIN
			);
			expect(
				mockSyncConfig.applyChangesToCRDTDoc
			).not.toHaveBeenCalled();

			// Simulate a remote peer joining before the deferred update has
			// been applied.
			const awareness = manager.getAwareness(
				'post',
				'123'
			) as Awareness;
			awareness.setLocalState( {} );
			awareness.states.set( awareness.clientID + 1, {} );

			// The collaborative update is applied synchronously, after the
			// queued update.
			manager.update(
				'post',
				'123',
				{ title: 'Second' },
				LOCAL_EDITOR_ORIGIN
			);

			const appliedChanges =
				mockSyncConfig.applyChangesToCRDTDoc.mock.calls.map(
					( call ) => call[ 1 ]
				);
			expect( appliedChanges ).toEqual( [
				{ title: 'First' },
				{ title: 'Second' },
			] );
		} );

		it( 'does not update when entity is not loaded', async () => {
			const manager = createSyncManager();

			const changes = { title: 'Updated Title' };
			manager.update( 'post', '999', changes, 'local-editor' );

			// Wait a tick for any async follow-up work.
			await new Promise( ( resolve ) => setTimeout( resolve, 0 ) );

			expect(
				mockSyncConfig.applyChangesToCRDTDoc
			).not.toHaveBeenCalled();
		} );

		it( 'applies changes with specified origin', async () => {
			// Capture the Y.Doc from provider creator
			let capturedDoc: Y.Doc | null = null;
			mockProviderCreator.mockImplementation( async ( { ydoc } ) => {
				capturedDoc = ydoc;
				return mockProviderResult;
			} );

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

			// Wait a tick for any async follow-up work.
			await new Promise( ( resolve ) => setTimeout( resolve, 0 ) );

			expect( transactSpy ).toHaveBeenCalledWith(
				expect.any( Function ),
				customOrigin
			);
		} );

		it( 'updates save metadata when the update is associated with a save', async () => {
			// Capture the Y.Doc from provider creator.
			let capturedDoc: Y.Doc | null = null;
			mockProviderCreator.mockImplementation( async ( { ydoc } ) => {
				capturedDoc = ydoc;
				return mockProviderResult;
			} );

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

			manager.update( 'post', '123', changes, 'local-editor', {
				isSave: true,
			} );

			// Wait a tick for any async follow-up work.
			await new Promise( ( resolve ) => setTimeout( resolve, 0 ) );

			// Verify that applyChangesToCRDTDoc was called with the changes.
			expect( mockSyncConfig.applyChangesToCRDTDoc ).toHaveBeenCalledWith(
				expect.any( Y.Doc ),
				changes
			);

			// Verify that the record metadata was updated.
			const ydoc = capturedDoc as unknown as Y.Doc;
			const stateMap = ydoc.getMap( CRDT_STATE_MAP_KEY );
			expect( stateMap.get( SAVED_AT_KEY ) ).toBeGreaterThanOrEqual(
				now
			);
			expect( stateMap.get( SAVED_BY_KEY ) ).toBe( ydoc.clientID );
		} );
	} );

	describe( 'autosave snapshots', () => {
		async function loadEntityCapturingDoc() {
			let capturedDoc: Y.Doc | null = null;
			mockProviderCreator.mockImplementation( async ( { ydoc } ) => {
				capturedDoc = ydoc;
				return mockProviderResult;
			} );

			const manager = createSyncManager();

			await manager.load(
				mockSyncConfig,
				'post',
				'123',
				mockRecord,
				mockHandlers
			);

			return { manager, ydoc: capturedDoc as unknown as Y.Doc };
		}

		it( 'encodes a snapshot the same document satisfies', async () => {
			const { manager, ydoc } = await loadEntityCapturingDoc();

			const stateVectorBefore = Y.encodeStateVector( ydoc );

			const snapshot = manager.getEntitySnapshot( 'post', '123' );

			expect( typeof snapshot ).toBe( 'string' );
			expect(
				manager.entityContainsSnapshot( 'post', '123', snapshot ?? '' )
			).toBe( true );

			// Neither call writes to the document, so the state vector is
			// unchanged and nothing enters the undo scope.
			expect( Y.encodeStateVector( ydoc ) ).toEqual( stateVectorBefore );
			expect( manager.undoManager?.hasUndo() ).toBe( false );
		} );

		it( 'includes updates issued in the same tick in the snapshot', async () => {
			const { manager } = await loadEntityCapturingDoc();

			jest.clearAllMocks();
			mockSyncConfig.applyChangesToCRDTDoc.mockImplementation(
				( ydoc, changes ) => {
					const recordMap = ydoc.getMap( CRDT_RECORD_MAP_KEY );
					Object.entries( changes ).forEach( ( [ key, value ] ) => {
						recordMap.set( key, value );
					} );
				}
			);

			const snapshotBefore = manager.getEntitySnapshot( 'post', '123' );

			// With no remote peers present, this update is deferred to the
			// next tick.
			manager.update(
				'post',
				'123',
				{ title: 'Updated Title' },
				LOCAL_EDITOR_ORIGIN
			);

			const snapshotAfter = manager.getEntitySnapshot( 'post', '123' );

			// The deferred update was applied before the snapshot was
			// encoded, so the snapshot describes state the earlier snapshot
			// does not.
			expect( snapshotAfter ).not.toEqual( snapshotBefore );
		} );

		it( 'still matches after the document moves ahead of the snapshot', async () => {
			const { manager, ydoc } = await loadEntityCapturingDoc();
			const snapshot = manager.getEntitySnapshot( 'post', '123' ) ?? '';

			ydoc.getText( 'later' ).insert( 0, 'more content' );

			expect(
				manager.entityContainsSnapshot( 'post', '123', snapshot )
			).toBe( true );
		} );

		it( 'does not match a snapshot describing content the document lacks', async () => {
			const { manager } = await loadEntityCapturingDoc();

			// A snapshot from an unrelated document, i.e. content this
			// document never received.
			const otherDoc = new Y.Doc();
			otherDoc.getText( 'text' ).insert( 0, 'content from elsewhere' );
			const otherSnapshot = buffer.toBase64(
				Y.encodeSnapshotV2( Y.snapshot( otherDoc ) )
			);

			expect(
				manager.entityContainsSnapshot( 'post', '123', otherSnapshot )
			).toBe( false );
		} );

		it( 'fails open for an undecodable snapshot', async () => {
			const { manager } = await loadEntityCapturingDoc();

			expect(
				manager.entityContainsSnapshot(
					'post',
					'123',
					'not a snapshot!'
				)
			).toBe( false );
		} );

		it( 'fails open for entities that are not loaded', async () => {
			const manager = createSyncManager();

			expect(
				manager.getEntitySnapshot( 'post', '456' )
			).toBeUndefined();
			expect(
				manager.entityContainsSnapshot( 'post', '456', 'anything' )
			).toBe( false );
		} );
	} );

	describe( 'shouldSync', () => {
		it( 'skips loading entity when shouldSync returns false', async () => {
			const manager = createSyncManager();

			mockSyncConfig.shouldSync = jest.fn( () => false );

			await manager.load(
				mockSyncConfig,
				'post',
				'123',
				mockRecord,
				mockHandlers
			);

			expect( mockSyncConfig.shouldSync ).toHaveBeenCalledWith(
				'post',
				'123'
			);
			expect(
				mockSyncConfig.applyChangesToCRDTDoc
			).not.toHaveBeenCalled();
			expect( mockProviderCreator ).not.toHaveBeenCalled();
		} );

		it( 'loads entity when shouldSync returns true', async () => {
			const manager = createSyncManager();

			mockSyncConfig.shouldSync = jest.fn( () => true );

			await manager.load(
				mockSyncConfig,
				'post',
				'123',
				mockRecord,
				mockHandlers
			);

			expect( mockSyncConfig.shouldSync ).toHaveBeenCalledWith(
				'post',
				'123'
			);
			expect(
				mockSyncConfig.applyChangesToCRDTDoc
			).toHaveBeenCalledTimes( 1 );
			expect( mockProviderCreator ).toHaveBeenCalledTimes( 1 );
		} );

		it( 'loads entity when shouldSync is not defined', async () => {
			const manager = createSyncManager();

			delete mockSyncConfig.shouldSync;

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

		it( 'skips loading collection when shouldSync returns false', async () => {
			const manager = createSyncManager();

			mockSyncConfig.shouldSync = jest.fn( () => false );

			const mockCollectionHandlers = {
				onStatusChange: jest.fn(),
				refetchRecords: jest.fn( async () => Promise.resolve() ),
			};

			await manager.loadCollection(
				mockSyncConfig,
				'comment',
				mockCollectionHandlers
			);

			expect( mockSyncConfig.shouldSync ).toHaveBeenCalledWith(
				'comment',
				null
			);
			expect( mockProviderCreator ).not.toHaveBeenCalled();
		} );

		it( 'loads collection when shouldSync returns true', async () => {
			const manager = createSyncManager();

			mockSyncConfig.shouldSync = jest.fn( () => true );

			const mockCollectionHandlers = {
				onStatusChange: jest.fn(),
				refetchRecords: jest.fn( async () => Promise.resolve() ),
			};

			await manager.loadCollection(
				mockSyncConfig,
				'comment',
				mockCollectionHandlers
			);

			expect( mockSyncConfig.shouldSync ).toHaveBeenCalledWith(
				'comment',
				null
			);
			expect( mockProviderCreator ).toHaveBeenCalledTimes( 1 );
		} );

		it( 'loads collection when shouldSync is not defined', async () => {
			const manager = createSyncManager();

			delete mockSyncConfig.shouldSync;

			const mockCollectionHandlers = {
				onStatusChange: jest.fn(),
				refetchRecords: jest.fn( async () => Promise.resolve() ),
			};

			await manager.loadCollection(
				mockSyncConfig,
				'comment',
				mockCollectionHandlers
			);

			expect( mockProviderCreator ).toHaveBeenCalledTimes( 1 );
		} );
	} );

	describe( 'CRDT doc observation', () => {
		it( 'edits the local entity record when remote updates arrive', async () => {
			// Capture the Y.Doc from provider creator.
			let capturedDoc: Y.Doc | null = null;
			mockProviderCreator.mockImplementation( async ( { ydoc } ) => {
				capturedDoc = ydoc;
				return mockProviderResult;
			} );

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

		it( 'refetches the entity record when a remote save updates save metadata', async () => {
			// Capture the Y.Doc from provider creator.
			let capturedDoc: Y.Doc | null = null;
			mockProviderCreator.mockImplementation( async ( { ydoc } ) => {
				capturedDoc = ydoc;
				return mockProviderResult;
			} );

			const manager = createSyncManager();

			await manager.load(
				mockSyncConfig,
				'post',
				'123',
				mockRecord,
				mockHandlers
			);

			mockHandlers.refetchRecord.mockClear();

			expect( capturedDoc ).not.toBeNull();

			const remoteDoc = new Y.Doc();
			const stateMap = remoteDoc.getMap( CRDT_STATE_MAP_KEY );
			stateMap.set( SAVED_AT_KEY, Date.now() + 1000 );
			stateMap.set( SAVED_BY_KEY, remoteDoc.clientID );
			Y.applyUpdateV2(
				capturedDoc as unknown as Y.Doc,
				Y.encodeStateAsUpdateV2( remoteDoc )
			);
			remoteDoc.destroy();

			// Wait a tick.
			await new Promise( ( resolve ) => setTimeout( resolve, 0 ) );

			expect( mockHandlers.refetchRecord ).toHaveBeenCalledTimes( 1 );
		} );

		it( 'does not edit the local record for local transactions', async () => {
			// Capture the Y.Doc from provider creator.
			let capturedDoc: Y.Doc | null = null;
			mockProviderCreator.mockImplementation( async ( { ydoc } ) => {
				capturedDoc = ydoc;
				return mockProviderResult;
			} );

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
