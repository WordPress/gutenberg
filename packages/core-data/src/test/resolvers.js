/**
 * WordPress dependencies
 */
import triggerFetch from '@wordpress/api-fetch';

jest.mock( '@wordpress/api-fetch' );

/**
 * Internal dependencies
 */
import {
	getEntityRecord,
	getEntityRecords,
	getEmbedPreview,
	canUser,
	getAutosaves,
	getCurrentUser,
} from '../resolvers';

describe( 'getEntityRecord', () => {
	const POST_TYPE = { slug: 'post' };
	const ENTITIES = [
		{
			name: 'postType',
			kind: 'root',
			baseURL: '/wp/v2/types',
			baseURLParams: { context: 'edit' },
		},
	];
	beforeEach( async () => {
		triggerFetch.mockReset();
		jest.useFakeTimers();
	} );

	it( 'yields with requested post type', async () => {
		const dispatch = Object.assign( jest.fn(), {
			receiveEntityRecords: jest.fn(),
			__unstableAcquireStoreLock: jest.fn(),
			__unstableReleaseStoreLock: jest.fn(),
		} );
		// Provide entities
		dispatch.mockReturnValueOnce( ENTITIES );

		// Provide response
		triggerFetch.mockImplementation( () => POST_TYPE );

		await getEntityRecord( 'root', 'postType', 'post' )( { dispatch } );

		// Fetch request should have been issued
		expect( triggerFetch ).toHaveBeenCalledWith( {
			path: '/wp/v2/types/post?context=edit',
		} );

		// The record should have been received
		expect( dispatch.receiveEntityRecords ).toHaveBeenCalledWith(
			'root',
			'postType',
			POST_TYPE,
			undefined
		);

		// Locks should have been acquired and released
		expect( dispatch.__unstableAcquireStoreLock ).toHaveBeenCalledTimes(
			1
		);
		expect( dispatch.__unstableReleaseStoreLock ).toHaveBeenCalledTimes(
			1
		);
	} );

	it( 'accepts a query that overrides default api path', async () => {
		const query = { context: 'view', _envelope: '1' };
		const queryObj = { include: [ 'post' ], ...query };

		const select = {
			hasEntityRecords: jest.fn( () => {} ),
		};

		const dispatch = Object.assign( jest.fn(), {
			receiveEntityRecords: jest.fn(),
			__unstableAcquireStoreLock: jest.fn(),
			__unstableReleaseStoreLock: jest.fn(),
		} );
		// Provide entities
		dispatch.mockReturnValueOnce( ENTITIES );

		// Provide response
		triggerFetch.mockImplementation( () => POST_TYPE );

		await getEntityRecord(
			'root',
			'postType',
			'post',
			query
		)( { dispatch, select } );

		// Check resolution cache for an existing entity that fulfills the request with query
		expect( select.hasEntityRecords ).toHaveBeenCalledWith(
			'root',
			'postType',
			queryObj
		);

		// Trigger apiFetch, test that the query is present in the url
		expect( triggerFetch ).toHaveBeenCalledWith( {
			path: '/wp/v2/types/post?context=view&_envelope=1',
		} );

		// The record should have been received
		expect( dispatch.receiveEntityRecords ).toHaveBeenCalledWith(
			'root',
			'postType',
			POST_TYPE,
			queryObj
		);

		// Locks should have been acquired and released
		expect( dispatch.__unstableAcquireStoreLock ).toHaveBeenCalledTimes(
			1
		);
		expect( dispatch.__unstableReleaseStoreLock ).toHaveBeenCalledTimes(
			1
		);
	} );
} );

describe( 'getEntityRecords', () => {
	const POST_TYPES = {
		post: { slug: 'post' },
		page: { slug: 'page', id: 2 },
	};
	const ENTITIES = [
		{
			name: 'postType',
			kind: 'root',
			baseURL: '/wp/v2/types',
			baseURLParams: { context: 'edit' },
		},
		{
			name: 'postType',
			kind: 'root',
			baseURL: '/wp/v2/types',
			baseURLParams: { context: 'edit' },
		},
	];

	beforeEach( async () => {
		triggerFetch.mockReset();
		jest.useFakeTimers();
	} );

	it( 'dispatches the requested post type', async () => {
		const dispatch = Object.assign( jest.fn(), {
			receiveEntityRecords: jest.fn(),
			__unstableAcquireStoreLock: jest.fn(),
			__unstableReleaseStoreLock: jest.fn(),
		} );
		// Provide entities
		dispatch.mockReturnValueOnce( ENTITIES );

		// Provide response
		triggerFetch.mockImplementation( () => POST_TYPES );

		await getEntityRecords( 'root', 'postType' )( { dispatch } );

		// Fetch request should have been issued
		expect( triggerFetch ).toHaveBeenCalledWith( {
			path: '/wp/v2/types?context=edit',
		} );

		// The record should have been received
		expect( dispatch.receiveEntityRecords ).toHaveBeenCalledWith(
			'root',
			'postType',
			Object.values( POST_TYPES ),
			{}
		);
	} );

	it( 'Uses state locks', async () => {
		const dispatch = Object.assign( jest.fn(), {
			receiveEntityRecords: jest.fn(),
			__unstableAcquireStoreLock: jest.fn(),
			__unstableReleaseStoreLock: jest.fn(),
		} );
		// Provide entities
		dispatch.mockReturnValueOnce( ENTITIES );

		// Provide response
		triggerFetch.mockImplementation( () => POST_TYPES );

		await getEntityRecords( 'root', 'postType' )( { dispatch } );

		// Fetch request should have been issued
		expect( triggerFetch ).toHaveBeenCalledWith( {
			path: '/wp/v2/types?context=edit',
		} );

		// The record should have been received
		expect(
			dispatch.__unstableAcquireStoreLock
		).toHaveBeenCalledWith(
			'core',
			[ 'entities', 'data', 'root', 'postType' ],
			{ exclusive: false }
		);
		expect( dispatch.__unstableReleaseStoreLock ).toHaveBeenCalledTimes(
			1
		);
	} );

	it( 'marks specific entity records as resolved', async () => {
		const dispatch = Object.assign( jest.fn(), {
			receiveEntityRecords: jest.fn(),
			__unstableAcquireStoreLock: jest.fn(),
			__unstableReleaseStoreLock: jest.fn(),
		} );
		// Provide entities
		dispatch.mockReturnValueOnce( ENTITIES );

		// Provide response
		triggerFetch.mockImplementation( () => POST_TYPES );

		await getEntityRecords( 'root', 'postType' )( { dispatch } );

		// Fetch request should have been issued
		expect( triggerFetch ).toHaveBeenCalledWith( {
			path: '/wp/v2/types?context=edit',
		} );

		// The record should have been received
		expect( dispatch ).toHaveBeenCalledWith( {
			type: 'START_RESOLUTIONS',
			selectorName: 'getEntityRecord',
			args: [ [ ENTITIES[ 1 ].kind, ENTITIES[ 1 ].name, 2 ] ],
		} );
		expect( dispatch ).toHaveBeenCalledWith( {
			type: 'FINISH_RESOLUTIONS',
			selectorName: 'getEntityRecord',
			args: [ [ ENTITIES[ 1 ].kind, ENTITIES[ 1 ].name, 2 ] ],
		} );
	} );
} );

describe( 'getEmbedPreview', () => {
	const SUCCESSFUL_EMBED_RESPONSE = { data: '<p>some html</p>' };
	const UNEMBEDDABLE_RESPONSE = false;
	const EMBEDDABLE_URL = 'http://twitter.com/notnownikki';
	const UNEMBEDDABLE_URL = 'http://example.com/';

	it( 'yields with fetched embed preview', async () => {
		const dispatch = Object.assign( jest.fn(), {
			receiveEmbedPreview: jest.fn(),
		} );

		// Provide response
		triggerFetch.mockResolvedValue( SUCCESSFUL_EMBED_RESPONSE );

		await getEmbedPreview( EMBEDDABLE_URL )( { dispatch } );

		expect( dispatch.receiveEmbedPreview ).toHaveBeenCalledWith(
			EMBEDDABLE_URL,
			SUCCESSFUL_EMBED_RESPONSE
		);
	} );

	it( 'yields false if the URL cannot be embedded', async () => {
		const dispatch = Object.assign( jest.fn(), {
			receiveEmbedPreview: jest.fn(),
		} );

		// Provide response
		triggerFetch.mockRejectedValue( { status: 404 } );

		await getEmbedPreview( UNEMBEDDABLE_URL )( { dispatch } );

		expect( dispatch.receiveEmbedPreview ).toHaveBeenCalledWith(
			UNEMBEDDABLE_URL,
			UNEMBEDDABLE_RESPONSE
		);
	} );
} );

describe( 'canUser', () => {
	beforeEach( async () => {
		triggerFetch.mockReset();
	} );

	it( 'does nothing when there is an API error', async () => {
		const dispatch = Object.assign( jest.fn(), {
			receiveUserPermission: jest.fn(),
		} );

		triggerFetch.mockImplementation( () =>
			Promise.reject( { status: 404 } )
		);

		await canUser( 'create', 'media' )( { dispatch } );

		expect( triggerFetch ).toHaveBeenCalledWith( {
			path: '/wp/v2/media',
			method: 'OPTIONS',
			parse: false,
		} );

		expect( dispatch.receiveUserPermission ).not.toHaveBeenCalled();
	} );

	it( 'receives false when the user is not allowed to perform an action', async () => {
		const dispatch = Object.assign( jest.fn(), {
			receiveUserPermission: jest.fn(),
		} );

		triggerFetch.mockImplementation( () => ( {
			headers: {
				Allow: 'GET',
			},
		} ) );

		await canUser( 'create', 'media' )( { dispatch } );

		expect( triggerFetch ).toHaveBeenCalledWith( {
			path: '/wp/v2/media',
			method: 'OPTIONS',
			parse: false,
		} );

		expect( dispatch.receiveUserPermission ).toHaveBeenCalledWith(
			'create/media',
			false
		);
	} );

	it( 'receives true when the user is allowed to perform an action', async () => {
		const dispatch = Object.assign( jest.fn(), {
			receiveUserPermission: jest.fn(),
		} );

		triggerFetch.mockImplementation( () => ( {
			headers: {
				Allow: 'POST, GET, PUT, DELETE',
			},
		} ) );

		await canUser( 'create', 'media' )( { dispatch } );

		expect( triggerFetch ).toHaveBeenCalledWith( {
			path: '/wp/v2/media',
			method: 'OPTIONS',
			parse: false,
		} );

		expect( dispatch.receiveUserPermission ).toHaveBeenCalledWith(
			'create/media',
			true
		);
	} );

	it( 'receives true when the user is allowed to perform an action on a specific resource', async () => {
		const dispatch = Object.assign( jest.fn(), {
			receiveUserPermission: jest.fn(),
		} );

		triggerFetch.mockImplementation( () => ( {
			headers: {
				Allow: 'POST, GET, PUT, DELETE',
			},
		} ) );

		await canUser( 'create', 'blocks', 123 )( { dispatch } );

		expect( triggerFetch ).toHaveBeenCalledWith( {
			path: '/wp/v2/blocks/123',
			method: 'OPTIONS',
			parse: false,
		} );

		expect( dispatch.receiveUserPermission ).toHaveBeenCalledWith(
			'create/blocks/123',
			true
		);
	} );
} );

describe( 'getAutosaves', () => {
	const SUCCESSFUL_RESPONSE = [
		{
			title: 'test title',
			excerpt: 'test excerpt',
			content: 'test content',
		},
	];

	beforeEach( async () => {
		triggerFetch.mockReset();
	} );

	it( 'yields with fetched autosaves', async () => {
		const postType = 'post';
		const postId = 1;
		const restBase = 'posts';
		const postEntity = { rest_base: restBase };

		triggerFetch.mockImplementation( () => SUCCESSFUL_RESPONSE );
		const dispatch = Object.assign( jest.fn(), {
			receiveAutosaves: jest.fn(),
		} );
		const resolveSelect = Object.assign( jest.fn(), {
			getPostType: jest.fn( () => postEntity ),
		} );
		await getAutosaves( postType, postId )( { dispatch, resolveSelect } );

		expect( triggerFetch ).toHaveBeenCalledWith( {
			path: `/wp/v2/${ restBase }/${ postId }/autosaves?context=edit`,
		} );
		expect( dispatch.receiveAutosaves ).toHaveBeenCalledWith(
			1,
			SUCCESSFUL_RESPONSE
		);
	} );

	it( 'yields undefined if no autosaves exist for the post', async () => {
		const postType = 'post';
		const postId = 1;
		const restBase = 'posts';
		const postEntity = { rest_base: restBase };

		triggerFetch.mockImplementation( () => [] );
		const dispatch = Object.assign( jest.fn(), {
			receiveAutosaves: jest.fn(),
		} );
		const resolveSelect = Object.assign( jest.fn(), {
			getPostType: jest.fn( () => postEntity ),
		} );
		await getAutosaves( postType, postId )( { dispatch, resolveSelect } );

		expect( triggerFetch ).toHaveBeenCalledWith( {
			path: `/wp/v2/${ restBase }/${ postId }/autosaves?context=edit`,
		} );
		expect( dispatch.receiveAutosaves ).not.toHaveBeenCalled();
	} );
} );

describe( 'getCurrentUser', () => {
	const SUCCESSFUL_RESPONSE = {
		id: 1,
	};

	it( 'yields with fetched user', async () => {
		const dispatch = Object.assign( jest.fn(), {
			receiveCurrentUser: jest.fn(),
		} );

		// Provide response
		triggerFetch.mockResolvedValue( SUCCESSFUL_RESPONSE );

		await getCurrentUser()( { dispatch } );

		expect( dispatch.receiveCurrentUser ).toHaveBeenCalledWith(
			SUCCESSFUL_RESPONSE
		);
	} );
} );
