/**
 * External dependencies
 */
import { Y } from '@wordpress/sync';
import { renderHook } from '@testing-library/react';

/**
 * Internal dependencies
 */
import {
	getBlockPathInYdoc,
	getContainingBlockYMap,
	resolveBlockClientIdByPath,
	usePostContentBlocks,
} from '../block-lookup';

import type { EditorStoreBlock } from '../block-lookup';

type MockBlock = EditorStoreBlock & {
	name: string;
	innerBlocks: MockBlock[];
};

let mockGetClientIdsTree: jest.Mock;

function mockFlattenBlocks( blocks: MockBlock[] ): MockBlock[] {
	return blocks.flatMap( ( b ) => [
		b,
		...mockFlattenBlocks( b.innerBlocks ),
	] );
}

jest.mock( '../../lock-unlock', () => ( {
	unlock: ( obj: any ) => obj,
} ) );

jest.mock( '@wordpress/data', () => ( {
	useSelect: ( selector: Function ) =>
		selector( () => ( {
			getClientIdsTree: ( ...args: any[] ) =>
				mockGetClientIdsTree( ...args ),
			getBlocksByName: ( blockName: string ) =>
				mockFlattenBlocks( mockGetClientIdsTree( '' ) )
					.filter( ( b ) => b.name === blockName )
					.map( ( b ) => b.clientId ),
		} ) ),
} ) );

jest.mock( '@wordpress/block-editor', () => ( {
	store: 'core/block-editor',
} ) );

/**
 * Create a Y.Map block with a clientId and empty innerBlocks, matching the
 * shape used by the Yjs block tree.
 *
 * @param clientId Block client ID.
 */
function createTestYBlock( clientId: string ): Y.Map< any > {
	const block = new Y.Map< any >();
	block.set( 'clientId', clientId );
	block.set( 'innerBlocks', new Y.Array< Y.Map< any > >() );
	return block;
}

/**
 * Create a Y.Map block with a clientId and the given innerBlocks array,
 * for blocks that need pre-populated children.
 *
 * @param clientId    Block client ID.
 * @param innerBlocks A Y.Array to use as the block's innerBlocks.
 */
function createTestYBlockWithInner(
	clientId: string,
	innerBlocks: Y.Array< Y.Map< any > >
): Y.Map< any > {
	const block = new Y.Map< any >();
	block.set( 'clientId', clientId );
	block.set( 'innerBlocks', innerBlocks );
	return block;
}

/**
 * Helper to create a Y.Doc with a flat list of blocks, each having a
 * `clientId` and an empty `innerBlocks` Y.Array.
 *
 * @param count Number of root blocks to create.
 * @return The Y.Doc and the root blocks Y.Array.
 */
function createFlatYDoc( count: number ) {
	const ydoc = new Y.Doc();
	const rootMap = ydoc.getMap( 'test' );
	const blocks = new Y.Array< Y.Map< any > >();
	rootMap.set( 'blocks', blocks );

	const yBlocks: Y.Map< any >[] = [];
	for ( let i = 0; i < count; i++ ) {
		yBlocks.push( createTestYBlock( `block-${ i }` ) );
	}
	blocks.push( yBlocks );

	return { ydoc, blocks };
}

/**
 * Helper to create a Y.Doc with nested blocks.
 *
 * Creates `rootCount` root blocks, then adds `innerCount` inner blocks
 * to the block at index `parentIndex`.
 * @param root0
 * @param root0.rootCount
 * @param root0.parentIndex
 * @param root0.innerCount
 */
function createNestedYDoc( {
	rootCount,
	parentIndex,
	innerCount,
}: {
	rootCount: number;
	parentIndex: number;
	innerCount: number;
} ) {
	const ydoc = new Y.Doc();
	const rootMap = ydoc.getMap( 'test' );
	const rootBlocks = new Y.Array< Y.Map< any > >();
	rootMap.set( 'blocks', rootBlocks );

	const yRootBlocks: Y.Map< any >[] = [];
	for ( let i = 0; i < rootCount; i++ ) {
		yRootBlocks.push( createTestYBlock( `root-${ i }` ) );
	}
	rootBlocks.push( yRootBlocks );

	// Add inner blocks to the specified parent.
	const parentBlock = rootBlocks.get( parentIndex );
	const innerBlocksArray = parentBlock.get( 'innerBlocks' ) as Y.Array<
		Y.Map< any >
	>;

	const yInnerBlocks: Y.Map< any >[] = [];
	for ( let j = 0; j < innerCount; j++ ) {
		yInnerBlocks.push(
			createTestYBlock( `inner-${ parentIndex }-${ j }` )
		);
	}
	innerBlocksArray.push( yInnerBlocks );

	return { ydoc, rootBlocks, innerBlocksArray };
}

describe( 'getBlockPathInYdoc', () => {
	it( 'should return path [0] for the first root block', () => {
		const { blocks } = createFlatYDoc( 3 );
		const firstBlock = blocks.get( 0 );

		expect( getBlockPathInYdoc( firstBlock ) ).toEqual( [ 0 ] );
	} );

	it( 'should return path [2] for the third root block', () => {
		const { blocks } = createFlatYDoc( 3 );
		const thirdBlock = blocks.get( 2 );

		expect( getBlockPathInYdoc( thirdBlock ) ).toEqual( [ 2 ] );
	} );

	it( 'should return a nested path for an inner block', () => {
		const { innerBlocksArray } = createNestedYDoc( {
			rootCount: 2,
			parentIndex: 1,
			innerCount: 3,
		} );

		// Second inner block of the second root block → [1, 1]
		const innerBlock = innerBlocksArray.get( 1 );
		expect( getBlockPathInYdoc( innerBlock ) ).toEqual( [ 1, 1 ] );
	} );

	it( 'should return [parentIndex, 0] for the first inner block', () => {
		const { innerBlocksArray } = createNestedYDoc( {
			rootCount: 3,
			parentIndex: 0,
			innerCount: 2,
		} );

		const firstInner = innerBlocksArray.get( 0 );
		expect( getBlockPathInYdoc( firstInner ) ).toEqual( [ 0, 0 ] );
	} );

	it( 'should return null for a Y.Map without a parent array', () => {
		const orphan = new Y.Map< any >();
		orphan.set( 'clientId', 'orphan' );

		expect( getBlockPathInYdoc( orphan ) ).toBeNull();
	} );

	it( 'should handle deeply nested blocks', () => {
		// Build a 3-level deep structure so the target block is at [2, 7, 1].
		const ydoc = new Y.Doc();
		const rootMap = ydoc.getMap( 'test' );
		const rootBlocks = new Y.Array< Y.Map< any > >();
		rootMap.set( 'blocks', rootBlocks );

		// 3 root blocks — the target parent is at index 2.
		const innerArray = new Y.Array< Y.Map< any > >();
		rootBlocks.push( [
			createTestYBlock( 'root-0' ),
			createTestYBlock( 'root-1' ),
			createTestYBlockWithInner( 'root-2', innerArray ),
		] );

		// 8 inner blocks inside root-2 — the target parent is at index 7.
		const grandchildArray = new Y.Array< Y.Map< any > >();
		const fillerInners: Y.Map< any >[] = [];
		for ( let i = 0; i < 7; i++ ) {
			fillerInners.push( createTestYBlock( `inner-${ i }` ) );
		}
		innerArray.push( [
			...fillerInners,
			createTestYBlockWithInner( 'inner-7', grandchildArray ),
		] );

		// 2 grandchildren inside inner-7 — the target is at index 1.
		const grandchild = createTestYBlock( 'target' );
		grandchildArray.push( [
			createTestYBlock( 'grandchild-0' ),
			grandchild,
		] );

		expect( getBlockPathInYdoc( grandchild ) ).toEqual( [ 2, 7, 1 ] );
	} );
} );

describe( 'getContainingBlockYMap', () => {
	it( 'should find the containing block for direct rich text content', () => {
		const block = createTestYBlock( 'block' );
		const attributes = new Y.Map< any >();
		const text = new Y.Text( 'Direct text' );
		attributes.set( 'content', text );
		block.set( 'attributes', attributes );

		const ydoc = new Y.Doc();
		const rootMap = ydoc.getMap( 'test' );
		const blocks = new Y.Array< Y.Map< any > >();
		rootMap.set( 'blocks', blocks );
		blocks.push( [ block ] );

		expect( getContainingBlockYMap( text ) ).toBe( block );
	} );

	it( 'should find the containing block for deeply nested rich text attributes', () => {
		const block = createTestYBlock( 'block' );
		const attributes = new Y.Map< any >();
		const cards = new Y.Array< Y.Map< any > >();
		const card = new Y.Map< any >();
		const meta = new Y.Map< any >();
		const caption = new Y.Text( 'Nested caption' );

		meta.set( 'caption', caption );
		card.set( 'meta', meta );
		cards.push( [ card ] );
		attributes.set( 'cards', cards );
		block.set( 'attributes', attributes );

		const ydoc = new Y.Doc();
		const rootMap = ydoc.getMap( 'test' );
		const blocks = new Y.Array< Y.Map< any > >();
		rootMap.set( 'blocks', blocks );
		blocks.push( [ block ] );

		expect( getContainingBlockYMap( caption ) ).toBe( block );
	} );

	it( 'should return null when no block ancestor exists', () => {
		const orphanAttributes = new Y.Map< any >();
		const text = new Y.Text( 'Orphan text' );
		orphanAttributes.set( 'content', text );

		expect( getContainingBlockYMap( text ) ).toBeNull();
	} );

	it( 'should skip nested attribute maps that look like blocks', () => {
		const block = createTestYBlock( 'block' );
		const attributes = new Y.Map< any >();
		const blockLikeAttribute = new Y.Map< any >();
		const text = new Y.Text( 'Nested text' );
		blockLikeAttribute.set( 'clientId', 'attribute-client-id' );
		blockLikeAttribute.set( 'innerBlocks', new Y.Array() );
		blockLikeAttribute.set( 'content', text );
		attributes.set( 'nested', blockLikeAttribute );
		block.set( 'attributes', attributes );

		const ydoc = new Y.Doc();
		const rootMap = ydoc.getMap( 'test' );
		const blocks = new Y.Array< Y.Map< any > >();
		rootMap.set( 'blocks', blocks );
		blocks.push( [ block ] );

		expect( getContainingBlockYMap( text ) ).toBe( block );
	} );
} );

describe( 'resolveBlockClientIdByPath', () => {
	it( 'should return null for an empty path', () => {
		expect( resolveBlockClientIdByPath( [], [] ) ).toBeNull();
	} );

	it( 'should resolve a root block by single-element path', () => {
		const blocks: MockBlock[] = [
			{ clientId: 'a', name: 'core/paragraph', innerBlocks: [] },
			{ clientId: 'b', name: 'core/heading', innerBlocks: [] },
		];

		expect( resolveBlockClientIdByPath( [ 0 ], blocks ) ).toBe( 'a' );
		expect( resolveBlockClientIdByPath( [ 1 ], blocks ) ).toBe( 'b' );
	} );

	it( 'should return null for an out-of-bounds index', () => {
		const blocks: MockBlock[] = [
			{ clientId: 'a', name: 'core/paragraph', innerBlocks: [] },
		];

		expect( resolveBlockClientIdByPath( [ 5 ], blocks ) ).toBeNull();
	} );

	it( 'should resolve a nested inner block', () => {
		const blocks: MockBlock[] = [
			{
				clientId: 'parent',
				name: 'core/group',
				innerBlocks: [
					{
						clientId: 'child-0',
						name: 'core/paragraph',
						innerBlocks: [],
					},
					{
						clientId: 'child-1',
						name: 'core/heading',
						innerBlocks: [],
					},
				],
			},
		];

		expect( resolveBlockClientIdByPath( [ 0, 1 ], blocks ) ).toBe(
			'child-1'
		);
	} );

	it( 'should return null when inner path index is out of bounds', () => {
		const blocks: MockBlock[] = [
			{
				clientId: 'parent',
				name: 'core/group',
				innerBlocks: [
					{
						clientId: 'child-0',
						name: 'core/paragraph',
						innerBlocks: [],
					},
				],
			},
		];

		expect( resolveBlockClientIdByPath( [ 0, 5 ], blocks ) ).toBeNull();
	} );

	describe( 'template mode (usePostContentBlocks behavior)', () => {
		it( 'should navigate through core/post-content in template mode', () => {
			const postContentInnerBlocks: MockBlock[] = [
				{
					clientId: 'post-para-0',
					name: 'core/paragraph',
					innerBlocks: [],
				},
				{
					clientId: 'post-para-1',
					name: 'core/heading',
					innerBlocks: [],
				},
			];

			// Template structure: header → post-content → footer.
			// post-content's innerBlocks are empty in the tree (controlled
			// inner blocks), so getClientIdsTree( postContentClientId ) is used.
			const templateBlocks: MockBlock[] = [
				{
					clientId: 'header',
					name: 'core/template-part',
					innerBlocks: [],
				},
				{
					clientId: 'post-content',
					name: 'core/post-content',
					innerBlocks: [], // Empty — controlled inner blocks.
				},
				{
					clientId: 'footer',
					name: 'core/template-part',
					innerBlocks: [],
				},
			];

			// Override getClientIdsTree to return post content blocks when
			// called with the post-content clientId (mimicking controlled
			// inner blocks behavior in useBlockSync).
			mockGetClientIdsTree = jest.fn( ( rootClientId: string = '' ) => {
				if ( rootClientId === '' ) {
					return templateBlocks;
				}
				if ( rootClientId === 'post-content' ) {
					return postContentInnerBlocks;
				}
				return [];
			} );

			// The returned blocks should be post content blocks, not the template blocks.
			const blocks = renderHook( () => usePostContentBlocks() ).result
				.current;
			expect( resolveBlockClientIdByPath( [ 0 ], blocks ) ).toBe(
				'post-para-0'
			);
			expect( resolveBlockClientIdByPath( [ 1 ], blocks ) ).toBe(
				'post-para-1'
			);
		} );

		it( 'should call getClientIdsTree with post-content clientId', () => {
			const templateBlocks: MockBlock[] = [
				{
					clientId: 'header',
					name: 'core/template-part',
					innerBlocks: [],
				},
				{
					clientId: 'pc',
					name: 'core/post-content',
					innerBlocks: [],
				},
			];

			mockGetClientIdsTree = jest.fn( ( rootClientId: string = '' ) => {
				if ( rootClientId === '' ) {
					return templateBlocks;
				}
				if ( rootClientId === 'pc' ) {
					return [
						{
							clientId: 'inner',
							name: 'core/paragraph',
							innerBlocks: [],
						},
					];
				}
				return [];
			} );

			renderHook( () => usePostContentBlocks() );

			// Verify getClientIdsTree was called with the post-content clientId.
			expect( mockGetClientIdsTree ).toHaveBeenCalledWith( 'pc' );
		} );

		it( 'should find core/post-content nested inside template parts', () => {
			// post-content can be nested inside other blocks in the
			// template tree (e.g. inside a group or template part).
			const postContentInnerBlocks: MockBlock[] = [
				{
					clientId: 'deep-para',
					name: 'core/paragraph',
					innerBlocks: [],
				},
			];

			const templateBlocks: MockBlock[] = [
				{
					clientId: 'group',
					name: 'core/group',
					innerBlocks: [
						{
							clientId: 'nested-pc',
							name: 'core/post-content',
							innerBlocks: [],
						},
					],
				},
			];

			mockGetClientIdsTree = jest.fn( ( rootClientId: string = '' ) => {
				if ( rootClientId === '' ) {
					return templateBlocks;
				}
				if ( rootClientId === 'nested-pc' ) {
					return postContentInnerBlocks;
				}
				return [];
			} );

			const blocks = renderHook( () => usePostContentBlocks() ).result
				.current;
			expect( resolveBlockClientIdByPath( [ 0 ], blocks ) ).toBe(
				'deep-para'
			);
		} );

		it( 'should use root blocks directly when no core/post-content exists', () => {
			// No template mode — plain post editing.
			const postContentBlocks: MockBlock[] = [
				{
					clientId: 'para-0',
					name: 'core/paragraph',
					innerBlocks: [],
				},
				{
					clientId: 'para-1',
					name: 'core/heading',
					innerBlocks: [],
				},
			];

			mockGetClientIdsTree = jest.fn( ( rootClientId: string = '' ) => {
				if ( rootClientId === '' ) {
					return postContentBlocks;
				}
				return [];
			} );

			const blocks = renderHook( () => usePostContentBlocks() ).result
				.current;

			expect( resolveBlockClientIdByPath( [ 0 ], blocks ) ).toBe(
				'para-0'
			);
			expect( resolveBlockClientIdByPath( [ 1 ], blocks ) ).toBe(
				'para-1'
			);
		} );

		it( 'should return null for invalid path in template mode', () => {
			const templateBlocks: MockBlock[] = [
				{
					clientId: 'header',
					name: 'core/template-part',
					innerBlocks: [],
				},
				{
					clientId: 'pc',
					name: 'core/post-content',
					innerBlocks: [],
				},
			];

			mockGetClientIdsTree = jest.fn( ( rootClientId: string = '' ) => {
				if ( rootClientId === '' ) {
					return templateBlocks;
				}
				if ( rootClientId === 'pc' ) {
					// Post content has only one block.
					return [
						{
							clientId: 'only-block',
							name: 'core/paragraph',
							innerBlocks: [],
						},
					];
				}
				return [];
			} );

			const blocks = renderHook( () => usePostContentBlocks() ).result
				.current;

			// Index 1 is out of bounds for the post content blocks.
			expect( resolveBlockClientIdByPath( [ 1 ], blocks ) ).toBeNull();
		} );
	} );
} );
