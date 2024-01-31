/**
 * Internal dependencies
 */
import { imageFillStyles } from '../media-container';

describe( 'imageFillStyles()', () => {
	it( 'should return centered object position', () => {
		const { objectPosition } = imageFillStyles( { x: 0.5, y: 0.5 } );
		expect( objectPosition ).toBe( '50% 50%' );
	} );

	it( 'should return custom object position', () => {
		const { objectPosition } = imageFillStyles( {
			x: 0.56,
			y: 0.57,
		} );
		expect( objectPosition ).toBe( '56% 57%' );
	} );
} );
