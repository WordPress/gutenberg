/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * Internal dependencies
 */
import { createBlock, switchToBlockType } from '../factory';
import { getBlockTypes, unregisterBlockType, setUnknownTypeHandler, registerBlockType } from '../registration';

describe( 'block factory', () => {
	const defaultBlockSettings = { save: noop };

	afterEach( () => {
		setUnknownTypeHandler( undefined );
		getBlockTypes().forEach( ( block ) => {
			unregisterBlockType( block.name );
		} );
	} );

	describe( 'createBlock()', () => {
		it( 'should create a block given its blockType and attributes', () => {
			registerBlockType( 'not-core/test-block', {
				defaultAttributes: {
					includesDefault: true,
				},
				save: noop,
			} );
			const block = createBlock( 'not-core/test-block', {
				align: 'left',
			} );

			expect( block.name ).toEqual( 'not-core/test-block' );
			expect( block.attributes ).toEqual( {
				includesDefault: true,
				align: 'left',
			} );
			expect( block.isValid ).toBe( true );
			expect( typeof block.uid ).toBe( 'string' );
		} );
	} );

	describe( 'switchToBlockType()', () => {
		it( 'should switch the blockType of a block using the "transform form"', () => {
			registerBlockType( 'not-core/updated-text-block', {
				transforms: {
					from: [ {
						blocks: [ 'not-core/text-block' ],
						transform: ( { value } ) => {
							return createBlock( 'not-core/updated-text-block', {
								value: 'chicken ' + value,
							} );
						},
					} ],
				},
				save: noop,
			} );
			registerBlockType( 'not-core/text-block', defaultBlockSettings );

			const block = createBlock( 'not-core/text-block', {
				value: 'ribs',
			} );

			const transformedBlocks = switchToBlockType( block, 'not-core/updated-text-block' );

			expect( transformedBlocks ).toHaveLength( 1 );
			expect( transformedBlocks[ 0 ] ).toHaveProperty( 'uid' );
			expect( transformedBlocks[ 0 ].name ).toBe( 'not-core/updated-text-block' );
			expect( transformedBlocks[ 0 ].isValid ).toBe( true );
			expect( transformedBlocks[ 0 ].attributes ).toEqual( {
				value: 'chicken ribs',
			} );
		} );

		it( 'should switch the blockType of a block using the "transform to"', () => {
			registerBlockType( 'not-core/updated-text-block', defaultBlockSettings );
			registerBlockType( 'not-core/text-block', {
				transforms: {
					to: [ {
						blocks: [ 'not-core/updated-text-block' ],
						transform: ( { value } ) => {
							return createBlock( 'not-core/updated-text-block', {
								value: 'chicken ' + value,
							} );
						},
					} ],
				},
				save: noop,
			} );

			const block = createBlock( 'not-core/text-block', {
				value: 'ribs',
			} );

			const transformedBlocks = switchToBlockType( block, 'not-core/updated-text-block' );

			expect( transformedBlocks ).toHaveLength( 1 );
			expect( transformedBlocks[ 0 ] ).toHaveProperty( 'uid' );
			expect( transformedBlocks[ 0 ].name ).toBe( 'not-core/updated-text-block' );
			expect( transformedBlocks[ 0 ].isValid ).toBe( true );
			expect( transformedBlocks[ 0 ].attributes ).toEqual( {
				value: 'chicken ribs',
			} );
		} );

		it( 'should return null if no transformation is found', () => {
			registerBlockType( 'not-core/updated-text-block', defaultBlockSettings );
			registerBlockType( 'not-core/text-block', defaultBlockSettings );

			const block = createBlock( 'not-core/text-block', {
				value: 'ribs',
			} );

			const transformedBlocks = switchToBlockType( block, 'not-core/updated-text-block' );

			expect( transformedBlocks ).toBeNull();
		} );

		it( 'should reject transformations that return null', () => {
			registerBlockType( 'not-core/updated-text-block', {
				transforms: {
					from: [ {
						blocks: [ 'not-core/text-block' ],
						transform: () => null,
					} ],
				},
				save: noop,
			} );
			registerBlockType( 'not-core/text-block', defaultBlockSettings );

			const block = createBlock( 'not-core/text-block', {
				value: 'ribs',
			} );

			const transformedBlocks = switchToBlockType( block, 'not-core/updated-text-block' );

			expect( transformedBlocks ).toBeNull();
		} );

		it( 'should reject transformations that return an empty array', () => {
			registerBlockType( 'not-core/updated-text-block', {
				transforms: {
					from: [ {
						blocks: [ 'not-core/text-block' ],
						transform: () => [],
					} ],
				},
				save: noop,
			} );
			registerBlockType( 'not-core/text-block', defaultBlockSettings );

			const block = createBlock( 'not-core/text-block', {
				value: 'ribs',
			} );

			const transformedBlocks = switchToBlockType( block, 'not-core/updated-text-block' );

			expect( transformedBlocks ).toBeNull();
		} );

		it( 'should reject single transformations that do not include block types', () => {
			registerBlockType( 'not-core/updated-text-block', {
				transforms: {
					from: [ {
						blocks: [ 'not-core/text-block' ],
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
			} );
			registerBlockType( 'not-core/text-block', defaultBlockSettings );

			const block = createBlock( 'not-core/text-block', {
				value: 'ribs',
			} );

			const transformedBlocks = switchToBlockType( block, 'not-core/updated-text-block' );

			expect( transformedBlocks ).toBeNull();
		} );

		it( 'should reject array transformations that do not include block types', () => {
			registerBlockType( 'not-core/updated-text-block', {
				transforms: {
					from: [ {
						blocks: [ 'not-core/text-block' ],
						transform: ( { value } ) => {
							return [
								createBlock( 'not-core/updated-text-block', {
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
			} );
			registerBlockType( 'not-core/text-block', defaultBlockSettings );

			const block = createBlock( 'not-core/text-block', {
				value: 'ribs',
			} );

			const transformedBlocks = switchToBlockType( block, 'not-core/updated-text-block' );

			expect( transformedBlocks ).toBeNull();
		} );

		it( 'should reject single transformations with unexpected block types', () => {
			registerBlockType( 'not-core/updated-text-block', defaultBlockSettings );
			registerBlockType( 'not-core/text-block', {
				transforms: {
					to: [ {
						blocks: [ 'not-core/updated-text-block' ],
						transform: ( { value } ) => {
							return createBlock( 'not-core/text-block', {
								value: 'chicken ' + value,
							} );
						},
					} ],
				},
				save: noop,
			} );

			const block = createBlock( 'not-core/text-block', {
				value: 'ribs',
			} );

			const transformedBlocks = switchToBlockType( block, 'not-core/updated-text-block' );

			expect( transformedBlocks ).toBeNull();
		} );

		it( 'should reject array transformations with unexpected block types', () => {
			registerBlockType( 'not-core/updated-text-block', defaultBlockSettings );
			registerBlockType( 'not-core/text-block', {
				transforms: {
					to: [ {
						blocks: [ 'not-core/updated-text-block' ],
						transform: ( { value } ) => {
							return [
								createBlock( 'not-core/text-block', {
									value: 'chicken ' + value,
								} ),
								createBlock( 'not-core/text-block', {
									value: 'smoked ' + value,
								} ),
							];
						},
					} ],
				},
				save: noop,
			} );

			const block = createBlock( 'not-core/text-block', {
				value: 'ribs',
			} );

			const transformedBlocks = switchToBlockType( block, 'not-core/updated-text-block' );

			expect( transformedBlocks ).toEqual( null );
		} );

		it( 'should accept valid array transformations', () => {
			registerBlockType( 'not-core/updated-text-block', defaultBlockSettings );
			registerBlockType( 'not-core/text-block', {
				transforms: {
					to: [ {
						blocks: [ 'not-core/updated-text-block' ],
						transform: ( { value } ) => {
							return [
								createBlock( 'not-core/text-block', {
									value: 'chicken ' + value,
								} ),
								createBlock( 'not-core/updated-text-block', {
									value: 'smoked ' + value,
								} ),
							];
						},
					} ],
				},
				save: noop,
			} );

			const block = createBlock( 'not-core/text-block', {
				value: 'ribs',
			} );

			const transformedBlocks = switchToBlockType( block, 'not-core/updated-text-block' );

			// Make sure the block UIDs are set as expected: the first
			// transformed block whose type matches the "destination" type gets
			// to keep the existing block's UID.
			expect( transformedBlocks ).toHaveLength( 2 );
			expect( transformedBlocks[ 0 ] ).toHaveProperty( 'uid' );
			expect( transformedBlocks[ 0 ].uid ).not.toBe( block.uid );
			expect( transformedBlocks[ 0 ].name ).toBe( 'not-core/text-block' );
			expect( transformedBlocks[ 0 ].isValid ).toBe( true );
			expect( transformedBlocks[ 0 ].attributes ).toEqual( {
				value: 'chicken ribs',
			} );
			expect( transformedBlocks[ 1 ].uid ).toBe( block.uid );
			expect( transformedBlocks[ 1 ] ).toHaveProperty( 'uid' );
			expect( transformedBlocks[ 1 ].name ).toBe( 'not-core/updated-text-block' );
			expect( transformedBlocks[ 1 ].isValid ).toBe( true );
			expect( transformedBlocks[ 1 ].attributes ).toEqual( {
				value: 'smoked ribs',
			} );
		} );
	} );
} );
