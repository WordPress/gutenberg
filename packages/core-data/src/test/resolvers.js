/**
 * WordPress dependencies
 */
import { apiFetch } from '@wordpress/data-controls';

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

jest.mock( '../locks/actions', () => ( {
	__unstableAcquireStoreLock: jest.fn( () => [
		{
			type: 'MOCKED_ACQUIRE_LOCK',
		},
	] ),
	__unstableReleaseStoreLock: jest.fn( () => [
		{
			type: 'MOCKED_RELEASE_LOCK',
		},
	] ),
} ) );

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

	it( 'yields with requested post type', async () => {
		const fulfillment = getEntityRecord( 'root', 'postType', 'post' );
		// Trigger generator
		fulfillment.next();
		// Provide entities and acquire lock
		expect( fulfillment.next( ENTITIES ).value.type ).toEqual(
			'MOCKED_ACQUIRE_LOCK'
		);
		// trigger apiFetch
		const { value: apiFetchAction } = fulfillment.next();
		expect( apiFetchAction.request ).toEqual( {
			path: '/wp/v2/types/post?context=edit',
		} );
		// Provide response and trigger action
		const { value: received } = fulfillment.next( POST_TYPE );
		expect( received ).toEqual(
			receiveEntityRecords( 'root', 'postType', POST_TYPE )
		);
		// Release lock
		expect( fulfillment.next().value.type ).toEqual(
			'MOCKED_RELEASE_LOCK'
		);
	} );

	it( 'accepts a query that overrides default api path', async () => {
		const query = { context: 'view', _envelope: '1' };
		const queryObj = { include: [ 'post' ], ...query };

		const fulfillment = getEntityRecord(
			'root',
			'postType',
			'post',
			query
		);

		// Trigger generator
		fulfillment.next();

		// Provide entities and acquire lock
		expect( fulfillment.next( ENTITIES ).value.type ).toEqual(
			'MOCKED_ACQUIRE_LOCK'
		);

		// Check resolution cache for an existing entity that fulfills the request with query
		const {
			value: { args: selectArgs },
		} = fulfillment.next();
		expect( selectArgs ).toEqual( [ 'root', 'postType', queryObj ] );

		// Trigger apiFetch, test that the query is present in the url
		const { value: apiFetchAction } = fulfillment.next();
		expect( apiFetchAction.request ).toEqual( {
			path: '/wp/v2/types/post?context=view&_envelope=1',
		} );

		// Receive response
		const { value: received } = fulfillment.next( POST_TYPE );
		expect( received ).toEqual(
			receiveEntityRecords( 'root', 'postType', POST_TYPE, queryObj )
		);

		// Release lock
		expect( fulfillment.next().value.type ).toEqual(
			'MOCKED_RELEASE_LOCK'
		);
	} );
} );

describe( 'getEntityRecords', () => {
	const POST_TYPES = {
		post: { slug: 'post' },
		page: { slug: 'page', id: 2 },
	};
	const ENTITIES = [
		{ name: 'postType', kind: 'root', baseURL: '/wp/v2/types' },
		{ name: 'postType', kind: 'root', baseURL: '/wp/v2/types' },
	];

	it( 'yields with requested post type', async () => {
		const fulfillment = getEntityRecords( 'root', 'postType' );

		// Trigger generator
		fulfillment.next();

		// Provide entities and acquire lock
		fulfillment.next( ENTITIES );

		// trigger apiFetch
		const { value: apiFetchAction } = fulfillment.next();

		expect( apiFetchAction.request ).toEqual( {
			path: '/wp/v2/types?context=edit',
		} );
		// Provide response and trigger action
		const { value: received } = fulfillment.next( POST_TYPES );
		expect( received ).toEqual(
			receiveEntityRecords(
				'root',
				'postType',
				Object.values( POST_TYPES ),
				{}
			)
		);
	} );

	it( 'Uses state locks', async () => {
		const fulfillment = getEntityRecords( 'root', 'postType' );

		// Repeat the steps from `yields with requested post type` test
		fulfillment.next();
		// Provide entities and acquire lock
		expect( fulfillment.next( ENTITIES ).value.type ).toEqual(
			'MOCKED_ACQUIRE_LOCK'
		);
		fulfillment.next();
		fulfillment.next( POST_TYPES );

		// Resolve specific entity records
		fulfillment.next();
		fulfillment.next();

		// Release lock
		expect( fulfillment.next().value.type ).toEqual(
			'MOCKED_RELEASE_LOCK'
		);
	} );

	it( 'marks specific entity records as resolved', async () => {
		const fulfillment = getEntityRecords( 'root', 'postType' );

		// Repeat the steps from `yields with requested post type` test
		fulfillment.next();
		fulfillment.next( ENTITIES );
		fulfillment.next();
		fulfillment.next( POST_TYPES );

		// It should mark the entity record that has an ID as resolved
		expect( fulfillment.next().value ).toEqual( {
			type: 'START_RESOLUTIONS',
			selectorName: 'getEntityRecord',
			args: [ [ ENTITIES[ 1 ].kind, ENTITIES[ 1 ].name, 2 ] ],
		} );
		expect( fulfillment.next().value ).toEqual( {
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
