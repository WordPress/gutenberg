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

	it( 'should not make a request if the record is already in store', async () => {
		const { getEntityRecord } = registry.resolveSelect( coreDataStore );
		const post = createTestPost( 1 );
		triggerFetch.mockResolvedValue( {
			async json() {
				return post;
			},
		} );

		// Resolve the record.
		await expect(
			getEntityRecord( 'postType', 'post', post.id, { context: 'edit' } )
		).resolves.toEqual( post );

		triggerFetch.mockReset();

		await expect(
			getEntityRecord( 'postType', 'post', post.id, {
				context: 'edit',
				_fields: [ 'id', 'author', 'title' ],
			} )
		).resolves.toEqual( {
			id: post.id,
			author: post.author,
			title: post.title,
		} );
		expect( triggerFetch ).not.toHaveBeenCalled();
	} );
} );

describe( 'clearEntityRecordEdits', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();
		triggerFetch.mockReset();
	} );

	it( 'should return the persisted record after clearing edits', () => {
		const post = createTestPost( 1 );
		const dispatch = registry.dispatch( coreDataStore );
		const select = registry.select( coreDataStore );

		dispatch.receiveEntityRecords( 'postType', 'post', post );
		dispatch.editEntityRecord( 'postType', 'post', post.id, {
			slug: 'updated-slug',
		} );

		expect(
			select.getEditedEntityRecord( 'postType', 'post', post.id ).slug
		).toBe( 'updated-slug' );

		dispatch.clearEntityRecordEdits( 'postType', 'post', post.id );

		expect(
			select.getEditedEntityRecord( 'postType', 'post', post.id )
		).toEqual( select.getRawEntityRecord( 'postType', 'post', post.id ) );
	} );
} );
