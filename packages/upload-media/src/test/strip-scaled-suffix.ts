/**
 * Internal dependencies
 */
import { stripScaledSuffix } from '../utils';

describe( 'stripScaledSuffix', () => {
	it.each( [
		[ 'IMG_2300-scaled.jpg', 'IMG_2300.jpg' ],
		[ 'photo-scaled.jpeg', 'photo.jpeg' ],
		[ 'my.image-scaled.png', 'my.image.png' ],
		[ 'IMG_2300.jpg', 'IMG_2300.jpg' ],
		[ 'thumbnail-150x150.jpg', 'thumbnail-150x150.jpg' ],
		[ 'name-scaled-1.jpg', 'name-scaled-1.jpg' ],
		[ 'scaled.jpg', 'scaled.jpg' ],
		[ '', '' ],
	] )( 'for file name %s returns %s', ( input, expected ) => {
		expect( stripScaledSuffix( input ) ).toBe( expected );
	} );
} );
