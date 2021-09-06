/**
 * WordPress dependencies
 */
import { apiFetch } from '@wordpress/data-controls';
import triggerFetch from '@wordpress/api-fetch';

jest.mock( '@wordpress/api-fetch' );

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
import {
	receiveEntityRecords,
	receiveEmbedPreview,
	receiveUserPermission,
	receiveAutosaves,
	receiveCurrentUser,
} from '../actions';

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
		const fulfillment = getEmbedPreview( EMBEDDABLE_URL );
		// Trigger generator
		fulfillment.next();
		// Provide apiFetch response and trigger Action
		const received = ( await fulfillment.next( SUCCESSFUL_EMBED_RESPONSE ) )
			.value;
		expect( received ).toEqual(
			receiveEmbedPreview( EMBEDDABLE_URL, SUCCESSFUL_EMBED_RESPONSE )
		);
	} );

	it( 'yields false if the URL cannot be embedded', async () => {
		const fulfillment = getEmbedPreview( UNEMBEDDABLE_URL );
		// Trigger generator
		fulfillment.next();
		// Provide invalid response and trigger Action
		const received = ( await fulfillment.throw( { status: 404 } ) ).value;
		expect( received ).toEqual(
			receiveEmbedPreview( UNEMBEDDABLE_URL, UNEMBEDDABLE_RESPONSE )
		);
	} );
} );

describe( 'canUser', () => {
	it( 'does nothing when there is an API error', () => {
		const generator = canUser( 'create', 'media' );

		let received = generator.next();
		expect( received.done ).toBe( false );
		expect( received.value ).toEqual(
			apiFetch( {
				path: '/wp/v2/media',
				method: 'OPTIONS',
				parse: false,
			} )
		);

		received = generator.throw( { status: 404 } );
		expect( received.done ).toBe( true );
		expect( received.value ).toBeUndefined();
	} );

	it( 'receives false when the user is not allowed to perform an action', () => {
		const generator = canUser( 'create', 'media' );

		let received = generator.next();
		expect( received.done ).toBe( false );
		expect( received.value ).toEqual(
			apiFetch( {
				path: '/wp/v2/media',
				method: 'OPTIONS',
				parse: false,
			} )
		);

		received = generator.next( {
			headers: {
				Allow: 'GET',
			},
		} );
		expect( received.done ).toBe( false );
		expect( received.value ).toEqual(
			receiveUserPermission( 'create/media', false )
		);

		received = generator.next();
		expect( received.done ).toBe( true );
		expect( received.value ).toBeUndefined();
	} );

	it( 'receives true when the user is allowed to perform an action', () => {
		const generator = canUser( 'create', 'media' );

		let received = generator.next();
		expect( received.done ).toBe( false );
		expect( received.value ).toEqual(
			apiFetch( {
				path: '/wp/v2/media',
				method: 'OPTIONS',
				parse: false,
			} )
		);

		received = generator.next( {
			headers: {
				Allow: 'POST, GET, PUT, DELETE',
			},
		} );
		expect( received.done ).toBe( false );
		expect( received.value ).toEqual(
			receiveUserPermission( 'create/media', true )
		);

		received = generator.next();
		expect( received.done ).toBe( true );
		expect( received.value ).toBeUndefined();
	} );

	it( 'receives true when the user is allowed to perform an action on a specific resource', () => {
		const generator = canUser( 'update', 'blocks', 123 );

		let received = generator.next();
		expect( received.done ).toBe( false );
		expect( received.value ).toEqual(
			apiFetch( {
				path: '/wp/v2/blocks/123',
				method: 'GET',
				parse: false,
			} )
		);

		received = generator.next( {
			headers: {
				Allow: 'POST, GET, PUT, DELETE',
			},
		} );
		expect( received.done ).toBe( false );
		expect( received.value ).toEqual(
			receiveUserPermission( 'update/blocks/123', true )
		);

		received = generator.next();
		expect( received.done ).toBe( true );
		expect( received.value ).toBeUndefined();
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

	it( 'yields with fetched autosaves', async () => {
		const postType = 'post';
		const postId = 1;
		const restBase = 'posts';
		const postEntity = { rest_base: restBase };
		const fulfillment = getAutosaves( postType, postId );

		// Trigger generator
		fulfillment.next();

		// Trigger generator with the postEntity and assert that correct path is formed
		// in the apiFetch request.
		const { value: apiFetchAction } = fulfillment.next( postEntity );
		expect( apiFetchAction.request ).toEqual( {
			path: `/wp/v2/${ restBase }/${ postId }/autosaves?context=edit`,
		} );

		// Provide apiFetch response and trigger Action
		const received = ( await fulfillment.next( SUCCESSFUL_RESPONSE ) )
			.value;
		expect( received ).toEqual(
			receiveAutosaves( 1, SUCCESSFUL_RESPONSE )
		);
	} );

	it( 'yields undefined if no autosaves exist for the post', async () => {
		const postType = 'post';
		const postId = 1;
		const restBase = 'posts';
		const postEntity = { rest_base: restBase };
		const fulfillment = getAutosaves( postType, postId );

		// Trigger generator
		fulfillment.next();

		// Trigger generator with the postEntity and assert that correct path is formed
		// in the apiFetch request.
		const { value: apiFetchAction } = fulfillment.next( postEntity );
		expect( apiFetchAction.request ).toEqual( {
			path: `/wp/v2/${ restBase }/${ postId }/autosaves?context=edit`,
		} );

		// Provide apiFetch response and trigger Action
		const received = ( await fulfillment.next( [] ) ).value;
		expect( received ).toBeUndefined();
	} );
} );

describe( 'getCurrentUser', () => {
	const SUCCESSFUL_RESPONSE = {
		id: 1,
	};

	it( 'yields with fetched user', async () => {
		const fulfillment = getCurrentUser();

		// Trigger generator
		fulfillment.next();

		// Provide apiFetch response and trigger Action
		const received = ( await fulfillment.next( SUCCESSFUL_RESPONSE ) )
			.value;
		expect( received ).toEqual( receiveCurrentUser( SUCCESSFUL_RESPONSE ) );
	} );
} );
