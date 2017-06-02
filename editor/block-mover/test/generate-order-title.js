/**
 * External dependencies
 */
import { expect } from 'chai';

/**
 * Internal dependencies
 */
import generateOrderTitle from '../generate-order-title';

describe( 'block mover', () => {
	describe( 'generateOrderTitle', () => {
		const typeTitle = 'TestType';

		it( 'Should generate a title for the first item moving up', () => {
			expect( generateOrderTitle( {
				typeTitle,
				position: 1,
				isFirst: true,
				isLast: false,
				dir: -1,
			} ) ).to.equal(
				'Block "' + typeTitle + '" is at the beginning of the content and can’t be moved up'
			);
		} );

		it( 'Should generate a title for the last item moving down', () => {
			expect( generateOrderTitle( {
				typeTitle,
				position: 1,
				isFirst: false,
				isLast: true,
				dir: 1,
			} ) ).to.equal(
				'Block "' + typeTitle + '" is at the end of the content and can’t be moved down'
			);
		} );

		it( 'Should generate a title for the second item moving up', () => {
			expect( generateOrderTitle( {
				typeTitle,
				position: 2,
				isFirst: false,
				isLast: false,
				dir: -1,
			} ) ).to.equal(
				'Move "' + typeTitle + '" block from position 2 up to position 1'
			);
		} );

		it( 'Should generate a title for the second item moving down', () => {
			expect( generateOrderTitle( {
				typeTitle,
				position: 2,
				isFirst: false,
				isLast: false,
				dir: 1,
			} ) ).to.equal(
				'Move "' + typeTitle + '" block from position 2 down to position 3'
			);
		} );

		it( 'Should generate a title for the only item in the list', () => {
			expect( generateOrderTitle( {
				typeTitle,
				position: 1,
				isFirst: true,
				isLast: true,
				dir: 1,
			} ) ).to.equal(
				'Block "' + typeTitle + '" is the only block, and cannot be moved'
			);
		} );
	} );
} );
