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
import { deserializeCrdtDoc, serializeCrdtDoc } from '../utils';

// Mock dependencies.
jest.mock( '../providers', () => ( {
	getProviderCreators: jest.fn(),
} ) );
const mockGetProviderCreators = jest.mocked( getProviderCreators );

async function createRequiredPersistedSnapshot(
	manager: ReturnType< typeof createSyncManager >
) {
	const snapshot = await manager.createPersistedCRDTSnapshot( 'post', '123' );
	if ( ! snapshot ) {
		throw new Error( 'Expected a persisted CRDT snapshot.' );
	}
	return snapshot;
}

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

		describe( 'persisted CRDT access', () => {
			function createSerializedRecordDoc( record: ObjectData ): string {
				const doc = new Y.Doc();
				const recordMap = doc.getMap( CRDT_RECORD_MAP_KEY );
				Object.entries( record ).forEach( ( [ key, value ] ) => {
					recordMap.set( key, value );
				} );
				const serialized = serializeCrdtDoc( doc );
				doc.destroy();
				return serialized;
			}

			function createLifecycleSyncConfig() {
				return {
					...mockSyncConfig,
					applyChangesToCRDTDoc: jest.fn(
						( ydoc: CRDTDoc, changes: Partial< ObjectData > ) => {
							const recordMap =
								ydoc.getMap( CRDT_RECORD_MAP_KEY );
							Object.entries( changes ).forEach(
								( [ key, value ] ) => {
									if ( key !== 'selection' ) {
										recordMap.set( key, value );
									}
								}
							);
						}
					),
					getPersistedCRDTDoc: jest.fn(
						( record: ObjectData ) =>
							(
								record.meta as
									| { persisted?: string }
									| undefined
							 )?.persisted ?? null
					),
					shouldInvalidateSnapshot: (
						changes: Partial< ObjectData >
					) =>
						Object.keys( changes ).some(
							( key ) => key !== 'selection'
						),
				};
			}

			async function getLiveRecord(
				manager: ReturnType< typeof createSyncManager >,
				objectId = '123'
			): Promise< ObjectData > {
				const serialized = await manager.createPersistedCRDTDoc(
					'post',
					objectId
				);
				const doc = deserializeCrdtDoc( serialized ?? '' );
				if ( ! doc ) {
					throw new Error( 'Expected a live CRDT document.' );
				}
				const record = doc.getMap( CRDT_RECORD_MAP_KEY ).toJSON();
				doc.destroy();
				return record;
			}

			it( 'creates a detached candidate and commits it to the same live document', async () => {
				const initialRecord = {
					id: '123',
					title: 'Local title',
					meta: {},
				};
				const persistedDoc = new Y.Doc();
				persistedDoc
					.getMap( CRDT_RECORD_MAP_KEY )
					.set( 'remoteField', 'Remote value' );
				const serializedPersistedDoc = serializeCrdtDoc( persistedDoc );
				const syncConfig = {
					...mockSyncConfig,
					applyChangesToCRDTDoc: jest.fn(
						( ydoc: CRDTDoc, changes: Partial< ObjectData > ) => {
							const recordMap =
								ydoc.getMap( CRDT_RECORD_MAP_KEY );
							Object.entries( changes ).forEach(
								( [ key, value ] ) =>
									recordMap.set( key, value )
							);
						}
					),
					getChangesFromCRDTDoc: jest.fn( () => ( {} ) ),
					getPersistedCRDTDoc: jest.fn(
						( record: ObjectData ) =>
							(
								record.meta as
									| { persisted?: string }
									| undefined
							 )?.persisted ?? null
					),
				};
				const manager = createSyncManager();

				await manager.load(
					syncConfig,
					'post',
					'123',
					initialRecord,
					mockHandlers
				);

				const latestRecord = {
					...initialRecord,
					meta: { persisted: serializedPersistedDoc },
				};
				mockHandlers.persistCRDTDoc.mockClear();
				const localSnapshot =
					await createRequiredPersistedSnapshot( manager );
				const candidate = await manager.createRebasedPersistedCRDTDoc(
					'post',
					'123',
					latestRecord,
					localSnapshot
				);
				expect( candidate?.record ).toEqual( {
					...initialRecord,
					remoteField: 'Remote value',
				} );
				expect( candidate?.serializedDoc ).toEqual(
					expect.any( String )
				);

				const beforeCommit = deserializeCrdtDoc(
					( await manager.createPersistedCRDTDoc( 'post', '123' ) ) ??
						''
				);
				expect(
					beforeCommit
						?.getMap( CRDT_RECORD_MAP_KEY )
						.has( 'remoteField' )
				).toBe( false );
				beforeCommit?.destroy();
				expect( mockHandlers.editRecord ).not.toHaveBeenCalled();

				if ( ! candidate ) {
					throw new Error( 'Expected a rebased CRDT candidate.' );
				}
				expect( await candidate.commit() ).toBe( true );
				const afterCommit = deserializeCrdtDoc(
					( await manager.createPersistedCRDTDoc( 'post', '123' ) ) ??
						''
				);
				expect(
					afterCommit
						?.getMap( CRDT_RECORD_MAP_KEY )
						.get( 'remoteField' )
				).toBe( 'Remote value' );
				afterCommit?.destroy();

				// Committing the exact same Yjs update again is idempotent.
				expect( await candidate.commit() ).toBe( true );
				expect( mockHandlers.persistCRDTDoc ).not.toHaveBeenCalled();

				persistedDoc.destroy();
			} );

			it( 'does not replace local state from an invalid persisted document during a save-time rebase', async () => {
				const initialRecord = {
					id: '123',
					title: 'Unsaved local title',
					meta: {},
				};
				const syncConfig = {
					...mockSyncConfig,
					applyChangesToCRDTDoc: jest.fn(
						( ydoc: CRDTDoc, changes: Partial< ObjectData > ) => {
							const recordMap =
								ydoc.getMap( CRDT_RECORD_MAP_KEY );
							Object.entries( changes ).forEach(
								( [ key, value ] ) =>
									recordMap.set( key, value )
							);
						}
					),
					getPersistedCRDTDoc: jest.fn(
						( record: ObjectData ) =>
							(
								record.meta as
									| { persisted?: string }
									| undefined
							 )?.persisted ?? null
					),
				};
				const manager = createSyncManager();

				await manager.load(
					syncConfig,
					'post',
					'123',
					initialRecord,
					mockHandlers
				);
				syncConfig.applyChangesToCRDTDoc.mockClear();
				mockHandlers.persistCRDTDoc.mockClear();
				const beforeRebase =
					await createRequiredPersistedSnapshot( manager );

				await expect(
					manager.createRebasedPersistedCRDTDoc(
						'post',
						'123',
						{
							...initialRecord,
							title: 'New server title',
							meta: {
								persisted: 'not a serialized Yjs document',
							},
						},
						beforeRebase
					)
				).rejects.toThrow( 'Invalid persisted CRDT document.' );
				const afterRebase = await manager.createPersistedCRDTDoc(
					'post',
					'123'
				);
				expect( JSON.parse( afterRebase ?? '' ).document ).toBe(
					JSON.parse( beforeRebase.serializedDoc ).document
				);
				expect(
					syncConfig.applyChangesToCRDTDoc
				).not.toHaveBeenCalled();
				expect( mockHandlers.persistCRDTDoc ).not.toHaveBeenCalled();
			} );

			it( 'rejects a valid document that is missing a required record field', async () => {
				const initialRecord = { id: '123', content: 'Local content' };
				const emptyDoc = new Y.Doc();
				const serializedEmptyDoc = serializeCrdtDoc( emptyDoc );
				const syncConfig = {
					...mockSyncConfig,
					getPersistedCRDTDoc: jest.fn(
						( record: ObjectData ) =>
							(
								record.meta as
									| { persisted?: string }
									| undefined
							 )?.persisted ?? null
					),
				};
				const manager = createSyncManager();

				await manager.load(
					syncConfig,
					'post',
					'123',
					initialRecord,
					mockHandlers
				);

				await expect(
					manager.createRebasedPersistedCRDTDoc(
						'post',
						'123',
						{
							...initialRecord,
							meta: { persisted: serializedEmptyDoc },
						},
						await createRequiredPersistedSnapshot( manager ),
						[ 'content' ]
					)
				).rejects.toThrow(
					'Persisted CRDT document is missing required fields: content.'
				);

				emptyDoc.destroy();
			} );

			it( 'rejects independently initialized field roots despite unrelated shared history', async () => {
				const commonDoc = new Y.Doc();
				commonDoc.getMap( CRDT_RECORD_MAP_KEY ).set( 'version', 1 );
				const serializedCommonDoc = serializeCrdtDoc( commonDoc );
				const syncConfig = {
					...mockSyncConfig,
					applyChangesToCRDTDoc: jest.fn(
						( ydoc: CRDTDoc, changes: Partial< ObjectData > ) => {
							const recordMap =
								ydoc.getMap( CRDT_RECORD_MAP_KEY );
							Object.entries( changes ).forEach(
								( [ key, value ] ) => {
									if ( key === 'content' ) {
										recordMap.set(
											key,
											new Y.Text( String( value ) )
										);
									} else {
										recordMap.set( key, value );
									}
								}
							);
						}
					),
					getChangesFromCRDTDoc: jest.fn( () => ( {} ) ),
					getPersistedCRDTDoc: jest.fn(
						( record: ObjectData ) =>
							(
								record.meta as
									| { persisted?: string }
									| undefined
							 )?.persisted ?? null
					),
				};
				const manager = createSyncManager();

				await manager.load(
					syncConfig,
					'post',
					'123',
					{
						id: '123',
						meta: { persisted: serializedCommonDoc },
					},
					mockHandlers
				);
				manager.update(
					'post',
					'123',
					{ content: 'local content' },
					LOCAL_EDITOR_ORIGIN
				);

				const serverDoc = new Y.Doc();
				Y.applyUpdateV2(
					serverDoc,
					Y.encodeStateAsUpdateV2( commonDoc )
				);
				serverDoc
					.getMap( CRDT_RECORD_MAP_KEY )
					.set( 'content', new Y.Text( 'server content' ) );
				const localSnapshot =
					await createRequiredPersistedSnapshot( manager );

				await expect(
					manager.createRebasedPersistedCRDTDoc(
						'post',
						'123',
						{
							id: '123',
							content: 'server content',
							meta: { persisted: serializeCrdtDoc( serverDoc ) },
						},
						localSnapshot,
						[ 'content' ],
						true,
						[ 'content' ]
					)
				).rejects.toThrow(
					'Persisted CRDT fields do not share roots with the local document: content.'
				);

				commonDoc.destroy();
				serverDoc.destroy();
			} );

			it( 'repairs a stale candidate without persisting it during a save-time rebase', async () => {
				const initialRecord = {
					id: '123',
					title: 'Unsaved local title',
					meta: {},
				};
				const persistedDoc = new Y.Doc();
				persistedDoc
					.getMap( CRDT_RECORD_MAP_KEY )
					.set( 'title', 'Older persisted title' );
				const serializedPersistedDoc = serializeCrdtDoc( persistedDoc );
				const syncConfig = {
					...mockSyncConfig,
					applyChangesToCRDTDoc: jest.fn(
						( ydoc: CRDTDoc, changes: Partial< ObjectData > ) => {
							const recordMap =
								ydoc.getMap( CRDT_RECORD_MAP_KEY );
							Object.entries( changes ).forEach(
								( [ key, value ] ) =>
									recordMap.set( key, value )
							);
						}
					),
					getPersistedCRDTDoc: jest.fn(
						( record: ObjectData ) =>
							(
								record.meta as
									| { persisted?: string }
									| undefined
							 )?.persisted ?? null
					),
				};
				const manager = createSyncManager();

				await manager.load(
					syncConfig,
					'post',
					'123',
					initialRecord,
					mockHandlers
				);
				syncConfig.applyChangesToCRDTDoc.mockClear();
				mockHandlers.persistCRDTDoc.mockClear();
				const localSnapshot =
					await createRequiredPersistedSnapshot( manager );

				const candidate = await manager.createRebasedPersistedCRDTDoc(
					'post',
					'123',
					{
						...initialRecord,
						title: 'New server title',
						meta: { persisted: serializedPersistedDoc },
					},
					localSnapshot
				);
				expect( candidate ).not.toBeNull();
				expect( syncConfig.applyChangesToCRDTDoc ).toHaveBeenCalledWith(
					expect.any( Y.Doc ),
					{
						title: 'New server title',
					}
				);
				expect( mockHandlers.persistCRDTDoc ).not.toHaveBeenCalled();

				persistedDoc.destroy();
			} );

			it( 'rejects preparing a candidate after a deferred material edit', async () => {
				const serializedPersistedDoc = createSerializedRecordDoc( {
					remoteField: 'Remote value',
				} );
				const syncConfig = createLifecycleSyncConfig();
				const manager = createSyncManager();

				await manager.load(
					syncConfig,
					'post',
					'123',
					mockRecord,
					mockHandlers
				);
				mockHandlers.editRecord.mockClear();
				const localSnapshot =
					await createRequiredPersistedSnapshot( manager );

				manager.update(
					'post',
					'123',
					{ title: 'Late local title' },
					LOCAL_EDITOR_ORIGIN
				);

				await expect(
					manager.createRebasedPersistedCRDTDoc(
						'post',
						'123',
						{
							...mockRecord,
							remoteField: 'Remote value',
							meta: { persisted: serializedPersistedDoc },
						},
						localSnapshot
					)
				).rejects.toThrow(
					'Local record changed while checking the latest record.'
				);

				expect( await getLiveRecord( manager ) ).toMatchObject( {
					title: 'Late local title',
				} );
				expect( await getLiveRecord( manager ) ).not.toHaveProperty(
					'remoteField'
				);
				expect( mockHandlers.editRecord ).not.toHaveBeenCalled();
			} );

			it( 'does not invalidate a snapshot for a selection-only update', async () => {
				const serializedPersistedDoc = createSerializedRecordDoc( {
					remoteField: 'Remote value',
				} );
				const syncConfig = createLifecycleSyncConfig();
				const manager = createSyncManager();

				await manager.load(
					syncConfig,
					'post',
					'123',
					mockRecord,
					mockHandlers
				);
				const localSnapshot =
					await createRequiredPersistedSnapshot( manager );
				manager.update(
					'post',
					'123',
					{ selection: { anchor: 1 } },
					LOCAL_EDITOR_ORIGIN
				);

				const candidate = await manager.createRebasedPersistedCRDTDoc(
					'post',
					'123',
					{
						...mockRecord,
						remoteField: 'Remote value',
						meta: { persisted: serializedPersistedDoc },
					},
					localSnapshot
				);

				expect( candidate ).not.toBeNull();
				expect( await candidate?.commit() ).toBe( true );
				expect( await getLiveRecord( manager ) ).toMatchObject( {
					remoteField: 'Remote value',
				} );
			} );

			it( 'does not commit a candidate after a late material update', async () => {
				const serializedPersistedDoc = createSerializedRecordDoc( {
					remoteField: 'Remote value',
				} );
				const syncConfig = createLifecycleSyncConfig();
				const manager = createSyncManager();

				await manager.load(
					syncConfig,
					'post',
					'123',
					mockRecord,
					mockHandlers
				);
				mockHandlers.editRecord.mockClear();
				const localSnapshot =
					await createRequiredPersistedSnapshot( manager );
				const candidate = await manager.createRebasedPersistedCRDTDoc(
					'post',
					'123',
					{
						...mockRecord,
						remoteField: 'Remote value',
						meta: { persisted: serializedPersistedDoc },
					},
					localSnapshot
				);
				if ( ! candidate ) {
					throw new Error( 'Expected a rebased CRDT candidate.' );
				}

				manager.update(
					'post',
					'123',
					{ title: 'Late local title' },
					LOCAL_EDITOR_ORIGIN
				);
				await new Promise( ( resolve ) => setTimeout( resolve, 0 ) );

				expect( await candidate.commit() ).toBe( false );
				expect( await getLiveRecord( manager ) ).toMatchObject( {
					title: 'Late local title',
				} );
				expect( await getLiveRecord( manager ) ).not.toHaveProperty(
					'remoteField'
				);
				expect( mockHandlers.editRecord ).not.toHaveBeenCalled();
			} );

			it( 'rechecks the snapshot after awaiting the edited record during commit', async () => {
				const serializedPersistedDoc = createSerializedRecordDoc( {
					remoteField: 'Remote value',
				} );
				const syncConfig = createLifecycleSyncConfig();
				const manager = createSyncManager();

				await manager.load(
					syncConfig,
					'post',
					'123',
					mockRecord,
					mockHandlers
				);
				mockHandlers.editRecord.mockClear();
				const localSnapshot =
					await createRequiredPersistedSnapshot( manager );
				const candidate = await manager.createRebasedPersistedCRDTDoc(
					'post',
					'123',
					{
						...mockRecord,
						remoteField: 'Remote value',
						meta: { persisted: serializedPersistedDoc },
					},
					localSnapshot
				);
				if ( ! candidate ) {
					throw new Error( 'Expected a rebased CRDT candidate.' );
				}

				let resolveEditedRecord:
					| ( ( record: ObjectData ) => void )
					| undefined;
				const editedRecord = new Promise< ObjectData >( ( resolve ) => {
					resolveEditedRecord = resolve;
				} );
				mockHandlers.getEditedRecord.mockReturnValueOnce(
					editedRecord
				);
				const commit = candidate.commit();
				expect( mockHandlers.getEditedRecord ).toHaveBeenCalled();

				manager.update(
					'post',
					'123',
					{ title: 'Late local title' },
					LOCAL_EDITOR_ORIGIN
				);
				resolveEditedRecord?.( mockRecord );

				expect( await commit ).toBe( false );
				await new Promise( ( resolve ) => setTimeout( resolve, 0 ) );
				expect( await getLiveRecord( manager ) ).toMatchObject( {
					title: 'Late local title',
				} );
				expect( await getLiveRecord( manager ) ).not.toHaveProperty(
					'remoteField'
				);
				expect( mockHandlers.editRecord ).not.toHaveBeenCalled();
			} );

			it( 'rejects a snapshot captured for a different entity', async () => {
				const serializedPersistedDoc = createSerializedRecordDoc( {
					remoteField: 'Remote value',
				} );
				const syncConfig = createLifecycleSyncConfig();
				const manager = createSyncManager();
				const otherRecord = {
					id: '456',
					title: 'Other post',
					meta: {},
				};
				const otherHandlers = {
					...mockHandlers,
					getEditedRecord: jest.fn( async () => otherRecord ),
				};

				await manager.load(
					syncConfig,
					'post',
					'123',
					mockRecord,
					mockHandlers
				);
				await manager.load(
					syncConfig,
					'post',
					'456',
					otherRecord,
					otherHandlers
				);
				const snapshot =
					await createRequiredPersistedSnapshot( manager );

				await expect(
					manager.createRebasedPersistedCRDTDoc(
						'post',
						'456',
						{
							...otherRecord,
							remoteField: 'Remote value',
							meta: { persisted: serializedPersistedDoc },
						},
						snapshot
					)
				).rejects.toThrow(
					'Local CRDT snapshot does not belong to this entity.'
				);
				expect(
					await getLiveRecord( manager, '456' )
				).not.toHaveProperty( 'remoteField' );
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
