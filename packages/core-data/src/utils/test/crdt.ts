/**
 * WordPress dependencies
 */
import { Y } from '@wordpress/sync';

/**
 * External dependencies
 */
import { describe, expect, it, jest, beforeEach } from '@jest/globals';

/**
 * Mock getBlockTypes so CRDT merging can identify rich-text attributes.
 * Also stub __unstableSerializeAndClean so we can assert how it's invoked
 * (the real implementation returns "" without registered block types, which
 * isn't useful for asserting closure-capture behavior).
 */
jest.mock( '@wordpress/blocks', () => {
	const actual = jest.requireActual( '@wordpress/blocks' ) as Record<
		string,
		unknown
	>;
	return {
		...actual,
		getBlockTypes: () => [
			{
				name: 'core/paragraph',
				attributes: { content: { type: 'rich-text' } },
			},
			{
				name: 'core/table',
				attributes: {
					hasFixedLayout: { type: 'boolean' },
					caption: { type: 'rich-text' },
					body: {
						type: 'array',
						query: {
							cells: {
								type: 'array',
								query: {
									content: { type: 'rich-text' },
									tag: { type: 'string' },
								},
							},
						},
					},
				},
			},
		],
		// Mocked so tests can control what the Code Editor sync path "parses"
		// from raw content without needing real block-type registration.
		parse: jest.fn( () => [] ),
		__unstableSerializeAndClean: jest.fn(
			( blocks: unknown[] ) => `serialized:${ blocks?.length ?? 0 }`
		),
	};
} );

/**
 * WordPress dependencies
 */
import { parse } from '@wordpress/blocks';
import { RichTextData } from '@wordpress/rich-text';

/**
 * Internal dependencies
 */
import { CRDT_RECORD_MAP_KEY } from '../../sync';
import {
	applyPostChangesToCRDTDoc,
	defaultCollectionSyncConfig,
	getPostChangesFromCRDTDoc,
	POST_META_KEY_FOR_CRDT_DOC_PERSISTENCE,
	type PostChanges,
	type YPostRecord,
} from '../crdt';
import type { Block, YBlock, YBlockRecord, YBlocks } from '../crdt-blocks';
import { updateSelectionHistory } from '../crdt-selection';
import { createYMap, getRootMap, type YMapWrap } from '../crdt-utils';
import type { Post } from '../../entity-types';

// Default synced properties matching the base set built in entities.js,
// plus 'categories' and 'tags' as example taxonomy rest_base values.
const defaultSyncedProperties = new Set< string >( [
	'blocks',
	'categories',
	'content',
	'date',
	'excerpt',
	'meta',
	'slug',
	'status',
	'tags',
	'title',
] );

describe( 'defaultCollectionSyncConfig', () => {
	it( 'has no-op applyChangesToCRDTDoc', () => {
		const doc = new Y.Doc();
		// Should not throw and return undefined.
		expect(
			defaultCollectionSyncConfig.applyChangesToCRDTDoc( doc, {
				title: 'test',
			} )
		).toBeUndefined();
		doc.destroy();
	} );

	it( 'has getChangesFromCRDTDoc that returns empty object', () => {
		const doc = new Y.Doc();
		const result = defaultCollectionSyncConfig.getChangesFromCRDTDoc( doc, {
			title: 'test',
		} );
		expect( result ).toEqual( {} );
		doc.destroy();
	} );

	it( 'shouldSync returns true when objectId is null (collection)', () => {
		expect(
			defaultCollectionSyncConfig.shouldSync?.( 'comment', null )
		).toBe( true );
	} );

	it( 'shouldSync returns false when objectId is provided (individual record)', () => {
		expect(
			defaultCollectionSyncConfig.shouldSync?.( 'comment', '123' )
		).toBe( false );
		expect(
			defaultCollectionSyncConfig.shouldSync?.( 'comment', 'foo' )
		).toBe( false );
	} );
} );

describe( 'crdt', () => {
	let doc: Y.Doc;

	beforeEach( () => {
		doc = new Y.Doc();
		jest.clearAllMocks();
		jest.useFakeTimers();
	} );

	afterEach( () => {
		jest.runAllTimers();
		jest.useRealTimers();
		doc.destroy();
	} );

	describe( 'applyPostChangesToCRDTDoc', () => {
		let map: YMapWrap< YPostRecord >;

		beforeEach( () => {
			map = getRootMap< YPostRecord >( doc, CRDT_RECORD_MAP_KEY );
		} );

		it( 'applies simple property changes', () => {
			const changes = {
				title: 'New Title',
			} as PostChanges;

			applyPostChangesToCRDTDoc( doc, changes, defaultSyncedProperties );

			const title = map.get( 'title' );
			expect( title ).toBeInstanceOf( Y.Text );
			expect( title?.toString() ).toBe( 'New Title' );
		} );

		it( 'does not sync disallowed properties', () => {
			const changes = {
				title: 'New Title',
				unsyncedProperty: 'value',
			} as unknown as PostChanges;

			applyPostChangesToCRDTDoc( doc, changes, defaultSyncedProperties );

			expect( map.has( 'unsyncedProperty' ) ).toBe( false );
			expect( map.get( 'title' )?.toString() ).toBe( 'New Title' );
		} );

		it( 'does not sync function values', () => {
			const changes = {
				title: () => 'function value',
			} as unknown as PostChanges;

			applyPostChangesToCRDTDoc( doc, changes, defaultSyncedProperties );

			expect( map.has( 'title' ) ).toBe( false );
		} );

		it( 'handles title with RenderedText format', () => {
			const changes = {
				title: { raw: 'Raw Title', rendered: 'Rendered Title' },
			};

			applyPostChangesToCRDTDoc( doc, changes, defaultSyncedProperties );

			const title = map.get( 'title' );
			expect( title ).toBeInstanceOf( Y.Text );
			expect( title?.toString() ).toBe( 'Raw Title' );
		} );

		it( 'skips "Auto Draft" template title when no current value exists', () => {
			const changes = {
				title: 'Auto Draft',
			} as PostChanges;

			applyPostChangesToCRDTDoc( doc, changes, defaultSyncedProperties );

			const title = map.get( 'title' );
			expect( title ).toBeInstanceOf( Y.Text );
			expect( title?.toString() ).toBe( '' );
		} );

		it( 'skips "Auto Draft" template title when current value is empty Y.Text', () => {
			// First set an empty title (simulates a prior sync that cleared it).
			applyPostChangesToCRDTDoc(
				doc,
				{ title: '' } as PostChanges,
				defaultSyncedProperties
			);

			const title = map.get( 'title' );
			expect( title ).toBeInstanceOf( Y.Text );
			expect( title?.toString() ).toBe( '' );

			// Now sync "Auto Draft" — should still be suppressed.
			applyPostChangesToCRDTDoc(
				doc,
				{ title: 'Auto Draft' } as PostChanges,
				defaultSyncedProperties
			);

			expect( map.get( 'title' )?.toString() ).toBe( '' );
		} );

		it( 'handles excerpt with RenderedText format', () => {
			const changes = {
				excerpt: {
					protected: false,
					raw: 'Raw excerpt',
					rendered: 'Rendered excerpt',
				},
			};

			applyPostChangesToCRDTDoc( doc, changes, defaultSyncedProperties );

			const excerpt = map.get( 'excerpt' );
			expect( excerpt ).toBeInstanceOf( Y.Text );
			expect( excerpt?.toString() ).toBe( 'Raw excerpt' );
		} );

		it( 'does not sync empty slug', () => {
			const changes = {
				slug: '',
			};

			applyPostChangesToCRDTDoc( doc, changes, defaultSyncedProperties );

			expect( map.has( 'slug' ) ).toBe( false );
		} );

		it( 'syncs non-empty slug', () => {
			const changes = {
				slug: 'my-post-slug',
			};

			applyPostChangesToCRDTDoc( doc, changes, defaultSyncedProperties );

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

			applyPostChangesToCRDTDoc( doc, changes, defaultSyncedProperties );

			expect( ( map.get( 'blocks' ) as YBlocks ).toJSON() ).toEqual(
				changes.blocks
			);
		} );

		it( 'initializes blocks as Y.Array when not present', () => {
			const changes = {
				blocks: [],
			};

			applyPostChangesToCRDTDoc( doc, changes, defaultSyncedProperties );

			const blocks = map.get( 'blocks' );
			expect( blocks ).toBeInstanceOf( Y.Array );
		} );

		it( 'sets blocks to undefined when blocks value is undefined and no content is provided', () => {
			// First, set some blocks.
			map.set( 'blocks', new Y.Array< YBlock >() );

			const changes = {
				blocks: undefined,
			};

			applyPostChangesToCRDTDoc( doc, changes, defaultSyncedProperties );

			// The key should still exist, but the value should be undefined.
			expect( map.has( 'blocks' ) ).toBe( true );
			expect( map.get( 'blocks' ) ).toBeUndefined();
		} );

		it( 'parses content into blocks when blocks=undefined is paired with new content', () => {
			// Pre-populate the Y.Doc with two stable blocks. Simulates the
			// state after the initial sync: peers share the same blocks Y.Array
			// with stable clientIds on every YBlock.
			applyPostChangesToCRDTDoc(
				doc,
				{
					blocks: [
						{
							name: 'core/paragraph',
							attributes: { content: 'Hello' },
							innerBlocks: [],
							clientId: 'stable-first',
						},
						{
							name: 'core/paragraph',
							attributes: { content: 'World' },
							innerBlocks: [],
							clientId: 'stable-second',
						},
					],
				} as PostChanges,
				defaultSyncedProperties
			);

			// The Code Editor flow: dispatch `{ content, blocks: undefined }`
			// when the user types. The new HTML edits the second paragraph
			// only. `parse()` is mocked to return blocks with freshly minted
			// clientIds — the sync layer must not let those overwrite the
			// stable clientIds already in the Y.Array.
			( parse as jest.Mock ).mockReturnValueOnce( [
				{
					name: 'core/paragraph',
					attributes: { content: 'Hello' },
					innerBlocks: [],
					clientId: 'fresh-first',
				},
				{
					name: 'core/paragraph',
					attributes: { content: 'World!' },
					innerBlocks: [],
					clientId: 'fresh-second',
				},
			] );

			applyPostChangesToCRDTDoc(
				doc,
				{
					content:
						'<!-- wp:paragraph --><p>Hello</p><!-- /wp:paragraph -->' +
						'<!-- wp:paragraph --><p>World!</p><!-- /wp:paragraph -->',
					blocks: undefined,
				} as PostChanges,
				defaultSyncedProperties
			);

			const yblocks = map.get( 'blocks' );
			expect( yblocks ).toBeInstanceOf( Y.Array );
			const blocksArray = yblocks as YBlocks;
			expect( blocksArray.length ).toBe( 2 );

			// Both clientIds must be preserved: the unchanged first block via
			// the left-right diff sweep, the edited second block via the
			// explicit clientId-skip in the update loop.
			expect( blocksArray.get( 0 ).get( 'clientId' ) ).toBe(
				'stable-first'
			);
			expect( blocksArray.get( 1 ).get( 'clientId' ) ).toBe(
				'stable-second'
			);

			// The second block's content reflects the edit.
			const updatedContent = (
				blocksArray
					.get( 1 )
					.get( 'attributes' ) as unknown as YMapWrap< YBlockRecord >
			 ).get( 'content' ) as Y.Text;
			expect( updatedContent.toString() ).toBe( 'World!' );
		} );

		it( 'syncs content as Y.Text', () => {
			const changes = {
				content: 'Hello, world!',
			} as PostChanges;

			applyPostChangesToCRDTDoc( doc, changes, defaultSyncedProperties );

			const content = map.get( 'content' );
			expect( content ).toBeInstanceOf( Y.Text );
			expect( content?.toString() ).toBe( 'Hello, world!' );
		} );

		it( 'syncs content with RenderedText format', () => {
			const changes = {
				content: {
					raw: '<!-- wp:paragraph --><p>Hello</p><!-- /wp:paragraph -->',
					rendered: '<p>Hello</p>',
				},
			} as PostChanges;

			applyPostChangesToCRDTDoc( doc, changes, defaultSyncedProperties );

			const content = map.get( 'content' );
			expect( content ).toBeInstanceOf( Y.Text );
			expect( content?.toString() ).toBe(
				'<!-- wp:paragraph --><p>Hello</p><!-- /wp:paragraph -->'
			);
		} );

		it( 'updates existing Y.Text title in place via mergeRichTextUpdate', () => {
			// First apply to create the Y.Text.
			applyPostChangesToCRDTDoc(
				doc,
				{ title: 'Old Title' } as PostChanges,
				defaultSyncedProperties
			);
			const titleRef = map.get( 'title' );

			// Apply again — should update in place, not replace.
			applyPostChangesToCRDTDoc(
				doc,
				{ title: 'New Title' } as PostChanges,
				defaultSyncedProperties
			);

			expect( map.get( 'title' ) ).toBe( titleRef );
			expect( map.get( 'title' )?.toString() ).toBe( 'New Title' );
		} );

		it( 'updates existing Y.Text content in place via mergeRichTextUpdate', () => {
			// First apply to create the Y.Text.
			applyPostChangesToCRDTDoc(
				doc,
				{ content: 'Old content' } as PostChanges,
				defaultSyncedProperties
			);
			const contentRef = map.get( 'content' );

			// Apply again — should update in place, not replace.
			applyPostChangesToCRDTDoc(
				doc,
				{ content: 'New content' } as PostChanges,
				defaultSyncedProperties
			);

			expect( map.get( 'content' ) ).toBe( contentRef );
			expect( map.get( 'content' )?.toString() ).toBe( 'New content' );
		} );

		it( 'updates existing Y.Text excerpt in place via mergeRichTextUpdate', () => {
			// First apply to create the Y.Text.
			applyPostChangesToCRDTDoc(
				doc,
				{ excerpt: 'Old excerpt' } as PostChanges,
				defaultSyncedProperties
			);
			const excerptRef = map.get( 'excerpt' );

			// Apply again — should update in place, not replace.
			applyPostChangesToCRDTDoc(
				doc,
				{ excerpt: 'New excerpt' } as PostChanges,
				defaultSyncedProperties
			);

			expect( map.get( 'excerpt' ) ).toBe( excerptRef );
			expect( map.get( 'excerpt' )?.toString() ).toBe( 'New excerpt' );
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

			applyPostChangesToCRDTDoc( doc, changes, defaultSyncedProperties );

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

			applyPostChangesToCRDTDoc( doc, changes, defaultSyncedProperties );

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

			applyPostChangesToCRDTDoc( doc, changes, defaultSyncedProperties );

			const metaMap = map.get( 'meta' );
			expect( metaMap ).toBeInstanceOf( Y.Map );
			expect( metaMap?.get( 'custom_field' ) ).toBe( 'value' );
		} );

		it( 'skips function-valued content in changes', () => {
			const changes = {
				content: ( {
					blocks: blocksForSerialization = [],
				}: {
					blocks: Block[];
				} ) =>
					blocksForSerialization
						.map( ( b ) => b.attributes.content )
						.join( '' ),
			} as unknown as PostChanges;

			applyPostChangesToCRDTDoc( doc, changes, defaultSyncedProperties );

			expect( map.has( 'content' ) ).toBe( false );
		} );

		it( 'syncs taxonomy rest_base values included in syncedProperties', () => {
			const changes = {
				categories: [ 1, 2, 3 ],
				genre: [ 10, 20 ], // should be ignored
				tags: [ 4, 5 ],
			} as unknown as PostChanges;

			applyPostChangesToCRDTDoc( doc, changes, defaultSyncedProperties );

			expect( map.get( 'categories' ) ).toEqual( [ 1, 2, 3 ] );
			expect( map.get( 'genre' ) ).toBeUndefined();
			expect( map.get( 'tags' ) ).toEqual( [ 4, 5 ] );

			const customSyncedProperties = new Set( [
				...defaultSyncedProperties,
				'genre', // now included
			] );

			applyPostChangesToCRDTDoc( doc, changes, customSyncedProperties );

			expect( map.get( 'categories' ) ).toEqual( [ 1, 2, 3 ] );
			expect( map.get( 'genre' ) ).toEqual( [ 10, 20 ] );
			expect( map.get( 'tags' ) ).toEqual( [ 4, 5 ] );
		} );
	} );

	describe( 'getPostChangesFromCRDTDoc', () => {
		let map: YMapWrap< YPostRecord >;

		beforeEach( () => {
			map = getRootMap< YPostRecord >( doc, CRDT_RECORD_MAP_KEY );
			map.set( 'title', new Y.Text( 'CRDT Title' ) );
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
				defaultSyncedProperties
			);

			expect( changes.title ).toBe( 'CRDT Title' );
		} );

		it( 'filters out disallowed properties', () => {
			map.set( 'title', new Y.Text( 'Test title' ) );
			map.set( 'unsyncedProp', 'value' );

			const editedRecord = {} as Post;

			const changes = getPostChangesFromCRDTDoc(
				doc,
				editedRecord,
				defaultSyncedProperties
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
				defaultSyncedProperties
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
				defaultSyncedProperties
			);

			expect( changesWithEmptyDate ).not.toHaveProperty( 'date' );

			map.set( 'date', '2025-01-02' );

			const changesWithDefinedDate = getPostChangesFromCRDTDoc(
				doc,
				editedRecord,
				defaultSyncedProperties
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
				defaultSyncedProperties
			);

			expect( changesWithEmptyDate ).not.toHaveProperty( 'date' );

			map.set( 'date', '2025-01-02' );

			const changesWithDefinedDate = getPostChangesFromCRDTDoc(
				doc,
				editedRecord,
				defaultSyncedProperties
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
				defaultSyncedProperties
			);

			expect( changes ).toHaveProperty( 'blocks' );
		} );

		it( 'returns rich-text block attributes as RichTextData, not strings', () => {
			// Simulate User A writing a paragraph block into the CRDT doc.
			addBlockToDoc( map, 'block-1', 'Hello world' );

			// Simulate User B reading the CRDT doc with no local blocks.
			const editedRecord = { blocks: [] } as unknown as Post;

			const changes = getPostChangesFromCRDTDoc(
				doc,
				editedRecord,
				defaultSyncedProperties
			);

			const block = ( changes.blocks as any[] )?.[ 0 ];
			expect( block ).toBeDefined();
			expect( block.attributes.content ).toBeInstanceOf( RichTextData );
			expect( block.attributes.content.text ).toBe( 'Hello world' );
		} );

		it( 'returns nested rich-text in array attributes as RichTextData', () => {
			// Add a table block to the CRDT doc with nested cell content
			// stored as plain strings.
			let blocks = map.get( 'blocks' );
			if ( ! ( blocks instanceof Y.Array ) ) {
				blocks = new Y.Array< YBlock >();
				map.set( 'blocks', blocks );
			}

			const tableBlock = createYMap< YBlockRecord >();
			tableBlock.set( 'name', 'core/table' );
			tableBlock.set( 'clientId', 'table-1' );
			const attrs = new Y.Map();
			attrs.set( 'body', [
				{
					cells: [
						{ content: '<strong>Cell</strong>', tag: 'td' },
						{ content: 'Plain', tag: 'td' },
					],
				},
			] );
			tableBlock.set( 'attributes', attrs );
			tableBlock.set( 'innerBlocks', new Y.Array() );
			( blocks as YBlocks ).push( [ tableBlock ] );

			const editedRecord = { blocks: [] } as unknown as Post;

			const changes = getPostChangesFromCRDTDoc(
				doc,
				editedRecord,
				defaultSyncedProperties
			);

			const block = ( changes.blocks as any[] )?.[ 0 ];
			expect( block ).toBeDefined();

			const cell = block.attributes.body[ 0 ].cells[ 0 ];
			expect( cell.content ).toBeInstanceOf( RichTextData );
			expect( ( cell.content as RichTextData ).toHTMLString() ).toBe(
				'<strong>Cell</strong>'
			);
		} );

		it( 'includes undefined blocks in changes', () => {
			map.set( 'blocks', undefined );

			const editedRecord = {
				blocks: [
					{
						name: 'core/paragraph',
						attributes: { content: 'Test' },
						innerBlocks: [],
					},
				],
			} as unknown as Post;

			const changes = getPostChangesFromCRDTDoc(
				doc,
				editedRecord,
				defaultSyncedProperties
			);

			expect( changes ).toHaveProperty( 'blocks' );
			expect( changes.blocks ).toBeUndefined();
		} );

		it( 'detects content changes from string value', () => {
			map.set( 'content', new Y.Text( 'New content' ) );

			const editedRecord = {
				content: 'Old content',
			} as unknown as Post;

			const changes = getPostChangesFromCRDTDoc(
				doc,
				editedRecord,
				defaultSyncedProperties
			);

			expect( changes.content ).toBe( 'New content' );
		} );

		it( 'detects content changes from RenderedText value', () => {
			map.set( 'content', new Y.Text( 'New content' ) );

			const editedRecord = {
				content: { raw: 'Old content', rendered: 'Old content' },
			} as unknown as Post;

			const changes = getPostChangesFromCRDTDoc(
				doc,
				editedRecord,
				defaultSyncedProperties
			);

			expect( changes.content ).toBe( 'New content' );
		} );

		it( 'excludes content when unchanged from RenderedText value', () => {
			map.set( 'content', new Y.Text( 'Same content' ) );

			const editedRecord = {
				content: { raw: 'Same content', rendered: 'Same content' },
			} as unknown as Post;

			const changes = getPostChangesFromCRDTDoc(
				doc,
				editedRecord,
				defaultSyncedProperties
			);

			expect( changes ).not.toHaveProperty( 'content' );
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
				defaultSyncedProperties
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
				defaultSyncedProperties
			);

			expect( changes.meta ).toEqual( {
				public_meta: [ 'value', 'value 2' ], // from CRDT
			} );
		} );

		it( 'excludes orphaned meta keys not present on the edited record', () => {
			// If post meta is registered, saved (landing in a CRDT doc),
			// then unregistered, it can permanently mark the record dirty.
			// Orphaned values should not show up as a change.
			const metaMap = createYMap();
			metaMap.set( 'registered_meta', 'value' );
			metaMap.set( 'orphaned_meta', 'stale value' );
			map.set( 'meta', metaMap );

			const editedRecord = {
				meta: {
					registered_meta: 'value',
				},
			} as unknown as Post;

			const changes = getPostChangesFromCRDTDoc(
				doc,
				editedRecord,
				defaultSyncedProperties
			);

			expect( changes ).not.toHaveProperty( 'meta' );
		} );

		it( 'excludes disallowed meta keys in changes', () => {
			const metaMap = createYMap();
			metaMap.set( 'public_meta', 'new value' );
			metaMap.set( POST_META_KEY_FOR_CRDT_DOC_PERSISTENCE, 'exclude me' );
			map.set( 'meta', metaMap );

			const editedRecord = {
				meta: {
					public_meta: 'old value',
				},
			} as unknown as Post;

			const changes = getPostChangesFromCRDTDoc(
				doc,
				editedRecord,
				defaultSyncedProperties
			);

			expect( changes.meta ).toEqual( {
				public_meta: 'new value', // from CRDT
			} );
			expect( changes.meta ).not.toHaveProperty(
				POST_META_KEY_FOR_CRDT_DOC_PERSISTENCE
			);
		} );

		it( 'returns taxonomy rest_base changes when in syncedProperties', () => {
			map.set( 'categories', [ 1, 2 ] );
			map.set( 'genre', [ 10, 20 ] );
			map.set( 'tags', [ 3 ] );

			const editedRecord = {
				categories: [ 1 ],
				genre: [ 10 ], // should be ignored
				tags: [],
			} as unknown as Post;

			const changes = getPostChangesFromCRDTDoc(
				doc,
				editedRecord,
				defaultSyncedProperties
			) as Record< string, unknown >;

			expect( changes.categories ).toEqual( [ 1, 2 ] );
			expect( changes.genre ).toBeUndefined();
			expect( changes.tags ).toEqual( [ 3 ] );

			const customSyncedProperties = new Set( [
				...defaultSyncedProperties,
				'genre', // now included
			] );

			const changes2 = getPostChangesFromCRDTDoc(
				doc,
				editedRecord,
				customSyncedProperties
			) as Record< string, unknown >;

			expect( changes2.categories ).toEqual( [ 1, 2 ] );
			expect( changes2.genre ).toEqual( [ 10, 20 ] );
			expect( changes2.tags ).toEqual( [ 3 ] );
		} );

		describe( 'selection recalculation', () => {
			it( 'includes recalculated selection when text is inserted before cursor', () => {
				const ytext = addBlockToDoc( map, 'block-1', 'Hello world' );

				// Record a selection at offset 5 (cursor between "Hello" and " world").
				updateSelectionHistory( doc, {
					selectionStart: {
						clientId: 'block-1',
						attributeKey: 'content',
						offset: 5,
					},
					selectionEnd: {
						clientId: 'block-1',
						attributeKey: 'content',
						offset: 5,
					},
				} );

				// Simulate remote insertion: insert "XXX" at position 0.
				ytext.insert( 0, 'XXX' );

				const editedRecord = {
					title: 'CRDT Title',
					status: 'draft',
					blocks: [],
				} as unknown as Post;

				const changes = getPostChangesFromCRDTDoc(
					doc,
					editedRecord,
					defaultSyncedProperties
				);

				expect( changes.selection ).toBeDefined();
				expect( changes.selection?.selectionStart.offset ).toBe( 8 ); // 5 + 3
				expect( changes.selection?.selectionStart.clientId ).toBe(
					'block-1'
				);
				expect( changes.selection?.selectionStart.attributeKey ).toBe(
					'content'
				);
				expect( changes.selection?.selectionEnd.offset ).toBe( 8 );
			} );

			it( 'includes recalculated selection when text is deleted before cursor', () => {
				const ytext = addBlockToDoc( map, 'block-1', 'Hello world' );

				// Record a selection at offset 8 (cursor between "Hello wo" and "rld").
				updateSelectionHistory( doc, {
					selectionStart: {
						clientId: 'block-1',
						attributeKey: 'content',
						offset: 8,
					},
					selectionEnd: {
						clientId: 'block-1',
						attributeKey: 'content',
						offset: 8,
					},
				} );

				// Simulate remote deletion: delete "Hello" (5 chars at position 0).
				ytext.delete( 0, 5 );

				const editedRecord = {
					title: 'CRDT Title',
					status: 'draft',
					blocks: [],
				} as unknown as Post;

				const changes = getPostChangesFromCRDTDoc(
					doc,
					editedRecord,
					defaultSyncedProperties
				);

				expect( changes.selection ).toBeDefined();
				expect( changes.selection?.selectionStart.offset ).toBe( 3 ); // 8 - 5
			} );

			it( 'does not include selection when selection history is empty', () => {
				addBlockToDoc( map, 'block-1', 'Hello world' );

				const editedRecord = {
					title: 'CRDT Title',
					status: 'draft',
					blocks: [],
				} as unknown as Post;

				const changes = getPostChangesFromCRDTDoc(
					doc,
					editedRecord,
					defaultSyncedProperties
				);

				expect( changes.selection ).toBeUndefined();
			} );
		} );

		it( 'injects a closure-based content function when blocks changed but content did not', () => {
			addBlockToDoc( map, 'block-1', 'Hello world' );

			const editedRecord = {
				title: 'CRDT Title',
				status: 'draft',
				content: { raw: 'Same content', rendered: 'Same content' },
				blocks: [],
			} as unknown as Post;

			const changes = getPostChangesFromCRDTDoc(
				doc,
				editedRecord,
				defaultSyncedProperties
			);

			// Blocks changed, content didn't, so a lazy content function is injected.
			expect( changes.blocks ).toBeDefined();
			expect( typeof changes.content ).toBe( 'function' );
		} );

		it( 'injected content function captures the synced blocks and ignores its caller-supplied argument', () => {
			addBlockToDoc( map, 'block-1', 'Hello world' );

			const editedRecord = {
				title: 'CRDT Title',
				status: 'draft',
				content: { raw: 'Same content', rendered: 'Same content' },
				blocks: [],
			} as unknown as Post;

			const changes = getPostChangesFromCRDTDoc(
				doc,
				editedRecord,
				defaultSyncedProperties
			);

			// The injected function takes no parameters and serializes the
			// captured (synced) blocks. This is what makes getEditedPostContent
			// keep working after the Code Editor clears `record.blocks` to force
			// a re-parse: the closure already has the right blocks on hand.
			//
			// The mocked __unstableSerializeAndClean returns "serialized:<n>"
			// where n is the length of the blocks it was called with. The
			// captured blocks have one entry, so both calls below should yield
			// "serialized:1" (proving the closure ignores its argument and
			// uses the captured blocks instead).
			const contentFn = changes.content as ( args?: {
				blocks: Block[];
			} ) => string;
			expect( contentFn() ).toBe( 'serialized:1' );
			expect( contentFn( { blocks: [] } ) ).toBe( 'serialized:1' );
		} );

		it( 'does not inject a content function when content also changed in the doc', () => {
			addBlockToDoc( map, 'block-1', 'Hello world' );
			map.set( 'content', new Y.Text( 'New content' ) );

			const editedRecord = {
				title: 'CRDT Title',
				status: 'draft',
				content: { raw: 'Old content', rendered: 'Old content' },
				blocks: [],
			} as unknown as Post;

			const changes = getPostChangesFromCRDTDoc(
				doc,
				editedRecord,
				defaultSyncedProperties
			);

			// Content changed directly, so it should be a string, not a function.
			expect( changes.blocks ).toBeDefined();
			expect( typeof changes.content ).toBe( 'string' );
			expect( changes.content ).toBe( 'New content' );
		} );

		it( 'does not inject a content function when blocks did not change', () => {
			map.set( 'content', new Y.Text( 'Same content' ) );

			const editedRecord = {
				title: 'CRDT Title',
				status: 'draft',
				content: { raw: 'Same content', rendered: 'Same content' },
			} as unknown as Post;

			const changes = getPostChangesFromCRDTDoc(
				doc,
				editedRecord,
				defaultSyncedProperties
			);

			expect( changes.blocks ).toBeUndefined();
			expect( changes.content ).toBeUndefined();
		} );
	} );
} );

/**
 * Helper to create a block with a Y.Text content attribute
 * in the CRDT document.
 *
 * @param map
 * @param clientId Block client ID.
 * @param content  Initial text content.
 * @param name     Block name (default: 'core/paragraph').
 */
function addBlockToDoc(
	map: YMapWrap< YPostRecord >,
	clientId: string,
	content: string,
	name = 'core/paragraph'
): Y.Text {
	let blocks = map.get( 'blocks' );
	if ( ! ( blocks instanceof Y.Array ) ) {
		blocks = new Y.Array< YBlock >();
		map.set( 'blocks', blocks );
	}

	const block = createYMap< YBlockRecord >();
	block.set( 'name', name );
	block.set( 'clientId', clientId );
	const attrs = new Y.Map();
	const ytext = new Y.Text( content );
	attrs.set( 'content', ytext );
	block.set( 'attributes', attrs );
	block.set( 'innerBlocks', new Y.Array() );
	( blocks as YBlocks ).push( [ block ] );

	return ytext;
}
