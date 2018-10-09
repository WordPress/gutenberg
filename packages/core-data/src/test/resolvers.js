/**
 * Internal dependencies
 */
import { getEntityRecord, getEntityRecords, getEmbedPreview } from '../resolvers';
import { receiveEntityRecords, receiveEmbedPreview } from '../actions';

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
