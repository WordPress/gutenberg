/**
 * Internal dependencies
 */
import { imageFillStyles } from '../image-fill';

describe( 'imageFillStyles()', () => {
	it( 'should return centered object position', () => {
		const { objectPosition } = imageFillStyles( 'image.jpg' );
		expect( objectPosition ).toBe( '50% 50%' );
	} );

	it( 'should return custom object position', () => {
		const { objectPosition } = imageFillStyles( 'image.jpg', {
			x: 0.56,
			y: 0.57,
		} );
		expect( objectPosition ).toBe( '56% 57%' );
	} );
} );
