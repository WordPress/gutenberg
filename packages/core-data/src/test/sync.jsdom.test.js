import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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
			undoManager: undefined,
		};
		return {
			mockSyncManager: manager,
			mockCreateSyncManager: vi.fn( () => manager ),
			mockSaveCRDTDoc: vi.fn(),
		};
	}
);

vi.mock( '@wordpress/sync', () => ( {
	privateApis: {
		createSyncManager: mockCreateSyncManager,
		ConnectionErrorCode: {},
		Delta: class {},
		CRDT_DOC_META_PERSISTENCE_KEY: 'crdt-doc-meta',
		CRDT_RECORD_MAP_KEY: 'crdt-record',
		LOCAL_EDITOR_ORIGIN: 'local-editor',
		LOCAL_UNDO_IGNORED_ORIGIN: 'local-undo-ignored',
		retrySyncConnection: vi.fn(),
	},
} ) );

vi.mock( '../lock-unlock', () => ( {
	unlock: ( privateApis ) => privateApis,
} ) );

// Keep the adapter's module graph small: the entity configs and the CRDT
// utilities pull in the block library, which does not survive module resets.
vi.mock( '../entities', () => ( {
	DEFAULT_ENTITY_KEY: 'id',
} ) );

vi.mock( '../utils/crdt', () => ( {
	POST_META_KEY_FOR_CRDT_DOC_PERSISTENCE: '_crdt_document',
	// Mirrors `getRawValue` in utils/crdt.ts.
	getRawValue: ( value ) => {
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

vi.mock( '../utils/save-crdt-doc', () => ( {
	saveCRDTDoc: mockSaveCRDTDoc,
} ) );

vi.mock( '../utils/crdt-selection', () => ( {
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
	entityConfig: undefined,
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
 * @param {Object} entityConfig The entity config `getEntityConfig` returns.
 * @return {Object} The private dispatcher the adapter will use.
 */
function mockStore( entityConfig ) {
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
			fn?.mockReset?.();
		}
		mockSyncManager.undoManager = undefined;
	} );

	it( 'registers itself through the interface only when the flag is on', async () => {
		await loadSync();
		let { getEntitySyncManager } = await import( '../entity-sync' );
		expect( getEntitySyncManager() ).toBeUndefined();

		window.__experimentalEnableRealTimeCollaboration = true;
		await loadSync();
		( { getEntitySyncManager } = await import( '../entity-sync' ) );
		expect( getEntitySyncManager() ).toEqual(
			expect.objectContaining( {
				load: expect.any( Function ),
				update: expect.any( Function ),
				unloadAll: expect.any( Function ),
			} )
		);
	} );

	describe( 'with the flag on', () => {
		let manager;

		beforeEach( async () => {
			window.__experimentalEnableRealTimeCollaboration = true;
			const { createDefaultEntitySyncManager } = await loadSync();
			manager = createDefaultEntitySyncManager( dataAccess );
		} );

		it( 'syncs only entities with a sync config', () => {
			mockStore( { syncConfig: {} } );
			expect( manager.shouldSync( 'postType', 'post', 1 ) ).toBe( true );

			mockStore( {} );
			expect( manager.shouldSync( 'postType', 'post', 1 ) ).toBe( false );
			manager.update(
				'postType',
				'post',
				1,
				{ title: 'x' },
				{
					isCached: false,
					undoIgnore: false,
				}
			);
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
				onUndoStackChange: vi.fn(),
			};

			manager.load( 'postType', 'post', 1, record, handlers );

			expect( mockSyncManager.load ).toHaveBeenCalledWith(
				syncConfig,
				'postType/post',
				1,
				record,
				{
					addUndoMeta: expect.any( Function ),
					editRecord: handlers.editRecord,
					getEditedRecord: handlers.getEditedRecord,
					onStatusChange: expect.any( Function ),
					onUndoStackChange: handlers.onUndoStackChange,
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
			async function loadAndPersist( syncConfig, editedRecord ) {
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
						onUndoStackChange: vi.fn(),
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

		it( 'maps the edit intent to origins and undo levels', () => {
			mockStore( { syncConfig: {} } );

			manager.update(
				'postType',
				'post',
				1,
				{ title: 'a' },
				{ isCached: false, undoIgnore: false }
			);
			manager.update(
				'postType',
				'post',
				1,
				{ title: 'b' },
				{ isCached: true, undoIgnore: false }
			);
			manager.update(
				'postType',
				'post',
				1,
				{ title: 'c' },
				{ isCached: false, undoIgnore: true }
			);

			expect( mockSyncManager.update.mock.calls ).toEqual( [
				[
					'postType/post',
					1,
					{ title: 'a' },
					'local-editor',
					{ isNewUndoLevel: true },
				],
				[
					'postType/post',
					1,
					{ title: 'b' },
					'local-editor',
					{ isNewUndoLevel: false },
				],
				[
					'postType/post',
					1,
					{ title: 'c' },
					'local-undo-ignored',
					{ isNewUndoLevel: false },
				],
			] );
		} );

		describe( 'beforeSave', () => {
			it( 'applies direct save changes to the CRDT before capturing the autosave snapshot', async () => {
				mockStore( { syncConfig: {} } );
				const callOrder = [];
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

			function afterSave( savedRecord, persistedRecord, edits ) {
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

		it( 'exposes the sync undo manager', () => {
			expect( manager.undoManager ).toBeUndefined();

			mockSyncManager.undoManager = { undo: vi.fn() };

			expect( manager.undoManager ).toBe( mockSyncManager.undoManager );
		} );
	} );
} );
