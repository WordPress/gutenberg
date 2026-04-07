/**
 * WordPress dependencies
 */
import { Y } from '@wordpress/sync';

/**
 * External dependencies
 */
import {
	describe,
	expect,
	it,
	jest,
	beforeEach,
	afterEach,
} from '@jest/globals';

/**
 * Mock uuid module
 */
jest.mock( 'uuid', () => ( {
	v4: () => 'mocked-uuid-' + Math.random(),
} ) );

/**
 * Mock @wordpress/blocks module
 */
jest.mock( '@wordpress/blocks', () => ( {
	getBlockTypes: () => [
		{
			name: 'core/paragraph',
			attributes: { content: { type: 'rich-text' } },
		},
		{
			name: 'core/image',
			attributes: {
				blob: { type: 'string', role: 'local' },
				url: { type: 'string' },
			},
		},
		{
			name: 'core/test-object-query',
			attributes: {
				metadata: {
					type: 'object',
					query: {
						title: { type: 'rich-text' },
						value: { type: 'string' },
					},
				},
			},
		},
		{
			name: 'core/table',
			attributes: {
				hasFixedLayout: { type: 'boolean' },
				caption: { type: 'rich-text' },
				head: {
					type: 'array',
					query: {
						cells: {
							type: 'array',
							query: {
								content: { type: 'rich-text' },
								tag: { type: 'string' },
								scope: { type: 'string' },
								align: { type: 'string' },
							},
						},
					},
				},
				body: {
					type: 'array',
					query: {
						cells: {
							type: 'array',
							query: {
								content: { type: 'rich-text' },
								tag: { type: 'string' },
								scope: { type: 'string' },
								align: { type: 'string' },
							},
						},
					},
				},
				foot: {
					type: 'array',
					query: {
						cells: {
							type: 'array',
							query: {
								content: { type: 'rich-text' },
								tag: { type: 'string' },
								scope: { type: 'string' },
								align: { type: 'string' },
							},
						},
					},
				},
			},
		},
	],
} ) );

/**
 * WordPress dependencies
 */
import { RichTextData } from '@wordpress/rich-text';

/**
 * Internal dependencies
 */
import {
	mergeCrdtBlocks,
	mergeRichTextUpdate,
	type Block,
	type YBlock,
	type YBlockAttributes,
	type YBlocks,
} from '../crdt-blocks';
import { getCachedRichTextData, createRichTextDataCache } from '../crdt-text';
import {
	createYArray,
	createYMap,
	createYText,
	getRootMap,
	isYArray,
	isYMap,
	isYText,
	yMapToJSON,
	yTextToString,
	type YArray,
	type YMap,
	type YText,
} from '../crdt-utils';

function toString( value: unknown ): string | null {
	return isYText( value ) ? yTextToString( value ) : null;
}

interface TestMapRecord {
	blocks: YBlocks;
	text: YText;
}

describe( 'crdt-blocks', () => {
	let doc: Y.Doc;
	let testMap: YMap< TestMapRecord >;
	let yblocks: YBlocks;

	beforeEach( () => {
		doc = new Y.Doc();
		yblocks = createYArray< YBlock >();
		testMap = getRootMap< TestMapRecord >( doc, 'testMap' );
		testMap.setAttr( 'blocks', yblocks );
		jest.clearAllMocks();
	} );

	afterEach( () => {
		doc.destroy();
	} );

	describe( 'mergeCrdtBlocks', () => {
		it( 'inserts new blocks into empty Y.Array', () => {
			const incomingBlocks: Block[] = [
				{
					name: 'core/paragraph',
					attributes: { content: 'Hello World' },
					innerBlocks: [],
				},
			];

			mergeCrdtBlocks( yblocks, incomingBlocks, null );

			expect( yblocks.length ).toBe( 1 );
			const block = yblocks.get( 0 );
			expect( block?.getAttr( 'name' ) ).toBe( 'core/paragraph' );
			const content = block
				?.getAttr( 'attributes' )
				?.getAttr( 'content' );
			expect( toString( content ) ).toBe( 'Hello World' );
		} );

		it( 'updates existing blocks when content changes', () => {
			const initialBlocks: Block[] = [
				{
					name: 'core/paragraph',
					attributes: { content: 'Initial content' },
					innerBlocks: [],
					clientId: 'block-1',
				},
			];

			mergeCrdtBlocks( yblocks, initialBlocks, null );

			const updatedBlocks: Block[] = [
				{
					name: 'core/paragraph',
					attributes: { content: 'Updated content' },
					innerBlocks: [],
					clientId: 'block-1',
				},
			];

			mergeCrdtBlocks( yblocks, updatedBlocks, null );

			expect( yblocks.length ).toBe( 1 );
			const block = yblocks.get( 0 );
			const content = block
				?.getAttr( 'attributes' )
				?.getAttr( 'content' );
			expect( toString( content ) ).toBe( 'Updated content' );
		} );

		it( 'deletes blocks that are removed', () => {
			const initialBlocks: Block[] = [
				{
					name: 'core/paragraph',
					attributes: { content: 'Block 1' },
					innerBlocks: [],
					clientId: 'block-1',
				},
				{
					name: 'core/paragraph',
					attributes: { content: 'Block 2' },
					innerBlocks: [],
					clientId: 'block-2',
				},
			];

			mergeCrdtBlocks( yblocks, initialBlocks, null );
			expect( yblocks.length ).toBe( 2 );

			const updatedBlocks: Block[] = [
				{
					name: 'core/paragraph',
					attributes: { content: 'Block 1' },
					innerBlocks: [],
					clientId: 'block-1',
				},
			];

			mergeCrdtBlocks( yblocks, updatedBlocks, null );

			expect( yblocks.length ).toBe( 1 );
			const block = yblocks.get( 0 );
			const content = block
				?.getAttr( 'attributes' )
				?.getAttr( 'content' );
			expect( toString( content ) ).toBe( 'Block 1' );
		} );

		it( 'handles innerBlocks recursively', () => {
			const blocksWithInner: Block[] = [
				{
					name: 'core/group',
					attributes: {},
					innerBlocks: [
						{
							name: 'core/paragraph',
							attributes: { content: 'Inner paragraph' },
							innerBlocks: [],
						},
					],
				},
			];

			mergeCrdtBlocks( yblocks, blocksWithInner, null );

			expect( yblocks.length ).toBe( 1 );
			const block = yblocks.get( 0 );
			const innerBlocks = block?.getAttr( 'innerBlocks' );
			expect( innerBlocks?.length ).toBe( 1 );
			const innerBlock = innerBlocks?.get( 0 );
			expect( innerBlock?.getAttr( 'name' ) ).toBe( 'core/paragraph' );
		} );

		it( 'strips local attributes when syncing blocks', () => {
			const imageWithBlob: Block[] = [
				{
					name: 'core/image',
					attributes: {
						url: 'http://example.com/image.jpg',
						blob: 'blob:...',
					},
					innerBlocks: [],
				},
			];

			mergeCrdtBlocks( yblocks, imageWithBlob, null );

			expect( yblocks.length ).toBe( 1 );
			const block = yblocks.get( 0 );
			expect( block?.getAttr( 'name' ) ).toBe( 'core/image' );
			const attrs = block?.getAttr( 'attributes' );
			expect( attrs?.getAttr( 'url' ) ).toBe(
				'http://example.com/image.jpg'
			);
			expect( attrs?.hasAttr( 'blob' ) ).toBe( false );
		} );

		it( 'strips local attributes from inner blocks', () => {
			const galleryWithBlobs: Block[] = [
				{
					name: 'core/gallery',
					attributes: {},
					innerBlocks: [
						{
							name: 'core/image',
							attributes: {
								url: 'http://example.com/image.jpg',
								blob: 'blob:...',
							},
							innerBlocks: [],
						},
					],
				},
			];

			mergeCrdtBlocks( yblocks, galleryWithBlobs, null );

			expect( yblocks.length ).toBe( 1 );
			const gallery = yblocks.get( 0 );
			expect( gallery?.getAttr( 'name' ) ).toBe( 'core/gallery' );
			const innerBlocks = gallery?.getAttr( 'innerBlocks' );
			expect( innerBlocks?.length ).toBe( 1 );
			const image = innerBlocks?.get( 0 );
			const attrs = image?.getAttr( 'attributes' );
			expect( attrs?.getAttr( 'url' ) ).toBe(
				'http://example.com/image.jpg'
			);
			expect( attrs?.hasAttr( 'blob' ) ).toBe( false );
		} );

		it( 'handles block reordering', () => {
			const initialBlocks: Block[] = [
				{
					name: 'core/paragraph',
					attributes: { content: 'First' },
					innerBlocks: [],
					clientId: 'block-1',
				},
				{
					name: 'core/paragraph',
					attributes: { content: 'Second' },
					innerBlocks: [],
					clientId: 'block-2',
				},
			];

			mergeCrdtBlocks( yblocks, initialBlocks, null );

			// Reorder blocks
			const reorderedBlocks: Block[] = [
				{
					name: 'core/paragraph',
					attributes: { content: 'Second' },
					innerBlocks: [],
					clientId: 'block-2',
				},
				{
					name: 'core/paragraph',
					attributes: { content: 'First' },
					innerBlocks: [],
					clientId: 'block-1',
				},
			];

			mergeCrdtBlocks( yblocks, reorderedBlocks, null );

			expect( yblocks.length ).toBe( 2 );
			const block0 = yblocks.get( 0 );
			const content0 = block0
				?.getAttr( 'attributes' )
				?.getAttr( 'content' );
			expect( toString( content0 ) ).toBe( 'Second' );

			const block1 = yblocks.get( 1 );
			const content1 = block1
				?.getAttr( 'attributes' )
				?.getAttr( 'content' );
			expect( toString( content1 ) ).toBe( 'First' );
		} );

		it( 'creates Y.Text for rich-text attributes', () => {
			const blocks: Block[] = [
				{
					name: 'core/paragraph',
					attributes: { content: 'Rich text content' },
					innerBlocks: [],
				},
			];

			mergeCrdtBlocks( yblocks, blocks, null );

			const block = yblocks.get( 0 );
			const contentAttr = block
				?.getAttr( 'attributes' )
				?.getAttr( 'content' );
			expect( contentAttr ).toBeInstanceOf( Y.Type );
			expect( toString( contentAttr ) ).toBe( 'Rich text content' );
		} );

		it( 'creates Y.Text for rich-text attributes even when the block name changes', () => {
			const blocks: Block[] = [
				{
					name: 'core/freeform',
					attributes: { content: 'Freeform text' },
					innerBlocks: [],
				},
			];

			mergeCrdtBlocks( yblocks, blocks, null );

			const block = yblocks.get( 0 );
			const contentAttr = block
				?.getAttr( 'attributes' )
				?.getAttr( 'content' );
			expect( block?.getAttr( 'name' ) ).toBe( 'core/freeform' );
			expect( typeof contentAttr ).toBe( 'string' );
			expect( contentAttr ).toBe( 'Freeform text' );

			const updatedBlocks: Block[] = [
				{
					name: 'core/paragraph',
					attributes: { content: 'Updated text' },
					innerBlocks: [],
				},
			];

			mergeCrdtBlocks( yblocks, updatedBlocks, null );

			expect( yblocks.length ).toBe( 1 );

			const updatedBlock = yblocks.get( 0 );
			const updatedContentAttr = updatedBlock
				?.getAttr( 'attributes' )
				?.getAttr( 'content' );
			expect( updatedBlock?.getAttr( 'name' ) ).toBe( 'core/paragraph' );
			expect( updatedContentAttr ).toBeInstanceOf( Y.Type );
			expect( toString( updatedContentAttr ) ).toBe( 'Updated text' );
		} );

		it( 'removes duplicate clientIds', () => {
			const blocksWithDuplicateIds: Block[] = [
				{
					name: 'core/paragraph',
					attributes: { content: 'First' },
					innerBlocks: [],
					clientId: 'duplicate-id',
				},
				{
					name: 'core/paragraph',
					attributes: { content: 'Second' },
					innerBlocks: [],
					clientId: 'duplicate-id',
				},
			];

			mergeCrdtBlocks( yblocks, blocksWithDuplicateIds, null );

			const block0 = yblocks.get( 0 );
			const clientId1 = block0?.getAttr( 'clientId' );
			const block1 = yblocks.get( 1 );
			const clientId2 = block1?.getAttr( 'clientId' );

			expect( clientId1 ).not.toBe( clientId2 );
		} );

		it( 'handles attribute deletion', () => {
			const initialBlocks: Block[] = [
				{
					name: 'core/heading',
					attributes: {
						content: 'Heading',
						level: 2,
					},
					innerBlocks: [],
				},
			];

			mergeCrdtBlocks( yblocks, initialBlocks, null );

			const updatedBlocks: Block[] = [
				{
					name: 'core/heading',
					attributes: {
						content: 'Heading',
					},
					innerBlocks: [],
				},
			];

			mergeCrdtBlocks( yblocks, updatedBlocks, null );

			const block = yblocks.get( 0 );
			const attributes = block?.getAttr( 'attributes' );
			expect( attributes?.hasAttr( 'level' ) ).toBe( false );
			expect( attributes?.hasAttr( 'content' ) ).toBe( true );
		} );

		it( 'preserves blocks that match from both left and right', () => {
			const initialBlocks: Block[] = [
				{
					name: 'core/paragraph',
					attributes: { content: 'First' },
					innerBlocks: [],
				},
				{
					name: 'core/paragraph',
					attributes: { content: 'Middle' },
					innerBlocks: [],
				},
				{
					name: 'core/paragraph',
					attributes: { content: 'Last' },
					innerBlocks: [],
				},
			];

			mergeCrdtBlocks( yblocks, initialBlocks, null );

			// Update only the middle block
			const updatedBlocks: Block[] = [
				{
					name: 'core/paragraph',
					attributes: { content: 'First' },
					innerBlocks: [],
				},
				{
					name: 'core/paragraph',
					attributes: { content: 'Updated Middle' },
					innerBlocks: [],
				},
				{
					name: 'core/paragraph',
					attributes: { content: 'Last' },
					innerBlocks: [],
				},
			];

			mergeCrdtBlocks( yblocks, updatedBlocks, null );

			expect( yblocks.length ).toBe( 3 );
			const block = yblocks.get( 1 );
			const content = block
				?.getAttr( 'attributes' )
				?.getAttr( 'content' );
			expect( toString( content ) ).toBe( 'Updated Middle' );
		} );

		it( 'adds new rich-text attribute to existing block without that attribute', () => {
			// Start with a block that has NO content attribute
			const initialBlocks: Block[] = [
				{
					name: 'core/paragraph',
					attributes: { level: 1 },
					innerBlocks: [],
				},
			];

			mergeCrdtBlocks( yblocks, initialBlocks, null );

			// Now add the content attribute (rich-text)
			const updatedBlocks: Block[] = [
				{
					name: 'core/paragraph',
					attributes: {
						level: 1,
						content: 'New content added',
					},
					innerBlocks: [],
				},
			];

			mergeCrdtBlocks( yblocks, updatedBlocks, null );

			expect( yblocks.length ).toBe( 1 );
			const block = yblocks.get( 0 );
			const attributes = block?.getAttr( 'attributes' );

			// The content attribute should now exist
			expect( attributes?.hasAttr( 'content' ) ).toBe( true );
			const content = attributes?.getAttr( 'content' );
			expect( toString( content ) ).toBe( 'New content added' );

			// The level attribute should still exist
			expect( attributes?.getAttr( 'level' ) ).toBe( 1 );
		} );

		it( 'handles block type changes from non-rich-text to rich-text', () => {
			// Start with freeform block (content is non-rich-text)
			const freeformBlocks: Block[] = [
				{
					name: 'core/freeform',
					attributes: { content: 'Freeform content' },
					innerBlocks: [],
					clientId: 'block-1',
				},
			];

			mergeCrdtBlocks( yblocks, freeformBlocks, null );

			const block1 = yblocks.get( 0 );
			const content1 = block1
				?.getAttr( 'attributes' )
				?.getAttr( 'content' );
			expect( block1?.getAttr( 'name' ) ).toBe( 'core/freeform' );
			expect( typeof content1 ).toBe( 'string' );
			expect( content1 ).toBe( 'Freeform content' );

			// Change to paragraph block (content becomes rich-text)
			const paragraphBlocks: Block[] = [
				{
					name: 'core/paragraph',
					attributes: { content: 'Freeform content' },
					innerBlocks: [],
					clientId: 'block-1',
				},
			];

			mergeCrdtBlocks( yblocks, paragraphBlocks, null );

			expect( yblocks.length ).toBe( 1 );
			const block2 = yblocks.get( 0 );
			const content2 = block2
				?.getAttr( 'attributes' )
				?.getAttr( 'content' );
			expect( block2?.getAttr( 'name' ) ).toBe( 'core/paragraph' );
			expect( content2 ).toBeInstanceOf( Y.Type );
			expect( toString( content2 ) ).toBe( 'Freeform content' );
		} );

		it( 'strips local attributes from deeply nested blocks', () => {
			const nestedGallery: Block[] = [
				{
					name: 'core/group',
					attributes: {},
					innerBlocks: [
						{
							name: 'core/gallery',
							attributes: {},
							innerBlocks: [
								{
									name: 'core/image',
									attributes: {
										url: 'http://example.com/image.jpg',
										blob: 'blob:...',
									},
									innerBlocks: [],
								},
							],
						},
					],
				},
			];

			mergeCrdtBlocks( yblocks, nestedGallery, null );

			expect( yblocks.length ).toBe( 1 );
			const groupBlock = yblocks.get( 0 );
			expect( groupBlock?.getAttr( 'name' ) ).toBe( 'core/group' );

			const innerBlocks = groupBlock?.getAttr( 'innerBlocks' );
			expect( innerBlocks?.length ).toBe( 1 );
			const gallery = innerBlocks?.get( 0 );
			const galleryInner = gallery?.getAttr( 'innerBlocks' );
			expect( galleryInner?.length ).toBe( 1 );
			const image = galleryInner?.get( 0 );
			const attrs = image?.getAttr( 'attributes' );
			expect( attrs?.getAttr( 'url' ) ).toBe(
				'http://example.com/image.jpg'
			);
			expect( attrs?.hasAttr( 'blob' ) ).toBe( false );
		} );

		it( 'handles complex block reordering', () => {
			const initialBlocks: Block[] = [
				{
					name: 'core/paragraph',
					attributes: { content: 'A' },
					innerBlocks: [],
					clientId: 'block-a',
				},
				{
					name: 'core/paragraph',
					attributes: { content: 'B' },
					innerBlocks: [],
					clientId: 'block-b',
				},
				{
					name: 'core/paragraph',
					attributes: { content: 'C' },
					innerBlocks: [],
					clientId: 'block-c',
				},
				{
					name: 'core/paragraph',
					attributes: { content: 'D' },
					innerBlocks: [],
					clientId: 'block-d',
				},
				{
					name: 'core/paragraph',
					attributes: { content: 'E' },
					innerBlocks: [],
					clientId: 'block-e',
				},
			];

			mergeCrdtBlocks( yblocks, initialBlocks, null );
			expect( yblocks.length ).toBe( 5 );

			// Reorder: [A, B, C, D, E] -> [C, A, E, B, D]
			const reorderedBlocks: Block[] = [
				{
					name: 'core/paragraph',
					attributes: { content: 'C' },
					innerBlocks: [],
					clientId: 'block-c',
				},
				{
					name: 'core/paragraph',
					attributes: { content: 'A' },
					innerBlocks: [],
					clientId: 'block-a',
				},
				{
					name: 'core/paragraph',
					attributes: { content: 'E' },
					innerBlocks: [],
					clientId: 'block-e',
				},
				{
					name: 'core/paragraph',
					attributes: { content: 'B' },
					innerBlocks: [],
					clientId: 'block-b',
				},
				{
					name: 'core/paragraph',
					attributes: { content: 'D' },
					innerBlocks: [],
					clientId: 'block-d',
				},
			];

			mergeCrdtBlocks( yblocks, reorderedBlocks, null );

			expect( yblocks.length ).toBe( 5 );
			const contents = [ 'C', 'A', 'E', 'B', 'D' ];
			contents.forEach( ( expectedContent, i ) => {
				const block = yblocks.get( i );
				const content = block
					?.getAttr( 'attributes' )
					?.getAttr( 'content' );
				expect( toString( content ) ).toBe( expectedContent );
			} );
		} );

		it( 'handles many deletions (10 blocks to 2 blocks)', () => {
			const manyBlocks: Block[] = Array.from(
				{ length: 10 },
				( _, i ) => ( {
					name: 'core/paragraph',
					attributes: { content: `Block ${ i }` },
					innerBlocks: [],
					clientId: `block-${ i }`,
				} )
			);

			mergeCrdtBlocks( yblocks, manyBlocks, null );
			expect( yblocks.length ).toBe( 10 );

			const fewBlocks: Block[] = [
				{
					name: 'core/paragraph',
					attributes: { content: 'Block 0' },
					innerBlocks: [],
					clientId: 'block-0',
				},
				{
					name: 'core/paragraph',
					attributes: { content: 'Block 9' },
					innerBlocks: [],
					clientId: 'block-9',
				},
			];

			mergeCrdtBlocks( yblocks, fewBlocks, null );

			expect( yblocks.length ).toBe( 2 );
			const content0 = yblocks
				?.get( 0 )
				?.getAttr( 'attributes' )
				?.getAttr( 'content' );
			expect( toString( content0 ) ).toBe( 'Block 0' );
			const content1 = yblocks
				?.get( 1 )
				?.getAttr( 'attributes' )
				?.getAttr( 'content' );
			expect( toString( content1 ) ).toBe( 'Block 9' );
		} );

		it( 'handles many insertions (2 blocks to 10 blocks)', () => {
			const fewBlocks: Block[] = [
				{
					name: 'core/paragraph',
					attributes: { content: 'Block 0' },
					innerBlocks: [],
					clientId: 'block-0',
				},
				{
					name: 'core/paragraph',
					attributes: { content: 'Block 9' },
					innerBlocks: [],
					clientId: 'block-9',
				},
			];

			mergeCrdtBlocks( yblocks, fewBlocks, null );
			expect( yblocks.length ).toBe( 2 );

			const manyBlocks: Block[] = Array.from(
				{ length: 10 },
				( _, i ) => ( {
					name: 'core/paragraph',
					attributes: { content: `Block ${ i }` },
					innerBlocks: [],
					clientId: `block-${ i }`,
				} )
			);

			mergeCrdtBlocks( yblocks, manyBlocks, null );

			expect( yblocks.length ).toBe( 10 );
			manyBlocks.forEach( ( _block, i ) => {
				const yblock = yblocks.get( i );
				const content = yblock
					?.getAttr( 'attributes' )
					?.getAttr( 'content' );
				expect( toString( content ) ).toBe( `Block ${ i }` );
			} );
		} );

		it( 'handles changes with all different block content', () => {
			const blocksA: Block[] = [
				{
					name: 'core/paragraph',
					attributes: { content: 'A1' },
					innerBlocks: [],
				},
				{
					name: 'core/paragraph',
					attributes: { content: 'A2' },
					innerBlocks: [],
				},
				{
					name: 'core/paragraph',
					attributes: { content: 'A3' },
					innerBlocks: [],
				},
			];

			mergeCrdtBlocks( yblocks, blocksA, null );
			expect( yblocks.length ).toBe( 3 );

			const blocksB: Block[] = [
				{
					name: 'core/paragraph',
					attributes: { content: 'B1' },
					innerBlocks: [],
				},
				{
					name: 'core/paragraph',
					attributes: { content: 'B2' },
					innerBlocks: [],
				},
				{
					name: 'core/paragraph',
					attributes: { content: 'B3' },
					innerBlocks: [],
				},
			];

			mergeCrdtBlocks( yblocks, blocksB, null );

			expect( yblocks.length ).toBe( 3 );
			[ 'B1', 'B2', 'B3' ].forEach( ( expected, i ) => {
				const content = yblocks
					?.get( i )
					?.getAttr( 'attributes' )
					?.getAttr( 'content' );
				expect( toString( content ) ).toBe( expected );
			} );
		} );

		it( 'clears all blocks when syncing empty array', () => {
			const blocks: Block[] = [
				{
					name: 'core/paragraph',
					attributes: { content: 'Content' },
					innerBlocks: [],
				},
			];

			mergeCrdtBlocks( yblocks, blocks, null );
			expect( yblocks.length ).toBe( 1 );

			mergeCrdtBlocks( yblocks, [], null );
			expect( yblocks.length ).toBe( 0 );
		} );

		it( 'handles deeply nested blocks', () => {
			const deeplyNested: Block[] = [
				{
					name: 'core/group',
					attributes: {},
					innerBlocks: [
						{
							name: 'core/group',
							attributes: {},
							innerBlocks: [
								{
									name: 'core/group',
									attributes: {},
									innerBlocks: [
										{
											name: 'core/group',
											attributes: {},
											innerBlocks: [
												{
													name: 'core/paragraph',
													attributes: {
														content: 'Deep content',
													},
													innerBlocks: [],
												},
											],
										},
									],
								},
							],
						},
					],
				},
			];

			mergeCrdtBlocks( yblocks, deeplyNested, null );

			// Navigate to the deepest block
			let current: YBlocks | undefined = yblocks;
			for ( let i = 0; i < 4; i++ ) {
				expect( current?.length ).toBe( 1 );
				current = current?.get( 0 )?.getAttr( 'innerBlocks' );
			}

			expect( current?.length ).toBe( 1 );
			const content = current
				?.get( 0 )
				?.getAttr( 'attributes' )
				?.getAttr( 'content' );
			expect( toString( content ) ).toBe( 'Deep content' );

			// Update innermost block
			const updatedDeep: Block[] = [
				{
					name: 'core/group',
					attributes: {},
					innerBlocks: [
						{
							name: 'core/group',
							attributes: {},
							innerBlocks: [
								{
									name: 'core/group',
									attributes: {},
									innerBlocks: [
										{
											name: 'core/group',
											attributes: {},
											innerBlocks: [
												{
													name: 'core/paragraph',
													attributes: {
														content: 'Updated deep',
													},
													innerBlocks: [],
												},
											],
										},
									],
								},
							],
						},
					],
				},
			];

			mergeCrdtBlocks( yblocks, updatedDeep, null );

			// Verify update propagated
			current = yblocks;
			for ( let i = 0; i < 4; i++ ) {
				current = current?.get( 0 )?.getAttr( 'innerBlocks' );
			}
			const updatedContent = current
				?.get( 0 )
				?.getAttr( 'attributes' )
				?.getAttr( 'content' );
			expect( toString( updatedContent ) ).toBe( 'Updated deep' );
		} );

		it( 'handles null and undefined attribute values', () => {
			const blocksWithNullAttrs: Block[] = [
				{
					name: 'core/paragraph',
					attributes: {
						content: 'Content',
						customAttr: null,
						otherAttr: undefined,
					},
					innerBlocks: [],
				},
			];

			mergeCrdtBlocks( yblocks, blocksWithNullAttrs, null );

			expect( yblocks.length ).toBe( 1 );
			const block = yblocks.get( 0 );
			const attributes = block?.getAttr( 'attributes' );
			expect( attributes?.getAttr( 'content' ) ).toBeInstanceOf( Y.Type );
			expect( attributes?.getAttr( 'customAttr' ) ).toBe( null );
		} );

		it( 'handles rich-text updates with cursor at start', () => {
			const blocks: Block[] = [
				{
					name: 'core/paragraph',
					attributes: { content: 'Hello World' },
					innerBlocks: [],
				},
			];

			mergeCrdtBlocks( yblocks, blocks, null );

			const updatedBlocks: Block[] = [
				{
					name: 'core/paragraph',
					attributes: { content: 'XHello World' },
					innerBlocks: [],
				},
			];

			mergeCrdtBlocks( yblocks, updatedBlocks, 0 );

			const block = yblocks.get( 0 );
			const content = block
				?.getAttr( 'attributes' )
				?.getAttr( 'content' );
			expect( toString( content ) ).toBe( 'XHello World' );
		} );

		it( 'handles rich-text updates with cursor at end', () => {
			const blocks: Block[] = [
				{
					name: 'core/paragraph',
					attributes: { content: 'Hello World' },
					innerBlocks: [],
				},
			];

			mergeCrdtBlocks( yblocks, blocks, null );

			const updatedBlocks: Block[] = [
				{
					name: 'core/paragraph',
					attributes: { content: 'Hello World!' },
					innerBlocks: [],
				},
			];

			mergeCrdtBlocks( yblocks, updatedBlocks, 11 );

			const block = yblocks.get( 0 );
			const content = block
				?.getAttr( 'attributes' )
				?.getAttr( 'content' );
			expect( toString( content ) ).toBe( 'Hello World!' );
		} );

		it( 'handles rich-text updates with cursor beyond text length', () => {
			const blocks: Block[] = [
				{
					name: 'core/paragraph',
					attributes: { content: 'Hello' },
					innerBlocks: [],
				},
			];

			mergeCrdtBlocks( yblocks, blocks, null );

			const updatedBlocks: Block[] = [
				{
					name: 'core/paragraph',
					attributes: { content: 'Hello World' },
					innerBlocks: [],
				},
			];

			mergeCrdtBlocks( yblocks, updatedBlocks, 999 );

			const block = yblocks.get( 0 );
			const content = block
				?.getAttr( 'attributes' )
				?.getAttr( 'content' );
			expect( toString( content ) ).toBe( 'Hello World' );
		} );

		it( 'deletes extra block properties not in incoming blocks', () => {
			const initialBlocks: Block[] = [
				{
					name: 'core/paragraph',
					attributes: { content: 'Content' },
					innerBlocks: [],
					clientId: 'block-1',
					isValid: true,
					originalContent: 'Original',
				},
			];

			mergeCrdtBlocks( yblocks, initialBlocks, null );

			const block1 = yblocks.get( 0 );
			expect( block1?.getAttr( 'isValid' ) ).toBe( true );
			expect( block1?.getAttr( 'originalContent' ) ).toBe( 'Original' );

			const updatedBlocks: Block[] = [
				{
					name: 'core/paragraph',
					attributes: { content: 'Content' },
					innerBlocks: [],
					clientId: 'block-1',
				},
			];

			mergeCrdtBlocks( yblocks, updatedBlocks, null );

			const block2 = yblocks.get( 0 );
			expect( block2?.hasAttr( 'isValid' ) ).toBe( false );
			expect( block2?.hasAttr( 'originalContent' ) ).toBe( false );
		} );

		it( 'deletes rich-text attributes when removed from block', () => {
			const blocksWithRichText: Block[] = [
				{
					name: 'core/paragraph',
					attributes: {
						content: 'Rich text content',
						caption: 'Caption text',
					},
					innerBlocks: [],
				},
			];

			mergeCrdtBlocks( yblocks, blocksWithRichText, null );

			const block1 = yblocks.get( 0 );
			const attrs1 = block1?.getAttr( 'attributes' );
			expect( attrs1?.hasAttr( 'content' ) ).toBe( true );
			expect( attrs1?.hasAttr( 'caption' ) ).toBe( true );

			const blocksWithoutCaption: Block[] = [
				{
					name: 'core/paragraph',
					attributes: {
						content: 'Rich text content',
					},
					innerBlocks: [],
				},
			];

			mergeCrdtBlocks( yblocks, blocksWithoutCaption, null );

			const block2 = yblocks.get( 0 );
			const attrs2 = block2?.getAttr( 'attributes' );
			expect( attrs2?.hasAttr( 'content' ) ).toBe( true );
			expect( attrs2?.hasAttr( 'caption' ) ).toBe( false );
		} );
	} );

	describe( 'table block', () => {
		it( 'preserves table cell content through CRDT round-trip', () => {
			const tableBlocks: Block[] = [
				{
					name: 'core/table',
					attributes: {
						hasFixedLayout: true,
						body: [
							{
								cells: [
									{
										content:
											RichTextData.fromPlainText( '1' ),
										tag: 'td',
									},
									{
										content:
											RichTextData.fromPlainText( '2' ),
										tag: 'td',
									},
								],
							},
							{
								cells: [
									{
										content:
											RichTextData.fromPlainText( '3' ),
										tag: 'td',
									},
									{
										content:
											RichTextData.fromPlainText( '4' ),
										tag: 'td',
									},
								],
							},
						],
					},
					innerBlocks: [],
				},
			];

			mergeCrdtBlocks( yblocks, tableBlocks, null );

			// Simulate a CRDT encode/decode cycle (persistence or sync).
			const encoded = Y.encodeStateAsUpdate( doc );
			const doc2 = new Y.Doc();
			Y.applyUpdate( doc2, encoded );

			const testMap2 = getRootMap< TestMapRecord >( doc2, 'testMap' );
			const yblocks2 = testMap2.getAttr( 'blocks' );
			expect( yblocks2?.length ).toBe( 1 );

			const block = yblocks2?.get( 0 );
			const attrs = block?.getAttr( 'attributes' );
			const body = yMapToJSON( attrs! ).body as {
				cells: { content: string; tag: string }[];
			}[];

			expect( body ).toHaveLength( 2 );
			expect( body?.[ 0 ].cells[ 0 ].content ).toBe( '1' );
			expect( body?.[ 0 ].cells[ 1 ].content ).toBe( '2' );
			expect( body?.[ 1 ].cells[ 0 ].content ).toBe( '3' );
			expect( body?.[ 1 ].cells[ 1 ].content ).toBe( '4' );

			doc2.destroy();
		} );

		it( 'preserves table cell content with HTML formatting', () => {
			const tableBlocks: Block[] = [
				{
					name: 'core/table',
					attributes: {
						hasFixedLayout: true,
						head: [
							{
								cells: [
									{
										content: RichTextData.fromHTMLString(
											'<strong>Header</strong>'
										),
										tag: 'th',
									},
								],
							},
						],
						body: [
							{
								cells: [
									{
										content: RichTextData.fromHTMLString(
											'<a href="https://example.com">Link</a>'
										),
										tag: 'td',
									},
								],
							},
						],
					},
					innerBlocks: [],
				},
			];

			mergeCrdtBlocks( yblocks, tableBlocks, null );

			// Round-trip through encode/decode.
			const encoded = Y.encodeStateAsUpdate( doc );
			const doc2 = new Y.Doc();
			Y.applyUpdate( doc2, encoded );

			const testMap2 = getRootMap< TestMapRecord >( doc2, 'testMap' );
			const yblocks2 = testMap2.getAttr( 'blocks' );
			const block = yblocks2?.get( 0 );
			const attrs = block?.getAttr( 'attributes' );

			const attrsJson = yMapToJSON( attrs! );
			const head = attrsJson.head as {
				cells: { content: string }[];
			}[];
			expect( head[ 0 ].cells[ 0 ].content ).toBe(
				'<strong>Header</strong>'
			);

			const body = attrsJson.body as {
				cells: { content: string }[];
			}[];
			expect( body[ 0 ].cells[ 0 ].content ).toBe(
				'<a href="https://example.com">Link</a>'
			);

			doc2.destroy();
		} );

		it( 'stores table body as nested Y types (Y.Array of Y.Maps with Y.Text)', () => {
			const tableBlocks: Block[] = [
				{
					name: 'core/table',
					attributes: {
						hasFixedLayout: true,
						body: [
							{
								cells: [
									{
										content:
											RichTextData.fromPlainText( 'A1' ),
										tag: 'td',
									},
									{
										content:
											RichTextData.fromPlainText( 'B1' ),
										tag: 'td',
									},
								],
							},
						],
					},
					innerBlocks: [],
				},
			];

			mergeCrdtBlocks( yblocks, tableBlocks, null );

			const attrs = yblocks
				?.get( 0 )
				?.getAttr( 'attributes' ) as YBlockAttributes;
			const body = attrs.getAttr( 'body' );

			// body should be a Y.Array, not a plain array.
			expect( isYArray( body ) ).toBe( true );

			// Each row should be a Y.Map.
			const row = ( body as YArray< unknown > ).get( 0 );
			expect( isYMap( row ) ).toBe( true );

			// Each row's cells should be a Y.Array.
			const cells = ( row as YMap< Record< string, unknown > > ).getAttr(
				'cells'
			);
			expect( isYArray( cells ) ).toBe( true );

			// Each cell should be a Y.Map with Y.Text content.
			const cell = ( cells as YArray< unknown > ).get( 0 );
			expect( isYMap( cell ) ).toBe( true );

			const content = (
				cell as YMap< Record< string, unknown > >
			 ).getAttr( 'content' ) as YText;
			expect( isYText( content ) ).toBe( true );
			expect( yTextToString( content ) ).toBe( 'A1' );

			// tag should be a plain string value.
			expect(
				( cell as YMap< Record< string, unknown > > ).getAttr( 'tag' )
			).toBe( 'td' );
		} );

		it( 'merges table cell edits in-place without replacing sibling cells', () => {
			const tableBlocks: Block[] = [
				{
					name: 'core/table',
					attributes: {
						body: [
							{
								cells: [
									{ content: 'A1', tag: 'td' },
									{ content: 'B1', tag: 'td' },
								],
							},
							{
								cells: [
									{ content: 'A2', tag: 'td' },
									{ content: 'B2', tag: 'td' },
								],
							},
						],
					},
					innerBlocks: [],
				},
			];

			mergeCrdtBlocks( yblocks, tableBlocks, null );

			// Grab the Y.Text for cell B2 before the update.
			const attrs = yblocks
				?.get( 0 )
				?.getAttr( 'attributes' ) as YBlockAttributes;
			const body = attrs.getAttr( 'body' ) as YArray< unknown >;
			const row1 = body.get( 1 ) as YMap< Record< string, unknown > >;
			const cells1 = row1.getAttr( 'cells' ) as YArray< unknown >;
			const cellB2 = cells1.get( 1 ) as YMap< Record< string, unknown > >;
			const b2Text = cellB2.getAttr( 'content' ) as YText;

			// Edit only cell A1.
			const updatedBlocks: Block[] = [
				{
					name: 'core/table',
					attributes: {
						body: [
							{
								cells: [
									{ content: 'A1-edited', tag: 'td' },
									{ content: 'B1', tag: 'td' },
								],
							},
							{
								cells: [
									{ content: 'A2', tag: 'td' },
									{ content: 'B2', tag: 'td' },
								],
							},
						],
					},
					innerBlocks: [],
				},
			];

			mergeCrdtBlocks( yblocks, updatedBlocks, null );

			// The Y.Text for B2 should be the exact same object (identity).
			const bodyAfter = attrs.getAttr( 'body' ) as YArray< unknown >;
			const row1After = bodyAfter.get( 1 ) as YMap<
				Record< string, unknown >
			>;
			const cells1After = row1After.getAttr(
				'cells'
			) as YArray< unknown >;
			const cellB2After = cells1After.get( 1 ) as YMap<
				Record< string, unknown >
			>;
			const b2TextAfter = cellB2After.getAttr( 'content' ) as YText;

			expect( b2TextAfter ).toBe( b2Text );
			expect( yTextToString( b2TextAfter ) ).toBe( 'B2' );

			// Cell A1 should be updated.
			const row0After = bodyAfter.get( 0 ) as YMap<
				Record< string, unknown >
			>;
			const cells0After = row0After.getAttr(
				'cells'
			) as YArray< unknown >;
			const cellA1After = cells0After.get( 0 ) as YMap<
				Record< string, unknown >
			>;
			const a1Content = cellA1After.getAttr( 'content' ) as YText;
			expect( yTextToString( a1Content ) ).toBe( 'A1-edited' );
		} );

		it( 'rebuilds Y.Array when row count changes (structural edit)', () => {
			const tableBlocks: Block[] = [
				{
					name: 'core/table',
					attributes: {
						body: [
							{
								cells: [ { content: 'A1', tag: 'td' } ],
							},
						],
					},
					innerBlocks: [],
				},
			];

			mergeCrdtBlocks( yblocks, tableBlocks, null );

			// Add a second row.
			const updatedBlocks: Block[] = [
				{
					name: 'core/table',
					attributes: {
						body: [
							{
								cells: [ { content: 'A1', tag: 'td' } ],
							},
							{
								cells: [ { content: 'A2', tag: 'td' } ],
							},
						],
					},
					innerBlocks: [],
				},
			];

			mergeCrdtBlocks( yblocks, updatedBlocks, null );

			const attrs = yblocks
				?.get( 0 )
				?.getAttr( 'attributes' ) as YBlockAttributes;
			const body = attrs.getAttr( 'body' ) as YArray< unknown >;

			expect( body.length ).toBe( 2 );

			const row1 = body.get( 1 ) as YMap< Record< string, unknown > >;
			const cells = ( row1.getAttr( 'cells' ) as YArray< unknown > ).get(
				0
			) as YMap< Record< string, unknown > >;
			const a2Content = cells.getAttr( 'content' ) as YText;
			expect( yTextToString( a2Content ) ).toBe( 'A2' );
		} );

		it( 'concurrent cell edits on different cells are both preserved', () => {
			// Simulate two users editing different cells in the same table.
			const initialBlocks: Block[] = [
				{
					name: 'core/table',
					attributes: {
						body: [
							{
								cells: [
									{ content: 'A1', tag: 'td' },
									{ content: 'B1', tag: 'td' },
								],
							},
						],
					},
					innerBlocks: [],
				},
			];

			// Set up doc1 (User A).
			mergeCrdtBlocks( yblocks, initialBlocks, null );

			// Set up doc2 (User B) by syncing initial state.
			const doc2 = new Y.Doc();
			const testMap2 = getRootMap< TestMapRecord >( doc2, 'testMap' );
			Y.applyUpdate( doc2, Y.encodeStateAsUpdate( doc ) );
			const yblocks2 = testMap2.getAttr( 'blocks' ) as YBlocks;

			// User A edits cell A1.
			const userABlocks: Block[] = [
				{
					name: 'core/table',
					attributes: {
						body: [
							{
								cells: [
									{ content: 'A1-userA', tag: 'td' },
									{ content: 'B1', tag: 'td' },
								],
							},
						],
					},
					innerBlocks: [],
				},
			];
			mergeCrdtBlocks( yblocks, userABlocks, null );

			// User B edits cell B1 (concurrently, before syncing A's change).
			const userBBlocks: Block[] = [
				{
					name: 'core/table',
					attributes: {
						body: [
							{
								cells: [
									{ content: 'A1', tag: 'td' },
									{ content: 'B1-userB', tag: 'td' },
								],
							},
						],
					},
					innerBlocks: [],
				},
			];
			mergeCrdtBlocks( yblocks2, userBBlocks, null );

			// Sync: apply each other's changes.
			const updateA = Y.encodeStateAsUpdate( doc );
			const updateB = Y.encodeStateAsUpdate( doc2 );
			Y.applyUpdate( doc2, updateA );
			Y.applyUpdate( doc, updateB );

			// Both docs should have both edits preserved.
			for ( const checkBlocks of [ yblocks, yblocks2 ] ) {
				const attrs = checkBlocks
					?.get( 0 )
					?.getAttr( 'attributes' ) as YBlockAttributes;
				const bodyArr = attrs.getAttr( 'body' ) as YArray< unknown >;
				const bodyRow0 = bodyArr.get( 0 ) as YMap<
					Record< string, unknown >
				>;
				const bodyCells = bodyRow0.getAttr(
					'cells'
				) as YArray< unknown >;
				const bodyCell0 = bodyCells.get( 0 ) as YMap<
					Record< string, unknown >
				>;
				const bodyCell1 = bodyCells.get( 1 ) as YMap<
					Record< string, unknown >
				>;

				expect(
					yTextToString( bodyCell0.getAttr( 'content' ) as YText )
				).toBe( 'A1-userA' );
				expect(
					yTextToString( bodyCell1.getAttr( 'content' ) as YText )
				).toBe( 'B1-userB' );
			}

			doc2.destroy();
		} );

		it( 'migrates plain array to Y.Array on first update', () => {
			// Manually set up a block with a plain array body (old format).
			const block = createYMap() as unknown as YBlock;
			block.setAttr( 'name' as any, 'core/table' );
			block.setAttr( 'clientId' as any, 'table-migration' );
			block.setAttr( 'innerBlocks' as any, createYArray() );

			const attrs = createYMap();
			attrs.setAttr( 'hasFixedLayout', true );
			// Store body as a plain array (pre-migration format).
			attrs.setAttr( 'body', [
				{ cells: [ { content: 'old', tag: 'td' } ] },
			] );
			block.setAttr( 'attributes' as any, attrs );

			doc.transact( () => {
				yblocks.push( [ block ] );
			} );

			// The body is currently a plain array.
			expect( isYArray( attrs.getAttr( 'body' ) ) ).toBe( false );

			// Now merge blocks, which should trigger migration.
			const updatedBlocks: Block[] = [
				{
					name: 'core/table',
					attributes: {
						hasFixedLayout: true,
						body: [
							{
								cells: [ { content: 'migrated', tag: 'td' } ],
							},
						],
					},
					innerBlocks: [],
				},
			];

			mergeCrdtBlocks( yblocks, updatedBlocks, null );

			// After migration, body should be a Y.Array.
			const bodyAfter = attrs.getAttr( 'body' );
			expect( isYArray( bodyAfter ) ).toBe( true );

			const bodyRow0 = ( bodyAfter as YArray< unknown > ).get(
				0
			) as YMap< Record< string, unknown > >;
			const bodyCells = bodyRow0.getAttr( 'cells' ) as YArray< unknown >;
			const bodyCell0 = bodyCells.get( 0 ) as YMap<
				Record< string, unknown >
			>;
			expect(
				yTextToString( bodyCell0.getAttr( 'content' ) as YText )
			).toBe( 'migrated' );
		} );

		it( 'preserves non-rich-text cell properties alongside Y.Text content', () => {
			const tableBlocks: Block[] = [
				{
					name: 'core/table',
					attributes: {
						body: [
							{
								cells: [
									{
										content: 'Header',
										tag: 'th',
										scope: 'col',
										align: 'center',
									},
								],
							},
						],
					},
					innerBlocks: [],
				},
			];

			mergeCrdtBlocks( yblocks, tableBlocks, null );

			const attrs = yblocks
				?.get( 0 )
				?.getAttr( 'attributes' ) as YBlockAttributes;
			const body = attrs.getAttr( 'body' ) as YArray< unknown >;
			const row = body.get( 0 ) as YMap< Record< string, unknown > >;
			const cells = row.getAttr( 'cells' ) as YArray< unknown >;
			const cell = cells.get( 0 ) as YMap< Record< string, unknown > >;

			// Rich-text content should be Y.Text.
			const content = cell.getAttr( 'content' ) as YText;
			expect( isYText( content ) ).toBe( true );
			expect( yTextToString( content ) ).toBe( 'Header' );

			// Plain string properties should be stored as-is.
			expect( cell.getAttr( 'tag' ) ).toBe( 'th' );
			expect( cell.getAttr( 'scope' ) ).toBe( 'col' );
			expect( cell.getAttr( 'align' ) ).toBe( 'center' );

			// Update only the content, verify other properties remain.
			const updatedBlocks: Block[] = [
				{
					name: 'core/table',
					attributes: {
						body: [
							{
								cells: [
									{
										content: 'Updated Header',
										tag: 'th',
										scope: 'col',
										align: 'center',
									},
								],
							},
						],
					},
					innerBlocks: [],
				},
			];

			mergeCrdtBlocks( yblocks, updatedBlocks, null );

			const cellAfter = (
				(
					( attrs.getAttr( 'body' ) as YArray< unknown > ).get(
						0
					) as YMap< Record< string, unknown > >
				 ).getAttr( 'cells' ) as YArray< unknown >
			 ).get( 0 ) as YMap< Record< string, unknown > >;

			expect(
				yTextToString( cellAfter.getAttr( 'content' ) as YText )
			).toBe( 'Updated Header' );
			expect( cellAfter.getAttr( 'tag' ) ).toBe( 'th' );
			expect( cellAfter.getAttr( 'scope' ) ).toBe( 'col' );
			expect( cellAfter.getAttr( 'align' ) ).toBe( 'center' );
		} );

		it( 'deletes removed properties from Y.Map cells', () => {
			const tableBlocks: Block[] = [
				{
					name: 'core/table',
					attributes: {
						body: [
							{
								cells: [
									{
										content: 'Header',
										tag: 'th',
										scope: 'col',
									},
								],
							},
						],
					},
					innerBlocks: [],
				},
			];

			mergeCrdtBlocks( yblocks, tableBlocks, null );

			const attrs = yblocks
				?.get( 0 )
				?.getAttr( 'attributes' ) as YBlockAttributes;
			const body = attrs.getAttr( 'body' ) as YArray< unknown >;
			const row = body.get( 0 ) as YMap< Record< string, unknown > >;
			const cells = row.getAttr( 'cells' ) as YArray< unknown >;
			const cell = cells.get( 0 ) as YMap< Record< string, unknown > >;

			// Scope should exist initially.
			expect( cell.getAttr( 'scope' ) ).toBe( 'col' );

			// Update without the scope property.
			const updatedBlocks: Block[] = [
				{
					name: 'core/table',
					attributes: {
						body: [
							{
								cells: [
									{
										content: 'Header',
										tag: 'th',
									},
								],
							},
						],
					},
					innerBlocks: [],
				},
			];

			mergeCrdtBlocks( yblocks, updatedBlocks, null );

			const cellAfter = (
				(
					( attrs.getAttr( 'body' ) as YArray< unknown > ).get(
						0
					) as YMap< Record< string, unknown > >
				 ).getAttr( 'cells' ) as YArray< unknown >
			 ).get( 0 ) as YMap< Record< string, unknown > >;

			// Scope should be deleted.
			expect( cellAfter.getAttr( 'scope' ) ).toBeUndefined();
			// Other properties should remain.
			expect( cellAfter.getAttr( 'tag' ) ).toBe( 'th' );
			expect(
				yTextToString( cellAfter.getAttr( 'content' ) as YText )
			).toBe( 'Header' );
		} );

		it( 'rebuilds Y.Array when element is wrong type (partial migration)', () => {
			// Manually set up a block with a Y.Array whose elements are
			// plain values instead of Y.Maps (simulating a partial migration).
			const block = createYMap() as unknown as YBlock;
			block.setAttr( 'name' as any, 'core/table' );
			block.setAttr( 'clientId' as any, 'table-partial' );
			block.setAttr( 'innerBlocks' as any, createYArray() );

			const attrs = createYMap();
			// Create a Y.Array with a plain object element (not a Y.Map).
			const bodyArray = createYArray();
			bodyArray.insert( 0, [
				{ cells: [ { content: 'plain', tag: 'td' } ] },
			] );
			attrs.setAttr( 'body', bodyArray );
			block.setAttr( 'attributes' as any, attrs );

			doc.transact( () => {
				yblocks.push( [ block ] );
			} );

			// The element should be a plain object, not a Y.Map.
			expect( isYMap( bodyArray.get( 0 ) ) ).toBe( false );

			// Merge, which should detect the wrong type and rebuild.
			const updatedBlocks: Block[] = [
				{
					name: 'core/table',
					attributes: {
						body: [
							{
								cells: [ { content: 'rebuilt', tag: 'td' } ],
							},
						],
					},
					innerBlocks: [],
				},
			];

			mergeCrdtBlocks( yblocks, updatedBlocks, null );

			const bodyAfter = attrs.getAttr( 'body' ) as YArray< unknown >;
			expect( isYArray( bodyAfter ) ).toBe( true );

			// After rebuild, elements should be proper Y.Maps.
			const row = bodyAfter.get( 0 );
			expect( isYMap( row ) ).toBe( true );

			const cells = ( row as YMap< Record< string, unknown > > ).getAttr(
				'cells'
			) as YArray< unknown >;
			const cell = cells.get( 0 ) as YMap< Record< string, unknown > >;
			expect( isYMap( cell ) ).toBe( true );
			expect( yTextToString( cell.getAttr( 'content' ) as YText ) ).toBe(
				'rebuilt'
			);
		} );
	} );

	describe( 'object+query attributes', () => {
		it( 'creates Y.Map for object+query attributes with Y.Text sub-values', () => {
			const blocks: Block[] = [
				{
					name: 'core/test-object-query',
					attributes: {
						metadata: {
							title: 'Hello',
							value: 'world',
						},
					},
					innerBlocks: [],
				},
			];

			mergeCrdtBlocks( yblocks, blocks, null );

			const attrs = yblocks
				?.get( 0 )
				?.getAttr( 'attributes' ) as YBlockAttributes;
			const metadata = attrs.getAttr( 'metadata' );

			// Should be a Y.Map, not a plain object.
			expect( isYMap( metadata ) ).toBe( true );

			const metadataMap = metadata as YMap< Record< string, unknown > >;

			// title is rich-text, so it should be Y.Text.
			expect( isYText( metadataMap.getAttr( 'title' ) ) ).toBe( true );
			expect(
				yTextToString( metadataMap.getAttr( 'title' ) as YText )
			).toBe( 'Hello' );

			// value is a plain string, so it should remain a string.
			expect( metadataMap.getAttr( 'value' ) ).toBe( 'world' );
		} );

		it( 'merges object+query attribute in-place preserving Y.Map identity', () => {
			const blocks: Block[] = [
				{
					name: 'core/test-object-query',
					attributes: {
						metadata: {
							title: 'Original',
							value: 'v1',
						},
					},
					innerBlocks: [],
					clientId: 'obj-query-1',
				},
			];

			mergeCrdtBlocks( yblocks, blocks, null );

			const attrs = yblocks
				?.get( 0 )
				?.getAttr( 'attributes' ) as YBlockAttributes;
			const metadataBefore = attrs.getAttr( 'metadata' ) as YMap<
				Record< string, unknown >
			>;
			const titleBefore = metadataBefore.getAttr( 'title' ) as YText;

			// Update the metadata.
			const updatedBlocks: Block[] = [
				{
					name: 'core/test-object-query',
					attributes: {
						metadata: {
							title: 'Updated',
							value: 'v2',
						},
					},
					innerBlocks: [],
					clientId: 'obj-query-1',
				},
			];

			mergeCrdtBlocks( yblocks, updatedBlocks, null );

			const metadataAfter = attrs.getAttr( 'metadata' ) as YMap<
				Record< string, unknown >
			>;

			// The Y.Map should be the same object (in-place merge).
			expect( metadataAfter ).toBe( metadataBefore );

			// The Y.Text for title should be the same object (merged in-place).
			const titleAfter = metadataAfter.getAttr( 'title' ) as YText;
			expect( titleAfter ).toBe( titleBefore );
			expect( yTextToString( titleAfter ) ).toBe( 'Updated' );

			// Plain value should be updated.
			expect( metadataAfter.getAttr( 'value' ) ).toBe( 'v2' );
		} );

		it( 'deletes removed properties from object+query Y.Map', () => {
			const blocks: Block[] = [
				{
					name: 'core/test-object-query',
					attributes: {
						metadata: {
							title: 'Keep',
							value: 'remove-me',
						},
					},
					innerBlocks: [],
					clientId: 'obj-query-2',
				},
			];

			mergeCrdtBlocks( yblocks, blocks, null );

			const attrs = yblocks
				?.get( 0 )
				?.getAttr( 'attributes' ) as YBlockAttributes;
			const metadata = attrs.getAttr( 'metadata' ) as YMap<
				Record< string, unknown >
			>;
			expect( metadata.getAttr( 'value' ) ).toBe( 'remove-me' );

			// Update without the value property.
			const updatedBlocks: Block[] = [
				{
					name: 'core/test-object-query',
					attributes: {
						metadata: {
							title: 'Keep',
						},
					},
					innerBlocks: [],
					clientId: 'obj-query-2',
				},
			];

			mergeCrdtBlocks( yblocks, updatedBlocks, null );

			expect( metadata.getAttr( 'value' ) ).toBeUndefined();
			expect(
				yTextToString( metadata.getAttr( 'title' ) as YText )
			).toBe( 'Keep' );
		} );

		it( 'upgrades plain value to Y.Map when schema requires it', () => {
			// Manually set up a block with a plain object attribute
			// where the schema expects object+query (Y.Map).
			const block = createYMap() as unknown as YBlock;
			block.setAttr( 'name' as any, 'core/test-object-query' );
			block.setAttr( 'clientId' as any, 'obj-upgrade' );
			block.setAttr( 'innerBlocks' as any, createYArray() );

			const attrs = createYMap();
			// Store metadata as a plain object (pre-migration).
			attrs.setAttr( 'metadata', { title: 'plain', value: 'old' } );
			block.setAttr( 'attributes' as any, attrs );

			doc.transact( () => {
				yblocks.push( [ block ] );
			} );

			// metadata should be a plain object currently.
			expect( isYMap( attrs.getAttr( 'metadata' ) ) ).toBe( false );

			// Merge, which should upgrade to Y.Map.
			const updatedBlocks: Block[] = [
				{
					name: 'core/test-object-query',
					attributes: {
						metadata: {
							title: 'upgraded',
							value: 'new',
						},
					},
					innerBlocks: [],
				},
			];

			mergeCrdtBlocks( yblocks, updatedBlocks, null );

			const metadataAfter = attrs.getAttr( 'metadata' );
			expect( isYMap( metadataAfter ) ).toBe( true );

			const metadataMap = metadataAfter as YMap<
				Record< string, unknown >
			>;
			expect( isYText( metadataMap.getAttr( 'title' ) ) ).toBe( true );
			expect(
				yTextToString( metadataMap.getAttr( 'title' ) as YText )
			).toBe( 'upgraded' );
			expect( metadataMap.getAttr( 'value' ) ).toBe( 'new' );
		} );
	} );

	describe( 'emoji handling', () => {
		// Emoji like 😀 (U+1F600) are surrogate pairs in UTF-16 (.length === 2).
		// The CRDT sync must preserve them without corruption (no U+FFFD / '�').

		it( 'preserves emoji in initial block content', () => {
			const blocks: Block[] = [
				{
					name: 'core/paragraph',
					attributes: { content: 'Hello 😀 World' },
					innerBlocks: [],
				},
			];

			mergeCrdtBlocks( yblocks, blocks, null );

			const block = yblocks.get( 0 );
			const content = block
				?.getAttr( 'attributes' )
				?.getAttr( 'content' );
			expect( toString( content ) ).toBe( 'Hello 😀 World' );
		} );

		it( 'handles inserting emoji into existing rich-text', () => {
			const initialBlocks: Block[] = [
				{
					name: 'core/paragraph',
					attributes: { content: 'Hello World' },
					innerBlocks: [],
					clientId: 'block-1',
				},
			];

			mergeCrdtBlocks( yblocks, initialBlocks, null );

			const updatedBlocks: Block[] = [
				{
					name: 'core/paragraph',
					attributes: { content: 'Hello 😀 World' },
					innerBlocks: [],
					clientId: 'block-1',
				},
			];

			// Cursor after 'Hello 😀' = 6 + 2 = 8
			mergeCrdtBlocks( yblocks, updatedBlocks, 8 );

			const block = yblocks.get( 0 );
			const content = block
				?.getAttr( 'attributes' )
				?.getAttr( 'content' );
			expect( toString( content ) ).toBe( 'Hello 😀 World' );
		} );

		it( 'handles deleting emoji from rich-text', () => {
			const initialBlocks: Block[] = [
				{
					name: 'core/paragraph',
					attributes: { content: 'Hello 😀 World' },
					innerBlocks: [],
					clientId: 'block-1',
				},
			];

			mergeCrdtBlocks( yblocks, initialBlocks, null );

			const updatedBlocks: Block[] = [
				{
					name: 'core/paragraph',
					attributes: { content: 'Hello  World' },
					innerBlocks: [],
					clientId: 'block-1',
				},
			];

			// Cursor at position 6 (after 'Hello ', emoji was deleted)
			mergeCrdtBlocks( yblocks, updatedBlocks, 6 );

			const block = yblocks.get( 0 );
			const content = block
				?.getAttr( 'attributes' )
				?.getAttr( 'content' );
			expect( toString( content ) ).toBe( 'Hello  World' );
		} );

		it( 'handles typing after emoji in rich-text', () => {
			const initialBlocks: Block[] = [
				{
					name: 'core/paragraph',
					attributes: { content: 'a😀b' },
					innerBlocks: [],
					clientId: 'block-1',
				},
			];

			mergeCrdtBlocks( yblocks, initialBlocks, null );

			const updatedBlocks: Block[] = [
				{
					name: 'core/paragraph',
					attributes: { content: 'a😀xb' },
					innerBlocks: [],
					clientId: 'block-1',
				},
			];

			// Cursor after 'a😀x' = 1 + 2 + 1 = 4
			mergeCrdtBlocks( yblocks, updatedBlocks, 4 );

			const block = yblocks.get( 0 );
			const content = block
				?.getAttr( 'attributes' )
				?.getAttr( 'content' );
			expect( toString( content ) ).toBe( 'a😀xb' );
		} );

		it( 'handles multiple emoji in rich-text updates', () => {
			const initialBlocks: Block[] = [
				{
					name: 'core/paragraph',
					attributes: { content: '😀🎉🚀' },
					innerBlocks: [],
					clientId: 'block-1',
				},
			];

			mergeCrdtBlocks( yblocks, initialBlocks, null );

			// Insert ' hello ' between first and second emoji
			const updatedBlocks: Block[] = [
				{
					name: 'core/paragraph',
					attributes: { content: '😀 hello 🎉🚀' },
					innerBlocks: [],
					clientId: 'block-1',
				},
			];

			// Cursor after '😀 hello ' = 2 + 7 = 9
			mergeCrdtBlocks( yblocks, updatedBlocks, 9 );

			const block = yblocks.get( 0 );
			const content = block
				?.getAttr( 'attributes' )
				?.getAttr( 'content' );
			expect( toString( content ) ).toBe( '😀 hello 🎉🚀' );
		} );
	} );

	describe( 'mergeRichTextUpdate - emoji handling', () => {
		let yText: YText;

		beforeEach( () => {
			// Start with empty Y.Text for each test
			yText = createYText();
			testMap.setAttr( 'text', yText );
		} );

		it( 'preserves emoji when appending text', () => {
			yText.insert( 0, '😀' );

			mergeRichTextUpdate( yText, '😀x' );

			expect( toString( yText ) ).toBe( '😀x' );
		} );

		it( 'preserves emoji when inserting before emoji', () => {
			yText.insert( 0, '😀' );

			mergeRichTextUpdate( yText, 'x😀' );

			expect( toString( yText ) ).toBe( 'x😀' );
		} );

		it( 'preserves emoji when replacing text around emoji', () => {
			yText.insert( 0, 'a😀b' );

			mergeRichTextUpdate( yText, 'a😀c', 4 );

			expect( toString( yText ) ).toBe( 'a😀c' );
		} );

		it( 'handles inserting emoji into plain text', () => {
			yText.insert( 0, 'ab' );

			mergeRichTextUpdate( yText, 'a😀b', 3 );

			expect( toString( yText ) ).toBe( 'a😀b' );
		} );

		it( 'handles deleting emoji', () => {
			yText.insert( 0, 'a😀b' );

			mergeRichTextUpdate( yText, 'ab', 1 );

			expect( toString( yText ) ).toBe( 'ab' );
		} );

		it( 'handles text with multiple emoji', () => {
			yText.insert( 0, 'Hello 😀 World 🎉' );

			mergeRichTextUpdate( yText, 'Hello 😀 Beautiful World 🎉', 19 );

			expect( toString( yText ) ).toBe( 'Hello 😀 Beautiful World 🎉' );
		} );

		it( 'handles compound emoji (flag emoji)', () => {
			// Flag emoji like 🏳️‍🌈 are compound and has .length === 6 in JavaScript
			yText.insert( 0, 'a🏳️‍🌈b' );

			mergeRichTextUpdate( yText, 'a🏳️‍🌈xb', 7 );

			expect( toString( yText ) ).toBe( 'a🏳️‍🌈xb' );
		} );

		it( 'handles emoji with skin tone modifier', () => {
			// 👋🏽 is U+1F44B U+1F3FD (wave + medium skin tone), .length === 4
			yText.insert( 0, 'Hi 👋🏽' );

			mergeRichTextUpdate( yText, 'Hi 👋🏽!', 6 );

			expect( toString( yText ) ).toBe( 'Hi 👋🏽!' );
		} );
	} );

	describe( 'supplementary plane characters (non-emoji)', () => {
		// Characters above U+FFFF are stored as surrogate pairs in UTF-16,
		// so .length === 2 per character. The diff library v8 counts them
		// as 1 grapheme cluster, causing the same mismatch as emoji.

		describe( 'mergeCrdtBlocks', () => {
			it( 'handles CJK Extension B characters (rare kanji)', () => {
				// 𠮷 (U+20BB7) is a real character used in Japanese names.
				// Surrogate pair: .length === 2.
				const initialBlocks: Block[] = [
					{
						name: 'core/paragraph',
						attributes: { content: '𠮷野家' },
						innerBlocks: [],
						clientId: 'block-1',
					},
				];

				mergeCrdtBlocks( yblocks, initialBlocks, null );

				const updatedBlocks: Block[] = [
					{
						name: 'core/paragraph',
						attributes: { content: '𠮷野家は美味しい' },
						innerBlocks: [],
						clientId: 'block-1',
					},
				];

				// Cursor after '𠮷野家は美味しい' = 2+1+1+1+1+1+1+1 = 9
				mergeCrdtBlocks( yblocks, updatedBlocks, 9 );

				const block = yblocks.get( 0 );
				const content = block
					?.getAttr( 'attributes' )
					?.getAttr( 'content' );
				expect( toString( content ) ).toBe( '𠮷野家は美味しい' );
			} );

			it( 'handles mathematical symbols from supplementary plane', () => {
				// 𝐀 (U+1D400) — .length === 2
				const initialBlocks: Block[] = [
					{
						name: 'core/paragraph',
						attributes: { content: 'Let 𝐀 be' },
						innerBlocks: [],
						clientId: 'block-1',
					},
				];

				mergeCrdtBlocks( yblocks, initialBlocks, null );

				const updatedBlocks: Block[] = [
					{
						name: 'core/paragraph',
						attributes: { content: 'Let 𝐀 be a matrix' },
						innerBlocks: [],
						clientId: 'block-1',
					},
				];

				mergeCrdtBlocks( yblocks, updatedBlocks, 18 );

				const block = yblocks.get( 0 );
				const content = block
					?.getAttr( 'attributes' )
					?.getAttr( 'content' );
				expect( toString( content ) ).toBe( 'Let 𝐀 be a matrix' );
			} );
		} );

		describe( 'mergeRichTextUpdate', () => {
			let yText: YText;

			beforeEach( () => {
				// Start with empty Y.Text for each test
				yText = createYText();
				testMap.setAttr( 'text', yText );
			} );

			it( 'preserves CJK Extension B characters when appending', () => {
				yText.insert( 0, '𠮷' );

				mergeRichTextUpdate( yText, '𠮷x' );

				expect( toString( yText ) ).toBe( '𠮷x' );
			} );

			it( 'handles inserting after CJK Extension B character', () => {
				yText.insert( 0, 'a𠮷b' );

				mergeRichTextUpdate( yText, 'a𠮷xb', 4 );

				expect( toString( yText ) ).toBe( 'a𠮷xb' );
			} );

			it( 'handles mathematical symbols from supplementary plane', () => {
				// 𝐀 (U+1D400) — .length === 2
				yText.insert( 0, 'a𝐀b' );

				mergeRichTextUpdate( yText, 'a𝐀xb', 4 );

				expect( toString( yText ) ).toBe( 'a𝐀xb' );
			} );

			it( 'handles mixed surrogate pairs and BMP text', () => {
				// 𠮷 (CJK Ext B) + 😀 (emoji) — both surrogate pairs
				yText.insert( 0, '𠮷😀' );

				mergeRichTextUpdate( yText, '𠮷😀!' );

				expect( toString( yText ) ).toBe( '𠮷😀!' );
			} );

			it( 'handles musical symbols (supplementary plane)', () => {
				// 𝄞 (U+1D11E, Musical Symbol G Clef) — .length === 2
				yText.insert( 0, 'a𝄞b' );

				mergeRichTextUpdate( yText, 'a𝄞xb', 4 );

				expect( toString( yText ) ).toBe( 'a𝄞xb' );
			} );
		} );
	} );
} );

describe( 'getCachedRichTextData', () => {
	let spy: ReturnType< typeof jest.spyOn >;

	beforeEach( () => {
		spy = jest.spyOn( RichTextData, 'fromHTMLString' );
	} );

	afterEach( () => {
		spy.mockRestore();
	} );

	it( 'does not call fromHTMLString again for the same HTML string', () => {
		getCachedRichTextData( '<strong>cached-hit</strong>' );
		getCachedRichTextData( '<strong>cached-hit</strong>' );

		expect( spy ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'calls fromHTMLString for each unique HTML string', () => {
		getCachedRichTextData( '<strong>cached-miss-a</strong>' );
		getCachedRichTextData( '<em>cached-miss-b</em>' );

		expect( spy ).toHaveBeenCalledTimes( 2 );
	} );

	it( 'calls fromHTMLString again for an evicted entry', () => {
		const cacheSize = 10;
		const getCachedValue = createRichTextDataCache( cacheSize );

		const firstString = 'eviction-test-first';

		getCachedValue( firstString );

		for ( let i = 1; i < cacheSize; i++ ) {
			getCachedValue( `eviction-test-${ i }` );
		}

		// This should push firstString out of the cache.
		getCachedValue( 'eviction-test-overflow' );

		spy.mockClear();

		// firstString was evicted, so fromHTMLString should be called again.
		getCachedValue( firstString );
		expect( spy ).toHaveBeenCalledTimes( 1 );

		// The overflow entry is still cached, so fromHTMLString should not be called.
		getCachedValue( 'eviction-test-overflow' );
		expect( spy ).toHaveBeenCalledTimes( 1 );
	} );
} );
