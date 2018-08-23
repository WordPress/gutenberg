/**
 * Internal dependencies
 */
import { getEntityRecord, getEntityRecords, getEmbedPreview, hasUploadPermissions } from '../resolvers';
import { receiveEntityRecords, receiveEmbedPreview, receiveUploadPermissions } from '../actions';

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

describe( 'hasUploadPermissions', () => {
	describe( 'a normal fetch request for a user with upload_file capabilities', () => {
		// When retrieving a non-preloaded request, the header is an object of the type Header.
		const ADMIN_FETCH_RESPONSE = {
			headers: {
				get: () => 'GET,POST,PUT,OPTIONS',
			},
		};

		it( 'yields true if the response header allow parameters contains POST', async () => {
			const fulfillment = hasUploadPermissions();

			// Trigger generator
			fulfillment.next();

			// Provide valid response
			const received = ( await fulfillment.next( ADMIN_FETCH_RESPONSE ) ).value;
			expect( received ).toEqual( receiveUploadPermissions( true ) );
		} );
	} );

	describe( 'a preloaded request for a user with upload_file capabilities', () => {
		// For a preloaded request, the header is an object with simple properties.
		const ADMIN_PRELOADED_RESPONSE = {
			headers: {
				Allow: 'GET,POST,PUT,OPTIONS',
			},
		};

		it( 'yields true if the response header allow parameters contains POST', async () => {
			const fulfillment = hasUploadPermissions();

			// Trigger generator
			fulfillment.next();

			// Provide valid response
			const received = ( await fulfillment.next( ADMIN_PRELOADED_RESPONSE ) ).value;
			expect( received ).toEqual( receiveUploadPermissions( true ) );
		} );
	} );

	describe( 'a user without upload_file capabilities', () => {
		const CONTRIBUTOR_RESPONSE = {
			headers: {
				get: () => 'GET',
			},
		};

		it( 'yields false if the response header allow parameters do not contain POST', async () => {
			const fulfillment = hasUploadPermissions();

			// Trigger generator
			fulfillment.next();

			// Provide response indicating user does not have permissions
			const received = ( await fulfillment.next( CONTRIBUTOR_RESPONSE ) ).value;
			expect( received ).toEqual( receiveUploadPermissions( false ) );
		} );
	} );
} );
