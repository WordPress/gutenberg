/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';

/**
 * External dependencies
 */
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { getCategories, getEntityRecord, getEntityRecords, getEmbedPreview } from '../resolvers';
import { receiveTerms, receiveEntityRecords, addEntities, receiveEmbedPreview } from '../actions';

jest.mock( '@wordpress/api-fetch', () => jest.fn() );

describe( 'getCategories', () => {
	const CATEGORIES = [ { id: 1 } ];

	beforeAll( () => {
		apiFetch.mockImplementation( ( options ) => {
			if ( options.path === '/wp/v2/categories?per_page=-1' ) {
				return Promise.resolve( CATEGORIES );
			}
		} );
	} );

	it( 'yields with requested terms', async () => {
		const fulfillment = getCategories();
		const received = ( await fulfillment.next() ).value;
		expect( received ).toEqual( receiveTerms( 'categories', CATEGORIES ) );
		expect( console ).toHaveWarnedWith( 'getCategories resolver is deprecated and will be removed from Gutenberg in 3.7.0. Please use getEntityRecords resolver instead.' );
	} );
} );

describe( 'getEntityRecord', () => {
	const POST_TYPE = { slug: 'post' };
	const POST_TYPES = {
		post: {
			rest_base: 'posts',
		},
	};
	const POST = { id: 10, title: 'test' };

	beforeAll( () => {
		apiFetch.mockImplementation( ( options ) => {
			if ( options.path === '/wp/v2/types/post?context=edit' ) {
				return Promise.resolve( POST_TYPE );
			}
			if ( options.path === '/wp/v2/posts/10?context=edit' ) {
				return Promise.resolve( POST );
			}
			if ( options.path === '/wp/v2/types?context=edit' ) {
				return Promise.resolve( POST_TYPES );
			}
		} );
	} );

	it( 'yields with requested post type', async () => {
		const state = {
			entities: {
				config: [
					{ name: 'postType', kind: 'root', baseURL: '/wp/v2/types' },
				],
			},
		};
		const fulfillment = getEntityRecord( state, 'root', 'postType', 'post' );
		const received = ( await fulfillment.next() ).value;
		expect( received ).toEqual( receiveEntityRecords( 'root', 'postType', POST_TYPE ) );
	} );

	it( 'loads the kind entities and yields with requested post type', async () => {
		const fulfillment = getEntityRecord( { entities: {} }, 'postType', 'post', 10 );
		const receivedEntities = ( await fulfillment.next() ).value;
		expect( receivedEntities ).toEqual( addEntities( [ {
			baseURL: '/wp/v2/posts',
			kind: 'postType',
			name: 'post',
		} ] ) );
		const received = ( await fulfillment.next() ).value;
		expect( received ).toEqual( receiveEntityRecords( 'postType', 'post', POST ) );
	} );
} );

describe( 'getEntityRecords', () => {
	const POST_TYPES = {
		post: { slug: 'post' },
		page: { slug: 'page' },
	};

	beforeAll( () => {
		apiFetch.mockImplementation( ( options ) => {
			if ( options.path === '/wp/v2/types?context=edit' ) {
				return Promise.resolve( POST_TYPES );
			}
		} );
	} );

	it( 'yields with requested post type', async () => {
		const state = {
			entities: {
				config: [
					{ name: 'postType', kind: 'root', baseURL: '/wp/v2/types' },
				],
			},
		};
		const fulfillment = getEntityRecords( state, 'root', 'postType' );
		const received = ( await fulfillment.next() ).value;
		expect( received ).toEqual( receiveEntityRecords( 'root', 'postType', Object.values( POST_TYPES ), {} ) );
	} );
} );

describe( 'getEmbedPreview', () => {
	const SUCCESSFUL_EMBED_RESPONSE = { data: '<p>some html</p>' };
	const UNEMBEDDABLE_RESPONSE = false;
	const EMBEDDABLE_URL = 'http://twitter.com/notnownikki';
	const UNEMBEDDABLE_URL = 'http://example.com/';

	beforeAll( () => {
		apiFetch.mockImplementation( ( options ) => {
			if ( options.path === addQueryArgs( '/oembed/1.0/proxy', { url: EMBEDDABLE_URL } ) ) {
				return Promise.resolve( SUCCESSFUL_EMBED_RESPONSE );
			}
			throw 404;
		} );
	} );

	it( 'yields with fetched embed preview', async () => {
		const fulfillment = getEmbedPreview( {}, EMBEDDABLE_URL );
		const received = ( await fulfillment.next() ).value;
		expect( received ).toEqual( receiveEmbedPreview( EMBEDDABLE_URL, SUCCESSFUL_EMBED_RESPONSE ) );
	} );

	it( 'yields false if the URL cannot be embedded', async () => {
		const fulfillment = getEmbedPreview( {}, UNEMBEDDABLE_URL );
		const received = ( await fulfillment.next() ).value;
		expect( received ).toEqual( receiveEmbedPreview( UNEMBEDDABLE_URL, UNEMBEDDABLE_RESPONSE ) );
	} );
} );
