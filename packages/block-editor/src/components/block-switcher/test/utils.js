/**
 * WordPress dependencies
 */
import { unregisterBlockType, registerBlockType } from '@wordpress/blocks';
/**
 * Internal dependencies
 */
import {
	// getMatchingBlockInPattern,
	getBlockRetainingAttributes,
} from '../utils';
describe( 'BlockSwitcher - utils', () => {
	describe( 'getBlockRetainingAttributes', () => {
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
			const res = getBlockRetainingAttributes(
				'core/test-block-2',
				attributes
			);
			expect( res ).toEqual( attributes );
		} );
		it( 'should return only the `role:content` attributes that exist in passed attributes', () => {
			const attributes = { align: 'right', level: 2 };
			const res = getBlockRetainingAttributes(
				'core/test-block-1',
				attributes
			);
			expect( res ).toEqual( { level: 2 } );
		} );
	} );
	describe( 'findMatchingBlockInPattern', () => {} );
} );
