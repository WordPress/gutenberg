/**
 * External dependencies
 */
import deepFreeze from 'deep-freeze';
import { noop, times } from 'lodash';

/**
 * Internal dependencies
 */
import {
	createBlock,
	cloneBlock,
	getPossibleBlockTransformations,
	switchToBlockType,
	getBlockTransforms,
	findTransform,
	isWildcardBlockTransform,
	isContainerGroupBlock,
	isBlockSelectionOfSameType,
} from '../factory';
import {
	getBlockType,
	getBlockTypes,
	registerBlockType,
	unregisterBlockType,
	setGroupingBlockName,
} from '../registration';

describe( 'block factory', () => {
	const defaultBlockSettings = {
		attributes: {
			value: {
				type: 'string',
			},
		},
		save: noop,
		category: 'common',
		title: 'block title',
	};

	beforeAll( () => {
		// Load blocks store
		require( '../../store' );
	} );

	afterEach( () => {
		getBlockTypes().forEach( ( block ) => {
			unregisterBlockType( block.name );
		} );
	} );

	describe( 'createBlock()', () => {
		it( 'should create a block given its blockType, attributes, inner blocks', () => {
			registerBlockType( 'core/test-block', {
				attributes: {
					align: {
						type: 'string',
					},
					includesDefault: {
						type: 'boolean',
						default: true,
					},
					includesFalseyDefault: {
						type: 'number',
						default: 0,
					},
				},
				save: noop,
				category: 'common',
				title: 'test block',
			} );
			const block = createBlock(
				'core/test-block',
				{ align: 'left' },
				[ createBlock( 'core/test-block' ) ],
			);

			expect( block.name ).toEqual( 'core/test-block' );
			expect( block.attributes ).toEqual( {
				includesDefault: true,
				includesFalseyDefault: 0,
				align: 'left',
			} );
			expect( block.isValid ).toBe( true );
			expect( block.innerBlocks ).toHaveLength( 1 );
			expect( block.innerBlocks[ 0 ].name ).toBe( 'core/test-block' );
			expect( typeof block.clientId ).toBe( 'string' );
		} );

		it( 'should cast children and node source attributes with default undefined', () => {
			registerBlockType( 'core/test-block', {
				...defaultBlockSettings,
				attributes: {
					content: {
						type: 'array',
						source: 'children',
					},
				},
			} );

			const block = createBlock( 'core/test-block' );

			expect( block.attributes ).toEqual( {
				content: [],
			} );
		} );

		it( 'should cast children and node source attributes with string as default', () => {
			registerBlockType( 'core/test-block', {
				...defaultBlockSettings,
				attributes: {
					content: {
						type: 'array',
						source: 'children',
						default: 'test',
					},
				},
			} );

			const block = createBlock( 'core/test-block' );

			expect( block.attributes ).toEqual( {
				content: [ 'test' ],
			} );
		} );

		it( 'should cast children and node source attributes with unknown type as default', () => {
			registerBlockType( 'core/test-block', {
				...defaultBlockSettings,
				attributes: {
					content: {
						type: 'array',
						source: 'children',
						default: 1,
					},
				},
			} );

			const block = createBlock( 'core/test-block' );

			expect( block.attributes ).toEqual( {
				content: [],
			} );
		} );

		it( 'should cast rich-text source attributes', () => {
			registerBlockType( 'core/test-block', {
				...defaultBlockSettings,
				attributes: {
					content: {
						source: 'html',
					},
				},
			} );

			const block = createBlock( 'core/test-block', {
				content: 'test',
			} );

			expect( block.attributes ).toEqual( {
				content: 'test',
			} );
		} );
	} );

	describe( 'cloneBlock()', () => {
		it( 'should merge attributes into the existing block', () => {
			registerBlockType( 'core/test-block', {
				attributes: {
					align: {
						type: 'string',
					},
					isDifferent: {
						type: 'boolean',
						default: false,
					},
				},
				save: noop,
				category: 'common',
				title: 'test block',
			} );
			const block = deepFreeze(
				createBlock(
					'core/test-block',
					{ align: 'left' },
					[ createBlock( 'core/test-block' ) ],
				)
			);

			const clonedBlock = cloneBlock( block, {
				isDifferent: true,
			} );

			expect( clonedBlock.name ).toEqual( block.name );
			expect( clonedBlock.attributes ).toEqual( {
				align: 'left',
				isDifferent: true,
			} );
			expect( clonedBlock.innerBlocks ).toHaveLength( 1 );
			expect( typeof clonedBlock.clientId ).toBe( 'string' );
			expect( clonedBlock.clientId ).not.toBe( block.clientId );
		} );

		it( 'should replace inner blocks of the existing block', () => {
			registerBlockType( 'core/test-block', {
				attributes: {
					align: {
						type: 'string',
					},
					isDifferent: {
						type: 'boolean',
						default: false,
					},
				},
				save: noop,
				category: 'common',
				title: 'test block',
			} );
			const block = deepFreeze(
				createBlock(
					'core/test-block',
					{ align: 'left' },
					[
						createBlock( 'core/test-block', { align: 'right' } ),
						createBlock( 'core/test-block', { align: 'left' } ),
					],
				)
			);

			const clonedBlock = cloneBlock( block, undefined, [
				createBlock( 'core/test-block' ),
			] );

			expect( clonedBlock.innerBlocks ).toHaveLength( 1 );
			expect( clonedBlock.innerBlocks[ 0 ].attributes ).not.toHaveProperty( 'align' );
		} );

		it( 'should clone innerBlocks if innerBlocks are not passed', () => {
			registerBlockType( 'core/test-block', {
				attributes: {
					align: {
						type: 'string',
					},
					isDifferent: {
						type: 'boolean',
						default: false,
					},
				},
				save: noop,
				category: 'common',
				title: 'test block',
			} );
			const block = deepFreeze(
				createBlock(
					'core/test-block',
					{ align: 'left' },
					[
						createBlock( 'core/test-block', { align: 'right' } ),
						createBlock( 'core/test-block', { align: 'left' } ),
					],
				)
			);

			const clonedBlock = cloneBlock( block );

			expect( clonedBlock.innerBlocks ).toHaveLength( 2 );
			expect( clonedBlock.innerBlocks[ 0 ].clientId ).not.toBe( block.innerBlocks[ 0 ].clientId );
			expect( clonedBlock.innerBlocks[ 0 ].attributes ).not.toBe( block.innerBlocks[ 0 ].attributes );
			expect( clonedBlock.innerBlocks[ 0 ].attributes ).toEqual( block.innerBlocks[ 0 ].attributes );
			expect( clonedBlock.innerBlocks[ 1 ].clientId ).not.toBe( block.innerBlocks[ 1 ].clientId );
			expect( clonedBlock.innerBlocks[ 1 ].attributes ).not.toBe( block.innerBlocks[ 1 ].attributes );
			expect( clonedBlock.innerBlocks[ 1 ].attributes ).toEqual( block.innerBlocks[ 1 ].attributes );
		} );
	} );

	describe( 'getPossibleBlockTransformations()', () => {
		it( 'should should show as available a simple "from" transformation"', () => {
			registerBlockType( 'core/updated-text-block', {
				attributes: {
					value: {
						type: 'string',
					},
				},
				transforms: {
					from: [ {
						type: 'block',
						blocks: [ 'core/text-block' ],
						transform: noop,
					} ],
				},
				save: noop,
				category: 'common',
				title: 'updated text block',
			} );
			registerBlockType( 'core/text-block', defaultBlockSettings );

			const block = createBlock( 'core/text-block', {
				value: 'chicken',
			} );

			const availableBlocks = getPossibleBlockTransformations( [ block ] );

			expect( availableBlocks ).toHaveLength( 1 );
			expect( availableBlocks[ 0 ].name ).toBe( 'core/updated-text-block' );
		} );

		it( 'should show as available a simple "to" transformation"', () => {
			registerBlockType( 'core/updated-text-block', {
				attributes: {
					value: {
						type: 'string',
					},
				},
				transforms: {
					to: [ {
						type: 'block',
						blocks: [ 'core/text-block' ],
						transform: noop,
					} ],
				},
				save: noop,
				category: 'common',
				title: 'updated text block',
			} );
			registerBlockType( 'core/text-block', defaultBlockSettings );

			const block = createBlock( 'core/updated-text-block', {
				value: 'ribs',
			} );

			const availableBlocks = getPossibleBlockTransformations( [ block ] );

			expect( availableBlocks ).toHaveLength( 1 );
			expect( availableBlocks[ 0 ].name ).toBe( 'core/text-block' );
		} );

		it( 'should not show a transformation if multiple blocks are passed and the transformation is not multi block (for a "from" transform)', () => {
			registerBlockType( 'core/updated-text-block', {
				attributes: {
					value: {
						type: 'string',
					},
				},
				transforms: {
					from: [ {
						type: 'block',
						blocks: [ 'core/text-block' ],
						transform: noop,
					} ],
				},
				save: noop,
				category: 'common',
				title: 'updated text block',
			} );
			registerBlockType( 'core/text-block', defaultBlockSettings );

			const block1 = createBlock( 'core/text-block', {
				value: 'chicken',
			} );

			const block2 = createBlock( 'core/text-block', {
				value: 'ribs',
			} );

			const availableBlocks = getPossibleBlockTransformations( [ block1, block2 ] );

			expect( availableBlocks ).toEqual( [] );
		} );

		it( 'should not show a transformation if multiple blocks are passed and the transformation is not multi block (for a "to" transform)', () => {
			registerBlockType( 'core/text-block', {
				attributes: {
					value: {
						type: 'string',
					},
				},
				transforms: {
					to: [ {
						type: 'block',
						blocks: [ 'core/updated-text-block' ],
						transform: noop,
					} ],
				},
				save: noop,
				category: 'common',
				title: 'updated text block',
			} );
			registerBlockType( 'core/updated-text-block', defaultBlockSettings );

			const block1 = createBlock( 'core/text-block', {
				value: 'chicken',
			} );

			const block2 = createBlock( 'core/text-block', {
				value: 'ribs',
			} );

			const availableBlocks = getPossibleBlockTransformations( [ block1, block2 ] );

			expect( availableBlocks ).toEqual( [] );
		} );

		it( 'should show a transformation as available if multiple blocks are passed and the transformation accepts multiple blocks (for a "from" transform)', () => {
			registerBlockType( 'core/updated-text-block', {
				attributes: {
					value: {
						type: 'string',
					},
				},
				transforms: {
					from: [ {
						type: 'block',
						blocks: [ 'core/text-block' ],
						transform: noop,
						isMultiBlock: true,
					} ],
				},
				save: noop,
				category: 'common',
				title: 'updated text block',
			} );
			registerBlockType( 'core/text-block', defaultBlockSettings );

			const block1 = createBlock( 'core/text-block', {
				value: 'chicken',
			} );

			const block2 = createBlock( 'core/text-block', {
				value: 'ribs',
			} );

			const availableBlocks = getPossibleBlockTransformations( [ block1, block2 ] );

			expect( availableBlocks ).toHaveLength( 1 );
			expect( availableBlocks[ 0 ].name ).toBe( 'core/updated-text-block' );
		} );

		it( 'should show a transformation as available if multiple blocks are passed and the transformation accepts multiple blocks (for a "to" transform)', () => {
			registerBlockType( 'core/text-block', {
				attributes: {
					value: {
						type: 'string',
					},
				},
				transforms: {
					to: [ {
						type: 'block',
						blocks: [ 'core/updated-text-block' ],
						transform: noop,
						isMultiBlock: true,
					} ],
				},
				save: noop,
				category: 'common',
				title: 'updated text block',
			} );
			registerBlockType( 'core/updated-text-block', defaultBlockSettings );

			const block1 = createBlock( 'core/text-block', {
				value: 'chicken',
			} );

			const block2 = createBlock( 'core/text-block', {
				value: 'ribs',
			} );

			const availableBlocks = getPossibleBlockTransformations( [ block1, block2 ] );

			expect( availableBlocks ).toHaveLength( 1 );
			expect( availableBlocks[ 0 ].name ).toBe( 'core/updated-text-block' );
		} );

		it( 'should show multiple possible transformations', () => {
			registerBlockType( 'core/updated-text-block', {
				attributes: {
					value: {
						type: 'string',
					},
				},
				transforms: {
					to: [ {
						type: 'block',
						blocks: [ 'core/text-block' ],
						transform: noop,
						isMultiBlock: true,
					}, {
						type: 'block',
						blocks: [ 'core/another-text-block' ],
						transform: noop,
						isMultiBlock: true,
					} ],
				},
				save: noop,
				category: 'common',
				title: 'updated text block',
			} );
			registerBlockType( 'core/text-block', defaultBlockSettings );
			registerBlockType( 'core/another-text-block', defaultBlockSettings );

			const block = createBlock( 'core/updated-text-block', {
				value: 'chicken',
			} );

			const availableBlocks = getPossibleBlockTransformations( [ block ] );

			expect( availableBlocks ).toHaveLength( 2 );
			expect( availableBlocks[ 0 ].name ).toBe( 'core/text-block' );
			expect( availableBlocks[ 1 ].name ).toBe( 'core/another-text-block' );
		} );

		it( 'should show multiple possible transformations when multiple blocks have a matching `from` transform', () => {
			registerBlockType( 'core/updated-text-block', {
				attributes: {
					value: {
						type: 'string',
					},
				},
				transforms: {
					from: [ {
						type: 'block',
						blocks: [ 'core/text-block' ],
						transform: noop,
						isMultiBlock: false,
					} ],
				},
				save: noop,
				category: 'common',
				title: 'updated text block',
			} );
			registerBlockType( 'core/another-text-block', {
				attributes: {
					value: {
						type: 'string',
					},
				},
				transforms: {
					from: [ {
						type: 'block',
						blocks: [ 'core/text-block' ],
						transform: noop,
						isMultiBlock: true,
					} ],
				},
				save: noop,
				category: 'common',
				title: 'another text block',
			} );
			registerBlockType( 'core/text-block', defaultBlockSettings );

			const block = createBlock( 'core/text-block', {
				value: 'chicken',
			} );

			const availableBlocks = getPossibleBlockTransformations( [ block ] );

			expect( availableBlocks ).toHaveLength( 2 );
			expect( availableBlocks[ 0 ].name ).toBe( 'core/updated-text-block' );
			expect( availableBlocks[ 1 ].name ).toBe( 'core/another-text-block' );
		} );

		it( 'should show multiple possible transformations for a single `to` transform object with multiple block names', () => {
			registerBlockType( 'core/updated-text-block', {
				attributes: {
					value: {
						type: 'string',
					},
				},
				transforms: {
					to: [ {
						type: 'block',
						blocks: [ 'core/text-block', 'core/another-text-block' ],
						transform: noop,
					} ],
				},
				save: noop,
				category: 'common',
				title: 'updated text block',
			} );
			registerBlockType( 'core/text-block', defaultBlockSettings );
			registerBlockType( 'core/another-text-block', defaultBlockSettings );

			const block = createBlock( 'core/updated-text-block', {
				value: 'chicken',
			} );

			const availableBlocks = getPossibleBlockTransformations( [ block ] );

			expect( availableBlocks ).toHaveLength( 2 );
			expect( availableBlocks[ 0 ].name ).toBe( 'core/text-block' );
			expect( availableBlocks[ 1 ].name ).toBe( 'core/another-text-block' );
		} );

		it( 'returns a single transformation for a "from" transform that has a `isMatch` function returning `true`', () => {
			registerBlockType( 'core/updated-text-block', {
				attributes: {
					value: {
						type: 'string',
					},
				},
				transforms: {
					from: [ {
						type: 'block',
						blocks: [ 'core/text-block' ],
						transform: noop,
						isMatch: () => true,
					} ],
				},
				save: noop,
				category: 'common',
				title: 'updated text block',
			} );
			registerBlockType( 'core/text-block', defaultBlockSettings );

			const block = createBlock( 'core/text-block', {
				value: 'chicken',
			} );

			const availableBlocks = getPossibleBlockTransformations( [ block ] );

			expect( availableBlocks ).toHaveLength( 1 );
			expect( availableBlocks[ 0 ].name ).toBe( 'core/updated-text-block' );
		} );

		it( 'returns no transformations for a "from" transform with a `isMatch` function returning `false`', () => {
			registerBlockType( 'core/updated-text-block', {
				attributes: {
					value: {
						type: 'string',
					},
				},
				transforms: {
					from: [ {
						type: 'block',
						blocks: [ 'core/text-block' ],
						transform: noop,
						isMatch: () => false,
					} ],
				},
				save: noop,
				category: 'common',
				title: 'updated text block',
			} );
			registerBlockType( 'core/text-block', defaultBlockSettings );

			const block = createBlock( 'core/text-block', {
				value: 'chicken',
			} );

			const availableBlocks = getPossibleBlockTransformations( [ block ] );

			expect( availableBlocks ).toEqual( [] );
		} );

		it( 'returns a single transformation for a "to" transform that has a `isMatch` function returning `true`', () => {
			registerBlockType( 'core/updated-text-block', {
				attributes: {
					value: {
						type: 'string',
					},
				},
				transforms: {
					to: [ {
						type: 'block',
						blocks: [ 'core/text-block' ],
						transform: noop,
						isMatch: () => true,
					} ],
				},
				save: noop,
				category: 'common',
				title: 'updated text block',
			} );
			registerBlockType( 'core/text-block', defaultBlockSettings );

			const block = createBlock( 'core/updated-text-block', {
				value: 'ribs',
			} );

			const availableBlocks = getPossibleBlockTransformations( [ block ] );

			expect( availableBlocks ).toHaveLength( 1 );
			expect( availableBlocks[ 0 ].name ).toBe( 'core/text-block' );
		} );

		it( 'returns no transformations for a "to" transform with a `isMatch` function returning `false`', () => {
			registerBlockType( 'core/updated-text-block', {
				attributes: {
					value: {
						type: 'string',
					},
				},
				transforms: {
					to: [ {
						type: 'block',
						blocks: [ 'core/text-block' ],
						transform: noop,
						isMatch: () => false,
					} ],
				},
				save: noop,
				category: 'common',
				title: 'updated text block',
			} );
			registerBlockType( 'core/text-block', defaultBlockSettings );

			const block = createBlock( 'core/updated-text-block', {
				value: 'ribs',
			} );

			const availableBlocks = getPossibleBlockTransformations( [ block ] );

			expect( availableBlocks ).toEqual( [] );
		} );

		it( 'for a non multiblock transform, the isMatch function receives the source block’s attributes object as its first argument', () => {
			const isMatch = jest.fn();

			registerBlockType( 'core/updated-text-block', {
				attributes: {
					value: {
						type: 'string',
					},
				},
				transforms: {
					to: [ {
						type: 'block',
						blocks: [ 'core/text-block' ],
						transform: noop,
						isMatch,
					} ],
				},
				save: noop,
				category: 'common',
				title: 'updated text block',
			} );
			registerBlockType( 'core/text-block', defaultBlockSettings );

			const block = createBlock( 'core/updated-text-block', {
				value: 'ribs',
			} );

			getPossibleBlockTransformations( [ block ] );

			expect( isMatch ).toHaveBeenCalledWith( { value: 'ribs' } );
		} );

		it( 'for a multiblock transform, the isMatch function receives an array containing every source block’s attributes as its first argument', () => {
			const isMatch = jest.fn();

			registerBlockType( 'core/updated-text-block', {
				attributes: {
					value: {
						type: 'string',
					},
				},
				transforms: {
					to: [ {
						type: 'block',
						blocks: [ 'core/text-block' ],
						transform: noop,
						isMultiBlock: true,
						isMatch,
					} ],
				},
				save: noop,
				category: 'common',
				title: 'updated text block',
			} );
			registerBlockType( 'core/text-block', defaultBlockSettings );

			const meatBlock = createBlock( 'core/updated-text-block', {
				value: 'ribs',
			} );

			const cheeseBlock = createBlock( 'core/updated-text-block', {
				value: 'halloumi',
			} );

			getPossibleBlockTransformations( [ meatBlock, cheeseBlock ] );

			expect( isMatch ).toHaveBeenCalledWith( [ { value: 'ribs' }, { value: 'halloumi' } ] );
		} );

		describe( 'wildcard block transforms', () => {
			beforeEach( () => {
				registerBlockType( 'core/group', {
					attributes: {
						value: {
							type: 'string',
						},
					},
					transforms: {
						from: [ {
							type: 'block',
							blocks: [ '*' ],
							transform: noop,
						} ],
					},
					save: noop,
					category: 'common',
					title: 'A block that groups other blocks.',
				} );
			} );

			it( 'should should show wildcard "from" transformation as available for multiple blocks of the same type', () => {
				registerBlockType( 'core/text-block', defaultBlockSettings );
				registerBlockType( 'core/image-block', defaultBlockSettings );

				const textBlocks = times( 4, ( index ) => {
					return createBlock( 'core/text-block', {
						value: `textBlock${ index + 1 }`,
					} );
				} );

				const availableBlocks = getPossibleBlockTransformations( textBlocks );

				expect( availableBlocks ).toHaveLength( 1 );
				expect( availableBlocks[ 0 ].name ).toBe( 'core/group' );
			} );

			it( 'should should show wildcard "from" transformation as available for multiple blocks of different types', () => {
				registerBlockType( 'core/text-block', defaultBlockSettings );
				registerBlockType( 'core/image-block', defaultBlockSettings );

				const textBlocks = times( 2, ( index ) => {
					return createBlock( 'core/text-block', {
						value: `textBlock${ index + 1 }`,
					} );
				} );

				const imageBlocks = times( 2, ( index ) => {
					return createBlock( 'core/image-block', {
						value: `imageBlock${ index + 1 }`,
					} );
				} );

				const availableBlocks = getPossibleBlockTransformations( [ ...textBlocks, ...imageBlocks ] );

				expect( availableBlocks ).toHaveLength( 1 );
				expect( availableBlocks[ 0 ].name ).toBe( 'core/group' );
			} );

			it( 'should should show wildcard "from" transformation as available for single blocks', () => {
				registerBlockType( 'core/text-block', defaultBlockSettings );

				const blocks = times( 1, ( index ) => {
					return createBlock( 'core/text-block', {
						value: `textBlock${ index + 1 }`,
					} );
				} );

				const availableBlocks = getPossibleBlockTransformations( blocks );

				expect( availableBlocks ).toHaveLength( 1 );
				expect( availableBlocks[ 0 ].name ).toBe( 'core/group' );
			} );
		} );
	} );

	describe( 'switchToBlockType()', () => {
		it( 'should switch the blockType of a block using the "transform form"', () => {
			registerBlockType( 'core/updated-text-block', {
				attributes: {
					value: {
						type: 'string',
					},
				},
				transforms: {
					from: [ {
						type: 'block',
						blocks: [ 'core/text-block' ],
						transform: ( { value } ) => {
							return createBlock( 'core/updated-text-block', {
								value: 'chicken ' + value,
							} );
						},
					} ],
				},
				save: noop,
				category: 'common',
				title: 'updated text block',
			} );
			registerBlockType( 'core/text-block', defaultBlockSettings );

			const block = createBlock( 'core/text-block', {
				value: 'ribs',
			} );

			const transformedBlocks = switchToBlockType( block, 'core/updated-text-block' );

			expect( transformedBlocks ).toHaveLength( 1 );
			expect( transformedBlocks[ 0 ] ).toHaveProperty( 'clientId' );
			expect( transformedBlocks[ 0 ].name ).toBe( 'core/updated-text-block' );
			expect( transformedBlocks[ 0 ].isValid ).toBe( true );
			expect( transformedBlocks[ 0 ].attributes ).toEqual( {
				value: 'chicken ribs',
			} );
		} );

		it( 'should switch the blockType of a block using the "transform to"', () => {
			registerBlockType( 'core/updated-text-block', defaultBlockSettings );
			registerBlockType( 'core/text-block', {
				attributes: {
					value: {
						type: 'string',
					},
				},
				transforms: {
					to: [ {
						type: 'block',
						blocks: [ 'core/updated-text-block' ],
						transform: ( { value } ) => {
							return createBlock( 'core/updated-text-block', {
								value: 'chicken ' + value,
							} );
						},
					} ],
				},
				save: noop,
				category: 'common',
				title: 'text-block',
			} );

			const block = createBlock( 'core/text-block', {
				value: 'ribs',
			} );

			const transformedBlocks = switchToBlockType( block, 'core/updated-text-block' );

			expect( transformedBlocks ).toHaveLength( 1 );
			expect( transformedBlocks[ 0 ] ).toHaveProperty( 'clientId' );
			expect( transformedBlocks[ 0 ].name ).toBe( 'core/updated-text-block' );
			expect( transformedBlocks[ 0 ].isValid ).toBe( true );
			expect( transformedBlocks[ 0 ].attributes ).toEqual( {
				value: 'chicken ribs',
			} );
		} );

		it( 'should return null if no transformation is found', () => {
			registerBlockType( 'core/updated-text-block', defaultBlockSettings );
			registerBlockType( 'core/text-block', defaultBlockSettings );

			const block = createBlock( 'core/text-block', {
				value: 'ribs',
			} );

			const transformedBlocks = switchToBlockType( block, 'core/updated-text-block' );

			expect( transformedBlocks ).toBeNull();
		} );

		it( 'should reject transformations that return null', () => {
			registerBlockType( 'core/updated-text-block', {
				attributes: {
					value: {
						type: 'string',
					},
				},
				transforms: {
					from: [ {
						blocks: [ 'core/text-block' ],
						transform: () => null,
					} ],
				},
				save: noop,
				category: 'common',
				title: 'updated text block',
			} );
			registerBlockType( 'core/text-block', defaultBlockSettings );

			const block = createBlock( 'core/text-block', {
				value: 'ribs',
			} );

			const transformedBlocks = switchToBlockType( block, 'core/updated-text-block' );

			expect( transformedBlocks ).toBeNull();
		} );

		it( 'should reject transformations that return an empty array', () => {
			registerBlockType( 'core/updated-text-block', {
				attributes: {
					value: {
						type: 'string',
					},
				},
				transforms: {
					from: [ {
						blocks: [ 'core/text-block' ],
						transform: () => [],
					} ],
				},
				save: noop,
				category: 'common',
				title: 'updated text block',
			} );
			registerBlockType( 'core/text-block', defaultBlockSettings );

			const block = createBlock( 'core/text-block', {
				value: 'ribs',
			} );

			const transformedBlocks = switchToBlockType( block, 'core/updated-text-block' );

			expect( transformedBlocks ).toBeNull();
		} );

		it( 'should reject single transformations that do not include block types', () => {
			registerBlockType( 'core/updated-text-block', {
				attributes: {
					value: {
						type: 'string',
					},
				},
				transforms: {
					from: [ {
						blocks: [ 'core/text-block' ],
						transform: ( { value } ) => {
							return {
								attributes: {
									value: 'chicken ' + value,
								},
							};
						},
					} ],
				},
				save: noop,
				category: 'common',
				title: 'updated text block',
			} );
			registerBlockType( 'core/text-block', defaultBlockSettings );

			const block = createBlock( 'core/text-block', {
				value: 'ribs',
			} );

			const transformedBlocks = switchToBlockType( block, 'core/updated-text-block' );

			expect( transformedBlocks ).toBeNull();
		} );

		it( 'should reject array transformations that do not include block types', () => {
			registerBlockType( 'core/updated-text-block', {
				attributes: {
					value: {
						type: 'string',
					},
				},
				transforms: {
					from: [ {
						blocks: [ 'core/text-block' ],
						transform: ( { value } ) => {
							return [
								createBlock( 'core/updated-text-block', {
									value: 'chicken ' + value,
								} ),
								{
									attributes: {
										value: 'smoked ' + value,
									},
								},
							];
						},
					} ],
				},
				save: noop,
				category: 'common',
				title: 'updated text block',
			} );
			registerBlockType( 'core/text-block', defaultBlockSettings );

			const block = createBlock( 'core/text-block', {
				value: 'ribs',
			} );

			const transformedBlocks = switchToBlockType( block, 'core/updated-text-block' );

			expect( transformedBlocks ).toBeNull();
		} );

		it( 'should reject single transformations with unexpected block types', () => {
			registerBlockType( 'core/updated-text-block', defaultBlockSettings );
			registerBlockType( 'core/text-block', {
				attributes: {
					value: {
						type: 'string',
					},
				},
				transforms: {
					to: [ {
						blocks: [ 'core/updated-text-block' ],
						transform: ( { value } ) => {
							return createBlock( 'core/text-block', {
								value: 'chicken ' + value,
							} );
						},
					} ],
				},
				save: noop,
				category: 'common',
				title: 'text block',
			} );

			const block = createBlock( 'core/text-block', {
				value: 'ribs',
			} );

			const transformedBlocks = switchToBlockType( block, 'core/updated-text-block' );

			expect( transformedBlocks ).toBeNull();
		} );

		it( 'should reject array transformations with unexpected block types', () => {
			registerBlockType( 'core/updated-text-block', defaultBlockSettings );
			registerBlockType( 'core/text-block', {
				attributes: {
					value: {
						type: 'string',
					},
				},
				transforms: {
					to: [ {
						blocks: [ 'core/updated-text-block' ],
						transform: ( { value } ) => {
							return [
								createBlock( 'core/text-block', {
									value: 'chicken ' + value,
								} ),
								createBlock( 'core/text-block', {
									value: 'smoked ' + value,
								} ),
							];
						},
					} ],
				},
				save: noop,
				category: 'common',
				title: 'text block',
			} );

			const block = createBlock( 'core/text-block', {
				value: 'ribs',
			} );

			const transformedBlocks = switchToBlockType( block, 'core/updated-text-block' );

			expect( transformedBlocks ).toEqual( null );
		} );

		it( 'should accept valid array transformations', () => {
			registerBlockType( 'core/updated-text-block', defaultBlockSettings );
			registerBlockType( 'core/text-block', {
				attributes: {
					value: {
						type: 'string',
					},
				},
				transforms: {
					to: [ {
						type: 'block',
						blocks: [ 'core/updated-text-block' ],
						transform: ( { value } ) => {
							return [
								createBlock( 'core/text-block', {
									value: 'chicken ' + value,
								} ),
								createBlock( 'core/updated-text-block', {
									value: 'smoked ' + value,
								} ),
							];
						},
					} ],
				},
				save: noop,
				category: 'common',
				title: 'text block',
			} );

			const block = createBlock( 'core/text-block', {
				value: 'ribs',
			} );

			const transformedBlocks = switchToBlockType( block, 'core/updated-text-block' );

			// Make sure the block client IDs are set as expected: the first
			// transformed block whose type matches the "destination" type gets
			// to keep the existing block's client ID.
			expect( transformedBlocks ).toHaveLength( 2 );
			expect( transformedBlocks[ 0 ] ).toHaveProperty( 'clientId' );
			expect( transformedBlocks[ 0 ].clientId ).not.toBe( block.clientId );
			expect( transformedBlocks[ 0 ].name ).toBe( 'core/text-block' );
			expect( transformedBlocks[ 0 ].isValid ).toBe( true );
			expect( transformedBlocks[ 0 ].attributes ).toEqual( {
				value: 'chicken ribs',
			} );
			expect( transformedBlocks[ 1 ].clientId ).toBe( block.clientId );
			expect( transformedBlocks[ 1 ] ).toHaveProperty( 'clientId' );
			expect( transformedBlocks[ 1 ].name ).toBe( 'core/updated-text-block' );
			expect( transformedBlocks[ 1 ].isValid ).toBe( true );
			expect( transformedBlocks[ 1 ].attributes ).toEqual( {
				value: 'smoked ribs',
			} );
		} );

		it( 'should pass through inner blocks to transform', () => {
			registerBlockType( 'core/updated-columns-block', {
				attributes: {
					value: {
						type: 'string',
					},
				},
				transforms: {
					from: [ {
						type: 'block',
						blocks: [ 'core/columns-block' ],
						transform( attributes, innerBlocks ) {
							return createBlock(
								'core/updated-columns-block',
								attributes,
								innerBlocks.map( ( innerBlock ) => {
									return cloneBlock( innerBlock, {
										value: 'after',
									} );
								} ),
							);
						},
					} ],
				},
				save: noop,
				category: 'common',
				title: 'updated columns block',
			} );
			registerBlockType( 'core/columns-block', defaultBlockSettings );
			registerBlockType( 'core/column-block', defaultBlockSettings );

			const block = createBlock(
				'core/columns-block',
				{},
				[ createBlock( 'core/column-block', { value: 'before' } ) ]
			);

			const transformedBlocks = switchToBlockType( block, 'core/updated-columns-block' );

			expect( transformedBlocks ).toHaveLength( 1 );
			expect( transformedBlocks[ 0 ].innerBlocks ).toHaveLength( 1 );
			expect( transformedBlocks[ 0 ].innerBlocks[ 0 ].attributes.value ).toBe( 'after' );
		} );

		it( 'should pass through inner blocks to transform (multi)', () => {
			registerBlockType( 'core/updated-columns-block', {
				attributes: {
					value: {
						type: 'string',
					},
				},
				transforms: {
					from: [ {
						type: 'block',
						blocks: [ 'core/columns-block' ],
						isMultiBlock: true,
						transform( blocksAttributes, blocksInnerBlocks ) {
							return blocksAttributes.map( ( attributes, i ) => {
								return createBlock(
									'core/updated-columns-block',
									attributes,
									blocksInnerBlocks[ i ].map( ( innerBlock ) => {
										return cloneBlock( innerBlock, {
											value: 'after' + i,
										} );
									} ),
								);
							} );
						},
					} ],
				},
				save: noop,
				category: 'common',
				title: 'updated columns block',
			} );
			registerBlockType( 'core/columns-block', defaultBlockSettings );
			registerBlockType( 'core/column-block', defaultBlockSettings );

			const blocks = [
				createBlock(
					'core/columns-block',
					{},
					[ createBlock( 'core/column-block', { value: 'before' } ) ]
				),
				createBlock(
					'core/columns-block',
					{},
					[ createBlock( 'core/column-block', { value: 'before' } ) ]
				),
			];

			const transformedBlocks = switchToBlockType( blocks, 'core/updated-columns-block' );

			expect( transformedBlocks ).toHaveLength( 2 );
			expect( transformedBlocks[ 0 ].innerBlocks ).toHaveLength( 1 );
			expect( transformedBlocks[ 0 ].innerBlocks[ 0 ].attributes.value ).toBe( 'after0' );
			expect( transformedBlocks[ 1 ].innerBlocks ).toHaveLength( 1 );
			expect( transformedBlocks[ 1 ].innerBlocks[ 0 ].attributes.value ).toBe( 'after1' );
		} );

		it( 'should pass entire block object(s) to the "__experimentalConvert" method if defined', () => {
			registerBlockType( 'core/test-group-block', {
				attributes: {
					value: {
						type: 'string',
					},
				},
				transforms: {
					from: [ {
						type: 'block',
						blocks: [ '*' ],
						isMultiBlock: true,
						__experimentalConvert( blocks ) {
							const groupInnerBlocks = blocks.map( ( { name, attributes, innerBlocks } ) => {
								return createBlock( name, attributes, innerBlocks );
							} );

							return createBlock( 'core/test-group-block', {}, groupInnerBlocks );
						},
					} ],
				},
				save: noop,
				category: 'common',
				title: 'Test Group Block',
			} );

			registerBlockType( 'core/text-block', defaultBlockSettings );

			const numOfBlocksToGroup = 4;
			const blocks = times( numOfBlocksToGroup, ( index ) => {
				return createBlock( 'core/text-block', {
					value: `textBlock${ index + 1 }`,
				} );
			} );

			const transformedBlocks = switchToBlockType( blocks, 'core/test-group-block' );

			expect( transformedBlocks ).toHaveLength( 1 );
			expect( transformedBlocks[ 0 ].name ).toBe( 'core/test-group-block' );
			expect( transformedBlocks[ 0 ].innerBlocks ).toHaveLength( numOfBlocksToGroup );
		} );

		it( 'should prefer "__experimentalConvert" method over "transform" method when running a transformation', () => {
			const convertSpy = jest.fn( ( blocks ) => {
				const groupInnerBlocks = blocks.map( ( { name, attributes, innerBlocks } ) => {
					return createBlock( name, attributes, innerBlocks );
				} );

				return createBlock( 'core/test-group-block', {}, groupInnerBlocks );
			} );
			const transformSpy = jest.fn();

			registerBlockType( 'core/test-group-block', {
				attributes: {
					value: {
						type: 'string',
					},
				},
				transforms: {
					from: [ {
						type: 'block',
						blocks: [ '*' ],
						isMultiBlock: true,
						__experimentalConvert: convertSpy,
						transform: transformSpy,
					} ],
				},
				save: noop,
				category: 'common',
				title: 'Test Group Block',
			} );

			registerBlockType( 'core/text-block', defaultBlockSettings );

			const numOfBlocksToGroup = 4;
			const blocks = times( numOfBlocksToGroup, ( index ) => {
				return createBlock( 'core/text-block', {
					value: `textBlock${ index + 1 }`,
				} );
			} );

			const transformedBlocks = switchToBlockType( blocks, 'core/test-group-block' );

			expect( transformedBlocks ).toHaveLength( 1 );
			expect( convertSpy.mock.calls ).toHaveLength( 1 );
			expect( transformSpy.mock.calls ).toHaveLength( 0 );
		} );
	} );

	describe( 'getBlockTransforms', () => {
		beforeEach( () => {
			registerBlockType( 'core/text-block', defaultBlockSettings );
			registerBlockType( 'core/transform-from-text-block-1', {
				transforms: {
					from: [ {
						blocks: [ 'core/text-block' ],
					} ],
				},
				save: noop,
				category: 'common',
				title: 'updated text block',
			} );
			registerBlockType( 'core/transform-from-text-block-2', {
				transforms: {
					from: [ {
						blocks: [ 'core/text-block' ],
					} ],
				},
				save: noop,
				category: 'common',
				title: 'updated text block',
			} );
		} );

		it( 'should return all block types of direction', () => {
			const transforms = getBlockTransforms( 'from' );

			expect( transforms ).toEqual( [
				{
					blocks: [ 'core/text-block' ],
					blockName: 'core/transform-from-text-block-1',
				},
				{
					blocks: [ 'core/text-block' ],
					blockName: 'core/transform-from-text-block-2',
				},
			] );
		} );

		it( 'should return empty array if no block type by name', () => {
			const transforms = getBlockTransforms( 'from', 'core/not-exists' );

			expect( transforms ).toEqual( [] );
		} );

		it( 'should return empty array if no defined transforms', () => {
			const transforms = getBlockTransforms( 'to', 'core/transform-from-text-block-1' );

			expect( transforms ).toEqual( [] );
		} );

		it( 'should return single block type transforms of direction', () => {
			const transforms = getBlockTransforms( 'from', 'core/transform-from-text-block-1' );

			expect( transforms ).toEqual( [
				{
					blocks: [ 'core/text-block' ],
					blockName: 'core/transform-from-text-block-1',
				},
			] );
		} );

		it( 'should return single block type transforms when passed as an object', () => {
			const transforms = getBlockTransforms(
				'from',
				getBlockType( 'core/transform-from-text-block-1' )
			);

			expect( transforms ).toEqual( [
				{
					blocks: [ 'core/text-block' ],
					blockName: 'core/transform-from-text-block-1',
				},
			] );
		} );
	} );

	describe( 'findTransform', () => {
		const transforms = [
			{
				blocks: [ 'core/text-block' ],
				priority: 20,
				blockName: 'core/transform-from-text-block-1',
			},
			{
				blocks: [ 'core/text-block' ],
				blockName: 'core/transform-from-text-block-3',
				priority: 5,
			},
			{
				blocks: [ 'core/text-block' ],
				blockName: 'core/transform-from-text-block-2',
			},
		];

		it( 'should return highest priority (lowest numeric value) transform', () => {
			const transform = findTransform( transforms, () => true );

			expect( transform ).toEqual( {
				blocks: [ 'core/text-block' ],
				blockName: 'core/transform-from-text-block-3',
				priority: 5,
			} );
		} );

		it( 'should return null if no matching transform', () => {
			const transform = findTransform( transforms, () => false );

			expect( transform ).toBe( null );
		} );
	} );

	describe( 'isWildcardBlockTransform', () => {
		it( 'should return true for transforms with type of block and "*" alias as blocks', () => {
			const validWildcardBlockTransform = {
				type: 'block',
				blocks: [
					'core/some-other-block-first', // unlikely to happen but...
					'*',
				],
				blockName: 'core/test-block',
			};

			expect( isWildcardBlockTransform( validWildcardBlockTransform ) ).toBe( true );
		} );

		it( 'should return false for transforms with a type which is not "block"', () => {
			const invalidWildcardBlockTransform = {
				type: 'file',
				blocks: [
					'*',
				],
				blockName: 'core/test-block',
			};

			expect( isWildcardBlockTransform( invalidWildcardBlockTransform ) ).toBe( false );
		} );

		it( 'should return false for transforms which do not include "*" alias in "block" array', () => {
			const invalidWildcardBlockTransform = {
				type: 'block',
				blocks: [
					'core/some-block',
					'core/another-block',
				],
				blockName: 'core/test-block',
			};

			expect( isWildcardBlockTransform( invalidWildcardBlockTransform ) ).toBe( false );
		} );

		it( 'should return false for transforms which do not provide an array as the "blocks" option', () => {
			const invalidWildcardBlockTransform = {
				type: 'block',
				blocks: noop,
				blockName: 'core/test-block',
			};

			expect( isWildcardBlockTransform( invalidWildcardBlockTransform ) ).toBe( false );
		} );
	} );

	describe( 'isContainerGroupBlock', () => {
		beforeEach( () => {
			registerBlockType( 'core/registered-grouping-block', {
				attributes: {
					value: {
						type: 'string',
					},
				},
				transforms: {
					from: [ {
						type: 'block',
						blocks: [ '*' ],
						transform: noop,
					} ],
				},
				save: noop,
				category: 'common',
				title: 'A Block with InnerBlocks that supports grouping',
			} );
		} );

		it( 'should return true when passed block name that matches the registered "Grouping" Block', () => {
			setGroupingBlockName( 'registered-grouping-block' );
			expect( isContainerGroupBlock( 'registered-grouping-block' ) ).toBe( true );
		} );

		it( 'should return false when passed block name does not match the registered "Grouping" Block', () => {
			setGroupingBlockName( 'registered-grouping-block' );
			expect( isContainerGroupBlock( 'core/group' ) ).toBe( false );
		} );
	} );

	describe( 'isBlockSelectionOfSameType', () => {
		it( 'should return false when all blocks do not match the name of the first block', () => {
			const blocks = [
				{
					name: 'core/test-block',
				},
				{
					name: 'core/test-block',
				},
				{
					name: 'core/test-block',
				},
				{
					name: 'core/another-block',
				},
				{
					name: 'core/test-block',
				},
			];

			expect( isBlockSelectionOfSameType( blocks ) ).toBe( false );
		} );

		it( 'should return true when all blocks match the name of the first block', () => {
			const blocks = [
				{
					name: 'core/test-block',
				},
				{
					name: 'core/test-block',
				},
				{
					name: 'core/test-block',
				},
				{
					name: 'core/test-block',
				},
			];

			expect( isBlockSelectionOfSameType( blocks ) ).toBe( true );
		} );
	} );
} );
