/**
 * WordPress dependencies
 */
import { CRDT_RECORD_MAP_KEY, Y } from '@wordpress/sync';

/**
 * External dependencies
 */
import { describe, expect, it, jest, beforeEach } from '@jest/globals';

/**
 * Internal dependencies
 */
import {
	applyPostChangesToCRDTDoc,
	getPostChangesFromCRDTDoc,
	getSyncedPropertiesForPostType,
	type PostChanges,
} from '../crdt';
import type { YBlock, YBlocks } from '../crdt-blocks';
import type { Post, Type } from '../../entity-types';

describe( 'crdt', () => {
	let doc: Y.Doc;
	let map: Y.Map< string | object | YBlocks >;

	beforeEach( () => {
		doc = new Y.Doc();
		map = doc.getMap( CRDT_RECORD_MAP_KEY );
		jest.clearAllMocks();
	} );

	afterEach( () => {
		doc.destroy();
	} );

	describe( 'getSyncedPropertiesForPostType', () => {
		it( 'includes base properties by default', () => {
			const postType = {
				slug: 'post',
				supports: {},
			} as Type;

			const syncedProps = getSyncedPropertiesForPostType( postType );

			expect( syncedProps.has( 'date' ) ).toBe( true );
			expect( syncedProps.has( 'status' ) ).toBe( true );
			expect( syncedProps.has( 'tags' ) ).toBe( true );
			expect( syncedProps.has( 'template' ) ).toBe( true );
			expect( syncedProps.has( 'slug' ) ).toBe( true );
			expect( syncedProps.has( 'sticky' ) ).toBe( true );
		} );

		it( 'adds title when supported', () => {
			const postType = {
				slug: 'post',
				supports: { title: true },
			} as unknown as Type;

			const syncedProps = getSyncedPropertiesForPostType( postType );

			expect( syncedProps.has( 'title' ) ).toBe( true );
		} );

		it( 'adds blocks (editor) when supported', () => {
			const postType = {
				slug: 'post',
				supports: { editor: true },
			} as unknown as Type;

			const syncedProps = getSyncedPropertiesForPostType( postType );

			expect( syncedProps.has( 'blocks' ) ).toBe( true );
		} );

		it( 'adds excerpt when supported', () => {
			const postType = {
				slug: 'post',
				supports: { excerpt: true },
			} as unknown as Type;

			const syncedProps = getSyncedPropertiesForPostType( postType );

			expect( syncedProps.has( 'excerpt' ) ).toBe( true );
		} );

		it( 'adds author when supported', () => {
			const postType = {
				slug: 'post',
				supports: { author: true },
			} as unknown as Type;

			const syncedProps = getSyncedPropertiesForPostType( postType );

			expect( syncedProps.has( 'author' ) ).toBe( true );
		} );

		it( 'adds comment_status when comments is supported', () => {
			const postType = {
				slug: 'post',
				supports: { comments: true },
			} as unknown as Type;

			const syncedProps = getSyncedPropertiesForPostType( postType );

			expect( syncedProps.has( 'comment_status' ) ).toBe( true );
		} );

		it( 'adds featured_media when thumbnail is supported', () => {
			const postType = {
				slug: 'post',
				supports: { thumbnail: true },
			} as unknown as Type;

			const syncedProps = getSyncedPropertiesForPostType( postType );

			expect( syncedProps.has( 'featured_media' ) ).toBe( true );
		} );

		it( 'adds format when post-formats is supported', () => {
			const postType = {
				slug: 'post',
				supports: { 'post-formats': true },
			} as unknown as Type;

			const syncedProps = getSyncedPropertiesForPostType( postType );

			expect( syncedProps.has( 'format' ) ).toBe( true );
		} );

		it( 'adds ping_status when trackbacks is supported', () => {
			const postType = {
				slug: 'post',
				supports: { trackbacks: true },
			} as unknown as Type;

			const syncedProps = getSyncedPropertiesForPostType( postType );

			expect( syncedProps.has( 'ping_status' ) ).toBe( true );
		} );
	} );

	describe( 'applyPostChangesToCRDTDoc', () => {
		const mockPostType = {} as Type;

		const syncedProperties = new Set( [
			'title',
			'excerpt',
			'blocks',
			'status',
			'slug',
		] );

		it( 'applies simple property changes', () => {
			const changes = {
				title: 'New Title',
			} as PostChanges;

			applyPostChangesToCRDTDoc(
				doc,
				changes,
				mockPostType,
				syncedProperties
			);

			expect( map.get( 'title' ) ).toBe( 'New Title' );
		} );

		it( 'does not sync properties not in syncedProperties', () => {
			const changes = {
				title: 'New Title',
				unsyncedProperty: 'value',
			} as unknown as PostChanges;

			applyPostChangesToCRDTDoc(
				doc,
				changes,
				mockPostType,
				syncedProperties
			);

			expect( map.has( 'unsyncedProperty' ) ).toBe( false );
			expect( map.get( 'title' ) ).toBe( 'New Title' );
		} );

		it( 'does not sync function values', () => {
			const changes = {
				title: () => 'function value',
			} as unknown as PostChanges;

			applyPostChangesToCRDTDoc(
				doc,
				changes,
				mockPostType,
				syncedProperties
			);

			expect( map.has( 'title' ) ).toBe( false );
		} );

		it( 'handles title with RenderedText format', () => {
			const changes = {
				title: { raw: 'Raw Title', rendered: 'Rendered Title' },
			};

			applyPostChangesToCRDTDoc(
				doc,
				changes,
				mockPostType,
				syncedProperties
			);

			expect( map.get( 'title' ) ).toBe( 'Raw Title' );
		} );

		it( 'skips "Auto Draft" template title when no current value exists', () => {
			const changes = {
				title: 'Auto Draft',
			} as PostChanges;

			applyPostChangesToCRDTDoc(
				doc,
				changes,
				mockPostType,
				syncedProperties
			);

			expect( map.get( 'title' ) ).toBe( '' );
		} );

		it( 'handles excerpt with RenderedText format', () => {
			const changes = {
				excerpt: {
					protected: false,
					raw: 'Raw excerpt',
					rendered: 'Rendered excerpt',
				},
			};

			applyPostChangesToCRDTDoc(
				doc,
				changes,
				mockPostType,
				syncedProperties
			);

			expect( map.get( 'excerpt' ) ).toBe( 'Raw excerpt' );
		} );

		it( 'does not sync empty slug', () => {
			const changes = {
				slug: '',
			};

			applyPostChangesToCRDTDoc(
				doc,
				changes,
				mockPostType,
				syncedProperties
			);

			expect( map.has( 'slug' ) ).toBe( false );
		} );

		it( 'syncs non-empty slug', () => {
			const changes = {
				slug: 'my-post-slug',
			};

			applyPostChangesToCRDTDoc(
				doc,
				changes,
				mockPostType,
				syncedProperties
			);

			expect( map.get( 'slug' ) ).toBe( 'my-post-slug' );
		} );

		it( 'merges blocks changes', () => {
			map.set( 'blocks', new Y.Array< YBlock >() );

			const changes = {
				blocks: [
					{
						name: 'core/paragraph',
						attributes: { content: 'Test' },
						innerBlocks: [],
					},
				],
			};

			applyPostChangesToCRDTDoc(
				doc,
				changes,
				mockPostType,
				syncedProperties
			);

			expect( ( map.get( 'blocks' ) as YBlocks ).toJSON() ).toEqual(
				changes.blocks
			);
		} );

		it( 'initializes blocks as Y.Array when not present', () => {
			const changes = {
				blocks: [],
			};

			applyPostChangesToCRDTDoc(
				doc,
				changes,
				mockPostType,
				syncedProperties
			);

			const blocks = map.get( 'blocks' );
			expect( blocks ).toBeInstanceOf( Y.Array );
		} );
	} );

	describe( 'getPostChangesFromCRDTDoc', () => {
		const mockPostType = {
			slug: 'post',
			supports: {
				title: true,
				editor: true,
			},
		} as unknown as Type;

		const syncedProperties = new Set( [
			'title',
			'status',
			'date',
			'blocks',
			'meta',
		] );

		beforeEach( () => {
			map.set( 'title', 'CRDT Title' );
			map.set( 'status', 'draft' );
			map.set( 'date', '2025-01-01' );
		} );

		it( 'returns changes when values differ from record', () => {
			const record = {
				title: 'Old Title',
				status: 'draft',
			} as unknown as Post;

			const changes = getPostChangesFromCRDTDoc(
				doc,
				record,
				mockPostType,
				syncedProperties
			);

			expect( changes.title ).toBe( 'CRDT Title' );
		} );

		it( 'filters out properties not in syncedProperties', () => {
			map.set( 'unsyncedProp', 'value' );

			const record = {} as Post;

			const changes = getPostChangesFromCRDTDoc(
				doc,
				record,
				mockPostType,
				syncedProperties
			);

			expect( changes ).not.toHaveProperty( 'unsyncedProp' );
		} );

		it( 'does not sync auto-draft status', () => {
			map.set( 'status', 'auto-draft' );

			const record = {
				status: 'draft',
			} as unknown as Post;

			const changes = getPostChangesFromCRDTDoc(
				doc,
				record,
				mockPostType,
				syncedProperties
			);

			expect( changes ).not.toHaveProperty( 'status' );
		} );

		it( 'does not sync empty date for floating dates', () => {
			map.set( 'status', 'draft' );
			map.set( 'date', '' );

			const record = {
				status: 'draft',
				date: null,
				modified: '2025-01-01',
			} as unknown as Post;

			const changes = getPostChangesFromCRDTDoc(
				doc,
				record,
				mockPostType,
				syncedProperties
			);

			expect( changes ).not.toHaveProperty( 'date' );
		} );

		it( 'includes blocks in changes', () => {
			map.set( 'blocks', new Y.Array< YBlock >() );

			const record = {
				blocks: [],
			} as unknown as Post;

			const changes = getPostChangesFromCRDTDoc(
				doc,
				record,
				mockPostType,
				syncedProperties
			);

			expect( changes ).toHaveProperty( 'blocks' );
		} );
	} );
} );
