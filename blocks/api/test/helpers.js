/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * Internal dependencies
 */
import { createBlock } from '../factory';
import { getBlockTypes, unregisterBlockType, registerBlockType, setDefaultBlockName } from '../registration';
import { isUntouchedDefaultBlock } from '../helpers';

describe( 'block helpers', () => {
	afterEach( () => {
		setDefaultBlockName( undefined );
		getBlockTypes().forEach( ( block ) => {
			unregisterBlockType( block.name );
		} );
	} );

	describe( 'isUntouchedDefaultBlock()', () => {
		it( 'should return true if the default block is untouched', () => {
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
			const untouchedBlock = createBlock( 'core/test-block' );
			expect( isUntouchedDefaultBlock( untouchedBlock ) ).toBe( true );
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

			expect( isUntouchedDefaultBlock( block ) ).toBe( false );
		} );
	} );
} );
