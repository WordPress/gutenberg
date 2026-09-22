import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import apiFetch from '@wordpress/api-fetch';
import warning from '@wordpress/warning';
import {
	deleteEntityRecord,
	editEntityRecord,
	saveEntityRecord,
} from '../actions';
import {
	getEntitySyncManager,
	registerEntitySyncManager,
} from '../entity-sync';
import { setCollaborationSupported } from '../private-actions';
import { getUndoManager } from '../private-selectors';
import { getEntityRecord, getEntityRecords } from '../resolvers';
import { hasRedo, hasUndo } from '../selectors';

vi.mock( '@wordpress/api-fetch' );
vi.mock( '@wordpress/warning' );

/**
 * A fake manager that records every interface call.
 *
 * @return {Object} The manager.
 */
function createFakeManager() {
	return {
		shouldSync: vi.fn( () => true ),
		load: vi.fn(),
		loadCollection: vi.fn(),
		update: vi.fn(),
		beforeSave: vi.fn(),
		afterSave: vi.fn(),
		unload: vi.fn(),
		unloadAll: vi.fn(),
		undoManager: undefined,
	};
}

const POST_ENTITY = {
	name: 'post',
	kind: 'postType',
	baseURL: '/wp/v2/posts',
	baseURLParams: { context: 'edit' },
	mergedEdits: { meta: true },
};

describe( 'registerEntitySyncManager', () => {
	let unregister;

	afterEach( () => {
		unregister?.();
		unregister = undefined;
		warning.mockReset();
	} );

	it( 'registers a manager and unregisters it again', () => {
		const manager = createFakeManager();

		expect( getEntitySyncManager() ).toBeUndefined();

		unregister = registerEntitySyncManager( manager );

		expect( getEntitySyncManager() ).toBe( manager );

		unregister();

		expect( getEntitySyncManager() ).toBeUndefined();
	} );

	it( 'replaces an earlier manager with a warning', () => {
		const first = createFakeManager();
		const second = createFakeManager();
		const unregisterFirst = registerEntitySyncManager( first );
		unregister = registerEntitySyncManager( second );

		expect( warning ).toHaveBeenCalledTimes( 1 );
		expect( getEntitySyncManager() ).toBe( second );

		// The first manager's unregister function only clears its own
		// registration, which is gone already.
		unregisterFirst();

		expect( getEntitySyncManager() ).toBe( second );
	} );

	it( 'does not warn when the same manager registers again', () => {
		const manager = createFakeManager();
		registerEntitySyncManager( manager );
		unregister = registerEntitySyncManager( manager );

		expect( warning ).not.toHaveBeenCalled();
	} );
} );

describe( 'the entity sync interface', () => {
	let manager;
	let unregister;
	let dispatch;

	beforeEach( () => {
		manager = createFakeManager();
		unregister = registerEntitySyncManager( manager );
		dispatch = Object.assign( vi.fn(), {
			receiveEntityRecords: vi.fn(),
			receiveAutosaves: vi.fn(),
			receiveUserPermissions: vi.fn(),
			finishResolutions: vi.fn(),
			__unstableAcquireStoreLock: vi.fn(),
			__unstableReleaseStoreLock: vi.fn(),
			__unstableNotifySyncUndoManagerChange: vi.fn(),
		} );
		apiFetch.mockReset();
	} );

	afterEach( () => {
		unregister();
	} );

	describe( 'getEntityRecord', () => {
		const registry = { batch: ( callback ) => callback() };
		const POST_RECORD = { id: 1, title: 'Test Post' };
		const resolveSelect = {
			getEntitiesConfig: vi.fn( () => [ POST_ENTITY ] ),
			getEditedEntityRecord: vi.fn( () =>
				Promise.resolve( { ...POST_RECORD, title: 'Edited' } )
			),
		};

		beforeEach( () => {
			apiFetch.mockImplementation( () => ( {
				json: () => Promise.resolve( POST_RECORD ),
			} ) );
		} );

		it( 'loads a numeric-id record once with the interface handlers', async () => {
			await getEntityRecord(
				'postType',
				'post',
				1
			)( { dispatch, registry, resolveSelect } );

			expect( manager.shouldSync ).toHaveBeenCalledWith(
				'postType',
				'post',
				1
			);
			expect( manager.load ).toHaveBeenCalledTimes( 1 );
			expect( manager.load ).toHaveBeenCalledWith(
				'postType',
				'post',
				1,
				POST_RECORD,
				{
					editRecord: expect.any( Function ),
					getEditedRecord: expect.any( Function ),
					refetchRecord: expect.any( Function ),
					onUndoStackChange: expect.any( Function ),
				}
			);
		} );

		it( 'does not load records with a query, a string id, or when shouldSync declines', async () => {
			await getEntityRecord( 'postType', 'post', 1, { context: 'view' } )(
				{ dispatch, registry, resolveSelect }
			);
			await getEntityRecord(
				'postType',
				'post',
				'hello-world'
			)( { dispatch, registry, resolveSelect } );

			manager.shouldSync.mockReturnValue( false );
			await getEntityRecord(
				'postType',
				'post',
				1
			)( { dispatch, registry, resolveSelect } );

			expect( manager.load ).not.toHaveBeenCalled();
		} );

		it( 'lets the manager edit the record without touching undo history', async () => {
			await getEntityRecord(
				'postType',
				'post',
				1
			)( { dispatch, registry, resolveSelect } );

			const handlers = manager.load.mock.calls[ 0 ][ 4 ];

			handlers.editRecord( {} );
			expect( dispatch ).not.toHaveBeenCalled();

			handlers.editRecord( { title: 'Remote' }, { undoIgnore: true } );
			expect( dispatch ).toHaveBeenCalledWith( {
				type: 'EDIT_ENTITY_RECORD',
				kind: 'postType',
				name: 'post',
				recordId: 1,
				edits: { title: 'Remote' },
				meta: { undo: undefined },
				options: { undoIgnore: true },
			} );

			await expect( handlers.getEditedRecord() ).resolves.toEqual( {
				...POST_RECORD,
				title: 'Edited',
			} );

			handlers.onUndoStackChange( { hasUndo: true, hasRedo: false } );
			expect(
				dispatch.__unstableNotifySyncUndoManagerChange
			).toHaveBeenCalledWith( { hasUndo: true, hasRedo: false } );
		} );

		it( 'refetches the record on request', async () => {
			await getEntityRecord(
				'postType',
				'post',
				1
			)( { dispatch, registry, resolveSelect } );

			const handlers = manager.load.mock.calls[ 0 ][ 4 ];
			const REFETCHED = { id: 1, title: 'Refetched' };
			apiFetch.mockImplementation( () => REFETCHED );

			await handlers.refetchRecord();

			expect( apiFetch ).toHaveBeenLastCalledWith( {
				path: '/wp/v2/posts/1?context=edit',
				parse: true,
			} );
			expect( dispatch.receiveEntityRecords ).toHaveBeenLastCalledWith(
				'postType',
				'post',
				REFETCHED,
				undefined
			);
		} );

		it( 'does nothing when no manager is registered', async () => {
			unregister();

			await getEntityRecord(
				'postType',
				'post',
				1
			)( { dispatch, registry, resolveSelect } );

			expect( manager.load ).not.toHaveBeenCalled();
			expect( dispatch.receiveEntityRecords ).toHaveBeenCalledWith(
				'postType',
				'post',
				POST_RECORD,
				undefined
			);
		} );
	} );

	describe( 'getEntityRecords', () => {
		const registry = { batch: ( callback ) => callback() };
		const resolveSelect = {
			getEntitiesConfig: vi.fn( () => [ POST_ENTITY ] ),
		};

		it( 'loads the collection when the whole collection is requested', async () => {
			apiFetch.mockImplementation( () => ( {} ) );

			await getEntityRecords( 'postType', 'post', { per_page: -1 } )( {
				dispatch,
				registry,
				resolveSelect,
			} );

			expect( manager.loadCollection ).toHaveBeenCalledWith(
				'postType',
				'post',
				{ refetchRecords: expect.any( Function ) }
			);
		} );

		it( 'does not load the collection for a page of records', async () => {
			apiFetch.mockImplementation( () => ( {} ) );

			await getEntityRecords( 'postType', 'post', { per_page: 10 } )( {
				dispatch,
				registry,
				resolveSelect,
			} );

			expect( manager.loadCollection ).not.toHaveBeenCalled();
		} );
	} );

	describe( 'editEntityRecord', () => {
		const select = {
			getEntityConfig: () => POST_ENTITY,
			getRawEntityRecord: () => ( { id: 1, title: 'Initial' } ),
			getEditedEntityRecord: () => ( { id: 1, title: 'Initial' } ),
			getUndoManager: () => ( { addRecord: vi.fn() } ),
		};

		it( 'forwards the edit and its intent before the store edit lands', () => {
			const order = [];
			manager.update.mockImplementation( () => order.push( 'update' ) );
			dispatch.mockImplementation( () => order.push( 'dispatch' ) );

			editEntityRecord(
				'postType',
				'post',
				1,
				{ title: 'Updated' },
				{ isCached: true }
			)( { select, dispatch } );

			expect( manager.update ).toHaveBeenCalledWith(
				'postType',
				'post',
				1,
				{ title: 'Updated' },
				{ isCached: true, undoIgnore: false }
			);
			expect( order ).toEqual( [ 'update', 'dispatch' ] );
		} );

		it( 'marks undo-ignored edits', () => {
			editEntityRecord(
				'postType',
				'post',
				1,
				{ title: 'Updated' },
				{ undoIgnore: true }
			)( { select, dispatch } );

			expect( manager.update ).toHaveBeenCalledWith(
				'postType',
				'post',
				1,
				{ title: 'Updated' },
				{ isCached: false, undoIgnore: true }
			);
		} );
	} );

	describe( 'saveEntityRecord', () => {
		const persistedRecord = { id: 10, title: 'Initial', meta: {} };
		const select = { getRawEntityRecord: () => persistedRecord };
		const resolveSelect = {
			getEntitiesConfig: vi.fn( () => [ POST_ENTITY ] ),
		};

		it( 'calls beforeSave and afterSave around a regular save', async () => {
			const edits = { id: 10, title: 'Updated' };
			const savedRecord = { ...persistedRecord, ...edits };
			const order = [];
			manager.beforeSave.mockImplementation( () => {
				order.push( 'beforeSave' );
				return { meta: { extra: 'value' } };
			} );
			apiFetch.mockImplementation( () => {
				order.push( 'fetch' );
				return savedRecord;
			} );
			dispatch.receiveEntityRecords.mockImplementation( () =>
				order.push( 'receive' )
			);
			manager.afterSave.mockImplementation( () =>
				order.push( 'afterSave' )
			);

			await saveEntityRecord(
				'postType',
				'post',
				edits
			)( { select, dispatch, resolveSelect } );

			expect( manager.beforeSave ).toHaveBeenCalledWith(
				'postType',
				'post',
				10,
				edits,
				{ persistedRecord, isAutosave: false }
			);
			// What beforeSave returns rides along in the request.
			expect( apiFetch ).toHaveBeenCalledWith( {
				path: '/wp/v2/posts/10',
				method: 'PUT',
				data: { ...edits, meta: { extra: 'value' } },
			} );
			// The store still clears the ORIGINAL edits.
			expect( dispatch.receiveEntityRecords ).toHaveBeenCalledWith(
				'postType',
				'post',
				savedRecord,
				undefined,
				true,
				edits
			);
			expect( manager.afterSave ).toHaveBeenCalledWith(
				'postType',
				'post',
				10,
				{ savedRecord, persistedRecord, edits }
			);
			expect( order ).toEqual( [
				'beforeSave',
				'fetch',
				'receive',
				'afterSave',
			] );
		} );

		it( 'calls beforeSave for an autosave and never afterSave', async () => {
			manager.beforeSave.mockReturnValue( { extra: 'value' } );
			apiFetch.mockImplementation( () => ( { id: 20, parent: 10 } ) );

			await saveEntityRecord(
				'postType',
				'post',
				{ id: 10, content: 'Autosaved' },
				{ isAutosave: true }
			)( { select, dispatch, resolveSelect } );

			expect( manager.beforeSave ).toHaveBeenCalledWith(
				'postType',
				'post',
				10,
				{ id: 10, content: 'Autosaved' },
				{ persistedRecord, isAutosave: true }
			);
			expect( apiFetch ).toHaveBeenCalledWith( {
				path: '/wp/v2/posts/10/autosaves',
				method: 'POST',
				data: expect.objectContaining( {
					content: 'Autosaved',
					extra: 'value',
				} ),
			} );
			expect( manager.afterSave ).not.toHaveBeenCalled();
		} );

		it( 'skips beforeSave for a new record and reports the save without an id', async () => {
			const edits = { title: 'New' };
			const savedRecord = { id: 11, title: 'New' };
			apiFetch.mockImplementation( () => savedRecord );

			await saveEntityRecord(
				'postType',
				'post',
				edits
			)( { select, dispatch, resolveSelect } );

			expect( manager.beforeSave ).not.toHaveBeenCalled();
			expect( manager.afterSave ).toHaveBeenCalledWith(
				'postType',
				'post',
				undefined,
				{ savedRecord, persistedRecord: undefined, edits }
			);
		} );

		it( 'does not call afterSave when the request fails', async () => {
			apiFetch.mockRejectedValue( new Error( 'API error' ) );

			await saveEntityRecord( 'postType', 'post', {
				id: 10,
				title: 'Updated',
			} )( { select, dispatch, resolveSelect } );

			expect( manager.beforeSave ).toHaveBeenCalledTimes( 1 );
			expect( manager.afterSave ).not.toHaveBeenCalled();
		} );

		it( 'saves normally when no manager is registered', async () => {
			unregister();
			const edits = { id: 10, title: 'Updated' };
			apiFetch.mockImplementation( () => ( {
				...persistedRecord,
				...edits,
			} ) );

			await saveEntityRecord(
				'postType',
				'post',
				edits
			)( { select, dispatch, resolveSelect } );

			expect( apiFetch ).toHaveBeenCalledWith( {
				path: '/wp/v2/posts/10',
				method: 'PUT',
				data: edits,
			} );
			expect( manager.beforeSave ).not.toHaveBeenCalled();
			expect( manager.afterSave ).not.toHaveBeenCalled();
		} );
	} );

	describe( 'deleteEntityRecord', () => {
		it( 'unloads the deleted record', async () => {
			const resolveSelect = {
				getEntitiesConfig: vi.fn( () => [ POST_ENTITY ] ),
			};
			apiFetch.mockImplementation( () => ( { deleted: true } ) );

			await deleteEntityRecord(
				'postType',
				'post',
				10
			)( { dispatch, resolveSelect } );

			expect( manager.unload ).toHaveBeenCalledWith(
				'postType',
				'post',
				10
			);
		} );
	} );

	describe( 'undo', () => {
		it( 'substitutes the manager undo manager and reads its stack state', () => {
			const fallback = {
				hasUndo: vi.fn( () => false ),
				hasRedo: vi.fn( () => false ),
			};
			const state = {
				undoManager: fallback,
				syncUndoManagerState: { hasUndo: true, hasRedo: true },
			};

			expect( getUndoManager( state ) ).toBe( fallback );
			expect( hasUndo( state ) ).toBe( false );

			manager.undoManager = { undo: vi.fn(), redo: vi.fn() };

			expect( getUndoManager( state ) ).toBe( manager.undoManager );
			expect( hasUndo( state ) ).toBe( true );
			expect( hasRedo( state ) ).toBe( true );
		} );
	} );

	describe( 'setCollaborationSupported', () => {
		it( 'unloads everything and resets the undo state when support is withdrawn', () => {
			setCollaborationSupported( false )( { dispatch } );

			expect( manager.unloadAll ).toHaveBeenCalledTimes( 1 );
			expect(
				dispatch.__unstableNotifySyncUndoManagerChange
			).toHaveBeenCalledWith( { hasUndo: false, hasRedo: false } );
		} );
	} );
} );
