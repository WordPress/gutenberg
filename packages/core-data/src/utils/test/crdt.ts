/**
 * WordPress dependencies
 */
import { Y } from '@wordpress/sync';
import type { Block as WPBlock } from '@wordpress/blocks';

/**
 * External dependencies
 */
import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	jest,
} from '@jest/globals';

/**
 * Mock getBlockTypes so CRDT merging can identify rich-text attributes.
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
				name: 'core/heading',
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
	};
} );

jest.mock( '@wordpress/block-editor', () => ( {
	store: { name: 'core/block-editor' },
} ) );

const {
	__unstableSerializeAndClean,
	getBlockType,
	parse,
	registerBlockType,
	unregisterBlockType,
} = jest.requireActual(
	'@wordpress/blocks'
) as typeof import('@wordpress/blocks');

import { createElement, RawHTML } from '@wordpress/element';
import { RichTextData } from '@wordpress/rich-text';

/**
 * Internal dependencies
 */
import { CRDT_DOC_META_PERSISTENCE_KEY, CRDT_RECORD_MAP_KEY } from '../../sync';
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

type ConsoleMatcherExpect = ( actual: Console ) => {
	toHaveErrored: () => void;
	toHaveWarned: () => void;
};

const expectConsole = expect as unknown as ConsoleMatcherExpect;

function serializeBlocksForTest( blocks: Block[] | WPBlock[] ): string {
	return __unstableSerializeAndClean( blocks as unknown as WPBlock[] ).trim();
}

function renderRichTextValue( value?: string | RichTextData ): string {
	return typeof value === 'string' ? value : value?.toHTMLString() ?? '';
}

function registerEntityReferenceBlocks() {
	registerBlockType( 'core/paragraph', {
		apiVersion: 3,
		category: 'text',
		title: 'Paragraph',
		attributes: {
			content: {
				type: 'rich-text',
				source: 'rich-text',
				selector: 'p',
			},
		},
		save: ( {
			attributes,
		}: {
			attributes: { content?: string | RichTextData };
		} ) =>
			createElement(
				'p',
				null,
				createElement(
					RawHTML,
					null,
					renderRichTextValue( attributes.content )
				)
			),
	} );

	registerBlockType( 'core/heading', {
		apiVersion: 3,
		category: 'text',
		title: 'Heading',
		attributes: {
			content: {
				type: 'rich-text',
				source: 'rich-text',
				selector: 'h1,h2,h3,h4,h5,h6',
			},
			level: {
				type: 'number',
				default: 2,
			},
		},
		save: ( {
			attributes,
		}: {
			attributes: { content?: string | RichTextData; level?: number };
		} ) =>
			createElement(
				`h${ attributes.level ?? 2 }`,
				null,
				createElement(
					RawHTML,
					null,
					renderRichTextValue( attributes.content )
				)
			),
	} );
}

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
		doc = new Y.Doc( { meta: new Map() } );
		jest.clearAllMocks();
	} );

	afterEach( () => {
		doc.destroy();
		for ( const blockName of [ 'core/paragraph', 'core/heading' ] ) {
			if ( getBlockType( blockName ) ) {
				unregisterBlockType( blockName );
			}
		}
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

		it( 'rebases local block insertions when the CRDT has remote changes since the last local snapshot', () => {
			const initialBlocks = [
				{
					name: 'core/paragraph',
					clientId: 'existing-client-id',
					attributes: { content: 'Initial content' },
					innerBlocks: [],
				},
			];
			applyPostChangesToCRDTDoc(
				doc,
				{ blocks: initialBlocks },
				defaultSyncedProperties
			);

			const yblocks = map.get( 'blocks' ) as YBlocks;
			const attributes = yblocks
				.get( 0 )
				.get( 'attributes' ) as Y.Map< unknown >;
			const content = attributes.get( 'content' ) as Y.Text;
			content.delete( 0, content.length );
			content.insert( 0, 'Remote content' );

			applyPostChangesToCRDTDoc(
				doc,
				{
					blocks: [
						{
							...initialBlocks[ 0 ],
							attributes: { content: 'Remote content' },
						},
						{
							name: 'core/paragraph',
							clientId: 'inserted-client-id',
							attributes: {
								content: 'rtc-save-paragraph-marker',
							},
							innerBlocks: [],
						},
					],
				},
				defaultSyncedProperties
			);

			expect( yblocks.toJSON() ).toEqual( [
				{
					...initialBlocks[ 0 ],
					attributes: { content: 'Remote content' },
				},
				{
					name: 'core/paragraph',
					clientId: 'inserted-client-id',
					attributes: {
						content: 'rtc-save-paragraph-marker',
					},
					innerBlocks: [],
				},
			] );
		} );

		it( 'rebases local block deletions when the CRDT has remote changes since the last local snapshot', () => {
			const initialBlocks = [
				{
					name: 'core/paragraph',
					clientId: 'existing-client-id',
					attributes: { content: 'Initial content' },
					innerBlocks: [],
				},
				{
					name: 'core/paragraph',
					clientId: 'deleted-client-id',
					attributes: {
						content: 'rtc-save-paragraph-marker',
					},
					innerBlocks: [],
				},
			];
			applyPostChangesToCRDTDoc(
				doc,
				{ blocks: initialBlocks },
				defaultSyncedProperties
			);

			const yblocks = map.get( 'blocks' ) as YBlocks;
			const attributes = yblocks
				.get( 0 )
				.get( 'attributes' ) as Y.Map< unknown >;
			const content = attributes.get( 'content' ) as Y.Text;
			content.delete( 0, content.length );
			content.insert( 0, 'Remote content' );

			applyPostChangesToCRDTDoc(
				doc,
				{
					blocks: [
						{
							...initialBlocks[ 0 ],
							attributes: { content: 'Remote content' },
						},
					],
				},
				defaultSyncedProperties
			);

			expect( yblocks.toJSON() ).toEqual( [
				{
					...initialBlocks[ 0 ],
					attributes: { content: 'Remote content' },
				},
			] );
		} );

		it( 'converges duplicate table row edit/delete through the post changes wrapper', () => {
			const docB = new Y.Doc();

			try {
				applyPostChangesToCRDTDoc(
					doc,
					{
						blocks: [
							createTableBlock( [ 'anchor', 'same', 'same' ] ),
						],
					},
					defaultSyncedProperties
				);
				Y.applyUpdate( docB, Y.encodeStateAsUpdate( doc ) );

				const stateVectorA = Y.encodeStateVector( doc );
				const stateVectorB = Y.encodeStateVector( docB );
				const runtimeBlocksA = getRuntimeBlocksFromDoc( doc );
				const runtimeBlocksB = getRuntimeBlocksFromDoc( docB );

				getRuntimeTableBody( runtimeBlocksA )[ 2 ].cells[ 0 ].content =
					'edited-second-duplicate';
				getRuntimeTableBody( runtimeBlocksB ).splice( 1, 1 );

				applyPostChangesToCRDTDoc(
					doc,
					{ blocks: runtimeBlocksA },
					defaultSyncedProperties
				);
				applyPostChangesToCRDTDoc(
					docB,
					{ blocks: runtimeBlocksB },
					defaultSyncedProperties
				);

				const updateA = Y.encodeStateAsUpdate( doc, stateVectorB );
				const updateB = Y.encodeStateAsUpdate( docB, stateVectorA );
				Y.applyUpdate( doc, updateB );
				Y.applyUpdate( docB, updateA );

				expect( getTableBodyCellContentsFromDoc( doc ) ).toEqual( [
					'anchor',
					'edited-second-duplicate',
				] );
				expect( getTableBodyCellContentsFromDoc( docB ) ).toEqual( [
					'anchor',
					'edited-second-duplicate',
				] );
			} finally {
				docB.destroy();
			}
		} );

		it( 'initializes blocks as Y.Array when not present', () => {
			const changes = {
				blocks: [],
			};

			applyPostChangesToCRDTDoc( doc, changes, defaultSyncedProperties );

			const blocks = map.get( 'blocks' );
			expect( blocks ).toBeInstanceOf( Y.Array );
		} );

		it( 'sets blocks to undefined when blocks value is undefined', () => {
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

		it( 'clears stale content text when syncing block changes', () => {
			applyPostChangesToCRDTDoc(
				doc,
				{ content: 'Stale content' } as PostChanges,
				defaultSyncedProperties
			);

			applyPostChangesToCRDTDoc(
				doc,
				{
					blocks: parse(
						[
							'<!-- wp:paragraph -->',
							'<p>Block content</p>',
							'<!-- /wp:paragraph -->',
						].join( '\n' )
					),
				} as PostChanges,
				defaultSyncedProperties
			);

			expect( map.get( 'content' )?.toString() ?? '' ).toBe( '' );
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

		it( 'does not invalidate persisted blocks when only entity-normalized originalContent differs from generated content', () => {
			registerBlockType( 'core/paragraph', {
				apiVersion: 3,
				category: 'text',
				title: 'Paragraph',
				attributes: {
					content: {
						type: 'rich-text',
						source: 'rich-text',
						selector: 'p',
					},
				},
				save: ( {
					attributes,
				}: {
					attributes: { content?: string | RichTextData };
				} ) =>
					createElement(
						'p',
						null,
						createElement(
							RawHTML,
							null,
							renderRichTextValue( attributes.content )
						)
					),
			} );

			const originalContent = [
				'<!-- wp:paragraph -->',
				'<p>Entity refs: &notin; / &notin text, nbsp &nbsp gap, quote &quot;value&quot;, apos &apos;value&apos;, lt &lt and gt &gt.</p>',
				'<!-- /wp:paragraph -->',
			].join( '\n' );
			const blocks = parse( originalContent );
			const generatedBlocks = blocks.map( ( block ) => {
				const generatedBlock = { ...block, isValid: true };
				delete generatedBlock.__unstableBlockSource;
				delete generatedBlock.originalContent;
				delete generatedBlock.validationIssues;
				return generatedBlock;
			} );
			const persistedContent =
				__unstableSerializeAndClean( generatedBlocks ).trim();

			expect( __unstableSerializeAndClean( blocks ).trim() ).not.toBe(
				persistedContent
			);
			expectConsole( console ).toHaveWarned();
			expectConsole( console ).toHaveErrored();

			applyPostChangesToCRDTDoc(
				doc,
				{ blocks } as PostChanges,
				defaultSyncedProperties
			);
			doc.meta?.set( CRDT_DOC_META_PERSISTENCE_KEY, true );

			const changes = getPostChangesFromCRDTDoc(
				doc,
				{
					content: {
						raw: persistedContent,
						rendered: persistedContent,
					},
				} as unknown as Post,
				defaultSyncedProperties
			);

			expect( changes ).not.toHaveProperty( 'blocks' );
		} );

		it( 'invalidates persisted blocks when generated content differs from persisted content', () => {
			registerBlockType( 'core/paragraph', {
				apiVersion: 3,
				category: 'text',
				title: 'Paragraph',
				attributes: {
					content: {
						type: 'rich-text',
						source: 'rich-text',
						selector: 'p',
					},
				},
				save: ( {
					attributes,
				}: {
					attributes: { content?: string | RichTextData };
				} ) =>
					createElement(
						'p',
						null,
						createElement(
							RawHTML,
							null,
							renderRichTextValue( attributes.content )
						)
					),
			} );

			const originalContent = [
				'<!-- wp:paragraph -->',
				'<p>Entity refs: &notin; / &notin text, nbsp &nbsp gap.</p>',
				'<!-- /wp:paragraph -->',
			].join( '\n' );
			const blocks = parse( originalContent );

			expectConsole( console ).toHaveWarned();
			expectConsole( console ).toHaveErrored();

			applyPostChangesToCRDTDoc(
				doc,
				{ blocks } as PostChanges,
				defaultSyncedProperties
			);
			doc.meta?.set( CRDT_DOC_META_PERSISTENCE_KEY, true );

			const changes = getPostChangesFromCRDTDoc(
				doc,
				{
					content: {
						raw: [
							'<!-- wp:paragraph -->',
							'<p>Changed server content.</p>',
							'<!-- /wp:paragraph -->',
						].join( '\n' ),
					},
				} as unknown as Post,
				defaultSyncedProperties
			);

			expect( changes ).toHaveProperty( 'blocks' );
		} );

		it( 'hydrates stale transient blocks when persisted content already matches the CRDT blocks', () => {
			registerBlockType( 'core/paragraph', {
				apiVersion: 3,
				category: 'text',
				title: 'Paragraph',
				attributes: {
					content: {
						type: 'rich-text',
						source: 'rich-text',
						selector: 'p',
					},
				},
				save: ( {
					attributes,
				}: {
					attributes: { content?: string | RichTextData };
				} ) =>
					createElement(
						'p',
						null,
						createElement(
							RawHTML,
							null,
							renderRichTextValue( attributes.content )
						)
					),
			} );

			const staleContent = [
				'<!-- wp:paragraph -->',
				'<p>Old editor blocks.</p>',
				'<!-- /wp:paragraph -->',
			].join( '\n' );
			const persistedContent = [
				'<!-- wp:paragraph -->',
				'<p>Saved marker from persisted CRDT.</p>',
				'<!-- /wp:paragraph -->',
			].join( '\n' );

			applyPostChangesToCRDTDoc(
				doc,
				{ blocks: parse( persistedContent ) } as PostChanges,
				defaultSyncedProperties
			);
			doc.meta?.set( CRDT_DOC_META_PERSISTENCE_KEY, true );

			const changes = getPostChangesFromCRDTDoc(
				doc,
				{
					blocks: parse( staleContent ),
					content: {
						raw: persistedContent,
						rendered: persistedContent,
					},
				} as unknown as Post,
				defaultSyncedProperties
			);

			expect( changes ).toHaveProperty( 'blocks' );
			expect(
				__unstableSerializeAndClean(
					changes.blocks as unknown as WPBlock[]
				).trim()
			).toBe( persistedContent );
		} );

		it( 'does not invalidate persisted blocks for equivalent entity references and link attribute order', () => {
			registerEntityReferenceBlocks();

			const staleBlocks: WPBlock[] = [
				{
					name: 'core/paragraph',
					clientId: 'paragraph-1',
					attributes: {
						content:
							'D29 escaped <a href="https://example.test/search?q=alpha&#38;beta=2" title="A&amp;B">&lt;em&gt;paragraph&lt;/em&gt;</a> and &notin text.',
					},
					innerBlocks: [],
					isValid: false,
					originalContent:
						'<p>D29 escaped <a href="https://example.test/search?q=alpha&#38;beta=2" title="A&amp;B">&lt;em&gt;paragraph&lt;/em&gt;</a> and &notin text.</p>',
				},
				{
					name: 'core/heading',
					clientId: 'heading-1',
					attributes: {
						content:
							'D29 heading <a href="https://example.test/ref?one=1&#38;two=2" title="H&amp;B">&lt;em&gt;title&lt;/em&gt;</a>.',
						level: 2,
					},
					innerBlocks: [],
					isValid: false,
					originalContent:
						'<h2>D29 heading <a href="https://example.test/ref?one=1&#38;two=2" title="H&amp;B">&lt;em&gt;title&lt;/em&gt;</a>.</h2>',
				},
			];
			const generatedBlocks = staleBlocks.map( ( block ) => {
				const {
					__unstableBlockSource,
					originalContent,
					validationIssues,
					...generatedBlock
				} = block;
				void __unstableBlockSource;
				void originalContent;
				void validationIssues;
				return {
					...generatedBlock,
					innerBlocks: generatedBlock.innerBlocks as Block[],
					isValid: true,
				};
			} );
			const persistedContent = [
				'<!-- wp:paragraph -->',
				'<p>D29 escaped <a title="A&amp;B" href="https://example.test/search?q=alpha&amp;beta=2">&lt;em>paragraph&lt;/em></a> and &not;in text.</p>',
				'<!-- /wp:paragraph -->',
				'',
				'<!-- wp:heading -->',
				'<h2>D29 heading <a title="H&amp;B" href="https://example.test/ref?one=1&amp;two=2">&lt;em>title&lt;/em></a>.</h2>',
				'<!-- /wp:heading -->',
			].join( '\n' );

			expect( serializeBlocksForTest( staleBlocks ) ).not.toBe(
				persistedContent
			);
			expect( serializeBlocksForTest( generatedBlocks ) ).not.toBe(
				persistedContent
			);

			applyPostChangesToCRDTDoc(
				doc,
				{
					blocks: staleBlocks,
					content: persistedContent,
				} as unknown as PostChanges,
				defaultSyncedProperties
			);
			doc.meta?.set( CRDT_DOC_META_PERSISTENCE_KEY, true );

			const changes = getPostChangesFromCRDTDoc(
				doc,
				{
					content: {
						raw: persistedContent,
						rendered: persistedContent,
					},
				} as unknown as Post,
				defaultSyncedProperties
			);

			expect( changes ).not.toHaveProperty( 'blocks' );
		} );

		it( 'invalidates persisted entity blocks when the generated content really changed', () => {
			registerEntityReferenceBlocks();

			const staleBlocks = [
				{
					name: 'core/paragraph',
					clientId: 'paragraph-1',
					attributes: {
						content:
							'D29 escaped <a href="https://example.test/search?q=alpha&#38;beta=2" title="A&amp;B">&lt;em&gt;paragraph&lt;/em&gt;</a> and &notin text.',
					},
					innerBlocks: [],
					isValid: false,
					originalContent:
						'<p>D29 escaped <a href="https://example.test/search?q=alpha&#38;beta=2" title="A&amp;B">&lt;em&gt;paragraph&lt;/em&gt;</a> and &notin text.</p>',
				},
			];

			applyPostChangesToCRDTDoc(
				doc,
				{ blocks: staleBlocks } as unknown as PostChanges,
				defaultSyncedProperties
			);
			doc.meta?.set( CRDT_DOC_META_PERSISTENCE_KEY, true );

			const changes = getPostChangesFromCRDTDoc(
				doc,
				{
					content: {
						raw: [
							'<!-- wp:paragraph -->',
							'<p>Changed server content.</p>',
							'<!-- /wp:paragraph -->',
						].join( '\n' ),
					},
				} as unknown as Post,
				defaultSyncedProperties
			);

			expect( changes ).toHaveProperty( 'blocks' );
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

		it( 'ignores stale content text when persisted block data matches the edited record', () => {
			const parsedBlocks = parse(
				[
					'<!-- wp:paragraph -->',
					'<p>Block content</p>',
					'<!-- /wp:paragraph -->',
				].join( '\n' )
			);
			const persistedContent = serializeBlocksForTest( parsedBlocks );

			applyPostChangesToCRDTDoc(
				doc,
				{ blocks: parsedBlocks } as PostChanges,
				defaultSyncedProperties
			);
			map.set( 'content', new Y.Text( 'Stale content' ) );
			doc.meta?.set( CRDT_DOC_META_PERSISTENCE_KEY, true );

			const changes = getPostChangesFromCRDTDoc(
				doc,
				{
					content: {
						raw: persistedContent,
						rendered: persistedContent,
					},
				} as unknown as Post,
				defaultSyncedProperties
			);

			expect( changes ).not.toHaveProperty( 'blocks' );
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

function createTableBlock( values: string[] ): Block {
	return {
		name: 'core/table',
		clientId: 'table',
		attributes: {
			body: values.map( ( value ) => ( {
				cells: [
					{
						content: value,
						tag: 'td',
					},
				],
			} ) ),
		},
		innerBlocks: [],
	};
}

function getRuntimeBlocksFromDoc( ydoc: Y.Doc ): Block[] {
	return getPostChangesFromCRDTDoc(
		ydoc,
		{ blocks: [] } as unknown as Post,
		defaultSyncedProperties
	).blocks as Block[];
}

function getRuntimeTableBody( blocks: Block[] ) {
	return blocks[ 0 ].attributes.body as Array< {
		cells: Array< Record< string, unknown > >;
	} >;
}

function getCellContentText( content: unknown ) {
	return typeof content === 'object' && content && 'valueOf' in content
		? String( content.valueOf() )
		: content;
}

function getTableBodyCellContentsFromDoc( ydoc: Y.Doc ) {
	return getRuntimeTableBody( getRuntimeBlocksFromDoc( ydoc ) ).map(
		( row ) => getCellContentText( row.cells[ 0 ].content )
	);
}
