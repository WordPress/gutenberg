/**
 * External dependencies
 */
import { describe, expect, it, jest, beforeEach } from '@jest/globals';

/**
 * Mock uuid module
 */
jest.mock( 'uuid', () => ( {
	// eslint-disable-next-line no-restricted-syntax
	v4: jest.fn( () => 'mocked-uuid-' + Math.random() ),
} ) );

/**
 * Mock lib0/math
 */
jest.mock( 'lib0/math', () => ( {
	// eslint-disable-next-line no-restricted-syntax
	uint32: jest.fn( () => Math.floor( Math.random() * 0xffffffff ) ),
	min: jest.fn( ( a: number, b: number ) => Math.min( a, b ) ),
	max: jest.fn( ( a: number, b: number ) => Math.max( a, b ) ),
} ) );

/**
 * Mock lib0/function
 */
jest.mock( 'lib0/function', () => ( {
	callAll: jest.fn( ( ...args: any[] ) => {
		args.forEach( ( fn: any ) => typeof fn === 'function' && fn() );
	} ),
	equalityDeep: jest.fn( ( a: any, b: any ) => {
		return JSON.stringify( a ) === JSON.stringify( b );
	} ),
} ) );

/**
 * Mock @wordpress/rich-text
 */
jest.mock( '@wordpress/rich-text', () => {
	class MockRichTextData {
		private text: string = '';

		toString() {
			return this.text;
		}
		toJSON() {
			return this.text;
		}
		valueOf() {
			return this.text;
		}
	}

	return {
		__experimentalRichText: MockRichTextData,
		RichTextData: MockRichTextData,
		store: jest.fn(),
		create: jest.fn(
			( { text }: { text: string } ) => new MockRichTextData( text )
		),
	};
} );

/**
 * Mock @wordpress/blocks
 */
jest.mock( '@wordpress/blocks', () => ( {
	store: jest.fn(),
	getBlockType: jest.fn( ( blockName: string ) => {
		const richTextAttributes = [ 'content', 'citation', 'value', 'text' ];
		return {
			name: blockName,
			attributes: richTextAttributes.reduce(
				( acc: Record< string, any >, attr: string ) => {
					acc[ attr ] = { type: 'rich-text' };
					return acc;
				},
				{}
			),
		};
	} ),
	getBlockTypes: jest.fn( () => {
		const richTextAttributes = [ 'content', 'citation', 'value', 'text' ];
		return [
			'core/paragraph',
			'core/heading',
			'core/list',
			'core/quote',
			'core/image',
			'core/gallery',
			'core/group',
		].map( ( name ) => ( {
			name,
			attributes: richTextAttributes.reduce(
				( acc: Record< string, any >, attr: string ) => {
					acc[ attr ] = { type: 'rich-text' };
					return acc;
				},
				{}
			),
		} ) );
	} ),
} ) );

/**
 * Mock @wordpress/sync - Yjs implementation
 */
jest.mock( '@wordpress/sync', () => {
	class MockYMap {
		private data: Map< string, any > = new Map();

		constructor( entries?: Array< [ string, any ] > ) {
			if ( entries ) {
				entries.forEach( ( [ key, value ] ) =>
					this.data.set( key, value )
				);
			}
		}

		get( key: string ): any {
			return this.data.get( key );
		}

		set( key: string, value: any ): void {
			this.data.set( key, value );
		}

		delete( key: string ): void {
			this.data.delete( key );
		}

		has( key: string ): boolean {
			return this.data.has( key );
		}

		forEach( callback: ( value: any, key: string ) => void ): void {
			this.data.forEach( callback );
		}

		toJSON(): any {
			const result: any = {};
			this.data.forEach( ( value, key ) => {
				if ( value && typeof value.toJSON === 'function' ) {
					result[ key ] = value.toJSON();
				} else {
					result[ key ] = value;
				}
			} );
			return result;
		}
	}

	class MockYArray {
		private data: any[] = [];

		push( items: any[] ): void {
			this.data.push( ...items );
		}

		insert( index: number, items: any[] ): void {
			this.data.splice( index, 0, ...items );
		}

		delete( index: number, length: number = 1 ): void {
			this.data.splice( index, length );
		}

		get( index: number ): any {
			return this.data[ index ];
		}

		get length(): number {
			return this.data.length;
		}

		slice( start?: number, end?: number ): any[] {
			return this.data.slice( start, end );
		}

		toJSON(): any[] {
			return this.data.map( ( item ) => {
				if ( item && typeof item.toJSON === 'function' ) {
					return item.toJSON();
				}
				return item;
			} );
		}
	}

	class MockYText {
		private text: string = '';

		constructor( text: string = '' ) {
			this.text = text;
		}

		toString(): string {
			return this.text;
		}

		insert( index: number, text: string ): void {
			this.text =
				this.text.slice( 0, index ) + text + this.text.slice( index );
		}

		delete( index: number, length: number ): void {
			this.text =
				this.text.slice( 0, index ) + this.text.slice( index + length );
		}

		toJSON(): string {
			return this.text;
		}
	}

	return {
		Y: {
			Map: MockYMap,
			Array: MockYArray,
			Text: MockYText,
		},
		createSyncManager: jest.fn(),
	};
} );

/**
 * Internal dependencies
 */
import {
	mergeCrdtBlocks,
	type Block,
	type YBlock,
	type YBlockAttributes,
} from '../crdt-blocks';

/**
 * WordPress dependencies
 */
import { Y } from '@wordpress/sync';

describe( 'crdt-blocks', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	describe( 'mergeCrdtBlocks', () => {
		it( 'inserts new blocks into empty Y.Array', () => {
			const yblocks = new Y.Array();
			const incomingBlocks: Block[] = [
				{
					name: 'core/paragraph',
					attributes: { content: 'Hello World' },
					innerBlocks: [],
				},
			];

			mergeCrdtBlocks( yblocks as any, incomingBlocks, null );

			expect( yblocks.length ).toBe( 1 );
			const block = yblocks.get( 0 ) as YBlock;
			expect( block.get( 'name' ) ).toBe( 'core/paragraph' );
			const content = (
				block.get( 'attributes' ) as YBlockAttributes
			 ).get( 'content' ) as Y.Text;
			expect( content.toString() ).toBe( 'Hello World' );
		} );

		it( 'updates existing blocks when content changes', () => {
			const yblocks = new Y.Array();
			const initialBlocks: Block[] = [
				{
					name: 'core/paragraph',
					attributes: { content: 'Initial content' },
					innerBlocks: [],
					clientId: 'block-1',
				},
			];

			mergeCrdtBlocks( yblocks as any, initialBlocks, null );

			const updatedBlocks: Block[] = [
				{
					name: 'core/paragraph',
					attributes: { content: 'Updated content' },
					innerBlocks: [],
					clientId: 'block-1',
				},
			];

			mergeCrdtBlocks( yblocks as any, updatedBlocks, null );

			expect( yblocks.length ).toBe( 1 );
			const block = yblocks.get( 0 ) as YBlock;
			const content = (
				block.get( 'attributes' ) as YBlockAttributes
			 ).get( 'content' ) as Y.Text;
			expect( content.toString() ).toBe( 'Updated content' );
		} );

		it( 'deletes blocks that are removed', () => {
			const yblocks = new Y.Array();
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

			mergeCrdtBlocks( yblocks as any, initialBlocks, null );
			expect( yblocks.length ).toBe( 2 );

			const updatedBlocks: Block[] = [
				{
					name: 'core/paragraph',
					attributes: { content: 'Block 1' },
					innerBlocks: [],
					clientId: 'block-1',
				},
			];

			mergeCrdtBlocks( yblocks as any, updatedBlocks, null );

			expect( yblocks.length ).toBe( 1 );
			const block = yblocks.get( 0 ) as YBlock;
			const content = (
				block.get( 'attributes' ) as YBlockAttributes
			 ).get( 'content' ) as Y.Text;
			expect( content.toString() ).toBe( 'Block 1' );
		} );

		it( 'handles innerBlocks recursively', () => {
			const yblocks = new Y.Array();
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

			mergeCrdtBlocks( yblocks as any, blocksWithInner, null );

			expect( yblocks.length ).toBe( 1 );
			const block = yblocks.get( 0 ) as YBlock;
			const innerBlocks = block.get( 'innerBlocks' ) as Y.Array< YBlock >;
			expect( innerBlocks.length ).toBe( 1 );
			const innerBlock = innerBlocks.get( 0 ) as YBlock;
			expect( innerBlock.get( 'name' ) ).toBe( 'core/paragraph' );
		} );

		it( 'skips gallery blocks with unuploaded images (blob attributes)', () => {
			const yblocks = new Y.Array();
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

			mergeCrdtBlocks( yblocks as any, galleryWithBlobs, null );

			// Gallery block should not be synced because it has blob attributes
			expect( yblocks.length ).toBe( 0 );
		} );

		it( 'syncs gallery blocks without blob attributes', () => {
			const yblocks = new Y.Array();
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

			mergeCrdtBlocks( yblocks as any, galleryWithoutBlobs, null );

			expect( yblocks.length ).toBe( 1 );
			const block = yblocks.get( 0 ) as YBlock;
			expect( block.get( 'name' ) ).toBe( 'core/gallery' );
		} );

		it( 'handles block reordering', () => {
			const yblocks = new Y.Array();
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

			mergeCrdtBlocks( yblocks as any, initialBlocks, null );

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

			mergeCrdtBlocks( yblocks as any, reorderedBlocks, null );

			expect( yblocks.length ).toBe( 2 );
			const block0 = yblocks.get( 0 ) as YBlock;
			const content0 = (
				block0.get( 'attributes' ) as YBlockAttributes
			 ).get( 'content' ) as Y.Text;
			expect( content0.toString() ).toBe( 'Second' );

			const block1 = yblocks.get( 1 ) as YBlock;
			const content1 = (
				block1.get( 'attributes' ) as YBlockAttributes
			 ).get( 'content' ) as Y.Text;
			expect( content1.toString() ).toBe( 'First' );
		} );

		it( 'creates Y.Text for rich-text attributes', () => {
			const yblocks = new Y.Array();
			const blocks: Block[] = [
				{
					name: 'core/paragraph',
					attributes: { content: 'Rich text content' },
					innerBlocks: [],
				},
			];

			mergeCrdtBlocks( yblocks as any, blocks, null );

			const block = yblocks.get( 0 ) as YBlock;
			const contentAttr = (
				block.get( 'attributes' ) as YBlockAttributes
			 ).get( 'content' ) as Y.Text;
			expect( contentAttr.toString() ).toBe( 'Rich text content' );
		} );

		it( 'removes duplicate clientIds', () => {
			const yblocks = new Y.Array();
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

			mergeCrdtBlocks( yblocks as any, blocksWithDuplicateIds, null );

			const block0 = yblocks.get( 0 ) as YBlock;
			const clientId1 = block0.get( 'clientId' );
			const block1 = yblocks.get( 1 ) as YBlock;
			const clientId2 = block1.get( 'clientId' );

			expect( clientId1 ).not.toBe( clientId2 );
		} );

		it( 'handles attribute deletion', () => {
			const yblocks = new Y.Array();
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

			mergeCrdtBlocks( yblocks as any, initialBlocks, null );

			const updatedBlocks: Block[] = [
				{
					name: 'core/heading',
					attributes: {
						content: 'Heading',
					},
					innerBlocks: [],
				},
			];

			mergeCrdtBlocks( yblocks as any, updatedBlocks, null );

			const block = yblocks.get( 0 ) as YBlock;
			const attributes = block.get( 'attributes' ) as YBlockAttributes;
			expect( attributes.has( 'level' ) ).toBe( false );
			expect( attributes.has( 'content' ) ).toBe( true );
		} );

		it( 'preserves blocks that match from both left and right', () => {
			const yblocks = new Y.Array();
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

			mergeCrdtBlocks( yblocks as any, initialBlocks, null );

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

			mergeCrdtBlocks( yblocks as any, updatedBlocks, null );

			expect( yblocks.length ).toBe( 3 );
			const block = yblocks.get( 1 ) as YBlock;
			const content = (
				block.get( 'attributes' ) as YBlockAttributes
			 ).get( 'content' ) as Y.Text;
			expect( content.toString() ).toBe( 'Updated Middle' );
		} );
	} );
} );
