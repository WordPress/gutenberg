/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';

jest.mock( '@wordpress/api-fetch' );

/**
 * Internal dependencies
 */
import {
	editEntityRecord,
	saveEntityRecord,
	deleteEntityRecord,
	receiveUserPermission,
	receiveAutosaves,
	receiveCurrentUser,
	__experimentalBatch,
	prepareAutosaveRequest,
	reconcileAutosave,
} from '../actions';

jest.mock( '../batch', () => {
	const { createBatch } = jest.requireActual( '../batch' );
	return {
		createBatch() {
			return createBatch( ( inputs ) => Promise.resolve( inputs ) );
		},
	};
} );

describe( 'editEntityRecord', () => {
	it( 'throws when the edited entity does not have a loaded config.', async () => {
		const entity = { kind: 'someKind', name: 'someName', id: 'someId' };
		const select = {
			getEntity: jest.fn(),
		};
		const fulfillment = editEntityRecord(
			entity.kind,
			entity.name,
			entity.id,
			{}
		)( { select } );
		expect( select.getEntity ).toHaveBeenCalledTimes( 1 );
		await expect( fulfillment ).rejects.toThrow(
			`The entity being edited (${ entity.kind }, ${ entity.name }) does not have a loaded config.`
		);
	} );
} );

describe( 'deleteEntityRecord', () => {
	beforeEach( async () => {
		apiFetch.mockReset();
		jest.useFakeTimers();
	} );

	it( 'triggers a DELETE request for an existing record', async () => {
		const deletedRecord = { title: 'new post', id: 10 };
		const entities = [
			{ name: 'post', kind: 'postType', baseURL: '/wp/v2/posts' },
		];

		const dispatch = Object.assign( jest.fn(), {
			receiveEntityRecords: jest.fn(),
			__unstableAcquireStoreLock: jest.fn(),
			__unstableReleaseStoreLock: jest.fn(),
		} );
		// Provide entities
		dispatch.mockReturnValueOnce( entities );

		// Provide response
		apiFetch.mockImplementation( () => deletedRecord );

		const result = await deleteEntityRecord(
			'postType',
			'post',
			deletedRecord.id
		)( { dispatch } );

		expect( apiFetch ).toHaveBeenCalledTimes( 1 );
		expect( apiFetch ).toHaveBeenCalledWith( {
			path: '/wp/v2/posts/10',
			method: 'DELETE',
		} );

		expect( dispatch ).toHaveBeenCalledTimes( 4 );
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
} );

describe( 'prepareAutosaveRequest', () => {
	const persistedRecord = {
		title: 'persisted title',
		status: 'persisted status',
		content: 'persisted content',
		unrelatedField: 'unrelated',
	};
	const autosavePost = {
		title: 'autosave title',
		status: 'autosave status',
		excerpt: 'autosave excerpt',
		unrelatedField: 'unrelated',
	};
	const record = {
		excerpt: 'record excerpt',
		content: 'record content',
		status: 'record status',
		unrelatedField: 'unrelated',
	};
	it('picks a specific subset of data', async () => {
		expect(
			prepareAutosaveRequest({ ...persistedRecord, ...autosavePost, ...record })
		).toEqual({
			title: 'autosave title',
			excerpt: 'record excerpt',
			content: 'record content',
			status: 'record status',
		});
		expect(
			prepareAutosaveRequest({ ...autosavePost, ...persistedRecord, ...record })
		).toEqual({
			title: 'persisted title',
			excerpt: 'record excerpt',
			content: 'record content',
			status: 'record status',
		});
		expect(
			prepareAutosaveRequest({ ...autosavePost, ...persistedRecord } )
		).toEqual( {
			title: 'persisted title',
			excerpt: 'autosave excerpt',
			content: 'persisted content',
			status: 'persisted status',
		} );
	} );
	it( 'corrects the auto-draft status to draft', async () => {
		expect(
			prepareAutosaveRequest({
				...persistedRecord,
				...autosavePost,
				status: 'auto-draft',
			} )
		).toEqual( {
			title: 'autosave title',
			excerpt: 'autosave excerpt',
			content: 'persisted content',
			status: 'draft',
		} );
	} );
} );

describe( 'reconcileAutosaveResults', () => {
	const persistedRecord = {
		title: 'persisted title',
		status: 'persisted status',
		content: 'persisted content',
		sticky: 'persisted sticky',
	};
	const requestData = {
		title: 'requestData title',
		status: 'requestData status',
		excerpt: 'requestData excerpt',
		sticky: 'requestData sticky',
	};
	const updatedRecord = {
		title: 'updatedRecord title',
		status: 'updatedRecord status',
		excerpt: 'updatedRecord excerpt',
		sticky: 'updatedRecord sticky',
		content: 'updatedRecord content',
	};
	it( 'has all the same keys as the merged data', () => {
		const reconciled = reconcileAutosave(
			persistedRecord,
			requestData,
			updatedRecord
		);
		expect( Object.keys( reconciled ) ).toEqual(
			expect.arrayContaining( [
				'title',
				'status',
				'content',
				'sticky',
				'excerpt',
			] )
		);
	} );
	it( 'picks title, excerpt, and content from the merged data', () => {
		expect(
			reconcileAutosave( persistedRecord, requestData, updatedRecord )
		).toEqual(
			expect.objectContaining( {
				title: 'updatedRecord title',
				excerpt: 'updatedRecord excerpt',
				content: 'updatedRecord content',
			} )
		);
	} );
	it( 'picks other properties from the persisted data', () => {
		expect(
			reconcileAutosave( persistedRecord, requestData, updatedRecord )
		).toEqual(
			expect.objectContaining( {
				sticky: 'persisted sticky',
			} )
		);
	} );
	it( 'picks status from merged data when the post went from auto-draft to draft', () => {
		const reconciled = reconcileAutosave(
			{
				...persistedRecord,
				status: 'auto-draft',
			},
			{
				...requestData,
				status: 'draft',
			},
			updatedRecord
		);
		expect( reconciled.status ).toEqual( 'draft' );
	} );
	const pairs = [
		[ 'draft', 'auto-draft' ],
		[ 'test', 'auto-draft' ],
		[ 'draft', 'test' ],
		[ 'test1', 'test2' ],
	];
	pairs.forEach( ( [ _from, _to ] ) =>
		it( `picks status from persisted record when the post did not go from auto-draft to draft but from ${ _from } to ${ _to }`, () => {
			const reconciled = reconcileAutosave(
				{
					...persistedRecord,
					status: _from,
				},
				{
					...requestData,
					stat1us: _to,
				},
				updatedRecord
			);
			expect( reconciled.status ).toEqual( _from );
		} )
	);
} );

describe( 'saveEntityRecord', () => {
	beforeEach( async () => {
		apiFetch.mockReset();
		jest.useFakeTimers();
	} );

	it( 'triggers a POST request for a new record', async () => {
		const post = { title: 'new post' };
		const entities = [
			{ name: 'post', kind: 'postType', baseURL: '/wp/v2/posts' },
		];
		const select = {
			getRawEntityRecord: () => post,
		};

		const dispatch = Object.assign( jest.fn(), {
			receiveEntityRecords: jest.fn(),
			__unstableAcquireStoreLock: jest.fn(),
			__unstableReleaseStoreLock: jest.fn(),
		} );
		// Provide entities
		dispatch.mockReturnValueOnce( entities );

		// Provide response
		const updatedRecord = { ...post, id: 10 };
		apiFetch.mockImplementation( () => {
			return updatedRecord;
		} );

		const result = await saveEntityRecord(
			'postType',
			'post',
			post
		)( { select, dispatch } );

		expect( apiFetch ).toHaveBeenCalledTimes( 1 );
		expect( apiFetch ).toHaveBeenCalledWith( {
			path: '/wp/v2/posts',
			method: 'POST',
			data: post,
		} );

		expect( dispatch ).toHaveBeenCalledTimes( 3 );
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

	it( 'triggers a PUT request for an existing record', async () => {
		const post = { id: 10, title: 'new post' };
		const entities = [
			{ name: 'post', kind: 'postType', baseURL: '/wp/v2/posts' },
		];
		const select = {
			getRawEntityRecord: () => post,
		};

		const dispatch = Object.assign( jest.fn(), {
			receiveEntityRecords: jest.fn(),
			__unstableAcquireStoreLock: jest.fn(),
			__unstableReleaseStoreLock: jest.fn(),
		} );
		// Provide entities
		dispatch.mockReturnValueOnce( entities );

		// Provide response
		const updatedRecord = { ...post, id: 10 };
		apiFetch.mockImplementation( () => {
			return updatedRecord;
		} );

		const result = await saveEntityRecord(
			'postType',
			'post',
			post
		)( { select, dispatch } );

		expect( apiFetch ).toHaveBeenCalledTimes( 1 );
		expect( apiFetch ).toHaveBeenCalledWith( {
			path: '/wp/v2/posts/10',
			method: 'PUT',
			data: post,
		} );

		expect( dispatch ).toHaveBeenCalledTimes( 3 );
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
		const entities = [
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

		const dispatch = Object.assign( jest.fn(), {
			receiveEntityRecords: jest.fn(),
			__unstableAcquireStoreLock: jest.fn(),
			__unstableReleaseStoreLock: jest.fn(),
		} );
		// Provide entities
		dispatch.mockReturnValueOnce( entities );

		// Provide response
		apiFetch.mockImplementation( () => postType );

		const result = await saveEntityRecord(
			'root',
			'postType',
			postType
		)( { select, dispatch } );

		expect( apiFetch ).toHaveBeenCalledTimes( 1 );
		expect( apiFetch ).toHaveBeenCalledWith( {
			path: '/wp/v2/types/page',
			method: 'PUT',
			data: postType,
		} );

		expect( dispatch ).toHaveBeenCalledTimes( 3 );
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
		const generator = __experimentalBatch(
			[
				( { saveEntityRecord: _saveEntityRecord } ) =>
					_saveEntityRecord( 'root', 'widget', {} ),
				( { saveEditedEntityRecord: _saveEditedEntityRecord } ) =>
					_saveEditedEntityRecord( 'root', 'widget', 123 ),
				( { deleteEntityRecord: _deleteEntityRecord } ) =>
					_deleteEntityRecord( 'root', 'widget', 123, {} ),
			],
			{ __unstableProcessor: ( inputs ) => Promise.resolve( inputs ) }
		);
		// Run generator up to `yield getDispatch()`.
		const { value: getDispatchControl } = generator.next();
		expect( getDispatchControl ).toEqual( { type: 'GET_DISPATCH' } );
		const actions = {
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
		const dispatch = () => actions;
		// Run generator up to `yield __unstableAwaitPromise( ... )`.
		const { value: awaitPromiseControl } = generator.next( dispatch );
		expect( actions.saveEntityRecord ).toHaveBeenCalledWith(
			'root',
			'widget',
			{},
			{ __unstableFetch: expect.any( Function ) }
		);
		expect( actions.saveEditedEntityRecord ).toHaveBeenCalledWith(
			'root',
			'widget',
			123,
			{ __unstableFetch: expect.any( Function ) }
		);
		expect( actions.deleteEntityRecord ).toHaveBeenCalledWith(
			'root',
			'widget',
			123,
			{},
			{ __unstableFetch: expect.any( Function ) }
		);
		expect( awaitPromiseControl ).toEqual( {
			type: 'AWAIT_PROMISE',
			promise: expect.any( Promise ),
		} );
		// Run generator to the end.
		const { value: results } = generator.next(
			await awaitPromiseControl.promise
		);
		expect( results ).toEqual( [
			{ id: 123, created: true },
			{ id: 123, updated: true },
			{ id: 123, deleted: true },
		] );
	} );
} );
