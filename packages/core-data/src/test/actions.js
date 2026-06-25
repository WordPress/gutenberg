/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import {
	parse,
	registerBlockType,
	unregisterBlockType,
} from '@wordpress/blocks';

jest.mock( '@wordpress/api-fetch' );

/**
 * Internal dependencies
 */
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
	LOCAL_EDITOR_ORIGIN: 'local-editor',
	LOCAL_UNDO_IGNORED_ORIGIN: 'gutenberg-undo-ignored',
} ) );

const TEST_BLOCK_NAME = 'test/save-response-content-block';

function blockContent( content ) {
	return `<!-- wp:${ TEST_BLOCK_NAME } ${ JSON.stringify( {
		content,
	} ) } /-->`;
}

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
				{
					baseRecord: {
						id: 1,
						meta: {
							existingKey: 'existingValue',
							editedKey: 'editedValue',
						},
					},
					isNewUndoLevel: true,
				}
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
				{
					baseRecord: {
						id: 1,
						meta: { key1: 'value1' },
					},
					isNewUndoLevel: true,
				}
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
				{
					baseRecord: {
						id: 1,
						title: 'Original Title',
						meta: { existingKey: 'existingValue' },
					},
					isNewUndoLevel: true,
				}
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

	beforeAll( () => {
		registerBlockType( TEST_BLOCK_NAME, {
			apiVersion: 3,
			title: 'Save response content test block',
			category: 'text',
			attributes: {
				content: {
					type: 'string',
				},
			},
			save: () => null,
		} );
	} );

	afterAll( () => {
		unregisterBlockType( TEST_BLOCK_NAME );
	} );

	beforeEach( async () => {
		apiFetch.mockReset();
		getSyncManager.mockReset();
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

	it( 'receives only saved meta when a CRDT persistence save returns stale post fields', async () => {
		const liveSyncState = {
			isSaved: false,
			title: 'synced title',
		};
		const post = {
			id: 10,
			title: 'synced title',
			content: 'synced content',
			meta: { _crdt_document: 'base-doc' },
		};
		const metaSave = {
			id: 10,
			meta: { _crdt_document: 'next-doc' },
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

		const staleSaveResponse = {
			...post,
			title: 'initial title',
			content: 'initial content',
			meta: { _crdt_document: 'next-doc' },
		};
		apiFetch.mockImplementation( () => {
			return staleSaveResponse;
		} );
		getSyncManager.mockReturnValue( syncManager );

		const result = await saveEntityRecord( 'postType', 'post', metaSave, {
			__unstableSkipSyncUpdate: true,
		} )( { select, dispatch, resolveSelect } );

		expect( dispatch.receiveEntityRecords ).toHaveBeenCalledWith(
			'postType',
			'post',
			{ id: 10, meta: { _crdt_document: 'next-doc' } },
			undefined,
			true,
			metaSave
		);
		expect( syncManager.update ).not.toHaveBeenCalled();
		expect( liveSyncState ).toEqual( {
			isSaved: false,
			title: 'synced title',
		} );
		expect( result ).toBe( staleSaveResponse );
	} );

	it( 'receives guarded CRDT meta when a skipped sync save response is based on the saved document', async () => {
		const savedCRDTDocument = JSON.stringify( {
			document: 'saved-document',
			version: 'document:saved',
		} );
		const staleResponseCRDTDocument = JSON.stringify( {
			document: 'stale-document',
			version: 'document:stale',
			baseVersion: 'document:saved',
		} );
		const baseContent = blockContent( 'base' );
		const savedContent = blockContent( 'checkpoint content 9' );
		const persistedRecord = {
			id: 10,
			title: 'checkpoint title 8',
			content: { raw: baseContent },
			meta: {},
		};
		const post = {
			id: 10,
			title: 'checkpoint title 9',
			meta: { _crdt_document: savedCRDTDocument },
		};
		const staleSaveResponse = {
			id: 10,
			title: {
				raw: 'checkpoint title 9',
				rendered: 'checkpoint title 9',
			},
			content: {
				raw: baseContent,
				rendered: '<p>base</p>',
			},
			meta: { _crdt_document: staleResponseCRDTDocument },
		};
		const guardedReceiveRecord = {
			id: 10,
			title: {
				raw: 'checkpoint title 9',
				rendered: 'checkpoint title 9',
			},
			meta: { _crdt_document: savedCRDTDocument },
		};
		const configs = [
			{
				name: 'post',
				kind: 'postType',
				baseURL: '/wp/v2/posts',
				rawAttributes: [ 'title', 'excerpt', 'content' ],
				syncConfig: {},
			},
		];
		const syncManager = {
			getCRDTRecordData: jest.fn( () => ( {
				title: 'checkpoint title 9',
				blocks: parse( savedContent ),
			} ) ),
			update: jest.fn(),
		};
		const select = {
			getRawEntityRecord: () => persistedRecord,
		};
		const resolveSelect = { getEntitiesConfig: jest.fn( () => configs ) };

		apiFetch.mockImplementation( () => staleSaveResponse );
		getSyncManager.mockReturnValue( syncManager );

		const result = await saveEntityRecord( 'postType', 'post', post, {
			__unstableSkipSyncUpdate: true,
		} )( { select, dispatch, resolveSelect } );

		expect( dispatch.receiveEntityRecords ).toHaveBeenCalledWith(
			'postType',
			'post',
			guardedReceiveRecord,
			undefined,
			true,
			post
		);
		expect( syncManager.update ).not.toHaveBeenCalled();
		expect( result ).toBe( staleSaveResponse );
	} );

	it( 'preserves the live sync title when a normal save response returns stale post fields', async () => {
		const persistedRecord = {
			id: 10,
			title: 'checkpoint title 8',
			content: { raw: 'checkpoint content 8' },
			meta: {},
		};
		const post = {
			id: 10,
			title: 'checkpoint title 9',
			content: 'checkpoint content 9',
			meta: { _crdt_document: 'fresh-crdt-doc' },
		};
		const staleSaveResponse = {
			id: 10,
			title: {
				raw: 'checkpoint title 8',
				rendered: 'checkpoint title 8',
			},
			content: { raw: 'checkpoint content 9' },
			meta: { _crdt_document: 'fresh-crdt-doc' },
		};
		const guardedSaveResponse = {
			...staleSaveResponse,
			title: {
				raw: 'checkpoint title 9',
				rendered: 'checkpoint title 9',
			},
		};
		const configs = [
			{
				name: 'post',
				kind: 'postType',
				baseURL: '/wp/v2/posts',
				rawAttributes: [ 'title', 'excerpt', 'content' ],
				syncConfig: {},
			},
		];
		const syncManager = {
			getCRDTRecordData: jest.fn( () => ( {
				title: 'checkpoint title 9',
				content: 'checkpoint content 9',
			} ) ),
			update: jest.fn(),
		};
		const select = {
			getRawEntityRecord: () => persistedRecord,
		};
		const resolveSelect = { getEntitiesConfig: jest.fn( () => configs ) };

		apiFetch.mockImplementation( () => staleSaveResponse );
		getSyncManager.mockReturnValue( syncManager );

		const result = await saveEntityRecord(
			'postType',
			'post',
			post
		)( { select, dispatch, resolveSelect } );

		expect( dispatch.receiveEntityRecords ).toHaveBeenCalledWith(
			'postType',
			'post',
			guardedSaveResponse,
			undefined,
			true,
			post
		);
		expect( syncManager.update ).toHaveBeenCalledWith(
			'postType/post',
			10,
			guardedSaveResponse,
			'gutenberg-undo-ignored',
			{ isSave: true }
		);
		expect( result ).toBe( staleSaveResponse );
	} );

	it( 'preserves the live sync content when a normal save response returns stale post fields', async () => {
		const persistedRecord = {
			id: 10,
			title: 'checkpoint title 8',
			content: { raw: 'checkpoint content 8' },
			meta: {},
		};
		const post = {
			id: 10,
			title: 'checkpoint title 9',
			content: 'checkpoint content 9',
			meta: { _crdt_document: 'fresh-crdt-doc' },
		};
		const staleSaveResponse = {
			id: 10,
			title: {
				raw: 'checkpoint title 9',
				rendered: 'checkpoint title 9',
			},
			content: {
				raw: 'checkpoint content 8',
				rendered: 'checkpoint content 8',
			},
			meta: { _crdt_document: 'fresh-crdt-doc' },
		};
		const guardedSaveResponse = {
			...staleSaveResponse,
			content: {
				raw: 'checkpoint content 9',
				rendered: 'checkpoint content 9',
			},
		};
		const configs = [
			{
				name: 'post',
				kind: 'postType',
				baseURL: '/wp/v2/posts',
				rawAttributes: [ 'title', 'excerpt', 'content' ],
				syncConfig: {},
			},
		];
		const syncManager = {
			getCRDTRecordData: jest.fn( () => ( {
				title: 'checkpoint title 9',
				content: 'checkpoint content 9',
			} ) ),
			update: jest.fn(),
		};
		const select = {
			getRawEntityRecord: () => persistedRecord,
		};
		const resolveSelect = { getEntitiesConfig: jest.fn( () => configs ) };

		apiFetch.mockImplementation( () => staleSaveResponse );
		getSyncManager.mockReturnValue( syncManager );

		const result = await saveEntityRecord(
			'postType',
			'post',
			post
		)( { select, dispatch, resolveSelect } );

		expect( dispatch.receiveEntityRecords ).toHaveBeenCalledWith(
			'postType',
			'post',
			guardedSaveResponse,
			undefined,
			true,
			post
		);
		expect( syncManager.update ).toHaveBeenCalledWith(
			'postType/post',
			10,
			guardedSaveResponse,
			'gutenberg-undo-ignored',
			{ isSave: true }
		);
		expect( result ).toBe( staleSaveResponse );
	} );

	it( 'guards stale normal save response content when CRDT blocks are current', async () => {
		const persistedRecord = {
			id: 10,
			title: 'checkpoint title 8',
			content: { raw: blockContent( 'base' ) },
			meta: {},
		};
		const post = {
			id: 10,
			title: 'checkpoint title 9',
			content: blockContent( 'checkpoint content 9' ),
			meta: { _crdt_document: 'fresh-crdt-doc' },
		};
		const staleSaveResponse = {
			id: 10,
			title: {
				raw: 'checkpoint title 9',
				rendered: 'checkpoint title 9',
			},
			content: {
				raw: blockContent( 'base' ),
				rendered: '<p>base</p>',
			},
			meta: { _crdt_document: 'fresh-crdt-doc' },
		};
		const guardedSaveResponse = {
			...staleSaveResponse,
			title: {
				raw: 'checkpoint title 9',
				rendered: 'checkpoint title 9',
			},
			content: {
				raw: blockContent( 'checkpoint content 9' ),
				rendered: blockContent( 'checkpoint content 9' ),
			},
			meta: { _crdt_document: 'fresh-crdt-doc' },
		};
		const configs = [
			{
				name: 'post',
				kind: 'postType',
				baseURL: '/wp/v2/posts',
				rawAttributes: [ 'title', 'excerpt', 'content' ],
				syncConfig: {},
			},
		];
		const syncManager = {
			getCRDTRecordData: jest.fn( () => ( {
				title: 'checkpoint title 9',
				blocks: parse( post.content ),
			} ) ),
			update: jest.fn(),
		};
		const select = {
			getRawEntityRecord: () => persistedRecord,
		};
		const resolveSelect = { getEntitiesConfig: jest.fn( () => configs ) };

		apiFetch.mockImplementation( () => staleSaveResponse );
		getSyncManager.mockReturnValue( syncManager );

		const result = await saveEntityRecord(
			'postType',
			'post',
			post
		)( { select, dispatch, resolveSelect } );

		expect( dispatch.receiveEntityRecords ).toHaveBeenCalledWith(
			'postType',
			'post',
			guardedSaveResponse,
			undefined,
			true,
			post
		);
		expect( syncManager.update ).toHaveBeenCalledWith(
			'postType/post',
			10,
			guardedSaveResponse,
			'gutenberg-undo-ignored',
			{ isSave: true }
		);
		expect( result ).toBe( staleSaveResponse );
	} );

	it( 'guards stale save response content when the response CRDT document is based on the saved document', async () => {
		const savedCRDTDocument = JSON.stringify( {
			document: 'saved-document',
			version: 'document:saved',
		} );
		const staleResponseCRDTDocument = JSON.stringify( {
			document: 'stale-document',
			version: 'document:stale',
			baseVersion: 'document:saved',
		} );
		const persistedRecord = {
			id: 10,
			content: {
				raw: blockContent( 'base' ),
			},
			meta: {},
		};
		const post = {
			id: 10,
			content: blockContent( 'checkpoint content 9' ),
			meta: { _crdt_document: savedCRDTDocument },
		};
		const staleSaveResponse = {
			id: 10,
			content: {
				raw: blockContent( 'base' ),
				rendered: '<p>base</p>',
			},
			meta: { _crdt_document: staleResponseCRDTDocument },
		};
		const guardedSaveResponse = {
			...staleSaveResponse,
			content: {
				raw: blockContent( 'checkpoint content 9' ),
				rendered: blockContent( 'checkpoint content 9' ),
			},
			meta: { _crdt_document: savedCRDTDocument },
		};
		const configs = [
			{
				name: 'post',
				kind: 'postType',
				baseURL: '/wp/v2/posts',
				rawAttributes: [ 'title', 'excerpt', 'content' ],
				syncConfig: {},
			},
		];
		const syncManager = {
			getCRDTRecordData: jest.fn( () => ( {
				blocks: parse( post.content ),
			} ) ),
			update: jest.fn(),
		};
		const select = {
			getRawEntityRecord: () => persistedRecord,
		};
		const resolveSelect = { getEntitiesConfig: jest.fn( () => configs ) };

		apiFetch.mockImplementation( () => staleSaveResponse );
		getSyncManager.mockReturnValue( syncManager );

		const result = await saveEntityRecord(
			'postType',
			'post',
			post
		)( { select, dispatch, resolveSelect } );

		expect( dispatch.receiveEntityRecords ).toHaveBeenCalledWith(
			'postType',
			'post',
			guardedSaveResponse,
			undefined,
			true,
			post
		);
		expect( syncManager.update ).toHaveBeenCalledWith(
			'postType/post',
			10,
			guardedSaveResponse,
			'gutenberg-undo-ignored',
			{ isSave: true }
		);
		expect( result ).toBe( staleSaveResponse );
	} );

	it( 'guards stale base-version save response content even when live CRDT blocks are stale', async () => {
		const savedCRDTDocument = JSON.stringify( {
			document: 'saved-document',
			version: 'document:saved',
		} );
		const staleResponseCRDTDocument = JSON.stringify( {
			document: 'stale-document',
			version: 'document:stale',
			baseVersion: 'document:saved',
		} );
		const baseContent = blockContent( 'base' );
		const savedContent = blockContent( 'checkpoint content 9' );
		const persistedRecord = {
			id: 10,
			content: {
				raw: baseContent,
			},
			meta: {},
		};
		const post = {
			id: 10,
			content: savedContent,
			meta: { _crdt_document: savedCRDTDocument },
		};
		const staleSaveResponse = {
			id: 10,
			content: {
				raw: baseContent,
				rendered: '<p>base</p>',
			},
			meta: { _crdt_document: staleResponseCRDTDocument },
		};
		const guardedSaveResponse = {
			...staleSaveResponse,
			content: {
				raw: savedContent,
				rendered: savedContent,
			},
			meta: { _crdt_document: savedCRDTDocument },
		};
		const configs = [
			{
				name: 'post',
				kind: 'postType',
				baseURL: '/wp/v2/posts',
				rawAttributes: [ 'title', 'excerpt', 'content' ],
				syncConfig: {},
			},
		];
		const syncManager = {
			getCRDTRecordData: jest.fn( () => ( {
				blocks: parse( baseContent ),
			} ) ),
			update: jest.fn(),
		};
		const select = {
			getRawEntityRecord: () => persistedRecord,
		};
		const resolveSelect = { getEntitiesConfig: jest.fn( () => configs ) };

		apiFetch.mockImplementation( () => staleSaveResponse );
		getSyncManager.mockReturnValue( syncManager );

		const result = await saveEntityRecord(
			'postType',
			'post',
			post
		)( { select, dispatch, resolveSelect } );

		expect( dispatch.receiveEntityRecords ).toHaveBeenCalledWith(
			'postType',
			'post',
			guardedSaveResponse,
			undefined,
			true,
			post
		);
		expect( syncManager.update ).toHaveBeenCalledWith(
			'postType/post',
			10,
			guardedSaveResponse,
			'gutenberg-undo-ignored',
			{ isSave: true }
		);
		expect( result ).toBe( staleSaveResponse );
	} );

	it( 'guards stale base-version save response content using the response record snapshot', async () => {
		const baseContent = blockContent( 'base' );
		const savedContent = blockContent( 'checkpoint content 9' );
		const savedCRDTDocument = JSON.stringify( {
			document: 'saved-document',
			version: 'document:saved',
			baseVersion: 'document:base',
			recordSnapshot: {
				content: savedContent,
			},
		} );
		const persistedRecord = {
			id: 10,
			content: {
				raw: baseContent,
			},
			meta: {},
		};
		const post = {
			id: 10,
			content: baseContent,
			meta: { _crdt_document: savedCRDTDocument },
		};
		const persistedEdits = {
			...post,
			content: savedContent,
		};
		const staleSaveResponse = {
			id: 10,
			content: {
				raw: baseContent,
				rendered: '<p>base</p>',
			},
			meta: { _crdt_document: savedCRDTDocument },
		};
		const guardedSaveResponse = {
			...staleSaveResponse,
			content: {
				raw: savedContent,
				rendered: savedContent,
			},
			meta: { _crdt_document: savedCRDTDocument },
		};
		const configs = [
			{
				name: 'post',
				kind: 'postType',
				baseURL: '/wp/v2/posts',
				rawAttributes: [ 'title', 'excerpt', 'content' ],
				syncConfig: {},
			},
		];
		const syncManager = {
			getCRDTRecordData: jest.fn( () => undefined ),
			update: jest.fn(),
		};
		const select = {
			getRawEntityRecord: () => persistedRecord,
		};
		const resolveSelect = { getEntitiesConfig: jest.fn( () => configs ) };

		apiFetch.mockImplementation( () => staleSaveResponse );
		getSyncManager.mockReturnValue( syncManager );

		const result = await saveEntityRecord(
			'postType',
			'post',
			post
		)( { select, dispatch, resolveSelect } );

		expect( dispatch.receiveEntityRecords ).toHaveBeenCalledWith(
			'postType',
			'post',
			guardedSaveResponse,
			undefined,
			true,
			persistedEdits
		);
		expect( syncManager.update ).toHaveBeenCalledWith(
			'postType/post',
			10,
			guardedSaveResponse,
			'gutenberg-undo-ignored',
			{ isSave: true }
		);
		expect( result ).toBe( staleSaveResponse );
	} );

	it( 'does not write snapshot raw fields to sync after hydrating a CRDT document save response', async () => {
		const baseContent = blockContent( 'base' );
		const savedContent = blockContent( 'checkpoint content 9' );
		const savedCRDTDocument = JSON.stringify( {
			document: 'saved-document',
			version: 'document:saved',
			recordSnapshot: {
				content: savedContent,
			},
		} );
		const persistedRecord = {
			id: 10,
			content: {
				raw: baseContent,
			},
			meta: {},
		};
		const post = {
			id: 10,
			content: savedContent,
			meta: { _crdt_document: savedCRDTDocument },
		};
		const staleSaveResponse = {
			id: 10,
			content: {
				raw: baseContent,
				rendered: '<p>base</p>',
			},
			meta: { _crdt_document: savedCRDTDocument },
		};
		const guardedSaveResponse = {
			...staleSaveResponse,
			content: {
				raw: savedContent,
				rendered: savedContent,
			},
			meta: { _crdt_document: savedCRDTDocument },
		};
		const configs = [
			{
				name: 'post',
				kind: 'postType',
				baseURL: '/wp/v2/posts',
				rawAttributes: [ 'title', 'excerpt', 'content' ],
				syncConfig: {},
			},
		];
		const syncManager = {
			hydrateRecordFromPersistedCRDTDoc: jest
				.fn()
				.mockResolvedValue( true ),
			getCRDTRecordData: jest.fn( () => undefined ),
			update: jest.fn(),
		};
		const select = {
			getRawEntityRecord: () => persistedRecord,
		};
		const resolveSelect = { getEntitiesConfig: jest.fn( () => configs ) };

		apiFetch.mockImplementation( () => staleSaveResponse );
		getSyncManager.mockReturnValue( syncManager );

		const result = await saveEntityRecord(
			'postType',
			'post',
			post
		)( { select, dispatch, resolveSelect } );

		expect( dispatch.receiveEntityRecords ).toHaveBeenCalledWith(
			'postType',
			'post',
			guardedSaveResponse,
			undefined,
			true,
			{
				...post,
				content: savedContent,
			}
		);
		expect(
			syncManager.hydrateRecordFromPersistedCRDTDoc
		).toHaveBeenCalledWith( 'postType/post', 10, guardedSaveResponse );
		expect( syncManager.update ).toHaveBeenCalledWith(
			'postType/post',
			10,
			{
				id: 10,
				meta: { _crdt_document: savedCRDTDocument },
			},
			'gutenberg-undo-ignored',
			{ isSave: true }
		);
		expect( result ).toBe( staleSaveResponse );
	} );

	it( 'strips stale raw fields absent from a CRDT base-version save response', async () => {
		const savedCRDTDocument = JSON.stringify( {
			document: 'saved-document',
			version: 'document:saved',
		} );
		const staleResponseCRDTDocument = JSON.stringify( {
			document: 'stale-document',
			version: 'document:stale',
			baseVersion: 'document:saved',
		} );
		const persistedRecord = {
			id: 10,
			title: 'checkpoint title 8',
			content: { raw: blockContent( 'base' ) },
			meta: {},
		};
		const post = {
			id: 10,
			title: 'checkpoint title 9',
			meta: { _crdt_document: savedCRDTDocument },
		};
		const staleSaveResponse = {
			id: 10,
			title: {
				raw: 'checkpoint title 9',
				rendered: 'checkpoint title 9',
			},
			content: {
				raw: blockContent( 'base' ),
				rendered: '<p>base</p>',
			},
			meta: { _crdt_document: staleResponseCRDTDocument },
		};
		const guardedSaveResponse = {
			id: 10,
			title: {
				raw: 'checkpoint title 9',
				rendered: 'checkpoint title 9',
			},
			meta: { _crdt_document: savedCRDTDocument },
		};
		const configs = [
			{
				name: 'post',
				kind: 'postType',
				baseURL: '/wp/v2/posts',
				rawAttributes: [ 'title', 'excerpt', 'content' ],
				syncConfig: {},
			},
		];
		const syncManager = {
			getCRDTRecordData: jest.fn( () => ( {
				title: 'checkpoint title 9',
				blocks: parse( blockContent( 'checkpoint content 9' ) ),
			} ) ),
			update: jest.fn(),
		};
		const select = {
			getRawEntityRecord: () => persistedRecord,
		};
		const resolveSelect = { getEntitiesConfig: jest.fn( () => configs ) };

		apiFetch.mockImplementation( () => staleSaveResponse );
		getSyncManager.mockReturnValue( syncManager );

		const result = await saveEntityRecord(
			'postType',
			'post',
			post
		)( { select, dispatch, resolveSelect } );

		expect( dispatch.receiveEntityRecords ).toHaveBeenCalledWith(
			'postType',
			'post',
			guardedSaveResponse,
			undefined,
			true,
			post
		);
		expect( syncManager.update ).toHaveBeenCalledWith(
			'postType/post',
			10,
			guardedSaveResponse,
			'gutenberg-undo-ignored',
			{ isSave: true }
		);
		expect( result ).toBe( staleSaveResponse );
	} );

	it( 'does not mark stripped stale raw fields as persisted edits', async () => {
		const savedCRDTDocument = JSON.stringify( {
			document: 'saved-document',
			version: 'document:saved',
		} );
		const staleResponseCRDTDocument = JSON.stringify( {
			document: 'stale-document',
			version: 'document:stale',
			baseVersion: 'document:saved',
		} );
		const baseContent = blockContent( 'base' );
		const savedContent = blockContent( 'checkpoint content 9' );
		const unrelatedContent = blockContent( 'unrelated live content' );
		const persistedRecord = {
			id: 10,
			title: 'checkpoint title 8',
			content: { raw: baseContent },
			meta: {},
		};
		const post = {
			id: 10,
			title: 'checkpoint title 9',
			content: savedContent,
			meta: { _crdt_document: savedCRDTDocument },
		};
		const persistedEdits = {
			id: 10,
			title: 'checkpoint title 9',
			meta: { _crdt_document: savedCRDTDocument },
		};
		const staleSaveResponse = {
			id: 10,
			title: {
				raw: 'checkpoint title 9',
				rendered: 'checkpoint title 9',
			},
			content: {
				raw: baseContent,
				rendered: '<p>base</p>',
			},
			meta: { _crdt_document: staleResponseCRDTDocument },
		};
		const guardedSaveResponse = {
			id: 10,
			title: {
				raw: 'checkpoint title 9',
				rendered: 'checkpoint title 9',
			},
			meta: { _crdt_document: savedCRDTDocument },
		};
		const configs = [
			{
				name: 'post',
				kind: 'postType',
				baseURL: '/wp/v2/posts',
				rawAttributes: [ 'title', 'excerpt', 'content' ],
				syncConfig: {},
			},
		];
		const syncManager = {
			getCRDTRecordData: jest.fn( () => ( {
				title: 'checkpoint title 9',
				blocks: parse( unrelatedContent ),
			} ) ),
			update: jest.fn(),
		};
		const select = {
			getRawEntityRecord: () => persistedRecord,
		};
		const resolveSelect = { getEntitiesConfig: jest.fn( () => configs ) };

		apiFetch.mockImplementation( () => staleSaveResponse );
		getSyncManager.mockReturnValue( syncManager );

		const result = await saveEntityRecord(
			'postType',
			'post',
			post
		)( { select, dispatch, resolveSelect } );

		expect( dispatch.receiveEntityRecords ).toHaveBeenCalledWith(
			'postType',
			'post',
			guardedSaveResponse,
			undefined,
			true,
			persistedEdits
		);
		expect( syncManager.update ).toHaveBeenCalledWith(
			'postType/post',
			10,
			guardedSaveResponse,
			'gutenberg-undo-ignored',
			{ isSave: true }
		);
		expect( result ).toBe( staleSaveResponse );
	} );

	it( 'keeps raw fields absent from edits when the save response CRDT document is unrelated', async () => {
		const persistedRecord = {
			id: 10,
			content: { raw: blockContent( 'base' ) },
			meta: {},
		};
		const post = {
			id: 10,
			meta: { _crdt_document: 'saved-crdt-doc' },
		};
		const staleSaveResponse = {
			id: 10,
			content: { raw: blockContent( 'base' ) },
			meta: { _crdt_document: 'server-different-crdt-doc' },
		};
		const configs = [
			{
				name: 'post',
				kind: 'postType',
				baseURL: '/wp/v2/posts',
				rawAttributes: [ 'title', 'excerpt', 'content' ],
				syncConfig: {},
			},
		];
		const syncManager = {
			getCRDTRecordData: jest.fn( () => ( {
				blocks: parse( blockContent( 'base' ) ),
			} ) ),
			update: jest.fn(),
		};
		const select = {
			getRawEntityRecord: () => persistedRecord,
		};
		const resolveSelect = { getEntitiesConfig: jest.fn( () => configs ) };

		apiFetch.mockImplementation( () => staleSaveResponse );
		getSyncManager.mockReturnValue( syncManager );

		const result = await saveEntityRecord(
			'postType',
			'post',
			post
		)( { select, dispatch, resolveSelect } );

		expect( dispatch.receiveEntityRecords ).toHaveBeenCalledWith(
			'postType',
			'post',
			staleSaveResponse,
			undefined,
			true,
			post
		);
		expect( syncManager.update ).toHaveBeenCalledWith(
			'postType/post',
			10,
			staleSaveResponse,
			'gutenberg-undo-ignored',
			{ isSave: true }
		);
		expect( result ).toBe( staleSaveResponse );
	} );

	it( 'hydrates after receiving a guarded CRDT document save response', async () => {
		const savedCRDTDocument = JSON.stringify( {
			document: 'saved-document',
			version: 'document:saved',
		} );
		const persistedRecord = {
			id: 10,
			content: { raw: 'checkpoint content 8' },
			meta: {},
		};
		const post = {
			id: 10,
			content: 'checkpoint content 9',
			meta: { _crdt_document: savedCRDTDocument },
		};
		const staleSaveResponse = {
			id: 10,
			content: {
				raw: 'checkpoint content 8',
				rendered: 'checkpoint content 8',
			},
			meta: { _crdt_document: savedCRDTDocument },
		};
		const guardedSaveResponse = {
			id: 10,
			meta: { _crdt_document: savedCRDTDocument },
		};
		const configs = [
			{
				name: 'post',
				kind: 'postType',
				baseURL: '/wp/v2/posts',
				rawAttributes: [ 'title', 'excerpt', 'content' ],
				syncConfig: {},
			},
		];
		const syncManager = {
			hydrateRecordFromPersistedCRDTDoc: jest
				.fn()
				.mockResolvedValue( true ),
			getCRDTRecordData: jest.fn( () => ( {
				content: 'checkpoint content 10',
			} ) ),
			update: jest.fn(),
		};
		const select = {
			getRawEntityRecord: () => persistedRecord,
		};
		const resolveSelect = { getEntitiesConfig: jest.fn( () => configs ) };

		apiFetch.mockImplementation( () => staleSaveResponse );
		getSyncManager.mockReturnValue( syncManager );

		const result = await saveEntityRecord(
			'postType',
			'post',
			post
		)( { select, dispatch, resolveSelect } );

		expect( dispatch.receiveEntityRecords ).toHaveBeenCalledWith(
			'postType',
			'post',
			guardedSaveResponse,
			undefined,
			true,
			{
				id: 10,
				meta: { _crdt_document: savedCRDTDocument },
			}
		);
		expect(
			syncManager.hydrateRecordFromPersistedCRDTDoc
		).toHaveBeenCalledWith( 'postType/post', 10, guardedSaveResponse );
		expect( syncManager.update ).toHaveBeenCalledWith(
			'postType/post',
			10,
			guardedSaveResponse,
			'gutenberg-undo-ignored',
			{ isSave: true }
		);
		expect( result ).toBe( staleSaveResponse );
	} );

	it( 'does not write a stale normal save response title to sync after the live title advances', async () => {
		const persistedRecord = {
			id: 10,
			title: 'checkpoint title 8',
			content: { raw: 'checkpoint content 8' },
			meta: {},
		};
		const post = {
			id: 10,
			title: 'checkpoint title 9',
			content: 'checkpoint content 9',
			meta: { _crdt_document: 'save-title-9-crdt-doc' },
		};
		const staleSaveResponse = {
			id: 10,
			title: {
				raw: 'checkpoint title 8',
				rendered: 'checkpoint title 8',
			},
			content: { raw: 'checkpoint content 9' },
			meta: { _crdt_document: 'save-title-9-crdt-doc' },
		};
		const syncSaveResponse = {
			id: 10,
			content: { raw: 'checkpoint content 9' },
			meta: { _crdt_document: 'save-title-9-crdt-doc' },
		};
		const configs = [
			{
				name: 'post',
				kind: 'postType',
				baseURL: '/wp/v2/posts',
				rawAttributes: [ 'title', 'excerpt', 'content' ],
				syncConfig: {},
			},
		];
		const syncManager = {
			getCRDTRecordData: jest.fn( () => ( {
				title: 'checkpoint title 10',
				content: 'checkpoint content 9',
			} ) ),
			update: jest.fn(),
		};
		const select = {
			getRawEntityRecord: () => persistedRecord,
		};
		const resolveSelect = { getEntitiesConfig: jest.fn( () => configs ) };

		apiFetch.mockImplementation( () => staleSaveResponse );
		getSyncManager.mockReturnValue( syncManager );

		const result = await saveEntityRecord(
			'postType',
			'post',
			post
		)( { select, dispatch, resolveSelect } );

		expect( dispatch.receiveEntityRecords ).toHaveBeenCalledWith(
			'postType',
			'post',
			syncSaveResponse,
			undefined,
			true,
			{
				id: 10,
				content: 'checkpoint content 9',
				meta: { _crdt_document: 'save-title-9-crdt-doc' },
			}
		);
		expect( syncManager.update ).toHaveBeenCalledWith(
			'postType/post',
			10,
			syncSaveResponse,
			'gutenberg-undo-ignored',
			{ isSave: true }
		);
		expect( result ).toBe( staleSaveResponse );
	} );

	it( 'does not write a stale normal save response content to sync after the live content advances', async () => {
		const persistedRecord = {
			id: 10,
			title: 'checkpoint title 8',
			content: { raw: 'checkpoint content 8' },
			meta: {},
		};
		const post = {
			id: 10,
			title: 'checkpoint title 9',
			content: 'checkpoint content 9',
			meta: { _crdt_document: 'save-content-9-crdt-doc' },
		};
		const staleSaveResponse = {
			id: 10,
			title: {
				raw: 'checkpoint title 9',
				rendered: 'checkpoint title 9',
			},
			content: {
				raw: 'checkpoint content 8',
				rendered: 'checkpoint content 8',
			},
			meta: { _crdt_document: 'save-content-9-crdt-doc' },
		};
		const syncSaveResponse = {
			id: 10,
			title: {
				raw: 'checkpoint title 9',
				rendered: 'checkpoint title 9',
			},
			meta: { _crdt_document: 'save-content-9-crdt-doc' },
		};
		const configs = [
			{
				name: 'post',
				kind: 'postType',
				baseURL: '/wp/v2/posts',
				rawAttributes: [ 'title', 'excerpt', 'content' ],
				syncConfig: {},
			},
		];
		const syncManager = {
			getCRDTRecordData: jest.fn( () => ( {
				title: 'checkpoint title 9',
				content: 'checkpoint content 10',
			} ) ),
			update: jest.fn(),
		};
		const select = {
			getRawEntityRecord: () => persistedRecord,
		};
		const resolveSelect = { getEntitiesConfig: jest.fn( () => configs ) };

		apiFetch.mockImplementation( () => staleSaveResponse );
		getSyncManager.mockReturnValue( syncManager );

		const result = await saveEntityRecord(
			'postType',
			'post',
			post
		)( { select, dispatch, resolveSelect } );

		expect( dispatch.receiveEntityRecords ).toHaveBeenCalledWith(
			'postType',
			'post',
			syncSaveResponse,
			undefined,
			true,
			{
				id: 10,
				title: 'checkpoint title 9',
				meta: { _crdt_document: 'save-content-9-crdt-doc' },
			}
		);
		expect( syncManager.update ).toHaveBeenCalledWith(
			'postType/post',
			10,
			syncSaveResponse,
			'gutenberg-undo-ignored',
			{ isSave: true }
		);
		expect( result ).toBe( staleSaveResponse );
	} );

	it( 'drops a stale normal save response saved edit content after the live CRDT advances', async () => {
		const persistedRecord = {
			id: 10,
			title: 'checkpoint title 8',
			content: { raw: 'checkpoint content 8' },
			meta: {},
		};
		const post = {
			id: 10,
			title: 'checkpoint title 9',
			content: 'checkpoint content 9',
			meta: { _crdt_document: 'save-content-9-crdt-doc' },
		};
		const staleSaveResponse = {
			id: 10,
			title: {
				raw: 'checkpoint title 9',
				rendered: 'checkpoint title 9',
			},
			content: {
				raw: 'checkpoint content 9',
				rendered: 'checkpoint content 9',
			},
			meta: { _crdt_document: 'save-content-9-crdt-doc' },
		};
		const guardedSaveResponse = {
			id: 10,
			title: {
				raw: 'checkpoint title 9',
				rendered: 'checkpoint title 9',
			},
			meta: { _crdt_document: 'save-content-9-crdt-doc' },
		};
		const configs = [
			{
				name: 'post',
				kind: 'postType',
				baseURL: '/wp/v2/posts',
				rawAttributes: [ 'title', 'excerpt', 'content' ],
				syncConfig: {},
			},
		];
		const syncManager = {
			getCRDTRecordData: jest.fn( () => ( {
				title: 'checkpoint title 9',
				content: 'checkpoint content 10',
			} ) ),
			update: jest.fn(),
		};
		const select = {
			getRawEntityRecord: () => persistedRecord,
		};
		const resolveSelect = { getEntitiesConfig: jest.fn( () => configs ) };

		apiFetch.mockImplementation( () => staleSaveResponse );
		getSyncManager.mockReturnValue( syncManager );

		const result = await saveEntityRecord(
			'postType',
			'post',
			post
		)( { select, dispatch, resolveSelect } );

		expect( dispatch.receiveEntityRecords ).toHaveBeenCalledWith(
			'postType',
			'post',
			guardedSaveResponse,
			undefined,
			true,
			{
				id: 10,
				title: 'checkpoint title 9',
				meta: { _crdt_document: 'save-content-9-crdt-doc' },
			}
		);
		expect( syncManager.update ).toHaveBeenCalledWith(
			'postType/post',
			10,
			guardedSaveResponse,
			'gutenberg-undo-ignored',
			{ isSave: true }
		);
		expect( result ).toBe( staleSaveResponse );
	} );

	it( 'does not rewrite a stale normal save response title without outgoing CRDT document evidence', async () => {
		const persistedRecord = {
			id: 10,
			title: 'checkpoint title 8',
			meta: {},
		};
		const post = {
			id: 10,
			title: 'checkpoint title 9',
			meta: {},
		};
		const staleSaveResponse = {
			id: 10,
			title: {
				raw: 'checkpoint title 8',
				rendered: 'checkpoint title 8',
			},
			meta: {},
		};
		const syncSaveResponse = {
			id: 10,
			meta: {},
		};
		const configs = [
			{
				name: 'post',
				kind: 'postType',
				baseURL: '/wp/v2/posts',
				rawAttributes: [ 'title', 'excerpt', 'content' ],
				syncConfig: {},
			},
		];
		const syncManager = {
			getCRDTRecordData: jest.fn( () => ( {
				title: 'checkpoint title 9',
			} ) ),
			update: jest.fn(),
		};
		const select = {
			getRawEntityRecord: () => persistedRecord,
		};
		const resolveSelect = { getEntitiesConfig: jest.fn( () => configs ) };

		apiFetch.mockImplementation( () => staleSaveResponse );
		getSyncManager.mockReturnValue( syncManager );

		const result = await saveEntityRecord(
			'postType',
			'post',
			post
		)( { select, dispatch, resolveSelect } );

		expect( dispatch.receiveEntityRecords ).toHaveBeenCalledWith(
			'postType',
			'post',
			staleSaveResponse,
			undefined,
			true,
			post
		);
		expect( syncManager.update ).toHaveBeenCalledWith(
			'postType/post',
			10,
			syncSaveResponse,
			'gutenberg-undo-ignored',
			{ isSave: true }
		);
		expect( result ).toBe( staleSaveResponse );
	} );

	it( 'does not rewrite a stale normal save response title for a different CRDT document', async () => {
		const persistedRecord = {
			id: 10,
			title: 'checkpoint title 8',
			meta: {},
		};
		const post = {
			id: 10,
			title: 'checkpoint title 9',
			meta: { _crdt_document: 'save-title-9-crdt-doc' },
		};
		const staleSaveResponse = {
			id: 10,
			title: {
				raw: 'checkpoint title 8',
				rendered: 'checkpoint title 8',
			},
			meta: { _crdt_document: 'server-different-crdt-doc' },
		};
		const syncSaveResponse = {
			id: 10,
			meta: { _crdt_document: 'server-different-crdt-doc' },
		};
		const configs = [
			{
				name: 'post',
				kind: 'postType',
				baseURL: '/wp/v2/posts',
				rawAttributes: [ 'title', 'excerpt', 'content' ],
				syncConfig: {},
			},
		];
		const syncManager = {
			getCRDTRecordData: jest.fn( () => ( {
				title: 'checkpoint title 9',
			} ) ),
			update: jest.fn(),
		};
		const select = {
			getRawEntityRecord: () => persistedRecord,
		};
		const resolveSelect = { getEntitiesConfig: jest.fn( () => configs ) };

		apiFetch.mockImplementation( () => staleSaveResponse );
		getSyncManager.mockReturnValue( syncManager );

		const result = await saveEntityRecord(
			'postType',
			'post',
			post
		)( { select, dispatch, resolveSelect } );

		expect( dispatch.receiveEntityRecords ).toHaveBeenCalledWith(
			'postType',
			'post',
			staleSaveResponse,
			undefined,
			true,
			post
		);
		expect( syncManager.update ).toHaveBeenCalledWith(
			'postType/post',
			10,
			syncSaveResponse,
			'gutenberg-undo-ignored',
			{ isSave: true }
		);
		expect( result ).toBe( staleSaveResponse );
	} );

	it( 'keeps a normal save response title that changed from the save base', async () => {
		const persistedRecord = {
			id: 10,
			title: 'draft title',
			meta: {},
		};
		const post = {
			id: 10,
			title: 'local title',
			meta: { _crdt_document: 'fresh-crdt-doc' },
		};
		const serverChangedSaveResponse = {
			id: 10,
			title: 'server title',
			meta: { _crdt_document: 'fresh-crdt-doc' },
		};
		const configs = [
			{
				name: 'post',
				kind: 'postType',
				baseURL: '/wp/v2/posts',
				rawAttributes: [ 'title', 'excerpt', 'content' ],
				syncConfig: {},
			},
		];
		const syncManager = {
			getCRDTRecordData: jest.fn( () => ( {
				title: 'local title',
			} ) ),
			update: jest.fn(),
		};
		const select = {
			getRawEntityRecord: () => persistedRecord,
		};
		const resolveSelect = { getEntitiesConfig: jest.fn( () => configs ) };

		apiFetch.mockImplementation( () => serverChangedSaveResponse );
		getSyncManager.mockReturnValue( syncManager );

		await saveEntityRecord(
			'postType',
			'post',
			post
		)( {
			select,
			dispatch,
			resolveSelect,
		} );

		expect( dispatch.receiveEntityRecords ).toHaveBeenCalledWith(
			'postType',
			'post',
			serverChangedSaveResponse,
			undefined,
			true,
			post
		);
		expect( syncManager.update ).toHaveBeenCalledWith(
			'postType/post',
			10,
			serverChangedSaveResponse,
			'gutenberg-undo-ignored',
			{ isSave: true }
		);
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
		expect( getSyncManager ).not.toHaveBeenCalled();

		expect( result ).toBe( postType );
	} );

	it( 'refetches, merges, and retries when persisted CRDT document meta is stale', async () => {
		const staleError = {
			code: 'rest_crdt_document_stale',
			data: { status: 409 },
		};
		const post = { id: 10, title: 'local title', meta: {} };
		const latestRecord = {
			id: 10,
			title: 'server title',
			meta: { _crdt_document: 'server-crdt-doc' },
		};
		const mergedRecord = {
			id: 10,
			title: 'merged title',
			meta: {},
		};
		const updatedRecord = {
			id: 10,
			title: 'merged title',
			meta: { _crdt_document: 'fresh-crdt-doc' },
		};
		const prePersist = jest
			.fn()
			.mockResolvedValueOnce( {
				meta: { _crdt_document: 'stale-crdt-doc' },
			} )
			.mockResolvedValueOnce( {
				meta: { _crdt_document: 'fresh-crdt-doc' },
			} );
		const configs = [
			{
				name: 'post',
				kind: 'postType',
				baseURL: '/wp/v2/posts',
				baseURLParams: { context: 'edit' },
				syncConfig: {},
				__unstablePrePersist: prePersist,
			},
		];
		const select = {
			getRawEntityRecord: jest.fn( () => post ),
			getEditedEntityRecord: jest.fn( () => mergedRecord ),
		};
		const resolveSelect = { getEntitiesConfig: jest.fn( () => configs ) };
		const syncManager = {
			applyPersistedCRDTDoc: jest.fn(),
			update: jest.fn(),
		};
		getSyncManager.mockReturnValue( syncManager );
		apiFetch
			.mockRejectedValueOnce( staleError )
			.mockResolvedValueOnce( latestRecord )
			.mockResolvedValueOnce( updatedRecord );

		const result = await saveEntityRecord(
			'postType',
			'post',
			post
		)( { select, dispatch, resolveSelect } );

		expect( apiFetch ).toHaveBeenCalledTimes( 3 );
		expect( apiFetch ).toHaveBeenNthCalledWith( 1, {
			path: '/wp/v2/posts/10',
			method: 'PUT',
			data: {
				...post,
				meta: { _crdt_document: 'stale-crdt-doc' },
			},
		} );
		expect( apiFetch ).toHaveBeenNthCalledWith( 2, {
			path: '/wp/v2/posts/10?context=edit',
		} );
		expect( apiFetch ).toHaveBeenNthCalledWith( 3, {
			path: '/wp/v2/posts/10',
			method: 'PUT',
			data: {
				...mergedRecord,
				meta: { _crdt_document: 'fresh-crdt-doc' },
			},
		} );
		expect( dispatch.receiveEntityRecords ).toHaveBeenNthCalledWith(
			1,
			'postType',
			'post',
			latestRecord,
			undefined,
			true
		);
		expect( syncManager.applyPersistedCRDTDoc ).toHaveBeenCalledWith(
			'postType/post',
			10,
			latestRecord
		);
		expect( dispatch.receiveEntityRecords ).toHaveBeenNthCalledWith(
			2,
			'postType',
			'post',
			updatedRecord,
			undefined,
			true,
			{
				...mergedRecord,
				meta: { _crdt_document: 'fresh-crdt-doc' },
			}
		);
		expect( syncManager.update ).toHaveBeenCalledWith(
			'postType/post',
			10,
			updatedRecord,
			'gutenberg-undo-ignored',
			{ isSave: true }
		);
		expect( result ).toBe( updatedRecord );
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
