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
	],
} ) );

/**
 * Internal dependencies
 */
import {
	mergeCrdtBlocks,
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

		it( 'skips gallery blocks with unuploaded images (blob attributes)', () => {
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

			// Gallery block should not be synced because it has blob attributes
			expect( yblocks.length ).toBe( 0 );
		} );

		it( 'syncs gallery blocks without blob attributes', () => {
			const galleryWithoutBlobs: Block[] = [
				{
					name: 'core/gallery',
					attributes: {},
					innerBlocks: [
						{
							name: 'core/image',
							attributes: {
								url: 'http://example.com/image.jpg',
							},
							innerBlocks: [],
						},
					],
				},
			];

			mergeCrdtBlocks( yblocks, galleryWithoutBlobs, null );

			expect( yblocks.length ).toBe( 1 );
			const block = yblocks.get( 0 );
			expect( block.get( 'name' ) ).toBe( 'core/gallery' );
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

		it( 'syncs nested blocks with blob attributes', () => {
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
			expect( innerBlocks.get( 0 ).get( 'name' ) ).toBe( 'core/gallery' );
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
} );
