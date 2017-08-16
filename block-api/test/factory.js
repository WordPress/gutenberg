/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * Internal dependencies
 */
import { createBlock, switchToBlockType } from '../factory';

describe( 'block factory', () => {
	describe( 'createBlock()', () => {
		it( 'should create a block given its blockType and attributes', () => {
			const blockType = {
				name: 'core/test-block',
				attributes: {
					align: {
						type: 'string',
					},
					includesDefault: {
						type: 'boolean',
						default: true,
					},
				},
				save: noop,
			};
			const block = createBlock( blockType, {
				align: 'left',
			} );

			expect( block.name ).toEqual( 'core/test-block' );
			expect( block.attributes ).toEqual( {
				includesDefault: true,
				align: 'left',
			} );
			expect( block.isValid ).toBe( true );
			expect( typeof block.uid ).toBe( 'string' );
		} );
	} );

	describe( 'switchToBlockType()', () => {
		const defaultBlockType = {
			name: 'core/text-block',
			attributes: {
				value: {
					type: 'string',
				},
			},
			save: noop,
		};
		it( 'should switch the blockType of a block using the "transform form"', () => {
			const updatedTextBlock = {
				name: 'core/updated-text-block',
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
								name: 'core/updated-text-block',
								attributes: {
									value: 'chicken ' + value,
								},
							};
						},
					} ],
				},
				save: noop,
				category: 'common',
			};
			const config = {
				blockTypes: [ updatedTextBlock, defaultBlockType ],
			};

			const block = createBlock( defaultBlockType, {
				value: 'ribs',
			} );

			const transformedBlocks = switchToBlockType( block, 'core/updated-text-block', config );

			expect( transformedBlocks ).toHaveLength( 1 );
			expect( transformedBlocks[ 0 ] ).toHaveProperty( 'uid' );
			expect( transformedBlocks[ 0 ].name ).toBe( 'core/updated-text-block' );
			expect( transformedBlocks[ 0 ].isValid ).toBe( true );
			expect( transformedBlocks[ 0 ].attributes ).toEqual( {
				value: 'chicken ribs',
			} );
		} );

		it( 'should switch the blockType of a block using the "transform to"', () => {
			const updatedTextBlock = {
				...defaultBlockType,
				name: 'core/updated-text-block',
			};
			const textBlock = {
				name: 'core/text-block',
				attributes: {
					value: {
						type: 'string',
					},
				},
				transforms: {
					to: [ {
						blocks: [ 'core/updated-text-block' ],
						transform: ( { value } ) => {
							return {
								name: 'core/updated-text-block',
								attributes: {
									value: 'chicken ' + value,
								},
							};
						},
					} ],
				},
				save: noop,
				category: 'common',
			};
			const config = {
				blockTypes: [ updatedTextBlock, textBlock ],
			};
			const block = createBlock( textBlock, {
				value: 'ribs',
			} );

			const transformedBlocks = switchToBlockType( block, 'core/updated-text-block', config );

			expect( transformedBlocks ).toHaveLength( 1 );
			expect( transformedBlocks[ 0 ] ).toHaveProperty( 'uid' );
			expect( transformedBlocks[ 0 ].name ).toBe( 'core/updated-text-block' );
			expect( transformedBlocks[ 0 ].isValid ).toBe( true );
			expect( transformedBlocks[ 0 ].attributes ).toEqual( {
				value: 'chicken ribs',
			} );
		} );

		it( 'should return null if no transformation is found', () => {
			const updatedTextBlock = {
				...defaultBlockType,
				name: 'core/updated-text-block',
			};
			const config = {
				blockTypes: [ updatedTextBlock, defaultBlockType ],
			};
			const block = createBlock( defaultBlockType, {
				value: 'ribs',
			} );

			const transformedBlocks = switchToBlockType( block, 'core/updated-text-block', config );

			expect( transformedBlocks ).toBeNull();
		} );

		it( 'should reject transformations that return null', () => {
			const updatedTextBlock = {
				name: 'core/updated-text-block',
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
			};
			const config = {
				blockTypes: [ updatedTextBlock, defaultBlockType ],
			};
			const block = createBlock( defaultBlockType, {
				value: 'ribs',
			} );

			const transformedBlocks = switchToBlockType( block, 'core/updated-text-block', config );

			expect( transformedBlocks ).toBeNull();
		} );

		it( 'should reject transformations that return an empty array', () => {
			const updatedTextBlock = {
				name: 'core/updated-text-block',
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
			};
			const config = {
				blockTypes: [ updatedTextBlock, defaultBlockType ],
			};
			const block = createBlock( defaultBlockType, {
				value: 'ribs',
			} );

			const transformedBlocks = switchToBlockType( block, 'core/updated-text-block', config );

			expect( transformedBlocks ).toBeNull();
		} );

		it( 'should reject single transformations that do not include block types', () => {
			const updatedTextBlock = {
				name: 'core/updated-text-block',
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
			};
			const config = {
				blockTypes: [ updatedTextBlock, defaultBlockType ],
			};

			const block = createBlock( defaultBlockType, {
				value: 'ribs',
			} );

			const transformedBlocks = switchToBlockType( block, 'core/updated-text-block', config );

			expect( transformedBlocks ).toBeNull();
		} );

		it( 'should reject array transformations that do not include block types', () => {
			const updatedTextBlock = {
				name: 'core/updated-text-block',
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
								{
									name: 'core/updated-text-block',
									attributes: {
										value: 'chicken ' + value,
									},
								},
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
			};
			const config = {
				blockTypes: [ updatedTextBlock, defaultBlockType ],
			};

			const block = createBlock( defaultBlockType, {
				value: 'ribs',
			} );

			const transformedBlocks = switchToBlockType( block, 'core/updated-text-block', config );

			expect( transformedBlocks ).toBeNull();
		} );

		it( 'should reject single transformations with unexpected block types', () => {
			const updatedTextBlock = {
				...defaultBlockType,
				name: 'core/updated-text-block',
			};
			const textBlock = {
				name: 'core/text-block',
				attributes: {
					value: {
						type: 'string',
					},
				},
				transforms: {
					to: [ {
						blocks: [ 'core/updated-text-block' ],
						transform: ( { value } ) => {
							return {
								name: 'core/text-block',
								attributes: {
									value: 'chicken ' + value,
								},
							};
						},
					} ],
				},
				save: noop,
				category: 'common',
			};
			const config = {
				blockTypes: [ updatedTextBlock, textBlock ],
			};

			const block = createBlock( textBlock, {
				value: 'ribs',
			} );

			const transformedBlocks = switchToBlockType( block, 'core/updated-text-block', config );

			expect( transformedBlocks ).toBeNull();
		} );

		it( 'should reject array transformations with unexpected block types', () => {
			const updatedTextBlock = {
				...defaultBlockType,
				name: 'core/updated-text-block',
			};
			const textBlock = {
				name: 'core/text-block',
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
								{
									name: 'core/text-block',
									attributes: {
										value: 'chicken ' + value,
									},
								},
								{
									name: 'core/text-block',
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
			};
			const config = {
				blockTypes: [ updatedTextBlock, textBlock ],
			};
			const block = createBlock( textBlock, {
				value: 'ribs',
			} );

			const transformedBlocks = switchToBlockType( block, 'core/updated-text-block', config );

			expect( transformedBlocks ).toEqual( null );
		} );

		it( 'should accept valid array transformations', () => {
			const updatedTextBlock = {
				...defaultBlockType,
				name: 'core/updated-text-block',
			};
			const textBlock = {
				name: 'core/text-block',
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
								{
									name: 'core/text-block',
									attributes: {
										value: 'chicken ' + value,
									},
								},
								{
									name: 'core/updated-text-block',
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
			};
			const config = {
				blockTypes: [ updatedTextBlock, textBlock ],
			};
			const block = createBlock( textBlock, {
				value: 'ribs',
			} );

			const transformedBlocks = switchToBlockType( block, 'core/updated-text-block', config );

			// Make sure the block UIDs are set as expected: the first
			// transformed block whose type matches the "destination" type gets
			// to keep the existing block's UID.
			expect( transformedBlocks ).toHaveLength( 2 );
			expect( transformedBlocks[ 0 ] ).toHaveProperty( 'uid' );
			expect( transformedBlocks[ 0 ].uid ).not.toBe( block.uid );
			expect( transformedBlocks[ 0 ].name ).toBe( 'core/text-block' );
			expect( transformedBlocks[ 0 ].isValid ).toBe( true );
			expect( transformedBlocks[ 0 ].attributes ).toEqual( {
				value: 'chicken ribs',
			} );
			expect( transformedBlocks[ 1 ].uid ).toBe( block.uid );
			expect( transformedBlocks[ 1 ] ).toHaveProperty( 'uid' );
			expect( transformedBlocks[ 1 ].name ).toBe( 'core/updated-text-block' );
			expect( transformedBlocks[ 1 ].isValid ).toBe( true );
			expect( transformedBlocks[ 1 ].attributes ).toEqual( {
				value: 'smoked ribs',
			} );
		} );
	} );
} );
