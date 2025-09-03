/**
 * WordPress dependencies
 */
import triggerFetch from '@wordpress/api-fetch';
import { createRegistry } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as coreDataStore } from '../index';

jest.mock( '@wordpress/api-fetch' );

function createTestRegistry() {
	const registry = createRegistry();

	// Register the core-data store
	registry.register( coreDataStore );

	const postEntityConfig = {
		kind: 'postType',
		baseURL: '/wp/v2/posts',
		baseURLParams: {
			context: 'edit',
		},
		name: 'post',
		label: 'Posts',
		transientEdits: {
			blocks: true,
			selection: true,
		},
		mergedEdits: {
			meta: true,
		},
		rawAttributes: [ 'title', 'excerpt', 'content' ],
		__unstable_rest_base: 'posts',
		supportsPagination: true,
		revisionKey: 'id',
	};

	// Add the post entity to the store
	registry.dispatch( coreDataStore ).addEntities( [ postEntityConfig ] );

	return registry;
}

function createTestPost( id = 1, fields = [] ) {
	const post = {
		id,
		author: 1,
		content: {
			raw: '<!-- wp:paragraph -->\n<p>A paragraph</p>\n<!-- /wp:paragraph -->',
			rendered: '\n<p>A paragraph</p>\n',
		},
		excerpt: {
			raw: '',
			rendered: '<p>A paragraph</p>\n',
		},
		title: {
			raw: 'Test',
			rendered: 'Test',
		},
		featured_media: 0,
		type: 'post',
		status: 'draft',
		slug: '',
	};

	if ( fields.length > 0 ) {
		return Object.fromEntries(
			fields.map( ( field ) => [ field, post[ field ] ] )
		);
	}

	return post;
}

describe( 'getEntityRecord', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();
		triggerFetch.mockReset();
	} );

	it( 'should return the entity record for a given post ID', async () => {
		const { getEntityRecord } = registry.resolveSelect( coreDataStore );
		const post = createTestPost( 1 );
		triggerFetch.mockResolvedValue( {
			async json() {
				return post;
			},
		} );

		await expect(
			getEntityRecord( 'postType', 'post', post.id )
		).resolves.toEqual( expect.objectContaining( { title: post.title } ) );
	} );

	it( 'should return a subset of record properties for a given fields query', async () => {
		const { getEntityRecord } = registry.resolveSelect( coreDataStore );
		const fields = [ 'id', 'author', 'title' ];
		const post = createTestPost( 2, fields );
		triggerFetch.mockResolvedValue( {
			async json() {
				return post;
			},
		} );

		await expect(
			getEntityRecord( 'postType', 'post', post.id, {
				_fields: fields,
			} )
		).resolves.toEqual( {
			id: post.id,
			author: post.author,
			title: post.title,
		} );
	} );

	it( 'should not return subset properties when selecting a full record', async () => {
		const { getEntityRecord } = registry.resolveSelect( coreDataStore );
		const id = 1;
		const fields = [ 'id', 'author', 'title' ];
		const subset = createTestPost( id, fields );
		const full = createTestPost( id );
		triggerFetch.mockImplementation( async ( { path } ) => {
			if ( path.includes( '_fields' ) ) {
				return {
					async json() {
						return subset;
					},
				};
			}
			return {
				async json() {
					return full;
				},
			};
		} );

		// Resolve subset record properties.
		await expect(
			getEntityRecord( 'postType', 'post', id, {
				context: 'view',
				_fields: fields,
			} )
		).resolves.toEqual( subset );

		expect(
			registry
				.select( coreDataStore )
				.getEntityRecord( 'postType', 'post', id, {
					context: 'view',
				} )
		).toEqual( undefined );
		await expect(
			getEntityRecord( 'postType', 'post', id, {
				context: 'view',
			} )
		).resolves.toEqual( full );
	} );
} );
