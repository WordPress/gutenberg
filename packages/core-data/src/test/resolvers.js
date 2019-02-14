/**
 * Internal dependencies
 */
import { getEntityRecord, getEntityRecords, getEmbedPreview, canUser } from '../resolvers';
import { receiveEntityRecords, receiveEmbedPreview, receiveUserPermission } from '../actions';
import { apiFetch } from '../controls';

describe( 'getEntityRecord', () => {
	const POST_TYPE = { slug: 'post' };

	it( 'yields with requested post type', async () => {
		const entities = [ { name: 'postType', kind: 'root', baseURL: '/wp/v2/types' } ];
		const fulfillment = getEntityRecord( 'root', 'postType', 'post' );
		// Trigger generator
		fulfillment.next();
		// Provide entities and trigger apiFetch
		const { value: apiFetchAction } = fulfillment.next( entities );
		expect( apiFetchAction.request ).toEqual( { path: '/wp/v2/types/post?context=edit' } );
		// Provide response and trigger action
		const { value: received } = fulfillment.next( POST_TYPE );
		expect( received ).toEqual( receiveEntityRecords( 'root', 'postType', POST_TYPE ) );
	} );
} );

describe( 'getEntityRecords', () => {
	const POST_TYPES = {
		post: { slug: 'post' },
		page: { slug: 'page' },
	};

	it( 'yields with requested post type', async () => {
		const entities = [
			{ name: 'postType', kind: 'root', baseURL: '/wp/v2/types' },
		];
		const fulfillment = getEntityRecords( 'root', 'postType' );

		// Trigger generator
		fulfillment.next();
		// Provide entities and trigger apiFetch
		const { value: apiFetchAction } = fulfillment.next( entities );
		expect( apiFetchAction.request ).toEqual( { path: '/wp/v2/types?context=edit' } );
		// Provide response and trigger action
		const { value: received } = fulfillment.next( POST_TYPES );
		expect( received ).toEqual( receiveEntityRecords( 'root', 'postType', Object.values( POST_TYPES ), {} ) );
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
		const received = ( await fulfillment.next( SUCCESSFUL_EMBED_RESPONSE ) ).value;
		expect( received ).toEqual( receiveEmbedPreview( EMBEDDABLE_URL, SUCCESSFUL_EMBED_RESPONSE ) );
	} );

	it( 'yields false if the URL cannot be embedded', async () => {
		const fulfillment = getEmbedPreview( UNEMBEDDABLE_URL );
		// Trigger generator
		fulfillment.next();
		// Provide invalid response and trigger Action
		const received = ( await fulfillment.throw( { status: 404 } ) ).value;
		expect( received ).toEqual( receiveEmbedPreview( UNEMBEDDABLE_URL, UNEMBEDDABLE_RESPONSE ) );
	} );
} );

describe( 'canUser', () => {
	it( 'does nothing when there is an API error', () => {
		const generator = canUser( 'create', 'media' );

		let received = generator.next();
		expect( received.done ).toBe( false );
		expect( received.value ).toEqual( apiFetch( {
			path: '/wp/v2/media',
			method: 'OPTIONS',
			parse: false,
		} ) );

		received = generator.throw( { status: 404 } );
		expect( received.done ).toBe( true );
		expect( received.value ).toBeUndefined();
	} );

	it( 'receives false when the user is not allowed to perform an action', () => {
		const generator = canUser( 'create', 'media' );

		let received = generator.next();
		expect( received.done ).toBe( false );
		expect( received.value ).toEqual( apiFetch( {
			path: '/wp/v2/media',
			method: 'OPTIONS',
			parse: false,
		} ) );

		received = generator.next( {
			headers: {
				Allow: 'GET',
			},
		} );
		expect( received.done ).toBe( false );
		expect( received.value ).toEqual( receiveUserPermission( 'create/media', false ) );

		received = generator.next();
		expect( received.done ).toBe( true );
		expect( received.value ).toBeUndefined();
	} );

	it( 'receives true when the user is allowed to perform an action', () => {
		const generator = canUser( 'create', 'media' );

		let received = generator.next();
		expect( received.done ).toBe( false );
		expect( received.value ).toEqual( apiFetch( {
			path: '/wp/v2/media',
			method: 'OPTIONS',
			parse: false,
		} ) );

		received = generator.next( {
			headers: {
				Allow: 'POST, GET, PUT, DELETE',
			},
		} );
		expect( received.done ).toBe( false );
		expect( received.value ).toEqual( receiveUserPermission( 'create/media', true ) );

		received = generator.next();
		expect( received.done ).toBe( true );
		expect( received.value ).toBeUndefined();
	} );

	it( 'receives true when the user is allowed to perform an action on a specific resource', () => {
		const generator = canUser( 'update', 'blocks', 123 );

		let received = generator.next();
		expect( received.done ).toBe( false );
		expect( received.value ).toEqual( apiFetch( {
			path: '/wp/v2/blocks/123',
			method: 'GET',
			parse: false,
		} ) );

		received = generator.next( {
			headers: {
				Allow: 'POST, GET, PUT, DELETE',
			},
		} );
		expect( received.done ).toBe( false );
		expect( received.value ).toEqual( receiveUserPermission( 'update/blocks/123', true ) );

		received = generator.next();
		expect( received.done ).toBe( true );
		expect( received.value ).toBeUndefined();
	} );
} );
