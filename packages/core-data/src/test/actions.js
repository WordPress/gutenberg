import apiFetch from '@wordpress/api-fetch';
jest.mock( '@wordpress/api-fetch' );
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
import { getSyncManager } from '../sync';

jest.mock( '../batch', () => {
	const { createBatch } = jest.requireActual( '../batch' );
	return {
		createBatch() {
			return createBatch( ( inputs ) => Promise.resolve( inputs ) );
		},
	};
} );

jest.mock( '../sync', () => ( {
	getSyncManager: jest.fn(),
	CRDT_AUTOSAVE_SNAPSHOT_KEY: 'crdt_snapshot',
	LOCAL_EDITOR_ORIGIN: 'local-editor',
	LOCAL_UNDO_IGNORED_ORIGIN: 'local-undo-ignored',
} ) );

describe( 'editEntityRecord', () => {
	it( 'throws when the edited entity does not have a loaded config.', async () => {
		const entityConfig = {
			kind: 'someKind',
			name: 'someName',
			id: 'someId',
		};
		const select = {
			getEntityConfig: jest.fn(),
		};
		const fulfillment = async () =>
			editEntityRecord(
				entityConfig.kind,
				entityConfig.name,
				entityConfig.id,
				{}
			)( { select } );
		await expect( fulfillment ).rejects.toThrow(
			`The entity being edited (${ entityConfig.kind }, ${ entityConfig.name }) does not have a loaded config.`
		);
		expect( select.getEntityConfig ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'dispatches the correct action for non-merged edits', () => {
		const dispatch = jest.fn();
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
				addRecord: jest.fn(),
			} ),
		};

		editEntityRecord( 'postType', 'post', 1, { title: 'New Title' } )( {
			select,
			dispatch,
		} );

		expect( dispatch ).toHaveBeenCalledWith( {
			type: 'EDIT_ENTITY_RECORD',
			kind: 'postType',
			name: 'post',
			recordId: 1,
			edits: { title: 'New Title' },
		} );
	} );

	it( 'merges edits for fields defined in mergedEdits config', () => {
		const dispatch = jest.fn();
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
				addRecord: jest.fn(),
			} ),
		};

		editEntityRecord( 'postType', 'post', 1, {
			meta: { newKey: 'newValue' },
		} )( {
			select,
			dispatch,
		} );

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
		const dispatch = jest.fn();
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
				addRecord: jest.fn(),
			} ),
		};

		editEntityRecord( 'postType', 'post', 1, {
			title: 'New Title',
			meta: { newKey: 'newValue' },
		} )( { select, dispatch } );

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
		const dispatch = jest.fn();
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
				addRecord: jest.fn(),
			} ),
		};

		// Editing meta to add key2 back should result in a value equal to the persisted record
		editEntityRecord( 'postType', 'post', 1, {
			meta: { key2: 'value2' },
		} )( { select, dispatch } );

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
		const dispatch = jest.fn();
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
				addRecord: jest.fn(),
			} ),
		};

		// Editing title back to original should clear the edit
		editEntityRecord( 'postType', 'post', 1, {
			title: 'Original Title',
		} )( { select, dispatch } );

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

	describe( 'with SyncManager', () => {
		let syncManager;

		beforeEach( () => {
			// Create a mock sync manager
			syncManager = {
				update: jest.fn(),
			};
			getSyncManager.mockReturnValue( syncManager );
		} );

		afterEach( () => {
			getSyncManager.mockReset();
		} );

		it( 'passes merged edits to SyncManager#update for merged fields', () => {
			const dispatch = jest.fn();
			const select = {
				getEntityConfig: () => ( {
					kind: 'postType',
					name: 'post',
					mergedEdits: { meta: true },
					syncConfig: {},
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
					addRecord: jest.fn(),
				} ),
			};

			editEntityRecord( 'postType', 'post', 1, {
				meta: { newKey: 'newValue' },
			} )( {
				select,
				dispatch,
			} );

			// Verify SyncManager#update was called with merged edits
			expect( syncManager.update ).toHaveBeenCalledWith(
				'postType/post',
				1,
				{
					meta: {
						existingKey: 'existingValue',
						editedKey: 'editedValue',
						newKey: 'newValue',
					},
				},
				'local-editor',
				{ isNewUndoLevel: true }
			);
		} );

		it( 'passes merged edits to SyncManager#update even when value equals persisted record', () => {
			const dispatch = jest.fn();
			const select = {
				getEntityConfig: () => ( {
					kind: 'postType',
					name: 'post',
					mergedEdits: { meta: true },
					syncConfig: {},
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
					addRecord: jest.fn(),
				} ),
			};

			// Editing meta to add key2 back results in a value equal to the persisted record
			editEntityRecord( 'postType', 'post', 1, {
				meta: { key2: 'value2' },
			} )( { select, dispatch } );

			// Verify SyncManager#update was called with merged edits (not cleaned/undefined)
			expect( syncManager.update ).toHaveBeenCalledWith(
				'postType/post',
				1,
				{
					meta: {
						key1: 'value1',
						key2: 'value2',
					},
				},
				'local-editor',
				{ isNewUndoLevel: true }
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

		it( 'passes merged and non-merged edits correctly to SyncManager#update', () => {
			const dispatch = jest.fn();
			const select = {
				getEntityConfig: () => ( {
					kind: 'postType',
					name: 'post',
					mergedEdits: { meta: true },
					syncConfig: {},
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
					addRecord: jest.fn(),
				} ),
			};

			editEntityRecord( 'postType', 'post', 1, {
				title: 'New Title',
				meta: { newKey: 'newValue' },
			} )( { select, dispatch } );

			// Verify SyncManager#update was called with merged meta but non-merged title
			expect( syncManager.update ).toHaveBeenCalledWith(
				'postType/post',
				1,
				{
					title: 'New Title',
					meta: {
						existingKey: 'existingValue',
						newKey: 'newValue',
					},
				},
				'local-editor',
				{ isNewUndoLevel: true }
			);
		} );

		it( 'does not call SyncManager#update when syncConfig is not defined', () => {
			const dispatch = jest.fn();
			const select = {
				getEntityConfig: () => ( {
					kind: 'postType',
					name: 'post',
					mergedEdits: { meta: true },
					// No syncConfig
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
					addRecord: jest.fn(),
				} ),
			};

			editEntityRecord( 'postType', 'post', 1, {
				meta: { newKey: 'newValue' },
			} )( {
				select,
				dispatch,
			} );

			// Verify SyncManager#update was NOT called
			expect( syncManager.update ).not.toHaveBeenCalled();
		} );
	} );
} );

describe( 'clearEntityRecordEdits', () => {
	it( 'throws when the entity does not have a loaded config.', async () => {
		const select = {
			getEntityConfig: jest.fn(),
		};
		const fulfillment = async () =>
			clearEntityRecordEdits(
				'someKind',
				'someName',
				'someId'
			)( { select } );
		await expect( fulfillment ).rejects.toThrow(
			`The entity being edited (someKind, someName) does not have a loaded config.`
		);
	} );

	it( 'does nothing when there are no edits', () => {
		const dispatch = jest.fn();
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
		)( {
			select,
			dispatch,
		} );

		expect( dispatch ).not.toHaveBeenCalled();
	} );

	it( 'clears all edits for an entity record', () => {
		const dispatch = jest.fn();
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
		)( {
			select,
			dispatch,
		} );

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
		apiFetch.mockReset();
	} );

	it( 'triggers a DELETE request for an existing record', async () => {
		const deletedRecord = { title: 'new post', id: 10 };
		const configs = [
			{ name: 'post', kind: 'postType', baseURL: '/wp/v2/posts' },
		];

		const dispatch = Object.assign( jest.fn(), {
			receiveEntityRecords: jest.fn(),
			__unstableAcquireStoreLock: jest.fn(),
			__unstableReleaseStoreLock: jest.fn(),
		} );
		const resolveSelect = { getEntitiesConfig: jest.fn( () => configs ) };

		// Provide response
		apiFetch.mockImplementation( () => deletedRecord );

		const result = await deleteEntityRecord(
			'postType',
			'post',
			deletedRecord.id
		)( { dispatch, resolveSelect } );

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

		const dispatch = Object.assign( jest.fn(), {
			receiveEntityRecords: jest.fn(),
			__unstableAcquireStoreLock: jest.fn(),
			__unstableReleaseStoreLock: jest.fn(),
		} );
		const resolveSelect = { getEntitiesConfig: jest.fn( () => entities ) };

		// Provide response
		apiFetch.mockImplementation( () => {
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
			)( { dispatch, resolveSelect } )
		).rejects.toEqual( new Error( 'API error' ) );
	} );

	it( 'resolves on error when throwOnError is false', async () => {
		const entities = [
			{ name: 'post', kind: 'postType', baseURL: '/wp/v2/posts' },
		];

		const dispatch = Object.assign( jest.fn(), {
			receiveEntityRecords: jest.fn(),
			__unstableAcquireStoreLock: jest.fn(),
			__unstableReleaseStoreLock: jest.fn(),
		} );
		const resolveSelect = { getEntitiesConfig: jest.fn( () => entities ) };

		// Provide response
		apiFetch.mockImplementation( () => {
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
			)( { dispatch, resolveSelect } )
		).resolves.toBe( false );
	} );
} );

describe( 'saveEditedEntityRecord', () => {
	beforeEach( async () => {
		apiFetch.mockReset();
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

		const dispatch = Object.assign( jest.fn(), {
			saveEntityRecord: jest.fn(),
		} );
		const resolveSelect = { getEntitiesConfig: jest.fn( () => configs ) };

		// Provide response
		const updatedRecord = { ...item, menu: 10 };
		apiFetch.mockImplementation( () => {
			return updatedRecord;
		} );

		await saveEditedEntityRecord(
			'root',
			'menuItem',
			1
		)( { dispatch, select, resolveSelect } );

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

		const dispatch = Object.assign( jest.fn(), {
			saveEntityRecord: jest.fn(),
		} );
		const resolveSelect = { getEntitiesConfig: jest.fn( () => configs ) };

		// Provide response
		const updatedRecord = { ...item, menu: 10 };
		apiFetch.mockImplementation( () => {
			return updatedRecord;
		} );

		await saveEditedEntityRecord(
			'root',
			'menuLocation',
			'primary'
		)( { dispatch, select, resolveSelect } );

		expect( dispatch.saveEntityRecord ).toHaveBeenCalledWith(
			'root',
			'menuLocation',
			{ name: 'primary' },
			undefined
		);
	} );
} );

describe( 'saveEntityRecord', () => {
	let dispatch;

	beforeEach( async () => {
		apiFetch.mockReset();
		dispatch = Object.assign( jest.fn(), {
			receiveEntityRecords: jest.fn(),
			__unstableAcquireStoreLock: jest.fn(),
			__unstableReleaseStoreLock: jest.fn(),
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
		const resolveSelect = { getEntitiesConfig: jest.fn( () => configs ) };

		// Provide response
		const updatedRecord = { ...post, id: 10 };
		apiFetch.mockImplementation( () => {
			return updatedRecord;
		} );

		const result = await saveEntityRecord(
			'postType',
			'post',
			post
		)( { select, dispatch, resolveSelect } );

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
		const resolveSelect = { getEntitiesConfig: jest.fn( () => entities ) };

		// Provide response
		apiFetch.mockImplementation( () => {
			throw new Error( 'API error' );
		} );

		await expect(
			saveEntityRecord( 'postType', 'post', post, {
				throwOnError: true,
			} )( { select, dispatch, resolveSelect } )
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
		const resolveSelect = { getEntitiesConfig: jest.fn( () => entities ) };

		// Provide response
		apiFetch.mockImplementation( () => {
			throw new Error( 'API error' );
		} );

		await expect(
			saveEntityRecord( 'postType', 'post', post, {
				throwOnError: false,
			} )( { select, dispatch, resolveSelect } )
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
		const resolveSelect = { getEntitiesConfig: jest.fn( () => configs ) };

		// Provide response
		const updatedRecord = { ...post, id: 10 };
		apiFetch.mockImplementation( () => {
			return updatedRecord;
		} );

		const result = await saveEntityRecord(
			'postType',
			'post',
			post
		)( { select, dispatch, resolveSelect } );

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

	it( 'preserves the live sync title when a CRDT persistence save returns stale post fields', async () => {
		const liveSyncState = {
			isSaved: false,
			title: 'synced title',
		};
		const post = { id: 10, title: 'synced title' };
		const configs = [
			{
				name: 'post',
				kind: 'postType',
				baseURL: '/wp/v2/posts',
				syncConfig: {},
			},
		];
		const syncManager = {
			update: jest.fn(
				( _objectType, _objectId, changes, _origin, options ) => {
					if (
						Object.prototype.hasOwnProperty.call( changes, 'title' )
					) {
						liveSyncState.title = changes.title;
					}
					if ( options?.isSave ) {
						liveSyncState.isSaved = true;
					}
				}
			),
		};
		const select = {
			getRawEntityRecord: () => post,
		};
		const resolveSelect = { getEntitiesConfig: jest.fn( () => configs ) };

		const staleSaveResponse = { ...post, title: 'initial title' };
		apiFetch.mockImplementation( () => {
			return staleSaveResponse;
		} );
		getSyncManager.mockReturnValue( syncManager );

		const result = await saveEntityRecord( 'postType', 'post', post, {
			__unstableSkipSyncUpdate: true,
		} )( { select, dispatch, resolveSelect } );

		expect( syncManager.update ).toHaveBeenCalledWith(
			'postType/post',
			10,
			{},
			'local-undo-ignored',
			{ isSave: true }
		);
		expect( syncManager.update ).toHaveBeenCalledTimes( 1 );
		expect( liveSyncState ).toEqual( {
			isSaved: true,
			title: 'synced title',
		} );
		expect( result ).toBe( staleSaveResponse );
	} );

	it( 'only passes server-mutated fields to SyncManager#update after saving', async () => {
		const persistedRecord = {
			id: 10,
			title: 'Initial title',
			content: 'Initial content',
			template: 'single',
			modified: '2026-07-01T00:00:00',
		};
		const edits = {
			id: 10,
			content: 'Updated content',
		};
		const configs = [
			{
				name: 'post',
				kind: 'postType',
				baseURL: '/wp/v2/posts',
				syncConfig: {},
			},
		];
		const syncManager = {
			update: jest.fn(),
		};
		const select = {
			getRawEntityRecord: () => persistedRecord,
		};
		const resolveSelect = { getEntitiesConfig: jest.fn( () => configs ) };
		const updatedRecord = {
			...persistedRecord,
			content: edits.content,
			modified: '2026-07-02T00:00:00',
		};
		apiFetch.mockImplementation( () => updatedRecord );
		getSyncManager.mockReturnValue( syncManager );

		const result = await saveEntityRecord(
			'postType',
			'post',
			edits
		)( { select, dispatch, resolveSelect } );

		expect( syncManager.update ).toHaveBeenNthCalledWith(
			1,
			'postType/post',
			10,
			edits,
			'local-undo-ignored'
		);
		expect( syncManager.update ).toHaveBeenCalledWith(
			'postType/post',
			10,
			{
				modified: '2026-07-02T00:00:00',
			},
			'local-undo-ignored',
			{ isSave: true }
		);
		expect( syncManager.update ).toHaveBeenCalledTimes( 2 );
		expect( result ).toBe( updatedRecord );
	} );

	it( 'does not pass unchanged meta fields to SyncManager#update after saving', async () => {
		const persistedRecord = {
			id: 10,
			content: 'Initial content',
			meta: {
				plugin_value: 'persisted',
				peer_value: 'persisted',
				_crdt_document: 'old-doc',
			},
		};
		const edits = {
			id: 10,
			content: 'Updated content',
		};
		const configs = [
			{
				name: 'post',
				kind: 'postType',
				baseURL: '/wp/v2/posts',
				syncConfig: {},
				__unstablePrePersist: async () => ( {
					meta: { _crdt_document: 'new-doc' },
				} ),
			},
		];
		const syncManager = {
			update: jest.fn(),
		};
		const select = {
			getRawEntityRecord: () => persistedRecord,
		};
		const resolveSelect = { getEntitiesConfig: jest.fn( () => configs ) };
		const updatedRecord = {
			...persistedRecord,
			content: edits.content,
			meta: {
				plugin_value: 'persisted',
				peer_value: 'persisted',
				_crdt_document: 'new-doc',
			},
		};
		apiFetch.mockImplementation( () => updatedRecord );
		getSyncManager.mockReturnValue( syncManager );

		const result = await saveEntityRecord(
			'postType',
			'post',
			edits
		)( { select, dispatch, resolveSelect } );

		expect( syncManager.update ).toHaveBeenNthCalledWith(
			2,
			'postType/post',
			10,
			{},
			'local-undo-ignored',
			{ isSave: true }
		);
		expect( syncManager.update ).toHaveBeenCalledTimes( 2 );
		expect( result ).toBe( updatedRecord );
	} );

	it( 'passes only server-mutated meta fields to SyncManager#update after saving', async () => {
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
		const configs = [
			{
				name: 'post',
				kind: 'postType',
				baseURL: '/wp/v2/posts',
				syncConfig: {},
				__unstablePrePersist: async () => ( {
					meta: {
						...edits.meta,
						_crdt_document: 'new-doc',
					},
				} ),
			},
		];
		const syncManager = {
			update: jest.fn(),
		};
		const select = {
			getRawEntityRecord: () => persistedRecord,
		};
		const resolveSelect = { getEntitiesConfig: jest.fn( () => configs ) };
		const updatedRecord = {
			id: 10,
			meta: {
				unchanged: 'persisted',
				peer_value: 'persisted',
				edited: 'local',
				server_mutated: 'needs-normalizing',
				settings: { color: 'red', size: 'small' },
				_crdt_document: 'new-doc',
			},
		};
		apiFetch.mockImplementation( () => updatedRecord );
		getSyncManager.mockReturnValue( syncManager );

		const result = await saveEntityRecord(
			'postType',
			'post',
			edits
		)( { select, dispatch, resolveSelect } );

		expect( syncManager.update ).toHaveBeenNthCalledWith(
			1,
			'postType/post',
			10,
			edits,
			'local-undo-ignored'
		);
		expect( syncManager.update ).toHaveBeenNthCalledWith(
			2,
			'postType/post',
			10,
			{
				meta: {
					server_mutated: 'needs-normalizing',
					settings: { color: 'red', size: 'small' },
				},
			},
			'local-undo-ignored',
			{ isSave: true }
		);
		expect( syncManager.update ).toHaveBeenCalledTimes( 2 );
		expect( result ).toBe( updatedRecord );
	} );

	it( 'resets persisted edits using the pre-prePersist edits so the record is clean after saving', async () => {
		const persistedRecord = {
			id: 10,
			meta: {
				plugin_value: 'persisted',
				_crdt_document: 'old-doc',
			},
		};
		// Mirrors a store meta edit: `mergedEdits` snapshots the full edited
		// meta, including the load-time CRDT document.
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
				syncConfig: {},
				// Mirrors prePersistPostType, which injects a freshly
				// serialized CRDT snapshot into the request meta.
				__unstablePrePersist: async ( _persisted, saveEdits ) => ( {
					meta: {
						...saveEdits.meta,
						_crdt_document: 'new-doc',
					},
				} ),
			},
		];
		const syncManager = {
			update: jest.fn(),
		};
		const select = {
			getRawEntityRecord: () => persistedRecord,
		};
		const resolveSelect = { getEntitiesConfig: jest.fn( () => configs ) };
		const updatedRecord = {
			id: 10,
			meta: {
				plugin_value: 'edited',
				// The server may also mutate meta on save (e.g. a plugin
				// normalizing a value in a save hook).
				server_value: 'server-mutated',
				_crdt_document: 'new-doc',
			},
		};
		apiFetch.mockImplementation( () => updatedRecord );
		getSyncManager.mockReturnValue( syncManager );

		await saveEntityRecord(
			'postType',
			'post',
			edits
		)( { select, dispatch, resolveSelect } );

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
		// edits, not the prePersist-augmented request payload. Otherwise the
		// injected CRDT snapshot makes the comparison against the state edits
		// fail and the record stays dirty after a successful save.
		expect( dispatch.receiveEntityRecords ).toHaveBeenCalledWith(
			'postType',
			'post',
			updatedRecord,
			undefined,
			true,
			edits
		);
	} );

	it( 'syncs direct save changes before pre-persisting the record', async () => {
		const persistedRecord = {
			id: 10,
			status: 'auto-draft',
			template: '',
		};
		const edits = {
			id: 10,
			template: 'page-no-title',
		};
		const syncManager = {
			update: jest.fn(),
		};
		const prePersist = jest.fn( async () => {
			expect( syncManager.update ).toHaveBeenCalledTimes( 1 );
			expect( syncManager.update ).toHaveBeenLastCalledWith(
				'postType/page',
				10,
				edits,
				'local-undo-ignored'
			);

			return { status: 'draft' };
		} );
		const configs = [
			{
				name: 'page',
				kind: 'postType',
				baseURL: '/wp/v2/pages',
				syncConfig: {},
				__unstablePrePersist: prePersist,
			},
		];
		const select = {
			getRawEntityRecord: () => persistedRecord,
		};
		const resolveSelect = { getEntitiesConfig: jest.fn( () => configs ) };
		const updatedRecord = {
			...persistedRecord,
			...edits,
			status: 'draft',
		};
		apiFetch.mockImplementation( () => updatedRecord );
		getSyncManager.mockReturnValue( syncManager );

		const result = await saveEntityRecord(
			'postType',
			'page',
			edits
		)( { select, dispatch, resolveSelect } );

		expect( prePersist ).toHaveBeenCalledWith( persistedRecord, edits );
		expect( apiFetch ).toHaveBeenCalledWith( {
			path: '/wp/v2/pages/10',
			method: 'PUT',
			data: { ...edits, status: 'draft' },
		} );
		expect( syncManager.update ).toHaveBeenNthCalledWith(
			2,
			'postType/page',
			10,
			{ status: 'draft' },
			'local-undo-ignored',
			{ isSave: true }
		);
		expect( syncManager.update ).toHaveBeenCalledTimes( 2 );
		expect( result ).toBe( updatedRecord );
	} );

	it( 'does not mark pre-synced direct save changes as saved when the request fails', async () => {
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
				syncConfig: {},
			},
		];
		const syncManager = {
			update: jest.fn(),
		};
		const select = {
			getRawEntityRecord: () => persistedRecord,
		};
		const resolveSelect = { getEntitiesConfig: jest.fn( () => configs ) };
		const error = new Error( 'API error' );
		apiFetch.mockRejectedValue( error );
		getSyncManager.mockReturnValue( syncManager );

		await expect(
			saveEntityRecord( 'postType', 'page', edits, {
				throwOnError: true,
			} )( { select, dispatch, resolveSelect } )
		).rejects.toBe( error );

		expect( syncManager.update ).toHaveBeenCalledTimes( 1 );
		expect( syncManager.update ).toHaveBeenCalledWith(
			'postType/page',
			10,
			edits,
			'local-undo-ignored'
		);
	} );

	it( 'passes server-normalized edited fields to SyncManager#update after saving', async () => {
		const persistedRecord = {
			id: 10,
			slug: 'initial-slug',
		};
		const edits = {
			id: 10,
			slug: 'Needs Normalizing',
		};
		const configs = [
			{
				name: 'post',
				kind: 'postType',
				baseURL: '/wp/v2/posts',
				syncConfig: {},
			},
		];
		const syncManager = {
			update: jest.fn(),
		};
		const select = {
			getRawEntityRecord: () => persistedRecord,
		};
		const resolveSelect = { getEntitiesConfig: jest.fn( () => configs ) };
		const updatedRecord = {
			id: 10,
			slug: 'needs-normalizing',
		};
		apiFetch.mockImplementation( () => updatedRecord );
		getSyncManager.mockReturnValue( syncManager );

		const result = await saveEntityRecord(
			'postType',
			'post',
			edits
		)( { select, dispatch, resolveSelect } );

		expect( syncManager.update ).toHaveBeenCalledWith(
			'postType/post',
			10,
			{
				slug: 'needs-normalizing',
			},
			'local-undo-ignored',
			{ isSave: true }
		);
		expect( syncManager.update ).toHaveBeenCalledTimes( 2 );
		expect( result ).toBe( updatedRecord );
	} );

	it( 'does not pass unchanged raw-attribute fields to SyncManager#update after saving', async () => {
		// The raw entity record holds raw strings while the save response
		// nests them as `{ raw, rendered }`; the comparison must not treat
		// that shape difference as a server mutation.
		const persistedRecord = {
			id: 10,
			title: 'Initial title',
			content: '<p>Initial content</p>',
			excerpt: 'Initial excerpt',
			slug: 'initial-slug',
			modified: '2026-07-01T00:00:00',
		};
		const edits = {
			id: 10,
			slug: 'updated-slug',
		};
		const configs = [
			{
				name: 'post',
				kind: 'postType',
				baseURL: '/wp/v2/posts',
				syncConfig: {},
			},
		];
		const syncManager = {
			update: jest.fn(),
		};
		const select = {
			getRawEntityRecord: () => persistedRecord,
		};
		const resolveSelect = { getEntitiesConfig: jest.fn( () => configs ) };
		const updatedRecord = {
			id: 10,
			title: { raw: 'Initial title', rendered: 'Initial title' },
			content: {
				raw: '<p>Initial content</p>',
				rendered: '<p>Initial content</p>',
			},
			excerpt: { raw: 'Initial excerpt', rendered: 'Initial excerpt' },
			slug: 'updated-slug',
			modified: '2026-07-02T00:00:00',
		};
		apiFetch.mockImplementation( () => updatedRecord );
		getSyncManager.mockReturnValue( syncManager );

		const result = await saveEntityRecord(
			'postType',
			'post',
			edits
		)( { select, dispatch, resolveSelect } );

		expect( syncManager.update ).toHaveBeenCalledWith(
			'postType/post',
			10,
			{
				modified: '2026-07-02T00:00:00',
			},
			'local-undo-ignored',
			{ isSave: true }
		);
		expect( syncManager.update ).toHaveBeenCalledTimes( 2 );
		expect( result ).toBe( updatedRecord );
	} );

	it( 'does not pass edited raw-attribute fields to SyncManager#update when the server echoes them unchanged', async () => {
		const persistedRecord = {
			id: 10,
			content: '<p>Initial content</p>',
			modified: '2026-07-01T00:00:00',
		};
		const edits = {
			id: 10,
			content: '<p>Updated content</p>',
		};
		const configs = [
			{
				name: 'post',
				kind: 'postType',
				baseURL: '/wp/v2/posts',
				syncConfig: {},
			},
		];
		const syncManager = {
			update: jest.fn(),
		};
		const select = {
			getRawEntityRecord: () => persistedRecord,
		};
		const resolveSelect = { getEntitiesConfig: jest.fn( () => configs ) };
		const updatedRecord = {
			id: 10,
			content: {
				raw: edits.content,
				// The rendered value differs from the raw baseline, but only
				// raw values are compared.
				rendered: '<p class="rendered">Updated content</p>\n',
			},
			modified: '2026-07-02T00:00:00',
		};
		apiFetch.mockImplementation( () => updatedRecord );
		getSyncManager.mockReturnValue( syncManager );

		const result = await saveEntityRecord(
			'postType',
			'post',
			edits
		)( { select, dispatch, resolveSelect } );

		expect( syncManager.update ).toHaveBeenCalledWith(
			'postType/post',
			10,
			{
				modified: '2026-07-02T00:00:00',
			},
			'local-undo-ignored',
			{ isSave: true }
		);
		expect( result ).toBe( updatedRecord );
	} );

	it( 'passes raw-attribute fields whose raw value the server mutated to SyncManager#update', async () => {
		const persistedRecord = {
			id: 10,
			content: '<p>Initial content</p>',
		};
		const edits = {
			id: 10,
			content: '<p>Content with <script>bad</script> markup</p>',
		};
		const configs = [
			{
				name: 'post',
				kind: 'postType',
				baseURL: '/wp/v2/posts',
				syncConfig: {},
			},
		];
		const syncManager = {
			update: jest.fn(),
		};
		const select = {
			getRawEntityRecord: () => persistedRecord,
		};
		const resolveSelect = { getEntitiesConfig: jest.fn( () => configs ) };
		// The server strips disallowed markup from the sent content.
		const updatedRecord = {
			id: 10,
			content: {
				raw: '<p>Content with bad markup</p>',
				rendered: '<p>Content with bad markup</p>',
			},
		};
		apiFetch.mockImplementation( () => updatedRecord );
		getSyncManager.mockReturnValue( syncManager );

		const result = await saveEntityRecord(
			'postType',
			'post',
			edits
		)( { select, dispatch, resolveSelect } );

		expect( syncManager.update ).toHaveBeenCalledWith(
			'postType/post',
			10,
			{
				content: updatedRecord.content,
			},
			'local-undo-ignored',
			{ isSave: true }
		);
		expect( result ).toBe( updatedRecord );
	} );

	it( 'passes the full save response to SyncManager#update when the persisted record is missing', async () => {
		const edits = {
			id: 10,
			content: 'Updated content',
		};
		const configs = [
			{
				name: 'post',
				kind: 'postType',
				baseURL: '/wp/v2/posts',
				syncConfig: {},
			},
		];
		const syncManager = {
			update: jest.fn(),
		};
		const select = {
			getRawEntityRecord: () => undefined,
		};
		const resolveSelect = { getEntitiesConfig: jest.fn( () => configs ) };
		const updatedRecord = {
			id: 10,
			content: 'Updated content',
			template: 'single',
		};
		apiFetch.mockImplementation( () => updatedRecord );
		getSyncManager.mockReturnValue( syncManager );

		const result = await saveEntityRecord(
			'postType',
			'post',
			edits
		)( { select, dispatch, resolveSelect } );

		expect( syncManager.update ).toHaveBeenCalledWith(
			'postType/post',
			10,
			updatedRecord,
			'local-undo-ignored',
			{ isSave: true }
		);
		expect( syncManager.update ).toHaveBeenCalledTimes( 1 );
		expect( result ).toBe( updatedRecord );
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
		const resolveSelect = { getEntitiesConfig: jest.fn( () => configs ) };

		// Provide response
		apiFetch.mockImplementation( () => postType );

		const result = await saveEntityRecord(
			'root',
			'postType',
			postType
		)( { select, dispatch, resolveSelect } );

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

	describe( 'autosave CRDT snapshots', () => {
		const persistedRecord = {
			id: 10,
			title: 'Test post',
			content: 'Test content',
		};
		let select;
		let resolveSelect;
		let syncManager;

		beforeEach( () => {
			dispatch.receiveAutosaves = jest.fn();
			select = {
				getRawEntityRecord: () => persistedRecord,
			};
			syncManager = {
				getEntitySnapshot: jest.fn( () => 'ENCODED_SNAPSHOT' ),
				update: jest.fn(),
			};
			getSyncManager.mockReturnValue( syncManager );
			apiFetch.mockImplementation( () => ( {
				id: 20,
				parent: 10,
				author: 2,
				modified_gmt: '2026-07-21T10:00:00',
			} ) );
		} );

		afterEach( () => {
			getSyncManager.mockReset();
		} );

		function makeResolveSelect( entityConfig ) {
			return {
				getEntitiesConfig: jest.fn( () => [ entityConfig ] ),
			};
		}

		function getAutosaveRequestData() {
			return apiFetch.mock.calls[ 0 ][ 0 ].data;
		}

		it( 'sends the current CRDT snapshot with the autosave request', async () => {
			resolveSelect = makeResolveSelect( {
				name: 'post',
				kind: 'postType',
				baseURL: '/wp/v2/posts',
				syncConfig: {},
			} );

			await saveEntityRecord( 'postType', 'post', persistedRecord, {
				isAutosave: true,
			} )( { select, dispatch, resolveSelect } );

			expect( syncManager.getEntitySnapshot ).toHaveBeenCalledWith(
				'postType/post',
				10
			);
			expect( getAutosaveRequestData() ).toEqual(
				expect.objectContaining( {
					crdt_snapshot: 'ENCODED_SNAPSHOT',
				} )
			);
		} );

		it( 'omits the snapshot for entities without a sync config', async () => {
			resolveSelect = makeResolveSelect( {
				name: 'post',
				kind: 'postType',
				baseURL: '/wp/v2/posts',
			} );

			await saveEntityRecord( 'postType', 'post', persistedRecord, {
				isAutosave: true,
			} )( { select, dispatch, resolveSelect } );

			expect( syncManager.getEntitySnapshot ).not.toHaveBeenCalled();
			expect( getAutosaveRequestData() ).not.toHaveProperty(
				'crdt_snapshot'
			);
			expect( dispatch.receiveAutosaves ).toHaveBeenCalled();
		} );

		it( 'omits the snapshot when the entity is not loaded in the sync manager', async () => {
			resolveSelect = makeResolveSelect( {
				name: 'post',
				kind: 'postType',
				baseURL: '/wp/v2/posts',
				syncConfig: {},
			} );
			syncManager.getEntitySnapshot.mockReturnValue( undefined );

			await saveEntityRecord( 'postType', 'post', persistedRecord, {
				isAutosave: true,
			} )( { select, dispatch, resolveSelect } );

			expect( getAutosaveRequestData() ).not.toHaveProperty(
				'crdt_snapshot'
			);
		} );

		it( 'captures the snapshot before the request is sent', async () => {
			resolveSelect = makeResolveSelect( {
				name: 'post',
				kind: 'postType',
				baseURL: '/wp/v2/posts',
				syncConfig: {},
			} );

			// A snapshot captured after the request would describe content
			// the autosave did not include, which could wrongly suppress the
			// notice. Assert the ordering directly.
			const callOrder = [];
			syncManager.getEntitySnapshot.mockImplementation( () => {
				callOrder.push( 'snapshot' );
				return 'ENCODED_SNAPSHOT';
			} );
			apiFetch.mockImplementation( () => {
				callOrder.push( 'fetch' );
				return { id: 20, parent: 10 };
			} );

			await saveEntityRecord( 'postType', 'post', persistedRecord, {
				isAutosave: true,
			} )( { select, dispatch, resolveSelect } );

			expect( callOrder ).toEqual( [ 'snapshot', 'fetch' ] );
		} );

		it( 'applies direct record changes to the CRDT before capturing the snapshot', async () => {
			resolveSelect = makeResolveSelect( {
				name: 'post',
				kind: 'postType',
				baseURL: '/wp/v2/posts',
				syncConfig: {},
			} );

			// A direct caller can pass content that never went through
			// `editEntityRecord`, so it is not yet in the CRDT. If the
			// snapshot were captured first, it would describe a state
			// without this content and wrongly suppress the recovery
			// notice on reload.
			const callOrder = [];
			syncManager.update = jest.fn( () => {
				callOrder.push( 'update' );
			} );
			syncManager.getEntitySnapshot.mockImplementation( () => {
				callOrder.push( 'snapshot' );
				return 'ENCODED_SNAPSHOT';
			} );

			const record = {
				id: 10,
				content: 'Directly autosaved content',
			};

			await saveEntityRecord( 'postType', 'post', record, {
				isAutosave: true,
			} )( { select, dispatch, resolveSelect } );

			expect( syncManager.update ).toHaveBeenCalledWith(
				'postType/post',
				10,
				record,
				'local-undo-ignored'
			);
			expect( callOrder ).toEqual( [ 'update', 'snapshot' ] );
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
		const currentUser = { id: 1 };
		expect( receiveCurrentUser( currentUser ) ).toEqual( {
			type: 'RECEIVE_CURRENT_USER',
			currentUser,
		} );
	} );
} );

describe( '__experimentalBatch', () => {
	it( 'batches multiple actions together', async () => {
		const dispatch = {
			saveEntityRecord: jest.fn(
				( kind, name, record, { __unstableFetch } ) => {
					__unstableFetch( {} );
					return { id: 123, created: true };
				}
			),
			saveEditedEntityRecord: jest.fn(
				( kind, name, recordId, { __unstableFetch } ) => {
					__unstableFetch( {} );
					return { id: 123, updated: true };
				}
			),
			deleteEntityRecord: jest.fn(
				( kind, name, recordId, query, { __unstableFetch } ) => {
					__unstableFetch( {} );
					return { id: 123, deleted: true };
				}
			),
		};

		const results = await __experimentalBatch(
			[
				( { saveEntityRecord: _saveEntityRecord } ) =>
					_saveEntityRecord( 'root', 'widget', {} ),
				( { saveEditedEntityRecord: _saveEditedEntityRecord } ) =>
					_saveEditedEntityRecord( 'root', 'widget', 123 ),
				( { deleteEntityRecord: _deleteEntityRecord } ) =>
					_deleteEntityRecord( 'root', 'widget', 123, {} ),
			],
			{ __unstableProcessor: ( inputs ) => Promise.resolve( inputs ) }
		)( { dispatch } );

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

		expect( results ).toEqual( [
			{ id: 123, created: true },
			{ id: 123, updated: true },
			{ id: 123, deleted: true },
		] );
	} );
} );
