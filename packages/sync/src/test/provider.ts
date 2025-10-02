/**
 * External dependencies
 */
import {
	describe,
	expect,
	it,
	jest,
	beforeEach,
	afterEach,
} from '@jest/globals';
import type * as Y from 'yjs';

/**
 * Internal dependencies
 */
import { SyncProvider } from '../provider';
import {
	CRDT_STATE_VERSION_KEY,
	CRDT_RECORD_MAP_KEY,
	CRDT_STATE_MAP_KEY,
	CRDT_STATE_PERSISTED_AT_KEY,
	CRDT_STATE_PERSISTED_BY_KEY,
	CRDT_STATE_RESTORED_AT_KEY,
	CRDT_DOC_VERSION,
} from '../config';
import type { SyncConfig, RecordHandlers, ObjectData } from '../types';

const mockYMapData = new Map();
const mockYMap = {
	get: jest.fn( ( key: string ) => mockYMapData.get( key ) ),
	set: jest.fn( ( key: string, value: any ) =>
		mockYMapData.set( key, value )
	),
	observe: jest.fn(),
	unobserve: jest.fn(),
	observeDeep: jest.fn(),
	unobserveDeep: jest.fn(),
};

const mockYDoc = {
	clientID: 12345,
	meta: new Map(),
	getMap: jest.fn( () => mockYMap ),
	transact: jest.fn( ( fn: () => void ) => fn() ),
	destroy: jest.fn(),
};

jest.mock( 'yjs', () => ( {
	Doc: jest.fn().mockImplementation( () => mockYDoc ),
	UndoManager: jest.fn().mockImplementation( () => ( {
		undo: jest.fn(),
		redo: jest.fn(),
	} ) ),
	applyUpdate: jest.fn(),
	encodeStateAsUpdate: jest.fn( () => new Uint8Array() ),
} ) );

jest.mock( 'y-protocols/awareness', () => ( {
	Awareness: jest.fn().mockImplementation( () => ( {
		destroy: jest.fn(),
		setLocalState: jest.fn(),
		getStates: jest.fn( () => new Map() ),
	} ) ),
} ) );

class TestSyncProvider extends SyncProvider {
	public get testEntityStates() {
		return this.entityStates;
	}
}

jest.mock( '../y-utilities/y-multidoc-undomanager', () => ( {
	YMultiDocUndoManager: jest.fn().mockImplementation( () => ( {
		addToScope: jest.fn(),
		undo: jest.fn(),
		redo: jest.fn(),
		canUndo: jest.fn( () => false ),
		canRedo: jest.fn( () => false ),
	} ) ),
} ) );

describe( 'SyncProvider', () => {
	let syncProvider: TestSyncProvider;
	let mockSyncConfig: SyncConfig;
	let mockHandlers: RecordHandlers;
	let mockRawRecord: ObjectData;

	beforeEach( () => {
		jest.clearAllMocks();

		mockYDoc.meta = new Map();
		mockYMapData.clear();
		mockYMap.get.mockClear();
		mockYMap.set.mockClear();
		mockYMap.observe.mockClear();
		mockYMap.unobserve.mockClear();
		mockYMap.observeDeep.mockClear();
		mockYMap.unobserveDeep.mockClear();
		mockYDoc.getMap.mockClear().mockReturnValue( mockYMap );
		mockYDoc.transact.mockClear();
		mockYDoc.destroy.mockClear();

		mockSyncConfig = {
			objectType: 'post',
			getObjectId: jest.fn( ( record: ObjectData ) =>
				String( record.id )
			) as ( record: ObjectData ) => string,
			getInitialObjectData: jest.fn(
				( record: ObjectData ) => record
			) as ( record: ObjectData ) => ObjectData,
			applyChangesToCRDTDoc: jest.fn() as (
				ydoc: Y.Doc,
				changes: Partial< ObjectData >,
				rawRecord: ObjectData,
				origin: string
			) => void,
			getChangesFromCRDTDoc: jest.fn( () => ( {} ) ) as (
				ydoc: Y.Doc,
				record: ObjectData
			) => ObjectData,
			syncedProperties: new Set( [ 'title', 'content' ] ),
			supports: {
				awareness: true,
				undo: true,
				crdtPersistence: false,
			},
		};

		mockHandlers = {
			editRecord: jest.fn() as jest.Mock<
				( data: Partial< ObjectData > ) => void
			>,
			getEditedRecord: jest.fn( async () => mockRawRecord ) as jest.Mock<
				() => Promise< ObjectData >
			>,
			refetchPersistedRecord: jest.fn() as jest.Mock< () => void >,
		};

		mockRawRecord = {
			id: 1,
			title: 'Test Post',
			content: 'Test Content',
			meta: {},
		};

		syncProvider = new TestSyncProvider( [] );
	} );

	afterEach( () => {
		if ( syncProvider ) {
			syncProvider.testEntityStates?.forEach( ( state ) => {
				state?.discard();
			} );
		}
	} );

	describe( 'constructor', () => {
		it( 'creates a new SyncProvider instance', () => {
			expect( syncProvider ).toBeInstanceOf( SyncProvider );
		} );

		it( 'initializes with empty connection creators', () => {
			const provider = new TestSyncProvider();
			expect( provider ).toBeInstanceOf( SyncProvider );
		} );

		it( 'accepts connection creators', () => {
			const mockConnectionCreator = jest.fn( () =>
				Promise.resolve( { destroy: jest.fn() } )
			);
			const provider = new TestSyncProvider( [ mockConnectionCreator ] );
			expect( provider ).toBeInstanceOf( SyncProvider );
		} );

		it( 'creates an undo manager', () => {
			const provider = new TestSyncProvider();
			const undoManager = provider.getUndoManager();

			expect( undoManager ).toBeDefined();
			expect( undoManager ).not.toBeNull();
			expect( typeof undoManager?.undo ).toBe( 'function' );
			expect( typeof undoManager?.redo ).toBe( 'function' );
			expect( typeof undoManager?.hasUndo ).toBe( 'function' );
			expect( typeof undoManager?.hasRedo ).toBe( 'function' );
		} );
	} );

	describe( 'bootstrap', () => {
		it( 'bootstraps an entity and creates CRDT document', async () => {
			await syncProvider.bootstrap(
				mockSyncConfig,
				mockRawRecord,
				mockHandlers
			);

			const entityId = 'post_1';
			const entityState = syncProvider.testEntityStates.get( entityId );

			expect( entityState ).toBeDefined();
			expect( entityState?.objectId ).toBe( '1' );
			expect( entityState?.syncConfig ).toBe( mockSyncConfig );
			expect( entityState?.handlers ).toBe( mockHandlers );
			expect( entityState?.ydoc ).toBeDefined();
			expect( entityState?.awareness ).toBeDefined();
		} );

		it( 'does not create awareness when not supported', async () => {
			const configWithoutAwareness = {
				...mockSyncConfig,
				supports: { ...mockSyncConfig.supports, awareness: false },
			};

			await syncProvider.bootstrap(
				configWithoutAwareness,
				mockRawRecord,
				mockHandlers
			);

			const entityId = 'post_1';
			const entityState = syncProvider.testEntityStates.get( entityId );

			expect( entityState?.awareness ).toBeUndefined();
		} );

		it( 'initializes state map with correct values', async () => {
			await syncProvider.bootstrap(
				mockSyncConfig,
				mockRawRecord,
				mockHandlers
			);

			const entityId = 'post_1';
			const entityState = syncProvider.testEntityStates.get( entityId );
			const stateMap = entityState?.ydoc.getMap( CRDT_STATE_MAP_KEY );

			expect( stateMap?.get( CRDT_STATE_PERSISTED_AT_KEY ) ).toBe( 0 );
			expect( stateMap?.get( CRDT_STATE_RESTORED_AT_KEY ) ).toBe( 0 );
			expect( stateMap?.get( CRDT_STATE_VERSION_KEY ) ).toBe(
				CRDT_DOC_VERSION
			);
		} );

		it( 'applies initial object data when no persisted doc exists', async () => {
			await syncProvider.bootstrap(
				mockSyncConfig,
				mockRawRecord,
				mockHandlers
			);

			expect( mockSyncConfig.applyChangesToCRDTDoc ).toHaveBeenCalled();
			expect( mockHandlers.editRecord ).toHaveBeenCalled();
		} );

		it( 'establishes connections with connection creators', async () => {
			const mockDestroy = jest.fn();
			const mockConnectionCreator = jest.fn( () =>
				Promise.resolve( { destroy: mockDestroy } )
			);

			syncProvider = new TestSyncProvider( [ mockConnectionCreator ] );

			await syncProvider.bootstrap(
				mockSyncConfig,
				mockRawRecord,
				mockHandlers
			);

			expect( mockConnectionCreator ).toHaveBeenCalled();
		} );

		it( 'handles multiple entities simultaneously', async () => {
			const record1 = { id: 1, title: 'Post 1' };
			const record2 = { id: 2, title: 'Post 2' };

			await syncProvider.bootstrap( mockSyncConfig, record1, {
				...mockHandlers,
				getEditedRecord: jest.fn( async () => record1 ),
			} );

			await syncProvider.bootstrap( mockSyncConfig, record2, {
				...mockHandlers,
				getEditedRecord: jest.fn( async () => record2 ),
			} );

			expect(
				syncProvider.testEntityStates.get( 'post_1' )
			).toBeDefined();
			expect(
				syncProvider.testEntityStates.get( 'post_2' )
			).toBeDefined();
		} );

		it( 'maintains separate CRDT docs for different entities', async () => {
			const record1 = { id: 1, title: 'Post 1' };
			const record2 = { id: 2, title: 'Post  2' };

			await syncProvider.bootstrap( mockSyncConfig, record1, {
				...mockHandlers,
				getEditedRecord: jest.fn( async () => record1 ),
			} );

			await syncProvider.bootstrap( mockSyncConfig, record2, {
				...mockHandlers,
				getEditedRecord: jest.fn( async () => record2 ),
			} );

			const state1 = syncProvider.testEntityStates.get( 'post_1' );
			const state2 = syncProvider.testEntityStates.get( 'post_2' );

			expect( state1?.ydoc ).toBeDefined();
			expect( state2?.ydoc ).toBeDefined();
		} );

		it( 'provides access to CRDT document maps', async () => {
			await syncProvider.bootstrap(
				mockSyncConfig,
				mockRawRecord,
				mockHandlers
			);

			const entityState = syncProvider.testEntityStates.get( 'post_1' );
			expect( entityState ).toBeDefined();

			const recordMap = entityState?.ydoc.getMap( CRDT_RECORD_MAP_KEY );
			expect( recordMap ).toBeDefined();
			expect( mockYDoc.getMap ).toHaveBeenCalledWith(
				CRDT_RECORD_MAP_KEY
			);
		} );

		it( 'sets up observers for document updates', async () => {
			await syncProvider.bootstrap(
				mockSyncConfig,
				mockRawRecord,
				mockHandlers
			);

			expect( mockYMap.observeDeep ).toHaveBeenCalled();
			expect( mockYMap.observe ).toHaveBeenCalled();
		} );
	} );

	describe( 'discard', () => {
		it( 'removes entity state and cleans up resources', async () => {
			await syncProvider.bootstrap(
				mockSyncConfig,
				mockRawRecord,
				mockHandlers
			);

			const entityId = 'post_1';
			expect(
				syncProvider.testEntityStates.get( entityId )
			).toBeDefined();

			syncProvider.discard( 'post', '1' );

			expect(
				syncProvider.testEntityStates.get( entityId )
			).toBeUndefined();
		} );

		it( 'handles discarding non-existent entity gracefully', () => {
			expect( () => {
				syncProvider.discard( 'post', '999' );
			} ).not.toThrow();
		} );
	} );

	describe( 'updateCRDTDoc', () => {
		it( 'updates CRDT document with changes from local store', async () => {
			await syncProvider.bootstrap(
				mockSyncConfig,
				mockRawRecord,
				mockHandlers
			);

			const changes = { title: 'Updated Title' };

			syncProvider.updateCRDTDoc(
				mockSyncConfig,
				mockRawRecord,
				changes,
				'gutenberg'
			);

			expect( mockSyncConfig.applyChangesToCRDTDoc ).toHaveBeenCalledWith(
				expect.any( Object ),
				changes,
				mockRawRecord,
				'gutenberg'
			);
		} );

		it( 'does nothing when entity does not exist', () => {
			const changes = { title: 'Updated Title' };

			expect( () => {
				syncProvider.updateCRDTDoc(
					mockSyncConfig,
					mockRawRecord,
					changes,
					'gutenberg'
				);
			} ).not.toThrow();
		} );
	} );

	describe( 'updateLastPersistedDate', () => {
		it( 'updates the persisted timestamp in state map', async () => {
			await syncProvider.bootstrap(
				mockSyncConfig,
				mockRawRecord,
				mockHandlers
			);

			const beforeTimestamp = Date.now();

			syncProvider.updateLastPersistedDate(
				mockSyncConfig,
				mockRawRecord
			);

			const entityId = 'post_1';
			const entityState = syncProvider.testEntityStates.get( entityId );
			const stateMap = entityState?.ydoc.getMap( CRDT_STATE_MAP_KEY );

			const persistedAt = stateMap?.get( CRDT_STATE_PERSISTED_AT_KEY );
			const persistedBy = stateMap?.get( CRDT_STATE_PERSISTED_BY_KEY );

			expect( persistedAt ).toBeGreaterThanOrEqual( beforeTimestamp );
			expect( persistedBy ).toBe( entityState?.ydoc.clientID );
		} );

		it( 'does nothing when entity does not exist', () => {
			expect( () => {
				syncProvider.updateLastPersistedDate(
					mockSyncConfig,
					mockRawRecord
				);
			} ).not.toThrow();
		} );
	} );

	describe( 'getUndoManager', () => {
		it( 'returns the undo manager instance', () => {
			const undoManager = syncProvider.getUndoManager();
			expect( undoManager ).toBeDefined();
		} );
	} );

	describe( 'createEntityMeta', () => {
		it( 'returns empty meta by default', async () => {
			const meta = await syncProvider.createEntityMeta(
				mockSyncConfig,
				mockRawRecord
			);

			expect( meta ).toEqual( {} );
		} );
	} );

	describe( 'state synchronization', () => {
		it( 'does not trigger refetch for local persisted date changes', async () => {
			await syncProvider.bootstrap(
				mockSyncConfig,
				mockRawRecord,
				mockHandlers
			);

			const refetchCallsBefore = (
				mockHandlers.refetchPersistedRecord as jest.Mock
			 ).mock.calls.length;

			syncProvider.updateLastPersistedDate(
				mockSyncConfig,
				mockRawRecord
			);

			expect(
				( mockHandlers.refetchPersistedRecord as jest.Mock ).mock.calls
					.length
			).toBe( refetchCallsBefore );
		} );
	} );
} );
