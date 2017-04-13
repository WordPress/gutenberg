/**
 * External dependencies
 */
import { expect } from 'chai';

/**
 * Internal dependencies
 */
import { createBlock } from '../factory';

describe( 'block factory', () => {
	describe( 'createBlock()', () => {
		it( 'should create a block given its blockType and attributes', () => {
			const block = createBlock( 'core/test-block', {
				align: 'left'
			} );

			expect( block.blockType ).to.eql( 'core/test-block' );
			expect( block.attributes ).to.eql( {
				align: 'left'
			} );
			expect( block.uid ).to.be.a( 'string' );
		} );
	} );
} );
