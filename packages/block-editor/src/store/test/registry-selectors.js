/**
 * WordPress dependencies
 */
import { registerBlockType, unregisterBlockType } from '@wordpress/blocks';
import { select, dispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store } from '../';

describe( 'selectors', () => {
	beforeEach( () => {
		registerBlockType( 'core/test-block-a', {
			save: ( props ) => props.attributes.text,
			category: 'design',
			title: 'Test Block A',
			icon: 'test',
			keywords: [ 'testing' ],
		} );

		registerBlockType( 'core/test-block-b', {
			save: ( props ) => props.attributes.text,
			category: 'text',
			title: 'Test Block B',
			icon: 'test',
			keywords: [ 'testing' ],
			supports: {
				multiple: false,
			},
		} );
	} );

	afterEach( async () => {
		unregisterBlockType( 'core/test-block-a' );
		unregisterBlockType( 'core/test-block-b' );
	} );

	describe( '__experimentalGetAllowedPatterns', () => {
		beforeAll( async () => {
			await dispatch( store ).resetBlocks( [
				{
					clientId: 'block1',
					name: 'core/test-block-a',
					innerBlocks: [],
				},
				{
					clientId: 'block2',
					name: 'core/test-block-b',
					innerBlocks: [],
				},
			] );
			await dispatch( store ).updateSettings( {
				__experimentalBlockPatterns: [
					{
						name: 'pattern-a',
						title: 'pattern with a',
						content: `<!-- wp:test-block-a --><!-- /wp:test-block-a -->`,
					},
					{
						name: 'pattern-b',
						title: 'pattern with b',
						content:
							'<!-- wp:test-block-b --><!-- /wp:test-block-b -->',
					},
					{
						name: 'pattern-c',
						title: 'pattern hidden from UI',
						inserter: false,
						content:
							'<!-- wp:test-block-a --><!-- /wp:test-block-a -->',
					},
				],
			} );
			await dispatch( store ).updateBlockListSettings( 'block1', {
				allowedBlocks: [ 'core/test-block-b' ],
			} );
		} );

		afterAll( async () => {
			await dispatch( store ).resetBlocks( [] );
			await dispatch( store ).updateSettings( {
				__experimentalBlockPatterns: [],
			} );
			await dispatch( store ).updateBlockListSettings( 'block1', {} );
		} );

		it( 'should return all patterns for root level', () => {
			expect(
				select( store ).__experimentalGetAllowedPatterns( null )
			).toHaveLength( 2 );
		} );
		it( 'should return patterns that consists of blocks allowed for the specified client ID', () => {
			expect(
				select( store ).__experimentalGetAllowedPatterns( 'block1' )
			).toHaveLength( 1 );
			expect(
				select( store ).__experimentalGetAllowedPatterns( 'block2' )
			).toHaveLength( 0 );
		} );
		it( 'should return empty array if only patterns hidden from UI exist', () => {
			expect(
				select( store ).__experimentalGetAllowedPatterns( {
					blocks: { byClientId: new Map() },
					blockListSettings: {},
					settings: {
						__experimentalBlockPatterns: [
							{
								name: 'pattern-c',
								title: 'pattern hidden from UI',
								inserter: false,
								content:
									'<!-- wp:test-block-a --><!-- /wp:test-block-a -->',
							},
						],
					},
				} )
			).toHaveLength( 0 );
		} );
	} );

	describe( '__experimentalGetParsedPattern', () => {
		beforeAll( async () => {
			await dispatch( store ).updateSettings( {
				__experimentalBlockPatterns: [
					{
						name: 'pattern-a',
						title: 'pattern with a',
						content: `<!-- wp:test-block-a --><!-- /wp:test-block-a -->`,
					},
					{
						name: 'pattern-hidden-from-ui',
						title: 'pattern hidden from UI',
						inserter: false,
						content:
							'<!-- wp:test-block-a --><!-- /wp:test-block-a --><!-- wp:test-block-b --><!-- /wp:test-block-b -->',
					},
				],
			} );
		} );

		afterAll( async () => {
			await dispatch( store ).updateSettings( {
				__experimentalBlockPatterns: [],
			} );
		} );

		it( 'should return proper results when pattern does not exist', () => {
			expect(
				select( store ).__experimentalGetParsedPattern( 'not there' )
			).toBeNull();
		} );
		it( 'should return existing pattern properly parsed', () => {
			const { name, blocks } =
				select( store ).__experimentalGetParsedPattern( 'pattern-a' );
			expect( name ).toEqual( 'pattern-a' );
			expect( blocks ).toHaveLength( 1 );
			expect( blocks[ 0 ] ).toEqual(
				expect.objectContaining( {
					name: 'core/test-block-a',
				} )
			);
		} );
		it( 'should return hidden from UI pattern when requested', () => {
			const { name, blocks, inserter } = select(
				store
			).__experimentalGetParsedPattern( 'pattern-hidden-from-ui' );
			expect( name ).toEqual( 'pattern-hidden-from-ui' );
			expect( inserter ).toBeFalsy();
			expect( blocks ).toHaveLength( 2 );
			expect( blocks[ 0 ] ).toEqual(
				expect.objectContaining( {
					name: 'core/test-block-a',
				} )
			);
		} );
	} );

	describe( 'getPatternsByBlockTypes', () => {
		beforeAll( async () => {
			await dispatch( store ).resetBlocks( [
				{
					clientId: 'block1',
					name: 'core/test-block-a',
					innerBlocks: [],
				},
			] );
			await dispatch( store ).updateSettings( {
				__experimentalBlockPatterns: [
					{
						name: 'pattern-a',
						blockTypes: [ 'test/block-a' ],
						title: 'pattern a',
						content:
							'<!-- wp:test-block-a --><!-- /wp:test-block-a -->',
					},
					{
						name: 'pattern-b',
						blockTypes: [ 'test/block-b' ],
						title: 'pattern b',
						content:
							'<!-- wp:test-block-b --><!-- /wp:test-block-b -->',
					},
					{
						title: 'pattern c',
						blockTypes: [ 'test/block-a' ],
						content:
							'<!-- wp:test-block-b --><!-- /wp:test-block-b -->',
					},
				],
			} );
			await dispatch( store ).updateBlockListSettings( 'block1', {
				allowedBlocks: [ 'core/test-block-b' ],
			} );
		} );

		afterAll( async () => {
			await dispatch( store ).resetBlocks( [] );
			await dispatch( store ).updateSettings( {
				__experimentalBlockPatterns: [],
			} );
			await dispatch( store ).updateBlockListSettings( 'block1', {} );
		} );

		it( 'should return empty array if no block name is provided', () => {
			expect( select( store ).getPatternsByBlockTypes() ).toEqual( [] );
		} );
		it( 'should return empty array if no match is found', () => {
			const patterns = select( store ).getPatternsByBlockTypes(
				'test/block-not-exists'
			);
			expect( patterns ).toEqual( [] );
		} );
		it( 'should return the same empty array in both empty array cases', () => {
			const patterns1 = select( store ).getPatternsByBlockTypes();
			const patterns2 = select( store ).getPatternsByBlockTypes(
				'test/block-not-exists'
			);
			expect( patterns1 ).toBe( patterns2 );
		} );
		it( 'should return proper results when there are matched block patterns', () => {
			const patterns =
				select( store ).getPatternsByBlockTypes( 'test/block-a' );
			expect( patterns ).toHaveLength( 2 );
			expect( patterns ).toEqual(
				expect.arrayContaining( [
					expect.objectContaining( { title: 'pattern a' } ),
					expect.objectContaining( { title: 'pattern c' } ),
				] )
			);
		} );
		it( 'should return proper result with matched patterns and allowed blocks from rootClientId', () => {
			const patterns = select( store ).getPatternsByBlockTypes(
				'test/block-a',
				'block1'
			);
			expect( patterns ).toHaveLength( 1 );
			expect( patterns[ 0 ] ).toEqual(
				expect.objectContaining( { title: 'pattern c' } )
			);
		} );
	} );

	describe( '__experimentalGetPatternTransformItems', () => {
		beforeAll( async () => {
			await dispatch( store ).resetBlocks( [
				{
					clientId: 'block1',
					name: 'core/test-block-a',
					innerBlocks: [],
				},
				{
					clientId: 'block2',
					name: 'core/test-block-b',
					innerBlocks: [],
				},
			] );
			await dispatch( store ).setHasControlledInnerBlocks(
				'block2-clientId',
				true
			);
			await dispatch( store ).updateSettings( {
				__experimentalBlockPatterns: [
					{
						name: 'pattern-a',
						blockTypes: [ 'test/block-a' ],
						title: 'pattern a',
						content:
							'<!-- wp:test-block-a --><!-- /wp:test-block-a -->',
					},
					{
						name: 'pattern-b',
						blockTypes: [ 'test/block-b' ],
						title: 'pattern b',
						content:
							'<!-- wp:test-block-b --><!-- /wp:test-block-b -->',
					},
					{
						name: 'pattern-c',
						title: 'pattern c',
						blockTypes: [ 'test/block-a' ],
						content:
							'<!-- wp:test-block-b --><!-- /wp:test-block-b -->',
					},
					{
						name: 'pattern-mix',
						title: 'pattern mix',
						blockTypes: [
							'core/test-block-a',
							'core/test-block-b',
						],
						content:
							'<!-- wp:test-block-b --><!-- /wp:test-block-b -->',
					},
				],
			} );
		} );

		afterAll( async () => {
			await dispatch( store ).resetBlocks( [] );
			await dispatch( store ).updateSettings( {
				__experimentalBlockPatterns: [],
			} );
			await dispatch( store ).updateBlockListSettings( 'block1', {} );
		} );

		describe( 'should return empty array', () => {
			it( 'when no blocks are selected', () => {
				expect(
					select( store ).__experimentalGetPatternTransformItems()
				).toEqual( [] );
			} );
			it( 'when a selected block has inner blocks', () => {
				const blocks = [
					{ name: 'core/test-block-a', innerBlocks: [] },
					{
						name: 'core/test-block-b',
						innerBlocks: [ { name: 'some inner block' } ],
					},
				];
				expect(
					select( store ).__experimentalGetPatternTransformItems(
						blocks
					)
				).toEqual( [] );
			} );
			it( 'when a selected block has controlled inner blocks', () => {
				const blocks = [
					{ name: 'core/test-block-a', innerBlocks: [] },
					{
						name: 'core/test-block-b',
						clientId: 'block2-clientId',
						innerBlocks: [],
					},
				];
				expect(
					select( store ).__experimentalGetPatternTransformItems(
						blocks
					)
				).toEqual( [] );
			} );
			it( 'when no patterns are available based on the selected blocks', () => {
				const blocks = [
					{ name: 'block-with-no-patterns', innerBlocks: [] },
				];
				expect(
					select( store ).__experimentalGetPatternTransformItems(
						blocks
					)
				).toEqual( [] );
			} );
		} );
		describe( 'should return proper results', () => {
			it( 'when a single block is selected', () => {
				const blocks = [
					{ name: 'core/test-block-b', innerBlocks: [] },
				];
				const patterns =
					select( store ).__experimentalGetPatternTransformItems(
						blocks
					);
				expect( patterns ).toHaveLength( 1 );
				expect( patterns[ 0 ] ).toEqual(
					expect.objectContaining( {
						name: 'pattern-mix',
					} )
				);
			} );
			it( 'when different multiple blocks are selected', () => {
				const blocks = [
					{ name: 'core/test-block-b', innerBlocks: [] },
					{ name: 'test/block-b', innerBlocks: [] },
					{ name: 'some other block', innerBlocks: [] },
				];
				const patterns =
					select( store ).__experimentalGetPatternTransformItems(
						blocks
					);
				expect( patterns ).toHaveLength( 2 );
				expect( patterns ).toEqual(
					expect.arrayContaining( [
						expect.objectContaining( {
							name: 'pattern-mix',
						} ),
						expect.objectContaining( {
							name: 'pattern-b',
						} ),
					] )
				);
			} );
			it( 'when multiple blocks are selected containing multiple times the same block', () => {
				const blocks = [
					{ name: 'core/test-block-b', innerBlocks: [] },
					{ name: 'some other block', innerBlocks: [] },
					{ name: 'core/test-block-a', innerBlocks: [] },
					{ name: 'core/test-block-b', innerBlocks: [] },
				];
				const patterns =
					select( store ).__experimentalGetPatternTransformItems(
						blocks
					);
				expect( patterns ).toHaveLength( 1 );
				expect( patterns[ 0 ] ).toEqual(
					expect.objectContaining( {
						name: 'pattern-mix',
					} )
				);
			} );
		} );
	} );
} );
