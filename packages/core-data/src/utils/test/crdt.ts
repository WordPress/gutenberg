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

	describe( 'applyPostChangesToCRDTDoc', () => {
		const mockPostType = {} as Type;

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
	} );

	describe( 'getPostChangesFromCRDTDoc', () => {
		const mockPostType = {
			slug: 'post',
			supports: {
				title: true,
				editor: true,
			},
		} as unknown as Type;

		beforeEach( () => {
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

		it( 'does not sync empty date for floating dates', () => {
			map.set( 'status', 'draft' );
			map.set( 'date', '' );

			const editedRecord = {
				status: 'draft',
				date: null,
				modified: '2025-01-01',
			} as unknown as Post;

			const changes = getPostChangesFromCRDTDoc(
				doc,
				editedRecord,
				mockPostType
			);

			expect( changes ).not.toHaveProperty( 'date' );
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
	} );
} );
