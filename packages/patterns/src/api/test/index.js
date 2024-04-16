/**
 * Internal dependencies
 */
import { getOverridableAttributes } from '../';
import { PARTIAL_SYNCING_SUPPORTED_BLOCKS } from '../../constants';

/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';
import { registerCoreBlocks } from '@wordpress/block-library';

describe( 'getOverridableAttributes', () => {
	beforeAll( () => {
		registerCoreBlocks();
	} );

	it( 'should return an array of overridable attributes', () => {
		const block = createBlock( 'core/paragraph', {
			metadata: {
				bindings: {
					content: { source: 'core/pattern-overrides' },
				},
			},
		} );

		const attributes = getOverridableAttributes( block );

		expect( attributes ).toEqual( [ 'content' ] );
	} );

	it( 'should return the default list for core blocks', () => {
		const block = createBlock( 'core/image', {
			metadata: {
				bindings: {
					__default: { source: 'core/pattern-overrides' },
				},
			},
		} );

		const attributes = getOverridableAttributes( block );

		expect( attributes ).toEqual(
			PARTIAL_SYNCING_SUPPORTED_BLOCKS[ 'core/image' ]
		);
	} );

	it( 'should allow overrides of the default list', () => {
		const block = createBlock( 'core/image', {
			metadata: {
				bindings: {
					__default: { source: 'core/pattern-overrides' },
					alt: { source: 'core/post-meta' },
					width: { source: 'core/pattern-overrides' },
				},
			},
		} );

		const attributes = getOverridableAttributes( block );

		const defaultAttributes = new Set(
			PARTIAL_SYNCING_SUPPORTED_BLOCKS[ 'core/image' ]
		);
		defaultAttributes.delete( 'alt' );
		defaultAttributes.add( 'width' );

		expect( attributes ).toEqual( Array.from( defaultAttributes ) );
	} );
} );
