/**
 * WordPress dependencies
 */
import { unregisterBlockType, registerBlockType } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { getMatchingBlockByName, getRetainedBlockAttributes } from '../utils';

describe( 'BlockSwitcher - utils', () => {
	describe( 'getRetainedBlockAttributes', () => {
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
		it( 'should return passed attributes if no `role:content` attributes were found', () => {
			const attributes = { align: 'right' };
			const res = getRetainedBlockAttributes(
				'core/test-block-2',
				attributes
			);
			expect( res ).toEqual( attributes );
		} );
		it( 'should return only the `role:content` attributes that exist in passed attributes', () => {
			const attributes = { align: 'right', level: 2 };
			const res = getRetainedBlockAttributes(
				'core/test-block-1',
				attributes
			);
			expect( res ).toEqual( { level: 2 } );
		} );
	} );
	describe( 'getMatchingBlockByName', () => {
		it( 'should return nothing if no match is found', () => {
			const block = {
				clientId: 'client-1',
				name: 'test-1',
				innerBlocks: [
					{
						clientId: 'client-1-1',
						name: 'test-1-1',
						innerBlocks: [],
					},
				],
			};
			const res = getMatchingBlockByName( block, 'not-a-match' );
			expect( res ).toBeUndefined();
		} );
		it( 'should return nothing if provided block has already been consumed', () => {
			const block = {
				clientId: 'client-1',
				name: 'test-1',
				innerBlocks: [
					{
						clientId: 'client-1-1',
						name: 'test-1-1',
						innerBlocks: [],
					},
					{
						clientId: 'client-1-2',
						name: 'test-1-2',
						innerBlocks: [],
					},
				],
			};
			const res = getMatchingBlockByName(
				block,
				'test-1-2',
				new Set( [ 'client-1-2' ] )
			);
			expect( res ).toBeUndefined();
		} );
		describe( 'should return the matched block', () => {
			it( 'if top level block', () => {
				const block = {
					clientId: 'client-1',
					name: 'test-1',
					innerBlocks: [],
				};
				const res = getMatchingBlockByName(
					block,
					'test-1',
					new Set( [ 'client-1-2' ] )
				);
				expect( res ).toEqual(
					expect.objectContaining( {
						clientId: 'client-1',
						name: 'test-1',
						innerBlocks: [],
					} )
				);
			} );
			it( 'if nested block', () => {
				const block = {
					clientId: 'client-1',
					name: 'test-1',
					innerBlocks: [
						{
							clientId: 'client-1-1',
							name: 'test-1-1',
							innerBlocks: [],
						},
						{
							clientId: 'client-1-2',
							name: 'test-1-2',
							innerBlocks: [
								{
									clientId: 'client-1-2-1',
									name: 'test-1-2-1',
									innerBlocks: [],
								},
							],
						},
					],
				};
				const res = getMatchingBlockByName(
					block,
					'test-1-2-1',
					new Set( [ 'someId' ] )
				);
				expect( res ).toEqual(
					expect.objectContaining( {
						clientId: 'client-1-2-1',
						name: 'test-1-2-1',
						innerBlocks: [],
					} )
				);
			} );
		} );
	} );
} );
