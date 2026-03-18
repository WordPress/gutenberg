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
			name: 'core/table',
			attributes: {
				hasFixedLayout: { type: 'boolean' },
				caption: { type: 'rich-text' },
				head: { type: 'array' },
				body: { type: 'array' },
				foot: { type: 'array' },
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
	type YBlocks,
	type YBlockAttributes,
} from '../crdt-blocks';

describe( 'crdt-blocks', () => {
	let doc: Y.Doc;
	let yblocks: Y.Array< YBlock >;

	beforeEach( () => {
		doc = new Y.Doc();
		yblocks = doc.getArray< YBlock >();
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
			expect( block.get( 'name' ) ).toBe( 'core/paragraph' );
			const content = (
				block.get( 'attributes' ) as YBlockAttributes
			 ).get( 'content' ) as Y.Text;
			expect( content.toString() ).toBe( 'Hello World' );
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
			const content = (
				block.get( 'attributes' ) as YBlockAttributes
			 ).get( 'content' ) as Y.Text;
			expect( content.toString() ).toBe( 'Updated content' );
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
			const content = (
				block.get( 'attributes' ) as YBlockAttributes
			 ).get( 'content' ) as Y.Text;
			expect( content.toString() ).toBe( 'Block 1' );
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
			const innerBlocks = block.get( 'innerBlocks' ) as YBlocks;
			expect( innerBlocks.length ).toBe( 1 );
			const innerBlock = innerBlocks.get( 0 );
			expect( innerBlock.get( 'name' ) ).toBe( 'core/paragraph' );
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
			expect( block.get( 'name' ) ).toBe( 'core/image' );
			const attrs = block.get( 'attributes' ) as YBlockAttributes;
			expect( attrs.get( 'url' ) ).toBe( 'http://example.com/image.jpg' );
			expect( attrs.has( 'blob' ) ).toBe( false );
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
			expect( gallery.get( 'name' ) ).toBe( 'core/gallery' );
			const innerBlocks = gallery.get( 'innerBlocks' ) as YBlocks;
			expect( innerBlocks.length ).toBe( 1 );
			const image = innerBlocks.get( 0 );
			const attrs = image.get( 'attributes' ) as YBlockAttributes;
			expect( attrs.get( 'url' ) ).toBe( 'http://example.com/image.jpg' );
			expect( attrs.has( 'blob' ) ).toBe( false );
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
			const content0 = (
				block0.get( 'attributes' ) as YBlockAttributes
			 ).get( 'content' ) as Y.Text;
			expect( content0.toString() ).toBe( 'Second' );

			const block1 = yblocks.get( 1 );
			const content1 = (
				block1.get( 'attributes' ) as YBlockAttributes
			 ).get( 'content' ) as Y.Text;
			expect( content1.toString() ).toBe( 'First' );
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
			const contentAttr = (
				block.get( 'attributes' ) as YBlockAttributes
			 ).get( 'content' ) as Y.Text;
			expect( contentAttr ).toBeInstanceOf( Y.Text );
			expect( contentAttr.toString() ).toBe( 'Rich text content' );
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
			const contentAttr = (
				block.get( 'attributes' ) as YBlockAttributes
			 ).get( 'content' );
			expect( block.get( 'name' ) ).toBe( 'core/freeform' );
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
			const updatedContentAttr = (
				updatedBlock.get( 'attributes' ) as YBlockAttributes
			 ).get( 'content' ) as Y.Text;
			expect( updatedBlock.get( 'name' ) ).toBe( 'core/paragraph' );
			expect( updatedContentAttr ).toBeInstanceOf( Y.Text );
			expect( updatedContentAttr.toString() ).toBe( 'Updated text' );
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
			const clientId1 = block0.get( 'clientId' );
			const block1 = yblocks.get( 1 );
			const clientId2 = block1.get( 'clientId' );

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
			const attributes = block.get( 'attributes' ) as YBlockAttributes;
			expect( attributes.has( 'level' ) ).toBe( false );
			expect( attributes.has( 'content' ) ).toBe( true );
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
			const content = (
				block.get( 'attributes' ) as YBlockAttributes
			 ).get( 'content' ) as Y.Text;
			expect( content.toString() ).toBe( 'Updated Middle' );
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
			const attributes = block.get( 'attributes' ) as YBlockAttributes;

			// The content attribute should now exist
			expect( attributes.has( 'content' ) ).toBe( true );
			const content = attributes.get( 'content' ) as Y.Text;
			expect( content.toString() ).toBe( 'New content added' );

			// The level attribute should still exist
			expect( attributes.get( 'level' ) ).toBe( 1 );
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
			const content1 = (
				block1.get( 'attributes' ) as YBlockAttributes
			 ).get( 'content' );
			expect( block1.get( 'name' ) ).toBe( 'core/freeform' );
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
			const content2 = (
				block2.get( 'attributes' ) as YBlockAttributes
			 ).get( 'content' ) as Y.Text;
			expect( block2.get( 'name' ) ).toBe( 'core/paragraph' );
			expect( content2 ).toBeInstanceOf( Y.Text );
			expect( content2.toString() ).toBe( 'Freeform content' );
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
			expect( groupBlock.get( 'name' ) ).toBe( 'core/group' );

			const innerBlocks = groupBlock.get( 'innerBlocks' ) as YBlocks;
			expect( innerBlocks.length ).toBe( 1 );
			const gallery = innerBlocks.get( 0 );
			const galleryInner = gallery.get( 'innerBlocks' ) as YBlocks;
			expect( galleryInner.length ).toBe( 1 );
			const image = galleryInner.get( 0 );
			const attrs = image.get( 'attributes' ) as YBlockAttributes;
			expect( attrs.get( 'url' ) ).toBe( 'http://example.com/image.jpg' );
			expect( attrs.has( 'blob' ) ).toBe( false );
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
				const content = (
					block.get( 'attributes' ) as YBlockAttributes
				 ).get( 'content' ) as Y.Text;
				expect( content.toString() ).toBe( expectedContent );
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
			const content0 = (
				yblocks.get( 0 ).get( 'attributes' ) as YBlockAttributes
			 ).get( 'content' ) as Y.Text;
			expect( content0.toString() ).toBe( 'Block 0' );
			const content1 = (
				yblocks.get( 1 ).get( 'attributes' ) as YBlockAttributes
			 ).get( 'content' ) as Y.Text;
			expect( content1.toString() ).toBe( 'Block 9' );
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
			manyBlocks.forEach( ( block, i ) => {
				const yblock = yblocks.get( i );
				const content = (
					yblock.get( 'attributes' ) as YBlockAttributes
				 ).get( 'content' ) as Y.Text;
				expect( content.toString() ).toBe( `Block ${ i }` );
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
				const content = (
					yblocks.get( i ).get( 'attributes' ) as YBlockAttributes
				 ).get( 'content' ) as Y.Text;
				expect( content.toString() ).toBe( expected );
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
			let current: YBlocks | YBlock = yblocks;
			for ( let i = 0; i < 4; i++ ) {
				expect( ( current as YBlocks ).length ).toBe( 1 );
				current = ( current as YBlocks ).get( 0 );
				current = ( current as YBlock ).get( 'innerBlocks' ) as YBlocks;
			}

			expect( ( current as YBlocks ).length ).toBe( 1 );
			const deepBlock = ( current as YBlocks ).get( 0 );
			const content = (
				deepBlock.get( 'attributes' ) as YBlockAttributes
			 ).get( 'content' ) as Y.Text;
			expect( content.toString() ).toBe( 'Deep content' );

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
				current = ( current as YBlocks ).get( 0 );
				current = ( current as YBlock ).get( 'innerBlocks' ) as YBlocks;
			}
			const updatedBlock = ( current as YBlocks ).get( 0 );
			const updatedContent = (
				updatedBlock.get( 'attributes' ) as YBlockAttributes
			 ).get( 'content' ) as Y.Text;
			expect( updatedContent.toString() ).toBe( 'Updated deep' );
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
			const attributes = block.get( 'attributes' ) as YBlockAttributes;
			expect( attributes.get( 'content' ) ).toBeInstanceOf( Y.Text );
			expect( attributes.get( 'customAttr' ) ).toBe( null );
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
			const content = (
				block.get( 'attributes' ) as YBlockAttributes
			 ).get( 'content' ) as Y.Text;
			expect( content.toString() ).toBe( 'XHello World' );
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
			const content = (
				block.get( 'attributes' ) as YBlockAttributes
			 ).get( 'content' ) as Y.Text;
			expect( content.toString() ).toBe( 'Hello World!' );
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
			const content = (
				block.get( 'attributes' ) as YBlockAttributes
			 ).get( 'content' ) as Y.Text;
			expect( content.toString() ).toBe( 'Hello World' );
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
			expect( block1.get( 'isValid' ) ).toBe( true );
			expect( block1.get( 'originalContent' ) ).toBe( 'Original' );

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
			expect( block2.has( 'isValid' ) ).toBe( false );
			expect( block2.has( 'originalContent' ) ).toBe( false );
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
			const attrs1 = block1.get( 'attributes' ) as YBlockAttributes;
			expect( attrs1.has( 'content' ) ).toBe( true );
			expect( attrs1.has( 'caption' ) ).toBe( true );

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
			const attrs2 = block2.get( 'attributes' ) as YBlockAttributes;
			expect( attrs2.has( 'content' ) ).toBe( true );
			expect( attrs2.has( 'caption' ) ).toBe( false );
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

			const yblocks2 = doc2.getArray< YBlock >();
			expect( yblocks2.length ).toBe( 1 );

			const block = yblocks2.get( 0 );
			const attrs = block.get( 'attributes' ) as YBlockAttributes;
			const body = attrs.get( 'body' ) as {
				cells: { content: string; tag: string }[];
			}[];

			expect( body ).toHaveLength( 2 );
			expect( body[ 0 ].cells[ 0 ].content ).toBe( '1' );
			expect( body[ 0 ].cells[ 1 ].content ).toBe( '2' );
			expect( body[ 1 ].cells[ 0 ].content ).toBe( '3' );
			expect( body[ 1 ].cells[ 1 ].content ).toBe( '4' );

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

			const yblocks2 = doc2.getArray< YBlock >();
			const block = yblocks2.get( 0 );
			const attrs = block.get( 'attributes' ) as YBlockAttributes;

			const head = attrs.get( 'head' ) as {
				cells: { content: string }[];
			}[];
			expect( head[ 0 ].cells[ 0 ].content ).toBe(
				'<strong>Header</strong>'
			);

			const body = attrs.get( 'body' ) as {
				cells: { content: string }[];
			}[];
			expect( body[ 0 ].cells[ 0 ].content ).toBe(
				'<a href="https://example.com">Link</a>'
			);

			doc2.destroy();
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
			const content = (
				block.get( 'attributes' ) as YBlockAttributes
			 ).get( 'content' ) as Y.Text;
			expect( content.toString() ).toBe( 'Hello 😀 World' );
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
			const content = (
				block.get( 'attributes' ) as YBlockAttributes
			 ).get( 'content' ) as Y.Text;
			expect( content.toString() ).toBe( 'Hello 😀 World' );
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
			const content = (
				block.get( 'attributes' ) as YBlockAttributes
			 ).get( 'content' ) as Y.Text;
			expect( content.toString() ).toBe( 'Hello  World' );
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
			const content = (
				block.get( 'attributes' ) as YBlockAttributes
			 ).get( 'content' ) as Y.Text;
			expect( content.toString() ).toBe( 'a😀xb' );
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
			const content = (
				block.get( 'attributes' ) as YBlockAttributes
			 ).get( 'content' ) as Y.Text;
			expect( content.toString() ).toBe( '😀 hello 🎉🚀' );
		} );
	} );

	describe( 'mergeRichTextUpdate - emoji handling', () => {
		it( 'preserves emoji when appending text', () => {
			const yText = doc.getText( 'test' );
			yText.insert( 0, '😀' );

			mergeRichTextUpdate( yText, '😀x' );

			expect( yText.toString() ).toBe( '😀x' );
		} );

		it( 'preserves emoji when inserting before emoji', () => {
			const yText = doc.getText( 'test' );
			yText.insert( 0, '😀' );

			mergeRichTextUpdate( yText, 'x😀' );

			expect( yText.toString() ).toBe( 'x😀' );
		} );

		it( 'preserves emoji when replacing text around emoji', () => {
			const yText = doc.getText( 'test' );
			yText.insert( 0, 'a😀b' );

			mergeRichTextUpdate( yText, 'a😀c', 4 );

			expect( yText.toString() ).toBe( 'a😀c' );
		} );

		it( 'handles inserting emoji into plain text', () => {
			const yText = doc.getText( 'test' );
			yText.insert( 0, 'ab' );

			mergeRichTextUpdate( yText, 'a😀b', 3 );

			expect( yText.toString() ).toBe( 'a😀b' );
		} );

		it( 'handles deleting emoji', () => {
			const yText = doc.getText( 'test' );
			yText.insert( 0, 'a😀b' );

			mergeRichTextUpdate( yText, 'ab', 1 );

			expect( yText.toString() ).toBe( 'ab' );
		} );

		it( 'handles text with multiple emoji', () => {
			const yText = doc.getText( 'test' );
			yText.insert( 0, 'Hello 😀 World 🎉' );

			mergeRichTextUpdate( yText, 'Hello 😀 Beautiful World 🎉', 19 );

			expect( yText.toString() ).toBe( 'Hello 😀 Beautiful World 🎉' );
		} );

		it( 'handles compound emoji (flag emoji)', () => {
			// Flag emoji like 🏳️‍🌈 are compound and has .length === 6 in JavaScript
			const yText = doc.getText( 'test' );
			yText.insert( 0, 'a🏳️‍🌈b' );

			mergeRichTextUpdate( yText, 'a🏳️‍🌈xb', 7 );

			expect( yText.toString() ).toBe( 'a🏳️‍🌈xb' );
		} );

		it( 'handles emoji with skin tone modifier', () => {
			// 👋🏽 is U+1F44B U+1F3FD (wave + medium skin tone), .length === 4
			const yText = doc.getText( 'test' );
			yText.insert( 0, 'Hi 👋🏽' );

			mergeRichTextUpdate( yText, 'Hi 👋🏽!', 6 );

			expect( yText.toString() ).toBe( 'Hi 👋🏽!' );
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
				const content = (
					block.get( 'attributes' ) as YBlockAttributes
				 ).get( 'content' ) as Y.Text;
				expect( content.toString() ).toBe( '𠮷野家は美味しい' );
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
				const content = (
					block.get( 'attributes' ) as YBlockAttributes
				 ).get( 'content' ) as Y.Text;
				expect( content.toString() ).toBe( 'Let 𝐀 be a matrix' );
			} );
		} );

		describe( 'mergeRichTextUpdate', () => {
			it( 'preserves CJK Extension B characters when appending', () => {
				const yText = doc.getText( 'test' );
				yText.insert( 0, '𠮷' );

				mergeRichTextUpdate( yText, '𠮷x' );

				expect( yText.toString() ).toBe( '𠮷x' );
			} );

			it( 'handles inserting after CJK Extension B character', () => {
				const yText = doc.getText( 'test' );
				yText.insert( 0, 'a𠮷b' );

				mergeRichTextUpdate( yText, 'a𠮷xb', 4 );

				expect( yText.toString() ).toBe( 'a𠮷xb' );
			} );

			it( 'handles mathematical symbols from supplementary plane', () => {
				// 𝐀 (U+1D400) — .length === 2
				const yText = doc.getText( 'test' );
				yText.insert( 0, 'a𝐀b' );

				mergeRichTextUpdate( yText, 'a𝐀xb', 4 );

				expect( yText.toString() ).toBe( 'a𝐀xb' );
			} );

			it( 'handles mixed surrogate pairs and BMP text', () => {
				// 𠮷 (CJK Ext B) + 😀 (emoji) — both surrogate pairs
				const yText = doc.getText( 'test' );
				yText.insert( 0, '𠮷😀' );

				mergeRichTextUpdate( yText, '𠮷😀!' );

				expect( yText.toString() ).toBe( '𠮷😀!' );
			} );

			it( 'handles musical symbols (supplementary plane)', () => {
				// 𝄞 (U+1D11E, Musical Symbol G Clef) — .length === 2
				const yText = doc.getText( 'test' );
				yText.insert( 0, 'a𝄞b' );

				mergeRichTextUpdate( yText, 'a𝄞xb', 4 );

				expect( yText.toString() ).toBe( 'a𝄞xb' );
			} );
		} );
	} );
} );
