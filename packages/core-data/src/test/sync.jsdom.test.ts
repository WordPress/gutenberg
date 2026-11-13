import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';
import type { EntitySyncManager, EntitySyncRecord } from '../entity-sync';
const { mockSyncManager, mockCreateSyncManager, mockSaveCRDTDoc } = vi.hoisted(
	() => {
		const manager = {
			load: vi.fn(),
			loadCollection: vi.fn(),
			update: vi.fn(),
			unload: vi.fn(),
			unloadAll: vi.fn(),
			getEntitySnapshot: vi.fn(),
			createPersistedCRDTDoc: vi.fn(),
			undoManager: undefined as
				| Record<
						'undo' | 'redo' | 'stopCapturing' | 'clearRedo',
						Mock
				  >
				| undefined,
			isLoaded: vi.fn(),
		};
		return {
			mockSyncManager: manager,
			mockCreateSyncManager: vi.fn( () => manager ),
			mockSaveCRDTDoc: vi.fn(),
		};
	}
);

vi.mock( import( '@wordpress/data' ), () => ( {
	select: vi.fn(),
	dispatch: vi.fn(),
	resolveSelect: vi.fn(),
} ) );

vi.mock(
	import( '@wordpress/sync' ),
	() =>
		( {
			createSyncManager: mockCreateSyncManager,
			ConnectionErrorCode: {},
			Delta: class {},
			CRDT_DOC_META_PERSISTENCE_KEY: 'crdt-doc-meta',
			CRDT_RECORD_MAP_KEY: 'crdt-record',
			LOCAL_EDITOR_ORIGIN: 'local-editor',
			LOCAL_UNDO_IGNORED_ORIGIN: 'local-undo-ignored',
			retrySyncConnection: vi.fn(),
			// Stand-ins for the members the adapter uses.
		} ) as unknown as typeof import( '@wordpress/sync' )
);

vi.mock( import( '../lock-unlock' ), () => ( {
	unlock: < T >( privateApis: unknown ) => privateApis as T,
} ) );

// Keep the adapter's module graph small: the entity configs and the CRDT
// utilities pull in the block library, which does not survive module resets.
vi.mock( import( '../entities' ), () => ( {
	DEFAULT_ENTITY_KEY: 'id' as const,
} ) );

vi.mock( import( '../utils/crdt' ), () => ( {
	POST_META_KEY_FOR_CRDT_DOC_PERSISTENCE: '_crdt_document' as const,
	// Mirrors `getRawValue` in utils/crdt.ts.
	getRawValue: ( value: unknown ) => {
		if ( 'string' === typeof value ) {
			return value;
		}
		if (
			value &&
			'object' === typeof value &&
			'raw' in value &&
			'string' === typeof value.raw
		) {
			return value.raw;
		}
		return undefined;
	},
} ) );

vi.mock( import( '../utils/save-crdt-doc' ), () => ( {
	saveCRDTDoc: mockSaveCRDTDoc,
} ) );

vi.mock( import( '../utils/crdt-edit-batch' ), () => ( {
	applyEditBatchToCRDTDoc: vi.fn(),
} ) );

vi.mock( import( '../utils/crdt-selection' ), () => ( {
	getSelectionHistory: vi.fn(),
	restoreSelection: vi.fn(),
} ) );

async function loadSync() {
	vi.resetModules();
	return import( '../sync' );
}

// Fake store access for the adapter: one entity config, one dispatcher, one
// edited record.
const store = {
	entityConfig: undefined as EntitySyncRecord | undefined,
	editedRecord: undefined,
	dispatcher: { setSyncConnectionStatus: vi.fn() },
	resolver: { getEditedEntityRecord: vi.fn() },
};
const dataAccess = {
	select: () => ( { getEntityConfig: () => store.entityConfig } ),
	dispatch: () => store.dispatcher,
	resolveSelect: () => store.resolver,
};

/**
 * Points the fake store at one entity config.
 *
 * @param entityConfig The entity config `getEntityConfig` returns.
 * @return The private dispatcher the adapter will use.
 */
function mockStore( entityConfig: EntitySyncRecord ) {
	store.entityConfig = entityConfig;
	return store.dispatcher;
}

describe( 'getSyncManager', () => {
	afterEach( () => {
		delete window.__experimentalEnableRealTimeCollaboration;
		mockCreateSyncManager.mockClear();
	} );

	it.each( [ undefined, false ] )(
		'does not create a sync manager when the real-time collaboration flag is %s',
		async ( collaborationEnabled ) => {
			window.__experimentalEnableRealTimeCollaboration =
				collaborationEnabled;
			const { getSyncManager } = await loadSync();

			expect( getSyncManager() ).toBeUndefined();
			expect( mockCreateSyncManager ).not.toHaveBeenCalled();
		}
	);

	it( 'creates and reuses a sync manager when real-time collaboration is enabled', async () => {
		window.__experimentalEnableRealTimeCollaboration = true;
		const { getSyncManager } = await loadSync();

		expect( getSyncManager() ).toBe( mockSyncManager );
		expect( getSyncManager() ).toBe( mockSyncManager );
		expect( mockCreateSyncManager ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'returns an existing sync manager after real-time collaboration is disabled', async () => {
		window.__experimentalEnableRealTimeCollaboration = true;
		const { getSyncManager } = await loadSync();
		const existingSyncManager = getSyncManager();

		window.__experimentalEnableRealTimeCollaboration = false;

		expect( getSyncManager() ).toBe( existingSyncManager );
		expect( mockCreateSyncManager ).toHaveBeenCalledTimes( 1 );
	} );
} );

describe( 'the default entity sync manager', () => {
	afterEach( () => {
		delete window.__experimentalEnableRealTimeCollaboration;
		mockCreateSyncManager.mockClear();
		store.entityConfig = undefined;
		store.dispatcher.setSyncConnectionStatus.mockReset();
		store.resolver.getEditedEntityRecord.mockReset();
		mockSaveCRDTDoc.mockReset();
		for ( const fn of Object.values( mockSyncManager ) ) {
			// The undo manager stand-in is a plain object, which has no reset.
			( fn as Partial< Mock > | undefined )?.mockReset?.();
		}
		mockSyncManager.undoManager = undefined;
	} );

	it( 'is not registered on load, with or without the flag', async () => {
		await loadSync();
		let { getEntitySyncManager } = await import( '../entity-sync' );
		expect( getEntitySyncManager() ).toBeUndefined();

		window.__experimentalEnableRealTimeCollaboration = true;
		await loadSync();
		( { getEntitySyncManager } = await import( '../entity-sync' ) );
		expect( getEntitySyncManager() ).toBeUndefined();
		expect( mockCreateSyncManager ).not.toHaveBeenCalled();
	} );

	describe( 'with the flag on', () => {
		// The default manager implements every optional member; only its undo
		// history waits for a sync manager.
		let manager: Required< Omit< EntitySyncManager, 'undoHistory' > > &
			Pick< EntitySyncManager, 'undoHistory' >;

		beforeEach( async () => {
			window.__experimentalEnableRealTimeCollaboration = true;
			const { createDefaultEntitySyncManager } = await loadSync();
			manager = createDefaultEntitySyncManager(
				dataAccess
			) as typeof manager;
		} );

		it( 'syncs only entities with a sync config', () => {
			mockStore( { syncConfig: {} } );
			expect( manager.shouldSync( 'postType', 'post', 1 ) ).toBe( true );

			mockStore( {} );
			expect( manager.shouldSync( 'postType', 'post', 1 ) ).toBe( false );
			manager.applyEditBatch( 'postType', 'post', 1, {
				operations: [
					{
						type: 'set-field',
						field: 'title',
						previousValue: '',
						value: 'x',
					},
				],
				options: { isCached: false, undoIgnore: false },
			} );
			manager.unload( 'postType', 'post', 1 );
			expect( mockSyncManager.update ).not.toHaveBeenCalled();
			expect( mockSyncManager.unload ).not.toHaveBeenCalled();
		} );

		it( 'loads the record with the Yjs handlers added', async () => {
			const syncConfig = { supportsPersistence: true };
			const dispatcher = mockStore( { syncConfig, key: 'id' } );
			const record = { id: 1, title: 'Post' };
			const handlers = {
				editRecord: vi.fn(),
				getEditedRecord: vi.fn(),
				refetchRecord: vi.fn(),
				onUndoLevelOpened: vi.fn(),
			};

			manager.load( 'postType', 'post', 1, record, handlers );

			expect( mockSyncManager.load ).toHaveBeenCalledWith(
				{
					...syncConfig,
					applyChangesToCRDTDoc: expect.any( Function ),
				},
				'postType/post',
				1,
				record,
				{
					addUndoMeta: expect.any( Function ),
					editRecord: handlers.editRecord,
					getEditedRecord: handlers.getEditedRecord,
					onStatusChange: expect.any( Function ),
					onUndoLevelOpened: handlers.onUndoLevelOpened,
					persistCRDTDoc: expect.any( Function ),
					refetchRecord: handlers.refetchRecord,
					restoreUndoMeta: expect.any( Function ),
				}
			);

			const yjsHandlers = mockSyncManager.load.mock.calls[ 0 ][ 4 ];
			yjsHandlers.onStatusChange( { status: 'connected' } );
			expect( dispatcher.setSyncConnectionStatus ).toHaveBeenCalledWith(
				'postType',
				'post',
				1,
				{ status: 'connected' }
			);
		} );

		it( 'loads a collection with the status handler added', () => {
			const syncConfig = {};
			const dispatcher = mockStore( { syncConfig } );
			const refetchRecords = vi.fn();

			manager.loadCollection( 'root', 'comment', { refetchRecords } );

			expect( mockSyncManager.loadCollection ).toHaveBeenCalledWith(
				syncConfig,
				'root/comment',
				{ onStatusChange: expect.any( Function ), refetchRecords }
			);
			mockSyncManager.loadCollection.mock.calls[ 0 ][ 2 ].onStatusChange(
				null
			);
			expect( dispatcher.setSyncConnectionStatus ).toHaveBeenCalledWith(
				'root',
				'comment',
				null,
				null
			);
		} );

		describe( 'persistCRDTDoc', () => {
			async function loadAndPersist(
				syncConfig: EntitySyncRecord,
				editedRecord: EntitySyncRecord
			) {
				mockStore( { syncConfig, key: 'id' } );
				store.resolver.getEditedEntityRecord.mockImplementation( () =>
					Promise.resolve( editedRecord )
				);
				manager.load(
					'postType',
					'post',
					1,
					{ id: 1 },
					{
						editRecord: vi.fn(),
						getEditedRecord: vi.fn(),
						refetchRecord: vi.fn(),
						onUndoLevelOpened: vi.fn(),
					}
				);
				await mockSyncManager.load.mock.calls[ 0 ][ 4 ].persistCRDTDoc();
			}

			it( 'does nothing when the sync config does not support persistence', async () => {
				await loadAndPersist( {}, { id: 1, meta: {} } );

				expect(
					store.resolver.getEditedEntityRecord
				).not.toHaveBeenCalled();
				expect( mockSaveCRDTDoc ).not.toHaveBeenCalled();
			} );

			it( 'does not persist auto-drafts or entities without meta', async () => {
				await loadAndPersist(
					{ supportsPersistence: true },
					{ id: 1, status: 'auto-draft', meta: {} }
				);
				await loadAndPersist(
					{ supportsPersistence: true },
					{ id: 1, status: 'draft' }
				);

				expect( mockSaveCRDTDoc ).not.toHaveBeenCalled();
			} );

			it( 'persists the document through the sync save endpoint', async () => {
				await loadAndPersist(
					{ supportsPersistence: true },
					{ id: 1, status: 'draft', meta: {} }
				);

				expect( mockSaveCRDTDoc ).toHaveBeenCalledWith(
					'postType/post',
					1
				);
			} );
		} );

		it( 'keeps an intent batch queued until the Yjs transaction applies it', async () => {
			const { applyEditBatchToCRDTDoc } =
				await import( '../utils/crdt-edit-batch' );
			const syncConfig = { applyChangesToCRDTDoc: vi.fn() };
			mockStore( { syncConfig } );
			manager.load(
				'postType',
				'post',
				1,
				{ id: 1 },
				{
					editRecord: vi.fn(),
					getEditedRecord: vi.fn(),
					refetchRecord: vi.fn(),
					onUndoLevelOpened: vi.fn(),
				}
			);
			const batch = {
				operations: [
					{
						type: 'move' as const,
						clientId: 'a',
						parent: null,
						before: 'b',
					},
				],
				options: { isCached: false, undoIgnore: false },
			};
			manager.applyEditBatch( 'postType', 'post', 1, batch );
			expect( applyEditBatchToCRDTDoc ).not.toHaveBeenCalled();
			const queuedChanges = mockSyncManager.update.mock.calls[ 0 ][ 2 ];
			const loadedConfig = mockSyncManager.load.mock.calls[ 0 ][ 0 ];
			const doc = {} as Parameters< typeof applyEditBatchToCRDTDoc >[ 0 ];
			loadedConfig.applyChangesToCRDTDoc( doc, queuedChanges );
			expect( applyEditBatchToCRDTDoc ).toHaveBeenCalledExactlyOnceWith(
				doc,
				batch,
				syncConfig
			);
			expect( syncConfig.applyChangesToCRDTDoc ).not.toHaveBeenCalled();
			// Load and save reconciliation still use the configured snapshot mapper.
			loadedConfig.applyChangesToCRDTDoc( doc, {
				title: 'Server value',
			} );
			expect(
				syncConfig.applyChangesToCRDTDoc
			).toHaveBeenCalledExactlyOnceWith( doc, { title: 'Server value' } );
		} );

		it( 'maps the edit intent to origins and undo levels', () => {
			mockStore( { syncConfig: {} } );

			manager.applyEditBatch( 'postType', 'post', 1, {
				operations: [
					{
						type: 'set-field',
						field: 'title',
						previousValue: '',
						value: 'a',
					},
				],
				options: { isCached: false, undoIgnore: false },
			} );
			manager.applyEditBatch( 'postType', 'post', 1, {
				operations: [
					{
						type: 'set-field',
						field: 'title',
						previousValue: '',
						value: 'b',
					},
				],
				options: { isCached: true, undoIgnore: false },
			} );
			manager.applyEditBatch( 'postType', 'post', 1, {
				operations: [
					{
						type: 'set-field',
						field: 'title',
						previousValue: '',
						value: 'c',
					},
				],
				options: { isCached: false, undoIgnore: true },
			} );

			expect( mockSyncManager.update.mock.calls ).toEqual( [
				[
					'postType/post',
					1,
					{
						[ Object.getOwnPropertySymbols(
							mockSyncManager.update.mock.calls[ 0 ][ 2 ]
						)[ 0 ] ]: {
							operations: [
								{
									type: 'set-field',
									field: 'title',
									previousValue: '',
									value: 'a',
								},
							],
							options: { isCached: false, undoIgnore: false },
						},
					},
					'local-editor',
					{ isNewUndoLevel: true },
				],
				[
					'postType/post',
					1,
					{
						[ Object.getOwnPropertySymbols(
							mockSyncManager.update.mock.calls[ 0 ][ 2 ]
						)[ 0 ] ]: {
							operations: [
								{
									type: 'set-field',
									field: 'title',
									previousValue: '',
									value: 'b',
								},
							],
							options: { isCached: true, undoIgnore: false },
						},
					},
					'local-editor',
					{ isNewUndoLevel: false },
				],
				[
					'postType/post',
					1,
					{
						[ Object.getOwnPropertySymbols(
							mockSyncManager.update.mock.calls[ 0 ][ 2 ]
						)[ 0 ] ]: {
							operations: [
								{
									type: 'set-field',
									field: 'title',
									previousValue: '',
									value: 'c',
								},
							],
							options: { isCached: false, undoIgnore: true },
						},
					},
					'local-undo-ignored',
					{ isNewUndoLevel: false },
				],
			] );
		} );

		describe( 'beforeSave', () => {
			it( 'applies direct save changes to the CRDT before capturing the autosave snapshot', async () => {
				mockStore( { syncConfig: {} } );
				const callOrder: string[] = [];
				mockSyncManager.update.mockImplementation( () =>
					callOrder.push( 'update' )
				);
				mockSyncManager.getEntitySnapshot.mockImplementation( () => {
					callOrder.push( 'snapshot' );
					return 'ENCODED_SNAPSHOT';
				} );
				const record = { id: 10, content: 'Directly autosaved' };

				const result = await manager.beforeSave(
					'postType',
					'post',
					10,
					record,
					{ persistedRecord: { id: 10 }, isAutosave: true }
				);

				expect( mockSyncManager.update ).toHaveBeenCalledWith(
					'postType/post',
					10,
					record,
					'local-undo-ignored'
				);
				expect(
					mockSyncManager.getEntitySnapshot
				).toHaveBeenCalledWith( 'postType/post', 10 );
				expect( callOrder ).toEqual( [ 'update', 'snapshot' ] );
				expect( result ).toEqual( {
					crdt_snapshot: 'ENCODED_SNAPSHOT',
				} );
			} );

			it( 'returns nothing when the entity has no snapshot or no sync config', async () => {
				mockStore( { syncConfig: {} } );
				mockSyncManager.getEntitySnapshot.mockReturnValue( undefined );

				expect(
					await manager.beforeSave(
						'postType',
						'post',
						10,
						{ id: 10 },
						{ persistedRecord: { id: 10 }, isAutosave: true }
					)
				).toBeUndefined();

				mockStore( {} );
				expect(
					await manager.beforeSave(
						'postType',
						'post',
						10,
						{ id: 10 },
						{ persistedRecord: { id: 10 }, isAutosave: true }
					)
				).toBeUndefined();
				expect( mockSyncManager.update ).toHaveBeenCalledTimes( 1 );
			} );

			it( 'adds meta with the serialized CRDT document to a real post save', async () => {
				mockStore( { syncConfig: {} } );
				mockSyncManager.createPersistedCRDTDoc.mockResolvedValue(
					'serialized-crdt-doc-data'
				);
				const edits = { id: 123, meta: { existing: 'value' } };

				const result = await manager.beforeSave(
					'postType',
					'post',
					123,
					edits,
					{
						persistedRecord: { id: 123, status: 'publish' },
						isAutosave: false,
					}
				);

				expect(
					mockSyncManager.createPersistedCRDTDoc
				).toHaveBeenCalledWith( 'postType/post', 123 );
				expect( result ).toEqual( {
					meta: {
						existing: 'value',
						_crdt_document: 'serialized-crdt-doc-data',
					},
				} );
			} );

			it( 'does not persist a document for taxonomies or when none is created', async () => {
				mockStore( { syncConfig: {} } );
				mockSyncManager.createPersistedCRDTDoc.mockResolvedValue(
					null
				);

				expect(
					await manager.beforeSave(
						'postType',
						'post',
						123,
						{ id: 123 },
						{ persistedRecord: { id: 123 }, isAutosave: false }
					)
				).toBeUndefined();
				expect(
					await manager.beforeSave(
						'taxonomy',
						'category',
						5,
						{ id: 5 },
						{ persistedRecord: { id: 5 }, isAutosave: false }
					)
				).toBeUndefined();
				expect(
					mockSyncManager.createPersistedCRDTDoc
				).toHaveBeenCalledTimes( 1 );
			} );

			it( 'does not flush edits without a persisted record', async () => {
				mockStore( { syncConfig: {} } );

				await manager.beforeSave(
					'postType',
					'post',
					10,
					{ id: 10 },
					{ persistedRecord: undefined, isAutosave: false }
				);

				expect( mockSyncManager.update ).not.toHaveBeenCalled();
			} );
		} );

		describe( 'afterSave', () => {
			beforeEach( () => {
				mockStore( { syncConfig: {} } );
			} );

			function afterSave(
				savedRecord: EntitySyncRecord,
				persistedRecord: EntitySyncRecord | undefined,
				edits: EntitySyncRecord
			) {
				manager.afterSave( 'postType', 'post', 10, {
					savedRecord,
					persistedRecord,
					edits,
				} );
				return mockSyncManager.update.mock.calls[ 0 ];
			}

			it( 'only passes server-mutated fields', () => {
				const persistedRecord = {
					id: 10,
					title: 'Initial title',
					content: 'Initial content',
					template: 'single',
					modified: '2026-07-01T00:00:00',
				};
				const edits = { id: 10, content: 'Updated content' };

				expect(
					afterSave(
						{
							...persistedRecord,
							content: edits.content,
							modified: '2026-07-02T00:00:00',
						},
						persistedRecord,
						edits
					)
				).toEqual( [
					'postType/post',
					10,
					{ modified: '2026-07-02T00:00:00' },
					'local-undo-ignored',
					{ isSave: true },
				] );
			} );

			it( 'does not pass unchanged meta fields or the persisted document', () => {
				const persistedRecord = {
					id: 10,
					content: 'Initial content',
					meta: {
						plugin_value: 'persisted',
						peer_value: 'persisted',
						_crdt_document: 'old-doc',
					},
				};
				const edits = { id: 10, content: 'Updated content' };

				expect(
					afterSave(
						{
							...persistedRecord,
							content: edits.content,
							meta: {
								plugin_value: 'persisted',
								peer_value: 'persisted',
								_crdt_document: 'new-doc',
							},
						},
						persistedRecord,
						edits
					)[ 2 ]
				).toEqual( {} );
			} );

			it( 'passes only server-mutated meta fields', () => {
				const persistedRecord = {
					id: 10,
					meta: {
						unchanged: 'persisted',
						peer_value: 'persisted',
						edited: 'initial',
						server_mutated: 'before',
						settings: { color: 'blue', size: 'small' },
					},
				};
				const edits = {
					id: 10,
					meta: {
						edited: 'local',
						server_mutated: 'Needs Normalizing',
					},
				};

				expect(
					afterSave(
						{
							id: 10,
							meta: {
								unchanged: 'persisted',
								peer_value: 'persisted',
								edited: 'local',
								server_mutated: 'needs-normalizing',
								settings: { color: 'red', size: 'small' },
								_crdt_document: 'new-doc',
							},
						},
						persistedRecord,
						edits
					)[ 2 ]
				).toEqual( {
					meta: {
						server_mutated: 'needs-normalizing',
						settings: { color: 'red', size: 'small' },
					},
				} );
			} );

			it( 'passes server-normalized edited fields', () => {
				expect(
					afterSave(
						{ id: 10, slug: 'needs-normalizing' },
						{ id: 10, slug: 'initial-slug' },
						{ id: 10, slug: 'Needs Normalizing' }
					)[ 2 ]
				).toEqual( { slug: 'needs-normalizing' } );
			} );

			it( 'does not treat the raw/rendered shape of raw attributes as a mutation', () => {
				// The raw entity record holds raw strings while the save
				// response nests them as `{ raw, rendered }`.
				const persistedRecord = {
					id: 10,
					title: 'Initial title',
					content: '<p>Initial content</p>',
					excerpt: 'Initial excerpt',
					slug: 'initial-slug',
					modified: '2026-07-01T00:00:00',
				};

				expect(
					afterSave(
						{
							id: 10,
							title: {
								raw: 'Initial title',
								rendered: 'Initial title',
							},
							content: {
								raw: '<p>Initial content</p>',
								rendered: '<p>Initial content</p>',
							},
							excerpt: {
								raw: 'Initial excerpt',
								rendered: 'Initial excerpt',
							},
							slug: 'updated-slug',
							modified: '2026-07-02T00:00:00',
						},
						persistedRecord,
						{ id: 10, slug: 'updated-slug' }
					)[ 2 ]
				).toEqual( { modified: '2026-07-02T00:00:00' } );
			} );

			it( 'does not pass edited raw attributes the server echoes unchanged', () => {
				const edits = { id: 10, content: '<p>Updated content</p>' };

				expect(
					afterSave(
						{
							id: 10,
							content: {
								raw: edits.content,
								// Only raw values are compared.
								rendered:
									'<p class="rendered">Updated content</p>\n',
							},
							modified: '2026-07-02T00:00:00',
						},
						{
							id: 10,
							content: '<p>Initial content</p>',
							modified: '2026-07-01T00:00:00',
						},
						edits
					)[ 2 ]
				).toEqual( { modified: '2026-07-02T00:00:00' } );
			} );

			it( 'passes raw attributes whose raw value the server mutated', () => {
				// The server strips disallowed markup from the sent content.
				const content = {
					raw: '<p>Content with bad markup</p>',
					rendered: '<p>Content with bad markup</p>',
				};

				expect(
					afterSave(
						{ id: 10, content },
						{ id: 10, content: '<p>Initial content</p>' },
						{
							id: 10,
							content:
								'<p>Content with <script>bad</script> markup</p>',
						}
					)[ 2 ]
				).toEqual( { content } );
			} );

			it( 'passes the full save response when the persisted record is missing', () => {
				const savedRecord = {
					id: 10,
					content: 'Updated content',
					template: 'single',
				};

				expect(
					afterSave( savedRecord, undefined, {
						id: 10,
						content: 'Updated content',
					} )[ 2 ]
				).toBe( savedRecord );
			} );

			it( 'reports a new record without an object id', () => {
				const savedRecord = { id: 11, title: 'New' };

				manager.afterSave( 'postType', 'post', undefined, {
					savedRecord,
					persistedRecord: undefined,
					edits: { title: 'New' },
				} );

				expect( mockSyncManager.update ).toHaveBeenCalledWith(
					'postType/post',
					null,
					savedRecord,
					'local-undo-ignored',
					{ isSave: true }
				);
			} );
		} );

		it( 'unloads a synced record', () => {
			mockStore( { syncConfig: {} } );

			manager.unload( 'postType', 'post', 1 );

			expect( mockSyncManager.unload ).toHaveBeenCalledWith(
				'postType/post',
				1
			);
		} );

		it( 'unloads everything only once a sync manager exists', async () => {
			const { getSyncManager } = await import( '../sync' );

			manager.unloadAll();
			expect( mockSyncManager.unloadAll ).not.toHaveBeenCalled();

			getSyncManager();
			manager.unloadAll();
			expect( mockSyncManager.unloadAll ).toHaveBeenCalledTimes( 1 );
		} );

		it( 'exposes the sync undo history only once a sync manager exists', async () => {
			const { getSyncManager } = await import( '../sync' );
			mockSyncManager.undoManager = {
				undo: vi.fn( () => true ),
				redo: vi.fn( () => false ),
				stopCapturing: vi.fn(),
				clearRedo: vi.fn(),
			};

			expect( manager.undoHistory ).toBeUndefined();

			getSyncManager();

			// Levels are moved for the record that opened them.
			expect( manager.undoHistory!.undo( 'postType', 'post', 1 ) ).toBe(
				true
			);
			expect( mockSyncManager.undoManager!.undo ).toHaveBeenCalledWith(
				'postType/post',
				1
			);
			expect( manager.undoHistory!.redo( 'postType', 'post', 1 ) ).toBe(
				false
			);
			expect( mockSyncManager.undoManager!.redo ).toHaveBeenCalledWith(
				'postType/post',
				1
			);

			manager.undoHistory!.stopCapturing();
			manager.undoHistory!.clearRedo();
			expect(
				mockSyncManager.undoManager!.stopCapturing
			).toHaveBeenCalledTimes( 1 );
			expect(
				mockSyncManager.undoManager!.clearRedo
			).toHaveBeenCalledTimes( 1 );
		} );

		it( 'reports a record as loaded when the sync manager has it loaded', async () => {
			const { getSyncManager } = await import( '../sync' );
			mockSyncManager.isLoaded.mockReturnValue( true );

			// Nothing is loaded before a sync manager exists.
			expect( manager.isLoaded( 'postType', 'post', 1 ) ).toBe( false );
			expect( mockCreateSyncManager ).not.toHaveBeenCalled();

			getSyncManager();

			expect( manager.isLoaded( 'postType', 'post', 1 ) ).toBe( true );
			expect( mockSyncManager.isLoaded ).toHaveBeenCalledWith(
				'postType/post',
				1
			);

			mockSyncManager.isLoaded.mockReturnValue( false );
			expect( manager.isLoaded( 'postType', 'post', 2 ) ).toBe( false );
		} );
	} );
} );

describe( 'registerEntitySyncProvider', () => {
	afterEach( () => {
		delete window.__experimentalEnableRealTimeCollaboration;
		mockCreateSyncManager.mockClear();
	} );

	it( 'leaves the editor without a provider when none registers', async () => {
		window.__experimentalEnableRealTimeCollaboration = true;
		const sync = await loadSync();
		expect( sync.getSyncServices() ).toBeUndefined();
		expect( sync.isSyncEngineUnavailable() ).toBe( false );
		expect(
			sync.getEntitySnapshot( 'postType', 'post', 1 )
		).toBeUndefined();
		expect(
			sync.entityContainsSnapshot( 'postType', 'post', 1, 'snapshot' )
		).toBe( false );
		sync.retrySyncConnection();
		expect( mockCreateSyncManager ).not.toHaveBeenCalled();
	} );

	it( 'constructs the first provider with the record operations and routes editor reads to it', async () => {
		window.__experimentalEnableRealTimeCollaboration = true;
		const sync = await loadSync();
		const services = {
			isAvailable: () => false,
			getEntitySnapshot: vi.fn( () => 'plugin snapshot' ),
			entityContainsSnapshot: vi.fn( () => true ),
			retry: vi.fn(),
		};
		const create = vi.fn(
			() => ( { services } ) as unknown as EntitySyncManager
		);
		const cleanup = sync.registerEntitySyncProvider( create );
		expect( create ).toHaveBeenCalledWith(
			expect.objectContaining( {
				getSyncConfig: expect.any( Function ),
				recordHandlers: expect.any( Function ),
				collectionHandlers: expect.any( Function ),
			} )
		);
		expect( sync.getSyncServices() ).toBe( services );
		expect( sync.isSyncEngineUnavailable() ).toBe( true );
		expect( sync.getEntitySnapshot( 'postType', 'post', 1 ) ).toBe(
			'plugin snapshot'
		);
		expect( services.getEntitySnapshot ).toHaveBeenCalledWith(
			'postType/post',
			'1'
		);
		expect(
			sync.entityContainsSnapshot( 'postType', 'post', 1, 'snapshot' )
		).toBe( true );
		sync.retrySyncConnection();
		expect( services.retry ).toHaveBeenCalledOnce();

		// A second provider is ignored while the first is registered.
		const ignored = vi.fn();
		sync.registerEntitySyncProvider( ignored )();
		expect( ignored ).not.toHaveBeenCalled();
		expect( sync.getSyncServices() ).toBe( services );
		expect( mockCreateSyncManager ).not.toHaveBeenCalled();

		cleanup();
		expect( sync.getSyncServices() ).toBeUndefined();
	} );

	it( 'does not construct a provider while collaboration is disabled', async () => {
		window.__experimentalEnableRealTimeCollaboration = false;
		const sync = await loadSync();
		const create = vi.fn();
		sync.registerEntitySyncProvider( create )();
		expect( create ).not.toHaveBeenCalled();
	} );
} );
