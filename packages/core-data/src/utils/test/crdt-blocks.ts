/**
 * WordPress dependencies
 */
import { Y } from '@wordpress/sync';

/**
 * External dependencies
 */
import { describe, expect, it, jest, beforeEach } from '@jest/globals';

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
			expect( contentAttr.toString() ).toBe( 'Rich text content' );
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
	} );
} );
