/**
 * WordPress dependencies
 */
import {
	CRDT_RECORD_MAP_KEY,
	WORDPRESS_META_KEY_FOR_CRDT_DOC_PERSISTENCE,
	Y,
} from '@wordpress/sync';

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
	type PostChanges,
	type YPostRecord,
} from '../crdt';
import type { YBlock, YBlocks } from '../crdt-blocks';
import { createYMap, getRootMap, type YMapWrap } from '../crdt-utils';
import type { Post, Type } from '../../entity-types';

describe( 'crdt', () => {
	let doc: Y.Doc;

	beforeEach( () => {
		doc = new Y.Doc();
		jest.clearAllMocks();
	} );

	afterEach( () => {
		doc.destroy();
	} );

	describe( 'applyPostChangesToCRDTDoc', () => {
		const mockPostType = {} as Type;

		let map: YMapWrap< YPostRecord >;

		beforeEach( () => {
			map = getRootMap< YPostRecord >( doc, CRDT_RECORD_MAP_KEY );
		} );

		it( 'applies simple property changes', () => {
			const changes = {
				title: 'New Title',
			} as PostChanges;

			applyPostChangesToCRDTDoc( doc, changes, mockPostType );

			expect( map.get( 'title' ) ).toBe( 'New Title' );
		} );

		it( 'does not sync disallowed properties', () => {
			const changes = {
				title: 'New Title',
				unsyncedProperty: 'value',
			} as unknown as PostChanges;

			applyPostChangesToCRDTDoc( doc, changes, mockPostType );

			expect( map.has( 'unsyncedProperty' ) ).toBe( false );
			expect( map.get( 'title' ) ).toBe( 'New Title' );
		} );

		it( 'does not sync function values', () => {
			const changes = {
				title: () => 'function value',
			} as unknown as PostChanges;

			applyPostChangesToCRDTDoc( doc, changes, mockPostType );

			expect( map.has( 'title' ) ).toBe( false );
		} );

		it( 'handles title with RenderedText format', () => {
			const changes = {
				title: { raw: 'Raw Title', rendered: 'Rendered Title' },
			};

			applyPostChangesToCRDTDoc( doc, changes, mockPostType );

			expect( map.get( 'title' ) ).toBe( 'Raw Title' );
		} );

		it( 'skips "Auto Draft" template title when no current value exists', () => {
			const changes = {
				title: 'Auto Draft',
			} as PostChanges;

			applyPostChangesToCRDTDoc( doc, changes, mockPostType );

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

			applyPostChangesToCRDTDoc( doc, changes, mockPostType );

			expect( map.get( 'excerpt' ) ).toBe( 'Raw excerpt' );
		} );

		it( 'does not sync empty slug', () => {
			const changes = {
				slug: '',
			};

			applyPostChangesToCRDTDoc( doc, changes, mockPostType );

			expect( map.has( 'slug' ) ).toBe( false );
		} );

		it( 'syncs non-empty slug', () => {
			const changes = {
				slug: 'my-post-slug',
			};

			applyPostChangesToCRDTDoc( doc, changes, mockPostType );

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

			applyPostChangesToCRDTDoc( doc, changes, mockPostType );

			expect( ( map.get( 'blocks' ) as YBlocks ).toJSON() ).toEqual(
				changes.blocks
			);
		} );

		it( 'initializes blocks as Y.Array when not present', () => {
			const changes = {
				blocks: [],
			};

			applyPostChangesToCRDTDoc( doc, changes, mockPostType );

			const blocks = map.get( 'blocks' );
			expect( blocks ).toBeInstanceOf( Y.Array );
		} );

		it( 'syncs meta fields', () => {
			const changes = {
				meta: {
					some_meta: 'new value',
				},
			};

			const metaMap = createYMap();
			metaMap.set( 'some_meta', 'old value' );
			map.set( 'meta', metaMap );

			applyPostChangesToCRDTDoc( doc, changes, mockPostType );

			expect( metaMap.get( 'some_meta' ) ).toBe( 'new value' );
		} );

		it( 'syncs non-single meta fields', () => {
			const changes = {
				meta: {
					some_meta: [ 'value', 'value 2' ],
				},
			};

			const metaMap = createYMap();
			metaMap.set( 'some_meta', 'old value' );
			map.set( 'meta', metaMap );

			applyPostChangesToCRDTDoc( doc, changes, mockPostType );

			expect( metaMap.get( 'some_meta' ) ).toStrictEqual( [
				'value',
				'value 2',
			] );
		} );

		it( 'initializes meta as Y.Map when not present', () => {
			const changes = {
				meta: {
					custom_field: 'value',
				},
			};

			applyPostChangesToCRDTDoc( doc, changes, mockPostType );

			const metaMap = map.get( 'meta' );
			expect( metaMap ).toBeInstanceOf( Y.Map );
			expect( metaMap?.get( 'custom_field' ) ).toBe( 'value' );
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

		let map: YMapWrap< YPostRecord >;

		beforeEach( () => {
			map = getRootMap< YPostRecord >( doc, CRDT_RECORD_MAP_KEY );
			map.set( 'title', 'CRDT Title' );
			map.set( 'status', 'draft' );
			map.set( 'date', '2025-01-01' );
		} );

		it( 'returns changes when values differ from record', () => {
			const editedRecord = {
				title: 'Old Title',
				status: 'draft',
			} as unknown as Post;

			const changes = getPostChangesFromCRDTDoc(
				doc,
				editedRecord,
				mockPostType
			);

			expect( changes.title ).toBe( 'CRDT Title' );
		} );

		it( 'filters out disallowed properties', () => {
			map.set( 'title', 'Test title' );
			map.set( 'unsyncedProp', 'value' );

			const editedRecord = {} as Post;

			const changes = getPostChangesFromCRDTDoc(
				doc,
				editedRecord,
				mockPostType
			);

			expect( changes ).not.toHaveProperty( 'unsyncedProp' );
			expect( changes.title ).toBe( 'Test title' );
		} );

		it( 'does not sync auto-draft status', () => {
			map.set( 'status', 'auto-draft' );

			const editedRecord = {
				status: 'draft',
			} as unknown as Post;

			const changes = getPostChangesFromCRDTDoc(
				doc,
				editedRecord,
				mockPostType
			);

			expect( changes ).not.toHaveProperty( 'status' );
		} );

		it( 'does not overwrite null floating date', () => {
			map.set( 'status', 'draft' );
			map.set( 'date', '' );

			const editedRecord = {
				status: 'draft',
				date: null,
				modified: '2025-01-01',
			} as unknown as Post;

			const changesWithEmptyDate = getPostChangesFromCRDTDoc(
				doc,
				editedRecord,
				mockPostType
			);

			expect( changesWithEmptyDate ).not.toHaveProperty( 'date' );

			map.set( 'date', '2025-01-02' );

			const changesWithDefinedDate = getPostChangesFromCRDTDoc(
				doc,
				editedRecord,
				mockPostType
			);

			expect( changesWithDefinedDate ).not.toHaveProperty( 'date' );
		} );

		it( 'does not overwrite defined floating date', () => {
			map.set( 'status', 'draft' );
			map.set( 'date', '' );

			const editedRecord = {
				status: 'draft',
				date: '2025-01-01', // matches modified
				modified: '2025-01-01',
			} as unknown as Post;

			const changesWithEmptyDate = getPostChangesFromCRDTDoc(
				doc,
				editedRecord,
				mockPostType
			);

			expect( changesWithEmptyDate ).not.toHaveProperty( 'date' );

			map.set( 'date', '2025-01-02' );

			const changesWithDefinedDate = getPostChangesFromCRDTDoc(
				doc,
				editedRecord,
				mockPostType
			);

			expect( changesWithDefinedDate ).not.toHaveProperty( 'date' );
		} );

		it( 'includes blocks in changes', () => {
			map.set( 'blocks', new Y.Array< YBlock >() );

			const editedRecord = {
				blocks: [],
			} as unknown as Post;

			const changes = getPostChangesFromCRDTDoc(
				doc,
				editedRecord,
				mockPostType
			);

			expect( changes ).toHaveProperty( 'blocks' );
		} );

		it( 'includes meta in changes', () => {
			const metaMap = createYMap();
			metaMap.set( 'public_meta', 'new value' );
			map.set( 'meta', metaMap );

			const editedRecord = {
				meta: {
					public_meta: 'old value',
				},
			} as unknown as Post;

			const changes = getPostChangesFromCRDTDoc(
				doc,
				editedRecord,
				mockPostType
			);

			expect( changes.meta ).toEqual( {
				public_meta: 'new value', // from CRDT
			} );
		} );

		it( 'includes non-single meta in changes', () => {
			const metaMap = createYMap();
			metaMap.set( 'public_meta', [ 'value', 'value 2' ] );
			map.set( 'meta', metaMap );

			const editedRecord = {
				meta: {
					public_meta: 'value',
				},
			} as unknown as Post;

			const changes = getPostChangesFromCRDTDoc(
				doc,
				editedRecord,
				mockPostType
			);

			expect( changes.meta ).toEqual( {
				public_meta: [ 'value', 'value 2' ], // from CRDT
			} );
		} );

		it( 'excludes disallowed meta keys in changes', () => {
			const metaMap = createYMap();
			metaMap.set( 'public_meta', 'new value' );
			metaMap.set(
				WORDPRESS_META_KEY_FOR_CRDT_DOC_PERSISTENCE,
				'exclude me'
			);
			map.set( 'meta', metaMap );

			const editedRecord = {
				meta: {
					public_meta: 'old value',
				},
			} as unknown as Post;

			const changes = getPostChangesFromCRDTDoc(
				doc,
				editedRecord,
				mockPostType
			);

			expect( changes.meta ).toEqual( {
				public_meta: 'new value', // from CRDT
			} );
			expect( changes.meta ).not.toHaveProperty(
				WORDPRESS_META_KEY_FOR_CRDT_DOC_PERSISTENCE
			);
		} );
	} );
} );
