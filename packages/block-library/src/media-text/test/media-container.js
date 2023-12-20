/**
 * Internal dependencies
 */
import { imageFillStyles } from '../media-container';

describe( 'imageFillStyles()', () => {
	it( 'should return image url', () => {
		const { backgroundImage } = imageFillStyles( 'image.jpg' );
		expect( backgroundImage ).toBe( 'url(image.jpg)' );
	} );

	it( 'should return centered background position', () => {
		const { backgroundPosition } = imageFillStyles( 'image.jpg' );
		expect( backgroundPosition ).toBe( '50% 50%' );
	} );

	it( 'should return custom background position', () => {
		const { backgroundPosition } = imageFillStyles( 'image.jpg', {
			x: 0.56,
			y: 0.57,
		} );
		expect( backgroundPosition ).toBe( '56% 57%' );
	} );
} );
