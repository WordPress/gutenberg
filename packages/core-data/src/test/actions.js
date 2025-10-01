/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';

jest.mock( '@wordpress/api-fetch' );

// Mock the sync provider
jest.mock( '../sync', () => ( {
	getSyncProvider: jest.fn( () => ( {
		updateCRDTDoc: jest.fn(),
	} ) ),
} ) );

// Mock logEntityDeprecation
jest.mock( '../utils/log-entity-deprecation', () => jest.fn() );

/**
 * Internal dependencies
 */
import {
	editEntityRecord,
	saveEntityRecord,
	saveEditedEntityRecord,
	deleteEntityRecord,
	receiveUserPermission,
	receiveAutosaves,
	receiveCurrentUser,
	__experimentalBatch,
} from '../actions';

import { getSyncProvider } from '../sync';

jest.mock( '../batch', () => {
	const { createBatch } = jest.requireActual( '../batch' );
	return {
		createBatch() {
			return createBatch( ( inputs ) => Promise.resolve( inputs ) );
		},
	};
} );

describe( 'editEntityRecord', () => {
	let select, dispatch, mockUndoManager;

	beforeEach( () => {
		jest.clearAllMocks();

		mockUndoManager = {
			addRecord: jest.fn(),
		};

		select = {
			getEntityConfig: jest.fn(),
			getRawEntityRecord: jest.fn(),
			getEditedEntityRecord: jest.fn(),
			getUndoManager: jest.fn( () => mockUndoManager ),
		};

		dispatch = jest.fn();

		getSyncProvider.mockReturnValue( {
			updateCRDTDoc: jest.fn(),
		} );
	} );

	it( 'throws when the edited entity does not have a loaded config.', async () => {
		const entityConfig = {
			kind: 'someKind',
			name: 'someName',
			id: 'someId',
		};
		select.getEntityConfig.mockReturnValue( null );

		const fulfillment = () =>
			editEntityRecord(
				entityConfig.kind,
				entityConfig.name,
				entityConfig.id,
				{}
			)( { select } );
		expect( fulfillment ).toThrow(
			`The entity being edited (${ entityConfig.kind }, ${ entityConfig.name }) does not have a loaded config.`
		);
		expect( select.getEntityConfig ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'dispatches EDIT_ENTITY_RECORD action with basic edits and no sync', () => {
		const entityConfig = {
			kind: 'postType',
			name: 'post',
			mergedEdits: {},
		};
		const record = {
			id: 1,
			title: 'Original Title',
			content: 'Original Content',
		};
		const editedRecord = {
			id: 1,
			title: 'Original Title',
			content: 'Original Content',
		};
		const edits = { title: 'New Title' };

		select.getEntityConfig.mockReturnValue( entityConfig );
		select.getRawEntityRecord.mockReturnValue( record );
		select.getEditedEntityRecord.mockReturnValue( editedRecord );

		editEntityRecord(
			'postType',
			'post',
			1,
			edits
		)( { select, dispatch } );

		expect( dispatch ).toHaveBeenCalledWith( {
			type: 'EDIT_ENTITY_RECORD',
			kind: 'postType',
			name: 'post',
			recordId: 1,
			edits,
		} );
		expect( mockUndoManager.addRecord ).toHaveBeenCalledWith(
			[
				{
					id: { kind: 'postType', name: 'post', recordId: 1 },
					changes: {
						title: {
							from: 'Original Title',
							to: 'New Title',
						},
					},
				},
			],
			undefined
		);
	} );

	it( 'clears edits when they are equal to persisted values', () => {
		const entityConfig = {
			kind: 'postType',
			name: 'post',
			mergedEdits: {},
		};
		const record = {
			id: 1,
			title: 'Same Title',
			content: 'Original Content',
		};
		const editedRecord = {
			id: 1,
			title: 'Same Title',
			content: 'Original Content',
		};
		const edits = { title: undefined };

		select.getEntityConfig.mockReturnValue( entityConfig );
		select.getRawEntityRecord.mockReturnValue( record );
		select.getEditedEntityRecord.mockReturnValue( editedRecord );

		editEntityRecord(
			'postType',
			'post',
			1,
			edits
		)( { select, dispatch } );

		expect( dispatch ).toHaveBeenCalledWith( {
			type: 'EDIT_ENTITY_RECORD',
			kind: 'postType',
			name: 'post',
			recordId: 1,
			edits,
		} );
		expect( mockUndoManager.addRecord ).toHaveBeenCalledWith(
			[
				{
					id: { kind: 'postType', name: 'post', recordId: 1 },
					changes: {
						title: {
							from: 'Same Title',
							to: undefined,
						},
					},
				},
			],
			undefined
		);
	} );

	it( 'handles merged edits configuration', () => {
		const entityConfig = {
			kind: 'postType',
			name: 'post',
			mergedEdits: { meta: true },
		};
		const record = {
			id: 1,
			title: 'Original Title',
			meta: { key1: 'value1' },
		};
		const editedRecord = {
			id: 1,
			title: 'Original Title',
			meta: { key1: 'value1', key2: 'value2' },
		};
		const edits = { meta: { key3: 'value3' } };

		select.getEntityConfig.mockReturnValue( entityConfig );
		select.getRawEntityRecord.mockReturnValue( record );
		select.getEditedEntityRecord.mockReturnValue( editedRecord );

		editEntityRecord(
			'postType',
			'post',
			1,
			edits
		)( { select, dispatch } );

		expect( dispatch ).toHaveBeenCalledWith( {
			type: 'EDIT_ENTITY_RECORD',
			kind: 'postType',
			name: 'post',
			recordId: 1,
			edits: {
				meta: { key1: 'value1', key2: 'value2', key3: 'value3' },
			},
		} );
		expect( mockUndoManager.addRecord ).toHaveBeenCalledWith(
			[
				{
					id: { kind: 'postType', name: 'post', recordId: 1 },
					changes: {
						meta: {
							from: {
								key1: 'value1',
								key2: 'value2',
							},
							to: {
								key3: 'value3',
							},
						},
					},
				},
			],
			undefined
		);
	} );

	it( 'skips undo manager when undoIgnore option is true', () => {
		const entityConfig = {
			kind: 'postType',
			name: 'post',
			mergedEdits: {},
		};
		const record = { id: 1, title: 'Original Title' };
		const editedRecord = { id: 1, title: 'Original Title' };
		const edits = { title: 'New Title' };
		const options = { undoIgnore: true };

		select.getEntityConfig.mockReturnValue( entityConfig );
		select.getRawEntityRecord.mockReturnValue( record );
		select.getEditedEntityRecord.mockReturnValue( editedRecord );

		editEntityRecord(
			'postType',
			'post',
			1,
			edits,
			options
		)( { select, dispatch } );

		expect( mockUndoManager.addRecord ).not.toHaveBeenCalled();
		expect( dispatch ).toHaveBeenCalledWith( {
			type: 'EDIT_ENTITY_RECORD',
			kind: 'postType',
			name: 'post',
			recordId: 1,
			edits: {
				title: 'New Title',
			},
		} );
	} );

	it( 'passes isCached option to undo manager', () => {
		const entityConfig = {
			kind: 'postType',
			name: 'post',
			mergedEdits: {},
		};
		const record = { id: 1, title: 'Original Title' };
		const editedRecord = { id: 1, title: 'Original Title' };
		const edits = { title: 'New Title' };
		const options = { isCached: true };

		select.getEntityConfig.mockReturnValue( entityConfig );
		select.getRawEntityRecord.mockReturnValue( record );
		select.getEditedEntityRecord.mockReturnValue( editedRecord );

		editEntityRecord(
			'postType',
			'post',
			1,
			edits,
			options
		)( { select, dispatch } );

		expect( mockUndoManager.addRecord ).toHaveBeenCalledWith(
			[
				{
					id: { kind: 'postType', name: 'post', recordId: 1 },
					changes: {
						title: {
							from: 'Original Title',
							to: 'New Title',
						},
					},
				},
			],
			true
		);
		expect( dispatch ).toHaveBeenCalledWith( {
			type: 'EDIT_ENTITY_RECORD',
			kind: 'postType',
			name: 'post',
			recordId: 1,
			edits: {
				title: 'New Title',
			},
		} );
	} );

	it( 'handles multiple simultaneous edits', () => {
		const entityConfig = {
			kind: 'postType',
			name: 'post',
			mergedEdits: {},
		};
		const record = {
			id: 1,
			title: 'Original Title',
			content: 'Original Content',
			status: 'draft',
		};
		const editedRecord = {
			id: 1,
			title: 'Original Title',
			content: 'Original Content',
			status: 'draft',
		};
		const edits = {
			title: 'New Title',
			content: 'New Content',
			status: 'publish',
		};

		select.getEntityConfig.mockReturnValue( entityConfig );
		select.getRawEntityRecord.mockReturnValue( record );
		select.getEditedEntityRecord.mockReturnValue( editedRecord );

		editEntityRecord(
			'postType',
			'post',
			1,
			edits
		)( { select, dispatch } );

		expect( dispatch ).toHaveBeenCalledWith( {
			type: 'EDIT_ENTITY_RECORD',
			kind: 'postType',
			name: 'post',
			recordId: 1,
			edits: {
				title: 'New Title',
				content: 'New Content',
				status: 'publish',
			},
		} );

		expect( mockUndoManager.addRecord ).toHaveBeenCalledWith(
			[
				{
					id: { kind: 'postType', name: 'post', recordId: 1 },
					changes: {
						title: { from: 'Original Title', to: 'New Title' },
						content: {
							from: 'Original Content',
							to: 'New Content',
						},
						status: { from: 'draft', to: 'publish' },
					},
				},
			],
			undefined
		);
	} );

	it( 'works correctly with sync-enabled entity config', () => {
		globalThis.window.__experimentalEnableSync = true;
		const syncConfig = { enabled: true };
		// Test that sync-related config doesn't break normal functionality

		const entityConfig = {
			kind: 'postType',
			name: 'post',
			mergedEdits: {},
			syncConfig,
		};
		const record = { id: 1, title: 'Original Title' };
		const editedRecord = { id: 1, title: 'Original Title' };
		const edits = { title: 'New Title' };

		select.getEntityConfig.mockReturnValue( entityConfig );
		select.getRawEntityRecord.mockReturnValue( record );
		select.getEditedEntityRecord.mockReturnValue( editedRecord );

		editEntityRecord(
			'postType',
			'post',
			1,
			edits
		)( { select, dispatch } );

		// Normal functionality should work regardless of sync config
		expect( dispatch ).toHaveBeenCalledWith( {
			type: 'EDIT_ENTITY_RECORD',
			kind: 'postType',
			name: 'post',
			recordId: 1,
			edits: { title: 'New Title' },
		} );

		expect( mockUndoManager.addRecord ).toHaveBeenCalledWith(
			[
				{
					id: { kind: 'postType', name: 'post', recordId: 1 },
					changes: {
						title: {
							from: 'Original Title',
							to: 'New Title',
						},
					},
				},
			],
			undefined
		);

		expect( getSyncProvider ).toBeDefined();
		const mockUpdateCRDTDoc = getSyncProvider().updateCRDTDoc;
		expect( mockUpdateCRDTDoc ).toBeDefined();
		expect( mockUpdateCRDTDoc ).toHaveBeenCalledWith(
			syncConfig,
			record,
			edits,
			'gutenberg'
		);
		delete globalThis.window.__experimentalEnableSync;
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
