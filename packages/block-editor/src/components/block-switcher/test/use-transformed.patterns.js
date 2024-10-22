/**
 * WordPress dependencies
 */
import { unregisterBlockType, registerBlockType } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import {
	transformMatchingBlock,
	getPatternTransformedBlocks,
} from '../use-transformed-patterns';

describe( 'use-transformed-patterns', () => {
	beforeAll( () => {
		registerBlockType( 'core/test-block-1', {
			attributes: {
				align: {
					type: 'string',
				},
				content: {
					type: 'boolean',
					role: 'content',
				},
				level: {
					type: 'number',
					role: 'content',
				},
				color: {
					type: 'string',
					role: 'other',
				},
			},
			save() {},
			category: 'text',
			title: 'test block 1',
		} );
		registerBlockType( 'core/test-block-2', {
			attributes: {
				align: { type: 'string' },
				content: { type: 'boolean' },
				color: { type: 'string' },
			},
			save() {},
			category: 'text',
			title: 'test block 2',
		} );
	} );
	afterAll( () => {
		[ 'core/test-block-1', 'core/test-block-2' ].forEach(
			unregisterBlockType
		);
	} );
	describe( 'transformMatchingBlock', () => {
		it( 'should properly update the matching block - No retained block attributes', () => {
			const match = {
				clientId: 'block-2',
				name: 'core/test-block-2',
				attributes: { align: 'center' },
			};
			const selectedBlock = {
				clientId: 'selected-block-2',
				name: 'core/test-block-2',
				attributes: { align: 'right', content: 'hi' },
			};
			transformMatchingBlock( match, selectedBlock );
			expect( match ).toEqual(
				expect.objectContaining( {
					clientId: 'block-2',
					name: 'core/test-block-2',
					attributes: expect.objectContaining( {
						align: 'right',
						content: 'hi',
					} ),
				} )
			);
		} );
		it( 'should properly update the matching block - WITH retained block attributes', () => {
			const match = {
				clientId: 'block-1',
				name: 'core/test-block-1',
				attributes: {
					align: 'center',
					content: 'from match',
					level: 3,
					color: 'red',
				},
			};
			const selectedBlock = {
				clientId: 'selected-block-1',
				name: 'core/test-block-1',
				attributes: {
					align: 'left',
					content: 'from selected block',
					level: 1,
					color: 'green',
				},
			};
			transformMatchingBlock( match, selectedBlock );
			expect( match ).toEqual(
				expect.objectContaining( {
					clientId: 'block-1',
					name: 'core/test-block-1',
					attributes: expect.objectContaining( {
						align: 'center',
						content: 'from selected block',
						level: 1,
						color: 'red',
					} ),
				} )
			);
		} );
	} );
	describe( 'getPatternTransformedBlocks', () => {
		const patternBlocks = [
			{
				clientId: 'client-1',
				name: 'core/test-block-1',
				attributes: { content: 'top level block 1', color: 'red' },
				innerBlocks: [
					{
						clientId: 'client-1-1',
						name: 'core/test-block-2',
						innerBlocks: [],
					},
					{
						clientId: 'client-1-2',
						name: 'core/test-block-2',
						innerBlocks: [
							{
								clientId: 'client-1-2-1',
								name: 'core/test-block-1',
								attributes: {
									content: 'nested block 1',
									level: 6,
									color: 'yellow',
								},
								innerBlocks: [],
							},
						],
					},
				],
			},
			{
				clientId: 'client-2',
				name: 'core/test-block-2',
				innerBlocks: [
					{
						clientId: 'client-1-1',
						name: 'core/test-block-2',
						innerBlocks: [],
					},
					{
						clientId: 'client-1-2',
						name: 'nested block',
						innerBlocks: [
							{
								clientId: 'client-1-2-1',
								name: 'core/test-block-1',
								attributes: {
									content: 'nested block 1',
									level: 6,
									color: 'yellow',
								},
								innerBlocks: [],
							},
						],
					},
				],
			},
			{
				clientId: 'client-3',
				name: 'core/test-block-1',
				attributes: { content: 'top level block 3', color: 'purple' },
				innerBlocks: [],
			},
		];
		describe( 'return nothing', () => {
			it( 'when no match is found', () => {
				const selectedBlocks = [
					{
						clientId: 'selected-1',
						name: 'selected-1',
						innerBlocks: [],
					},
				];
				const res = getPatternTransformedBlocks(
					selectedBlocks,
					patternBlocks
				);
				expect( res ).toBeUndefined();
			} );
			it( 'when not ALL blocks are matched', () => {
				const selectedBlocks = [
					{
						clientId: 'selected-1',
						name: 'core/test-block-1',
						attributes: {
							content: 'from selected',
							color: 'green',
						},
						innerBlocks: [],
					},
					{
						clientId: 'selected-2',
						name: 'not in pattern',
						innerBlocks: [],
					},
				];
				const res = getPatternTransformedBlocks(
					selectedBlocks,
					patternBlocks
				);
				expect( res ).toBeUndefined();
			} );
		} );
		describe( 'return properly transformed pattern blocks', () => {
			it( 'when single block is selected', () => {
				const selectedBlocks = [
					{
						clientId: 'selected-1',
						name: 'core/test-block-1',
						attributes: {
							content: 'from selected',
							color: 'green',
						},
						innerBlocks: [],
					},
				];
				const res = getPatternTransformedBlocks(
					selectedBlocks,
					patternBlocks
				);
				expect( res ).toHaveLength( 3 );
				expect( res ).toEqual(
					expect.arrayContaining( [
						expect.objectContaining( {
							name: 'core/test-block-1',
							attributes: expect.objectContaining( {
								content: 'from selected',
								color: 'red',
							} ),
						} ),
						expect.objectContaining( {
							name: 'core/test-block-2',
						} ),
						expect.objectContaining( {
							name: 'core/test-block-1',
							attributes: {
								content: 'top level block 3',
								color: 'purple',
							},
						} ),
					] )
				);
			} );
			it( 'when multiple selected blocks', () => {
				/**
				 * The matching is performed recursively searching depth first,
				 * so top level blocks' InnerBlocks are search before trying
				 * the next top level pattern's block.
				 */
				const selectedBlocks = [
					{
						clientId: 'selected-1',
						name: 'core/test-block-1',
						attributes: {
							content: 'from selected 1',
							color: 'green',
						},
						innerBlocks: [],
					},
					{
						clientId: 'selected-2',
						name: 'core/test-block-1',
						attributes: {
							content: 'from selected 2',
							level: 1,
						},
						innerBlocks: [],
					},
					{
						clientId: 'selected-3',
						name: 'core/test-block-1',
						attributes: {
							content: 'from selected 3',
							color: 'white',
						},
						innerBlocks: [],
					},
				];
				const res = getPatternTransformedBlocks(
					selectedBlocks,
					patternBlocks
				);
				expect( res ).toHaveLength( 3 );
				expect( res ).toEqual(
					expect.arrayContaining( [
						expect.objectContaining( {
							name: 'core/test-block-1',
							attributes: expect.objectContaining( {
								content: 'from selected 1',
								color: 'red',
							} ),
						} ),
						expect.objectContaining( {
							name: 'core/test-block-2',
							innerBlocks: expect.arrayContaining( [
								expect.objectContaining( {
									name: 'nested block',
									innerBlocks: [
										expect.objectContaining( {
											name: 'core/test-block-1',
											attributes: {
												content: 'from selected 2',
												level: 1,
												color: 'yellow',
											},
										} ),
									],
								} ),
							] ),
						} ),
						expect.objectContaining( {
							name: 'core/test-block-1',
							attributes: {
								content: 'from selected 3',
								color: 'purple',
							},
						} ),
					] )
				);
			} );
		} );
	} );
} );
