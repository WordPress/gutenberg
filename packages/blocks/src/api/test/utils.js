/* eslint-disable react/forbid-elements2 */

/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * Internal dependencies
 */
import { createBlock } from '../factory';
import { getBlockTypes, unregisterBlockType, registerBlockType, setDefaultBlockName } from '../registration';
import { isUnmodifiedDefaultBlock } from '../utils';

describe( 'block helpers', () => {
	beforeAll( () => {
		// Initialize the block store
		require( '../../store' );
	} );

	afterEach( () => {
		setDefaultBlockName( undefined );
		getBlockTypes().forEach( ( block ) => {
			unregisterBlockType( block.name );
		} );
	} );

	describe( 'isUnmodifiedDefaultBlock()', () => {
		it( 'should return true if the default block is unmodified', () => {
			registerBlockType( 'core/test-block', {
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
				category: 'common',
				title: 'test block',
			} );
			setDefaultBlockName( 'core/test-block' );
			const unmodifiedBlock = createBlock( 'core/test-block' );
			expect( isUnmodifiedDefaultBlock( unmodifiedBlock ) ).toBe( true );
		} );

		it( 'should return false if the default block is updated', () => {
			registerBlockType( 'core/test-block', {
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
				category: 'common',
				title: 'test block',
			} );
			setDefaultBlockName( 'core/test-block' );
			const block = createBlock( 'core/test-block' );
			block.attributes.align = 'left';

			expect( isUnmodifiedDefaultBlock( block ) ).toBe( false );
		} );

		it( 'should invalidate cache if the default block name changed', () => {
			registerBlockType( 'core/test-block1', {
				attributes: {
					includesDefault1: {
						type: 'boolean',
						default: true,
					},
				},
				save: noop,
				category: 'common',
				title: 'test block',
			} );
			registerBlockType( 'core/test-block2', {
				attributes: {
					includesDefault2: {
						type: 'boolean',
						default: true,
					},
				},
				save: noop,
				category: 'common',
				title: 'test block',
			} );
			setDefaultBlockName( 'core/test-block1' );
			isUnmodifiedDefaultBlock( createBlock( 'core/test-block1' ) );
			setDefaultBlockName( 'core/test-block2' );
			expect( isUnmodifiedDefaultBlock( createBlock( 'core/test-block2' ) ) ).toBe( true );
		} );
	} );
} );
