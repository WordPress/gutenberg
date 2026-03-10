/**
 * External dependencies
 */
import { Y } from '@wordpress/sync';
import { select } from '@wordpress/data';

/**
 * Internal dependencies
 */
import {
	getBlockPathInYdoc,
	resolveBlockClientIdByPath,
} from '../block-lookup';

// Mock WordPress dependencies
jest.mock( '@wordpress/data', () => ( {
	select: jest.fn(),
} ) );

jest.mock( '@wordpress/block-editor', () => ( {
	store: 'core/block-editor',
} ) );

type MockBlock = {
	clientId: string;
	name: string;
	innerBlocks: MockBlock[];
};

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

/**
 * Mock the block-editor store's `getBlocks` selector.
 *
 * When called without an argument (or undefined), returns `rootBlocks`.
 * When called with a clientId, looks up the block by clientId and returns
 * its innerBlocks. This mimics how `getBlocks( clientId )` works in the
 * real store for controlled inner blocks.
 * @param rootBlocks
 */
function mockBlockEditorStore( rootBlocks: MockBlock[] ) {
	const allBlocks = new Map< string, MockBlock >();

	function indexBlocks( blocks: MockBlock[] ) {
		for ( const block of blocks ) {
			allBlocks.set( block.clientId, block );
			if ( block.innerBlocks?.length ) {
				indexBlocks( block.innerBlocks );
			}
		}
	}
	indexBlocks( rootBlocks );

	const getBlocks = jest.fn( ( rootClientId?: string ) => {
		if ( rootClientId === undefined ) {
			return rootBlocks;
		}
		const block = allBlocks.get( rootClientId );
		return block ? block.innerBlocks : [];
	} );

	( select as jest.Mock ).mockReturnValue( { getBlocks } );
	return { getBlocks };
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

describe( 'resolveBlockClientIdByPath', () => {
	afterEach( () => {
		jest.restoreAllMocks();
	} );

	it( 'should return null for an empty path', () => {
		mockBlockEditorStore( [] );
		expect( resolveBlockClientIdByPath( [] ) ).toBeNull();
	} );

	it( 'should resolve a root block by single-element path', () => {
		mockBlockEditorStore( [
			{ clientId: 'a', name: 'core/paragraph', innerBlocks: [] },
			{ clientId: 'b', name: 'core/heading', innerBlocks: [] },
		] );

		expect( resolveBlockClientIdByPath( [ 0 ] ) ).toBe( 'a' );
		expect( resolveBlockClientIdByPath( [ 1 ] ) ).toBe( 'b' );
	} );

	it( 'should return null for an out-of-bounds index', () => {
		mockBlockEditorStore( [
			{ clientId: 'a', name: 'core/paragraph', innerBlocks: [] },
		] );

		expect( resolveBlockClientIdByPath( [ 5 ] ) ).toBeNull();
	} );

	it( 'should resolve a nested inner block', () => {
		mockBlockEditorStore( [
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
		] );

		expect( resolveBlockClientIdByPath( [ 0, 1 ] ) ).toBe( 'child-1' );
	} );

	it( 'should return null when inner path index is out of bounds', () => {
		mockBlockEditorStore( [
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
		] );

		expect( resolveBlockClientIdByPath( [ 0, 5 ] ) ).toBeNull();
	} );

	describe( 'template mode (getPostContentBlocks behavior)', () => {
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
			// inner blocks), so getBlocks( postContentClientId ) is used.
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

			const { getBlocks } = mockBlockEditorStore( templateBlocks );

			// Override getBlocks to return post content blocks when called
			// with the post-content clientId (mimicking controlled inner
			// blocks behavior in useBlockSync).
			getBlocks.mockImplementation( ( rootClientId?: string ) => {
				if ( rootClientId === undefined ) {
					return templateBlocks;
				}
				if ( rootClientId === 'post-content' ) {
					return postContentInnerBlocks;
				}
				return [];
			} );

			// Path [0] should resolve to the first post content block,
			// not the first template block.
			expect( resolveBlockClientIdByPath( [ 0 ] ) ).toBe( 'post-para-0' );
			expect( resolveBlockClientIdByPath( [ 1 ] ) ).toBe( 'post-para-1' );
		} );

		it( 'should call getBlocks with post-content clientId', () => {
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

			const { getBlocks } = mockBlockEditorStore( templateBlocks );
			getBlocks.mockImplementation( ( rootClientId?: string ) => {
				if ( rootClientId === undefined ) {
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

			resolveBlockClientIdByPath( [ 0 ] );

			// Verify getBlocks was called with the post-content clientId.
			expect( getBlocks ).toHaveBeenCalledWith( 'pc' );
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

			const { getBlocks } = mockBlockEditorStore( templateBlocks );
			getBlocks.mockImplementation( ( rootClientId?: string ) => {
				if ( rootClientId === undefined ) {
					return templateBlocks;
				}
				if ( rootClientId === 'nested-pc' ) {
					return postContentInnerBlocks;
				}
				return [];
			} );

			expect( resolveBlockClientIdByPath( [ 0 ] ) ).toBe( 'deep-para' );
		} );

		it( 'should use root blocks directly when no core/post-content exists', () => {
			// No template mode — plain post editing.
			const blocks: MockBlock[] = [
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

			mockBlockEditorStore( blocks );

			expect( resolveBlockClientIdByPath( [ 0 ] ) ).toBe( 'para-0' );
			expect( resolveBlockClientIdByPath( [ 1 ] ) ).toBe( 'para-1' );
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

			const { getBlocks } = mockBlockEditorStore( templateBlocks );
			getBlocks.mockImplementation( ( rootClientId?: string ) => {
				if ( rootClientId === undefined ) {
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

			// Index 1 is out of bounds for the post content blocks.
			expect( resolveBlockClientIdByPath( [ 1 ] ) ).toBeNull();
		} );
	} );
} );
