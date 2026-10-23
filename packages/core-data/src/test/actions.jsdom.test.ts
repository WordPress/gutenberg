import {
	afterEach,
	beforeEach,
	describe,
	expect,
	expectTypeOf,
	it,
	vi,
} from 'vitest';
import apiFetch from '@wordpress/api-fetch';
import { dispatch as dispatchStore } from '@wordpress/data';
import type { Mock } from 'vitest';
import {
	editEntityRecord,
	clearEntityRecordEdits,
	saveEntityRecord,
	saveEditedEntityRecord,
	deleteEntityRecord,
	receiveUserPermission,
	receiveAutosaves,
	receiveCurrentUser,
	__experimentalBatch,
} from '../actions';
import { getEntitySyncManager } from '../entity-sync';
import { store as coreStore } from '../index';
import type { EntitySyncManager } from '../entity-sync';
import type * as ET from '../entity-types';
import type { CoreDataThunkArgs } from '../private-types';
import type { RestRecord } from '../types';

// A mocked `dispatch`, with the action creators the tests check.
type DispatchMock< Action extends string > = Mock & Record< Action, Mock >;

// The tests stub REST responses and errors in place of typed requests.
const apiFetchMock = apiFetch as unknown as Mock;

/**
 * Types the mocks an action runs with, which provide only what it uses.
 *
 * @param args The mocked thunk arguments.
 */
function thunkArgs( args: Record< string, unknown > ): CoreDataThunkArgs {
	return args as unknown as CoreDataThunkArgs;
}

/**
 * Types a mocked sync manager, which provides only what the actions use.
 *
 * @param manager The mocked sync manager.
 */
function asSyncManager( manager: Record< string, Mock > ): EntitySyncManager {
	return manager as unknown as EntitySyncManager;
}
vi.mock( import( '@wordpress/api-fetch' ) );

vi.mock( import( '../batch' ), async ( importOriginal ) => {
	const { createBatch } = await importOriginal();
	return {
		createBatch() {
			return createBatch( ( inputs ) => Promise.resolve( inputs ) );
		},
	};
} );

vi.mock( import( '../entity-sync' ), () => ( {
	getEntitySyncManager: vi.fn(),
} ) );

describe( 'editEntityRecord', () => {
	it( 'throws when the edited entity does not have a loaded config.', async () => {
		const entityConfig = {
			kind: 'someKind',
			name: 'someName',
			id: 'someId',
		};
		const select = {
			getEntityConfig: vi.fn(),
		};
		const fulfillment = async () =>
			editEntityRecord(
				entityConfig.kind,
				entityConfig.name,
				entityConfig.id,
				{}
			)( thunkArgs( { select } ) );
		await expect( fulfillment ).rejects.toThrow(
			`The entity being edited (${ entityConfig.kind }, ${ entityConfig.name }) does not have a loaded config.`
		);
		expect( select.getEntityConfig ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'dispatches the correct action for non-merged edits', () => {
		const dispatch = vi.fn();
		const select = {
			getEntityConfig: () => ( {
				kind: 'postType',
				name: 'post',
				mergedEdits: {},
			} ),
			getRawEntityRecord: () => ( {
				id: 1,
				title: 'Original Title',
				content: 'Original Content',
			} ),
			getEditedEntityRecord: () => ( {
				id: 1,
				title: 'Original Title',
				content: 'Original Content',
			} ),
			getUndoManager: () => ( {
				hasRedo: vi.fn( () => false ),
				addRecord: vi.fn(),
			} ),
		};

		editEntityRecord( 'postType', 'post', 1, { title: 'New Title' } )(
			thunkArgs( {
				select,
				dispatch,
			} )
		);

		expect( dispatch ).toHaveBeenCalledWith( {
			type: 'EDIT_ENTITY_RECORD',
			kind: 'postType',
			name: 'post',
			recordId: 1,
			edits: { title: 'New Title' },
		} );
	} );

	it( 'merges edits for fields defined in mergedEdits config', () => {
		const dispatch = vi.fn();
		const select = {
			getEntityConfig: () => ( {
				kind: 'postType',
				name: 'post',
				mergedEdits: { meta: true },
			} ),
			getRawEntityRecord: () => ( {
				id: 1,
				meta: { existingKey: 'existingValue' },
			} ),
			getEditedEntityRecord: () => ( {
				id: 1,
				meta: {
					existingKey: 'existingValue',
					editedKey: 'editedValue',
				},
			} ),
			getUndoManager: () => ( {
				hasRedo: vi.fn( () => false ),
				addRecord: vi.fn(),
			} ),
		};

		editEntityRecord( 'postType', 'post', 1, {
			meta: { newKey: 'newValue' },
		} )(
			thunkArgs( {
				select,
				dispatch,
			} )
		);

		expect( dispatch ).toHaveBeenCalledWith( {
			type: 'EDIT_ENTITY_RECORD',
			kind: 'postType',
			name: 'post',
			recordId: 1,
			edits: {
				meta: {
					existingKey: 'existingValue',
					editedKey: 'editedValue',
					newKey: 'newValue',
				},
			},
		} );
	} );

	it( 'handles both merged and non-merged edits together', () => {
		const dispatch = vi.fn();
		const select = {
			getEntityConfig: () => ( {
				kind: 'postType',
				name: 'post',
				mergedEdits: { meta: true },
			} ),
			getRawEntityRecord: () => ( {
				id: 1,
				title: 'Original Title',
				meta: { existingKey: 'existingValue' },
			} ),
			getEditedEntityRecord: () => ( {
				id: 1,
				title: 'Original Title',
				meta: { existingKey: 'existingValue' },
			} ),
			getUndoManager: () => ( {
				hasRedo: vi.fn( () => false ),
				addRecord: vi.fn(),
			} ),
		};

		editEntityRecord( 'postType', 'post', 1, {
			title: 'New Title',
			meta: { newKey: 'newValue' },
		} )( thunkArgs( { select, dispatch } ) );

		expect( dispatch ).toHaveBeenCalledWith( {
			type: 'EDIT_ENTITY_RECORD',
			kind: 'postType',
			name: 'post',
			recordId: 1,
			edits: {
				title: 'New Title',
				meta: {
					existingKey: 'existingValue',
					newKey: 'newValue',
				},
			},
		} );
	} );

	it( 'clears edit when merged value equals persisted record', () => {
		const dispatch = vi.fn();
		const select = {
			getEntityConfig: () => ( {
				kind: 'postType',
				name: 'post',
				mergedEdits: { meta: true },
			} ),
			getRawEntityRecord: () => ( {
				id: 1,
				meta: { key1: 'value1', key2: 'value2' },
			} ),
			getEditedEntityRecord: () => ( {
				id: 1,
				meta: { key1: 'value1' },
			} ),
			getUndoManager: () => ( {
				hasRedo: vi.fn( () => false ),
				addRecord: vi.fn(),
			} ),
		};

		// Editing meta to add key2 back should result in a value equal to the persisted record
		editEntityRecord( 'postType', 'post', 1, {
			meta: { key2: 'value2' },
		} )( thunkArgs( { select, dispatch } ) );

		expect( dispatch ).toHaveBeenCalledWith( {
			type: 'EDIT_ENTITY_RECORD',
			kind: 'postType',
			name: 'post',
			recordId: 1,
			edits: {
				// meta should be undefined because merged value equals persisted record
				meta: undefined,
			},
		} );
	} );

	it( 'clears non-merged edit when value equals persisted record', () => {
		const dispatch = vi.fn();
		const select = {
			getEntityConfig: () => ( {
				kind: 'postType',
				name: 'post',
				mergedEdits: {},
			} ),
			getRawEntityRecord: () => ( {
				id: 1,
				title: 'Original Title',
			} ),
			getEditedEntityRecord: () => ( {
				id: 1,
				title: 'Edited Title',
			} ),
			getUndoManager: () => ( {
				hasRedo: vi.fn( () => false ),
				addRecord: vi.fn(),
			} ),
		};

		// Editing title back to original should clear the edit
		editEntityRecord( 'postType', 'post', 1, {
			title: 'Original Title',
		} )( thunkArgs( { select, dispatch } ) );

		expect( dispatch ).toHaveBeenCalledWith( {
			type: 'EDIT_ENTITY_RECORD',
			kind: 'postType',
			name: 'post',
			recordId: 1,
			edits: {
				title: undefined,
			},
		} );
	} );

	describe( 'with an entity sync manager', () => {
		let syncManager: Record< string, Mock >;

		beforeEach( () => {
			syncManager = {
				update: vi.fn(),
			};
			vi.mocked( getEntitySyncManager ).mockReturnValue(
				asSyncManager( syncManager )
			);
		} );

		afterEach( () => {
			vi.mocked( getEntitySyncManager ).mockReset();
		} );

		it( 'passes merged edits to the sync manager for merged fields', () => {
			const dispatch = vi.fn();
			const select = {
				getEntityConfig: () => ( {
					kind: 'postType',
					name: 'post',
					mergedEdits: { meta: true },
				} ),
				getRawEntityRecord: () => ( {
					id: 1,
					meta: { existingKey: 'existingValue' },
				} ),
				getEditedEntityRecord: () => ( {
					id: 1,
					meta: {
						existingKey: 'existingValue',
						editedKey: 'editedValue',
					},
				} ),
				getUndoManager: () => ( {
					hasRedo: vi.fn( () => false ),
					addRecord: vi.fn(),
				} ),
			};

			editEntityRecord( 'postType', 'post', 1, {
				meta: { newKey: 'newValue' },
			} )(
				thunkArgs( {
					select,
					dispatch,
				} )
			);

			expect( syncManager.update ).toHaveBeenCalledWith(
				'postType',
				'post',
				1,
				{
					meta: {
						existingKey: 'existingValue',
						editedKey: 'editedValue',
						newKey: 'newValue',
					},
				},
				{ isCached: false, undoIgnore: false }
			);
		} );

		it( 'passes merged edits to the sync manager even when value equals persisted record', () => {
			const dispatch = vi.fn();
			const select = {
				getEntityConfig: () => ( {
					kind: 'postType',
					name: 'post',
					mergedEdits: { meta: true },
				} ),
				getRawEntityRecord: () => ( {
					id: 1,
					meta: { key1: 'value1', key2: 'value2' },
				} ),
				getEditedEntityRecord: () => ( {
					id: 1,
					meta: { key1: 'value1' },
				} ),
				getUndoManager: () => ( {
					hasRedo: vi.fn( () => false ),
					addRecord: vi.fn(),
				} ),
			};

			// Editing meta to add key2 back results in a value equal to the persisted record
			editEntityRecord( 'postType', 'post', 1, {
				meta: { key2: 'value2' },
			} )( thunkArgs( { select, dispatch } ) );

			// The sync manager sees the merged edits (not cleaned/undefined)
			expect( syncManager.update ).toHaveBeenCalledWith(
				'postType',
				'post',
				1,
				{
					meta: {
						key1: 'value1',
						key2: 'value2',
					},
				},
				{ isCached: false, undoIgnore: false }
			);

			// But the local store dispatch should still receive undefined for the cleaned edit
			expect( dispatch ).toHaveBeenCalledWith( {
				type: 'EDIT_ENTITY_RECORD',
				kind: 'postType',
				name: 'post',
				recordId: 1,
				edits: {
					meta: undefined,
				},
			} );
		} );

		it( 'passes merged and non-merged edits correctly to the sync manager', () => {
			const dispatch = vi.fn();
			const select = {
				getEntityConfig: () => ( {
					kind: 'postType',
					name: 'post',
					mergedEdits: { meta: true },
				} ),
				getRawEntityRecord: () => ( {
					id: 1,
					title: 'Original Title',
					meta: { existingKey: 'existingValue' },
				} ),
				getEditedEntityRecord: () => ( {
					id: 1,
					title: 'Original Title',
					meta: { existingKey: 'existingValue' },
				} ),
				getUndoManager: () => ( {
					hasRedo: vi.fn( () => false ),
					addRecord: vi.fn(),
				} ),
			};

			editEntityRecord( 'postType', 'post', 1, {
				title: 'New Title',
				meta: { newKey: 'newValue' },
			} )( thunkArgs( { select, dispatch } ) );

			expect( syncManager.update ).toHaveBeenCalledWith(
				'postType',
				'post',
				1,
				{
					title: 'New Title',
					meta: {
						existingKey: 'existingValue',
						newKey: 'newValue',
					},
				},
				{ isCached: false, undoIgnore: false }
			);
		} );

		it( 'passes the edit intent to the sync manager', () => {
			const dispatch = vi.fn();
			const select = {
				getEntityConfig: () => ( {
					kind: 'postType',
					name: 'post',
				} ),
				getRawEntityRecord: () => ( { id: 1, title: 'Original' } ),
				getEditedEntityRecord: () => ( { id: 1, title: 'Original' } ),
				getUndoManager: () => ( {
					hasRedo: vi.fn( () => false ),
					addRecord: vi.fn(),
				} ),
			};

			editEntityRecord(
				'postType',
				'post',
				1,
				{ title: 'Typing' },
				{ isCached: true }
			)( thunkArgs( { select, dispatch } ) );
			editEntityRecord(
				'postType',
				'post',
				1,
				{ title: 'Selection' },
				{ undoIgnore: true }
			)( thunkArgs( { select, dispatch } ) );

			expect( syncManager.update ).toHaveBeenNthCalledWith(
				1,
				'postType',
				'post',
				1,
				{ title: 'Typing' },
				{ isCached: true, undoIgnore: false }
			);
			expect( syncManager.update ).toHaveBeenNthCalledWith(
				2,
				'postType',
				'post',
				1,
				{ title: 'Selection' },
				{ isCached: false, undoIgnore: true }
			);
		} );

		it( 'edits normally when no sync manager is registered', () => {
			vi.mocked( getEntitySyncManager ).mockReturnValue( undefined );
			const dispatch = vi.fn();
			const select = {
				getEntityConfig: () => ( {
					kind: 'postType',
					name: 'post',
					mergedEdits: { meta: true },
				} ),
				getRawEntityRecord: () => ( {
					id: 1,
					meta: { existingKey: 'existingValue' },
				} ),
				getEditedEntityRecord: () => ( {
					id: 1,
					meta: { existingKey: 'existingValue' },
				} ),
				getUndoManager: () => ( {
					hasRedo: vi.fn( () => false ),
					addRecord: vi.fn(),
				} ),
			};

			editEntityRecord( 'postType', 'post', 1, {
				meta: { newKey: 'newValue' },
			} )(
				thunkArgs( {
					select,
					dispatch,
				} )
			);

			expect( syncManager.update ).not.toHaveBeenCalled();
			expect( dispatch ).toHaveBeenCalledWith(
				expect.objectContaining( { type: 'EDIT_ENTITY_RECORD' } )
			);
		} );
	} );
} );

describe( 'clearEntityRecordEdits', () => {
	it( 'throws when the entity does not have a loaded config.', async () => {
		const select = {
			getEntityConfig: vi.fn(),
		};
		const fulfillment = async () =>
			clearEntityRecordEdits(
				'someKind',
				'someName',
				'someId'
			)( thunkArgs( { select } ) );
		await expect( fulfillment ).rejects.toThrow(
			`The entity being edited (someKind, someName) does not have a loaded config.`
		);
	} );

	it( 'does nothing when there are no edits', () => {
		const dispatch = vi.fn();
		const select = {
			getEntityConfig: () => ( {
				kind: 'postType',
				name: 'post',
			} ),
			getEntityRecordEdits: () => undefined,
		};

		clearEntityRecordEdits(
			'postType',
			'post',
			1
		)(
			thunkArgs( {
				select,
				dispatch,
			} )
		);

		expect( dispatch ).not.toHaveBeenCalled();
	} );

	it( 'clears all edits for an entity record', () => {
		const dispatch = vi.fn();
		const select = {
			getEntityConfig: () => ( {
				kind: 'postType',
				name: 'post',
			} ),
			getEntityRecordEdits: () => ( {
				title: 'New Title',
				content: 'New Content',
			} ),
			getEditedEntityRecord: () => ( {
				id: 1,
				title: 'New Title',
				content: 'New Content',
			} ),
		};

		clearEntityRecordEdits(
			'postType',
			'post',
			1
		)(
			thunkArgs( {
				select,
				dispatch,
			} )
		);

		expect( dispatch ).toHaveBeenCalledWith( {
			type: 'EDIT_ENTITY_RECORD',
			kind: 'postType',
			name: 'post',
			recordId: 1,
			edits: {
				title: undefined,
				content: undefined,
			},
		} );
	} );
} );

describe( 'deleteEntityRecord', () => {
	beforeEach( async () => {
		apiFetchMock.mockReset();
	} );

	it( 'triggers a DELETE request for an existing record', async () => {
		const deletedRecord = { title: 'new post', id: 10 };
		const configs = [
			{ name: 'post', kind: 'postType', baseURL: '/wp/v2/posts' },
		];

		const dispatch = Object.assign( vi.fn(), {
			receiveEntityRecords: vi.fn(),
			__unstableAcquireStoreLock: vi.fn(),
			__unstableReleaseStoreLock: vi.fn(),
		} );
		const resolveSelect = { getEntitiesConfig: vi.fn( () => configs ) };

		// Provide response
		apiFetchMock.mockImplementation( () => deletedRecord );

		const result = await deleteEntityRecord(
			'postType',
			'post',
			deletedRecord.id
		)( thunkArgs( { dispatch, resolveSelect } ) );

		expect( apiFetch ).toHaveBeenCalledTimes( 1 );
		expect( apiFetch ).toHaveBeenCalledWith( {
			path: '/wp/v2/posts/10',
			method: 'DELETE',
		} );

		expect( dispatch ).toHaveBeenCalledTimes( 3 );
		expect( dispatch ).toHaveBeenCalledWith( {
			type: 'DELETE_ENTITY_RECORD_START',
			kind: 'postType',
			name: 'post',
			recordId: 10,
		} );
		expect( dispatch ).toHaveBeenCalledWith( {
			type: 'DELETE_ENTITY_RECORD_FINISH',
			kind: 'postType',
			name: 'post',
			recordId: 10,
			error: undefined,
		} );
		expect( dispatch.__unstableAcquireStoreLock ).toHaveBeenCalledTimes(
			1
		);
		expect( dispatch.__unstableReleaseStoreLock ).toHaveBeenCalledTimes(
			1
		);

		expect( result ).toBe( deletedRecord );
	} );

	it( 'throws on error when throwOnError is true', async () => {
		const entities = [
			{ name: 'post', kind: 'postType', baseURL: '/wp/v2/posts' },
		];

		const dispatch = Object.assign( vi.fn(), {
			receiveEntityRecords: vi.fn(),
			__unstableAcquireStoreLock: vi.fn(),
			__unstableReleaseStoreLock: vi.fn(),
		} );
		const resolveSelect = { getEntitiesConfig: vi.fn( () => entities ) };

		// Provide response
		apiFetchMock.mockImplementation( () => {
			throw new Error( 'API error' );
		} );

		await expect(
			deleteEntityRecord(
				'postType',
				'post',
				10,
				{},
				{
					throwOnError: true,
				}
			)( thunkArgs( { dispatch, resolveSelect } ) )
		).rejects.toEqual( new Error( 'API error' ) );
	} );

	it( 'resolves on error when throwOnError is false', async () => {
		const entities = [
			{ name: 'post', kind: 'postType', baseURL: '/wp/v2/posts' },
		];

		const dispatch = Object.assign( vi.fn(), {
			receiveEntityRecords: vi.fn(),
			__unstableAcquireStoreLock: vi.fn(),
			__unstableReleaseStoreLock: vi.fn(),
		} );
		const resolveSelect = { getEntitiesConfig: vi.fn( () => entities ) };

		// Provide response
		apiFetchMock.mockImplementation( () => {
			throw new Error( 'API error' );
		} );

		await expect(
			deleteEntityRecord(
				'postType',
				'post',
				10,
				{},
				{
					throwOnError: false,
				}
			)( thunkArgs( { dispatch, resolveSelect } ) )
		).resolves.toBe( false );
	} );
} );

describe( 'saveEditedEntityRecord', () => {
	beforeEach( async () => {
		apiFetchMock.mockReset();
	} );

	it( 'Uses "id" as a key when no entity key is provided', async () => {
		const item = { id: 1, menu: 0 };
		const configs = [
			{
				kind: 'root',
				name: 'menuItem',
				baseURL: '/wp/v2/menu-items',
			},
		];
		const select = {
			getEntityRecordNonTransientEdits: () => [],
			hasEditsForEntityRecord: () => true,
		};

		const dispatch = Object.assign( vi.fn(), {
			saveEntityRecord: vi.fn(),
		} );
		const resolveSelect = { getEntitiesConfig: vi.fn( () => configs ) };

		// Provide response
		const updatedRecord = { ...item, menu: 10 };
		apiFetchMock.mockImplementation( () => {
			return updatedRecord;
		} );

		await saveEditedEntityRecord(
			'root',
			'menuItem',
			1
		)( thunkArgs( { dispatch, select, resolveSelect } ) );

		expect( dispatch.saveEntityRecord ).toHaveBeenCalledWith(
			'root',
			'menuItem',
			{ id: 1 },
			undefined
		);
	} );

	it( 'Uses the entity key when provided', async () => {
		const item = { name: 'primary', menu: 0 };
		const configs = [
			{
				kind: 'root',
				name: 'menuLocation',
				baseURL: '/wp/v2/menu-items',
				key: 'name',
			},
		];
		const select = {
			getEntityRecordNonTransientEdits: () => [],
			hasEditsForEntityRecord: () => true,
		};

		const dispatch = Object.assign( vi.fn(), {
			saveEntityRecord: vi.fn(),
		} );
		const resolveSelect = { getEntitiesConfig: vi.fn( () => configs ) };

		// Provide response
		const updatedRecord = { ...item, menu: 10 };
		apiFetchMock.mockImplementation( () => {
			return updatedRecord;
		} );

		await saveEditedEntityRecord(
			'root',
			'menuLocation',
			'primary'
		)( thunkArgs( { dispatch, select, resolveSelect } ) );

		expect( dispatch.saveEntityRecord ).toHaveBeenCalledWith(
			'root',
			'menuLocation',
			{ name: 'primary' },
			undefined
		);
	} );
} );

describe( 'saveEntityRecord', () => {
	let dispatch: DispatchMock<
		| 'receiveEntityRecords'
		| '__unstableAcquireStoreLock'
		| '__unstableReleaseStoreLock'
	> & { receiveAutosaves?: Mock };

	beforeEach( async () => {
		apiFetchMock.mockReset();
		dispatch = Object.assign( vi.fn(), {
			receiveEntityRecords: vi.fn(),
			__unstableAcquireStoreLock: vi.fn(),
			__unstableReleaseStoreLock: vi.fn(),
		} );
	} );

	it( 'triggers a POST request for a new record', async () => {
		const post = { title: 'new post' };
		const configs = [
			{ name: 'post', kind: 'postType', baseURL: '/wp/v2/posts' },
		];
		const select = {
			getRawEntityRecord: () => post,
		};
		const resolveSelect = { getEntitiesConfig: vi.fn( () => configs ) };

		// Provide response
		const updatedRecord = { ...post, id: 10 };
		apiFetchMock.mockImplementation( () => {
			return updatedRecord;
		} );

		const result = await saveEntityRecord(
			'postType',
			'post',
			post
		)( thunkArgs( { select, dispatch, resolveSelect } ) );

		expect( apiFetch ).toHaveBeenCalledTimes( 1 );
		expect( apiFetch ).toHaveBeenCalledWith( {
			path: '/wp/v2/posts',
			method: 'POST',
			data: post,
		} );

		expect( dispatch ).toHaveBeenCalledTimes( 2 );
		expect( dispatch ).toHaveBeenCalledWith( {
			type: 'SAVE_ENTITY_RECORD_START',
			kind: 'postType',
			name: 'post',
			recordId: undefined,
			isAutosave: false,
		} );
		expect( dispatch.__unstableAcquireStoreLock ).toHaveBeenCalledTimes(
			1
		);
		expect( dispatch ).toHaveBeenCalledWith( {
			type: 'SAVE_ENTITY_RECORD_FINISH',
			kind: 'postType',
			name: 'post',
			recordId: undefined,
			error: undefined,
			isAutosave: false,
		} );
		expect( dispatch.__unstableReleaseStoreLock ).toHaveBeenCalledTimes(
			1
		);

		expect( dispatch.receiveEntityRecords ).toHaveBeenCalledTimes( 1 );
		expect( dispatch.receiveEntityRecords ).toHaveBeenCalledWith(
			'postType',
			'post',
			updatedRecord,
			undefined,
			true,
			post
		);

		expect( result ).toBe( updatedRecord );
	} );

	it( 'throws on error when throwOnError is true', async () => {
		const post = { title: 'new post' };
		const entities = [
			{ name: 'post', kind: 'postType', baseURL: '/wp/v2/posts' },
		];
		const select = {
			getRawEntityRecord: () => post,
		};
		const resolveSelect = { getEntitiesConfig: vi.fn( () => entities ) };

		// Provide response
		apiFetchMock.mockImplementation( () => {
			throw new Error( 'API error' );
		} );

		await expect(
			saveEntityRecord( 'postType', 'post', post, {
				throwOnError: true,
			} )( thunkArgs( { select, dispatch, resolveSelect } ) )
		).rejects.toEqual( new Error( 'API error' ) );
	} );

	it( 'resolves on error when throwOnError is false', async () => {
		const post = { title: 'new post' };
		const entities = [
			{ name: 'post', kind: 'postType', baseURL: '/wp/v2/posts' },
		];
		const select = {
			getRawEntityRecord: () => post,
		};
		const resolveSelect = { getEntitiesConfig: vi.fn( () => entities ) };

		// Provide response
		apiFetchMock.mockImplementation( () => {
			throw new Error( 'API error' );
		} );

		await expect(
			saveEntityRecord( 'postType', 'post', post, {
				throwOnError: false,
			} )( thunkArgs( { select, dispatch, resolveSelect } ) )
		).resolves.toEqual( undefined );
	} );

	it( 'triggers a PUT request for an existing record', async () => {
		const post = { id: 10, title: 'new post' };
		const configs = [
			{ name: 'post', kind: 'postType', baseURL: '/wp/v2/posts' },
		];
		const select = {
			getRawEntityRecord: () => post,
		};
		const resolveSelect = { getEntitiesConfig: vi.fn( () => configs ) };

		// Provide response
		const updatedRecord = { ...post, id: 10 };
		apiFetchMock.mockImplementation( () => {
			return updatedRecord;
		} );

		const result = await saveEntityRecord(
			'postType',
			'post',
			post
		)( thunkArgs( { select, dispatch, resolveSelect } ) );

		expect( apiFetch ).toHaveBeenCalledTimes( 1 );
		expect( apiFetch ).toHaveBeenCalledWith( {
			path: '/wp/v2/posts/10',
			method: 'PUT',
			data: post,
		} );

		expect( dispatch ).toHaveBeenCalledTimes( 2 );
		expect( dispatch ).toHaveBeenCalledWith( {
			type: 'SAVE_ENTITY_RECORD_START',
			kind: 'postType',
			name: 'post',
			recordId: 10,
			isAutosave: false,
		} );
		expect( dispatch.__unstableAcquireStoreLock ).toHaveBeenCalledTimes(
			1
		);
		expect( dispatch ).toHaveBeenCalledWith( {
			type: 'SAVE_ENTITY_RECORD_FINISH',
			kind: 'postType',
			name: 'post',
			recordId: 10,
			error: undefined,
			isAutosave: false,
		} );
		expect( dispatch.__unstableReleaseStoreLock ).toHaveBeenCalledTimes(
			1
		);

		expect( dispatch.receiveEntityRecords ).toHaveBeenCalledTimes( 1 );
		expect( dispatch.receiveEntityRecords ).toHaveBeenCalledWith(
			'postType',
			'post',
			updatedRecord,
			undefined,
			true,
			post
		);

		expect( result ).toBe( updatedRecord );
	} );

	describe( 'with an entity sync manager', () => {
		let syncManager: Record< string, Mock >;

		beforeEach( () => {
			syncManager = {
				beforeSave: vi.fn(),
				afterSave: vi.fn(),
			};
			vi.mocked( getEntitySyncManager ).mockReturnValue(
				asSyncManager( syncManager )
			);
		} );

		afterEach( () => {
			vi.mocked( getEntitySyncManager ).mockReset();
		} );

		it( 'merges what beforeSave returns into the request but resets edits with the original edits', async () => {
			const persistedRecord = {
				id: 10,
				meta: {
					plugin_value: 'persisted',
					_crdt_document: 'old-doc',
				},
			};
			// Mirrors a store meta edit: `mergedEdits` snapshots the full
			// edited meta, including the load-time CRDT document.
			const edits = {
				id: 10,
				meta: {
					plugin_value: 'edited',
					_crdt_document: 'old-doc',
				},
			};
			const configs = [
				{
					name: 'post',
					kind: 'postType',
					baseURL: '/wp/v2/posts',
				},
			];
			// Mirrors a manager injecting a freshly serialized document
			// into the request meta.
			syncManager.beforeSave.mockImplementation(
				( _kind, _name, _id, saveEdits ) => ( {
					meta: {
						...saveEdits.meta,
						_crdt_document: 'new-doc',
					},
				} )
			);
			const select = {
				getRawEntityRecord: () => persistedRecord,
			};
			const resolveSelect = {
				getEntitiesConfig: vi.fn( () => configs ),
			};
			const updatedRecord = {
				id: 10,
				meta: {
					plugin_value: 'edited',
					server_value: 'server-mutated',
					_crdt_document: 'new-doc',
				},
			};
			apiFetchMock.mockImplementation( () => updatedRecord );

			await saveEntityRecord(
				'postType',
				'post',
				edits
			)( thunkArgs( { select, dispatch, resolveSelect } ) );

			expect( syncManager.beforeSave ).toHaveBeenCalledWith(
				'postType',
				'post',
				10,
				edits,
				{ persistedRecord, isAutosave: false }
			);
			expect( apiFetch ).toHaveBeenCalledWith( {
				path: '/wp/v2/posts/10',
				method: 'PUT',
				data: {
					...edits,
					meta: {
						plugin_value: 'edited',
						_crdt_document: 'new-doc',
					},
				},
			} );

			// The persisted edits passed to the reducer must be the original
			// edits, not the augmented request payload. Otherwise the
			// injected values make the comparison against the state edits
			// fail and the record stays dirty after a successful save.
			expect( dispatch.receiveEntityRecords ).toHaveBeenCalledWith(
				'postType',
				'post',
				updatedRecord,
				undefined,
				true,
				edits
			);
			expect( syncManager.afterSave ).toHaveBeenCalledWith(
				'postType',
				'post',
				10,
				{ savedRecord: updatedRecord, persistedRecord, edits }
			);
		} );

		it( 'calls beforeSave before pre-persisting the record', async () => {
			const persistedRecord = {
				id: 10,
				status: 'auto-draft',
				template: '',
			};
			const edits = {
				id: 10,
				template: 'page-no-title',
			};
			const prePersist = vi.fn( async ( _persisted, saveEdits ) => {
				expect( syncManager.beforeSave ).toHaveBeenCalledTimes( 1 );
				// Pre-persist sees the edits with the manager's additions.
				expect( saveEdits ).toEqual( { ...edits, extra: 'value' } );

				return { status: 'draft' };
			} );
			syncManager.beforeSave.mockReturnValue( { extra: 'value' } );
			const configs = [
				{
					name: 'page',
					kind: 'postType',
					baseURL: '/wp/v2/pages',
					__unstablePrePersist: prePersist,
				},
			];
			const select = {
				getRawEntityRecord: () => persistedRecord,
			};
			const resolveSelect = {
				getEntitiesConfig: vi.fn( () => configs ),
			};
			const updatedRecord = {
				...persistedRecord,
				...edits,
				status: 'draft',
			};
			apiFetchMock.mockImplementation( () => updatedRecord );

			const result = await saveEntityRecord(
				'postType',
				'page',
				edits
			)( thunkArgs( { select, dispatch, resolveSelect } ) );

			expect( prePersist ).toHaveBeenCalledTimes( 1 );
			expect( apiFetch ).toHaveBeenCalledWith( {
				path: '/wp/v2/pages/10',
				method: 'PUT',
				data: { ...edits, extra: 'value', status: 'draft' },
			} );
			expect( result ).toBe( updatedRecord );
		} );

		it( 'does not call afterSave when the request fails', async () => {
			const persistedRecord = {
				id: 10,
				template: '',
			};
			const edits = {
				id: 10,
				template: 'page-no-title',
			};
			const configs = [
				{
					name: 'page',
					kind: 'postType',
					baseURL: '/wp/v2/pages',
				},
			];
			const select = {
				getRawEntityRecord: () => persistedRecord,
			};
			const resolveSelect = {
				getEntitiesConfig: vi.fn( () => configs ),
			};
			const error = new Error( 'API error' );
			apiFetchMock.mockRejectedValue( error );

			await expect(
				saveEntityRecord( 'postType', 'page', edits, {
					throwOnError: true,
				} )( thunkArgs( { select, dispatch, resolveSelect } ) )
			).rejects.toBe( error );

			expect( syncManager.beforeSave ).toHaveBeenCalledTimes( 1 );
			expect( syncManager.afterSave ).not.toHaveBeenCalled();
		} );

		it( 'passes no persisted record to afterSave when it is missing', async () => {
			const edits = {
				id: 10,
				content: 'Updated content',
			};
			const configs = [
				{
					name: 'post',
					kind: 'postType',
					baseURL: '/wp/v2/posts',
				},
			];
			const select = {
				getRawEntityRecord: () => undefined,
			};
			const resolveSelect = {
				getEntitiesConfig: vi.fn( () => configs ),
			};
			const updatedRecord = {
				id: 10,
				content: 'Updated content',
				template: 'single',
			};
			apiFetchMock.mockImplementation( () => updatedRecord );

			const result = await saveEntityRecord(
				'postType',
				'post',
				edits
			)( thunkArgs( { select, dispatch, resolveSelect } ) );

			expect( syncManager.beforeSave ).toHaveBeenCalledWith(
				'postType',
				'post',
				10,
				edits,
				{ persistedRecord: undefined, isAutosave: false }
			);
			expect( syncManager.afterSave ).toHaveBeenCalledWith(
				'postType',
				'post',
				10,
				{
					savedRecord: updatedRecord,
					persistedRecord: undefined,
					edits,
				}
			);
			expect( result ).toBe( updatedRecord );
		} );
	} );

	it( 'triggers a PUT request for an existing record with a custom key', async () => {
		const postType = { slug: 'page', title: 'Pages' };
		const configs = [
			{
				name: 'postType',
				kind: 'root',
				baseURL: '/wp/v2/types',
				key: 'slug',
			},
		];
		const select = {
			getRawEntityRecord: () => ( {} ),
		};
		const resolveSelect = { getEntitiesConfig: vi.fn( () => configs ) };

		// Provide response
		apiFetchMock.mockImplementation( () => postType );

		const result = await saveEntityRecord(
			'root',
			'postType',
			postType
		)( thunkArgs( { select, dispatch, resolveSelect } ) );

		expect( apiFetch ).toHaveBeenCalledTimes( 1 );
		expect( apiFetch ).toHaveBeenCalledWith( {
			path: '/wp/v2/types/page',
			method: 'PUT',
			data: postType,
		} );

		expect( dispatch ).toHaveBeenCalledTimes( 2 );
		expect( dispatch ).toHaveBeenCalledWith( {
			type: 'SAVE_ENTITY_RECORD_START',
			kind: 'root',
			name: 'postType',
			recordId: 'page',
			isAutosave: false,
		} );
		expect( dispatch.__unstableAcquireStoreLock ).toHaveBeenCalledTimes(
			1
		);
		expect( dispatch ).toHaveBeenCalledWith( {
			type: 'SAVE_ENTITY_RECORD_FINISH',
			kind: 'root',
			name: 'postType',
			recordId: 'page',
			error: undefined,
			isAutosave: false,
		} );
		expect( dispatch.__unstableReleaseStoreLock ).toHaveBeenCalledTimes(
			1
		);

		expect( dispatch.receiveEntityRecords ).toHaveBeenCalledTimes( 1 );
		expect( dispatch.receiveEntityRecords ).toHaveBeenCalledWith(
			'root',
			'postType',
			postType,
			undefined,
			true,
			{ slug: 'page', title: 'Pages' }
		);

		expect( result ).toBe( postType );
	} );

	describe( 'autosaves with an entity sync manager', () => {
		const persistedRecord = {
			id: 10,
			title: 'Test post',
			content: 'Test content',
		};
		let select: Record< string, unknown >;
		let resolveSelect: Record< string, unknown >;
		let syncManager: Record< string, Mock >;

		beforeEach( () => {
			dispatch.receiveAutosaves = vi.fn();
			select = {
				getRawEntityRecord: () => persistedRecord,
			};
			syncManager = {
				beforeSave: vi.fn( () => ( {
					crdt_snapshot: 'ENCODED_SNAPSHOT',
				} ) ),
				afterSave: vi.fn(),
			};
			vi.mocked( getEntitySyncManager ).mockReturnValue(
				asSyncManager( syncManager )
			);
			resolveSelect = {
				getEntitiesConfig: vi.fn( () => [
					{
						name: 'post',
						kind: 'postType',
						baseURL: '/wp/v2/posts',
					},
				] ),
			};
			apiFetchMock.mockImplementation( () => ( {
				id: 20,
				parent: 10,
				author: 2,
				modified_gmt: '2026-07-21T10:00:00',
			} ) );
		} );

		afterEach( () => {
			vi.mocked( getEntitySyncManager ).mockReset();
		} );

		function getAutosaveRequestData() {
			return apiFetchMock.mock.calls[ 0 ][ 0 ].data;
		}

		it( 'merges what beforeSave returns into the autosave request', async () => {
			await saveEntityRecord( 'postType', 'post', persistedRecord, {
				isAutosave: true,
			} )( thunkArgs( { select, dispatch, resolveSelect } ) );

			expect( syncManager.beforeSave ).toHaveBeenCalledWith(
				'postType',
				'post',
				10,
				persistedRecord,
				{ persistedRecord, isAutosave: true }
			);
			expect( getAutosaveRequestData() ).toEqual(
				expect.objectContaining( {
					crdt_snapshot: 'ENCODED_SNAPSHOT',
				} )
			);
			expect( syncManager.afterSave ).not.toHaveBeenCalled();
		} );

		it( 'sends the autosave unchanged when beforeSave returns nothing', async () => {
			syncManager.beforeSave.mockReturnValue( undefined );

			await saveEntityRecord( 'postType', 'post', persistedRecord, {
				isAutosave: true,
			} )( thunkArgs( { select, dispatch, resolveSelect } ) );

			expect( getAutosaveRequestData() ).toEqual( {
				title: 'Test post',
				content: 'Test content',
				status: undefined,
			} );
			expect( dispatch.receiveAutosaves ).toHaveBeenCalled();
		} );

		it( 'calls beforeSave before the request is sent', async () => {
			// Anything captured after the request would describe content
			// the autosave did not include. Assert the ordering directly.
			const callOrder: Array< string > = [];
			syncManager.beforeSave.mockImplementation( () => {
				callOrder.push( 'beforeSave' );
				return undefined;
			} );
			apiFetchMock.mockImplementation( () => {
				callOrder.push( 'fetch' );
				return { id: 20, parent: 10 };
			} );

			await saveEntityRecord( 'postType', 'post', persistedRecord, {
				isAutosave: true,
			} )( thunkArgs( { select, dispatch, resolveSelect } ) );

			expect( callOrder ).toEqual( [ 'beforeSave', 'fetch' ] );
		} );

		it( 'autosaves normally when no sync manager is registered', async () => {
			vi.mocked( getEntitySyncManager ).mockReturnValue( undefined );

			await saveEntityRecord( 'postType', 'post', persistedRecord, {
				isAutosave: true,
			} )( thunkArgs( { select, dispatch, resolveSelect } ) );

			expect( syncManager.beforeSave ).not.toHaveBeenCalled();
			expect( getAutosaveRequestData() ).not.toHaveProperty(
				'crdt_snapshot'
			);
			expect( dispatch.receiveAutosaves ).toHaveBeenCalled();
		} );
	} );
} );

describe( 'receiveUserPermission', () => {
	it( 'builds an action object', () => {
		expect( receiveUserPermission( 'create/media', true ) ).toEqual( {
			type: 'RECEIVE_USER_PERMISSION',
			key: 'create/media',
			isAllowed: true,
		} );
	} );
} );

describe( 'receiveAutosaves', () => {
	it( 'builds an action object', () => {
		const postId = 1;
		const autosaves = [
			{
				content: 'test 1',
			},
			{
				content: 'test 2',
			},
		];

		expect( receiveAutosaves( postId, autosaves ) ).toEqual( {
			type: 'RECEIVE_AUTOSAVES',
			postId,
			autosaves,
		} );
	} );

	it( 'converts singular autosaves into an array', () => {
		const postId = 1;
		const autosave = {
			content: 'test 1',
		};

		expect( receiveAutosaves( postId, autosave ) ).toEqual( {
			type: 'RECEIVE_AUTOSAVES',
			postId,
			autosaves: [ autosave ],
		} );
	} );
} );

describe( 'receiveCurrentUser', () => {
	it( 'builds an action object', () => {
		// The action passes the user on without reading it.
		const currentUser = { id: 1 } as ET.User< 'view' >;
		expect( receiveCurrentUser( currentUser ) ).toEqual( {
			type: 'RECEIVE_CURRENT_USER',
			currentUser,
		} );
	} );
} );

describe( '__experimentalBatch', () => {
	it( 'batches multiple actions together', async () => {
		const dispatch = {
			saveEntityRecord: vi.fn(
				( kind, name, record, { __unstableFetch } ) => {
					__unstableFetch( {} );
					return { id: 123, created: true };
				}
			),
			saveEditedEntityRecord: vi.fn(
				( kind, name, recordId, { __unstableFetch } ) => {
					__unstableFetch( {} );
					return { id: 123, updated: true };
				}
			),
			deleteEntityRecord: vi.fn(
				( kind, name, recordId, query, { __unstableFetch } ) => {
					__unstableFetch( {} );
					return { id: 123, deleted: true };
				}
			),
		};

		const results = await __experimentalBatch( [
			( { saveEntityRecord: _saveEntityRecord } ) =>
				_saveEntityRecord( 'root', 'widget', {} ),
			( { saveEditedEntityRecord: _saveEditedEntityRecord } ) =>
				_saveEditedEntityRecord( 'root', 'widget', 123 ),
			( { deleteEntityRecord: _deleteEntityRecord } ) =>
				_deleteEntityRecord( 'root', 'widget', 123, {} ),
		] )( thunkArgs( { dispatch } ) );

		expect( dispatch.saveEntityRecord ).toHaveBeenCalledWith(
			'root',
			'widget',
			{},
			{ __unstableFetch: expect.any( Function ) }
		);
		expect( dispatch.saveEditedEntityRecord ).toHaveBeenCalledWith(
			'root',
			'widget',
			123,
			{ __unstableFetch: expect.any( Function ) }
		);
		expect( dispatch.deleteEntityRecord ).toHaveBeenCalledWith(
			'root',
			'widget',
			123,
			{},
			{ __unstableFetch: expect.any( Function ) }
		);

		expectTypeOf( results ).toEqualTypeOf<
			[ RestRecord | undefined, RestRecord | undefined, unknown ]
		>();
		expect( results ).toEqual( [
			{ id: 123, created: true },
			{ id: 123, updated: true },
			{ id: 123, deleted: true },
		] );

		// Never called: the assertion is on the type of the public call.
		const batchThroughStore = () =>
			dispatchStore( coreStore ).__experimentalBatch( [
				( { saveEntityRecord: _saveEntityRecord } ) =>
					_saveEntityRecord( 'root', 'widget', {} ),
				( { deleteEntityRecord: _deleteEntityRecord } ) =>
					_deleteEntityRecord( 'root', 'widget', 123 ),
			] );

		expectTypeOf( batchThroughStore ).returns.resolves.toEqualTypeOf<
			[ RestRecord | undefined, unknown ]
		>();
	} );
} );
