/**
 * Internal dependencies
 */
import { isPortrait, getImageRatio, getDimensionsByRatio } from '../utils';

test( 'isPortrait should return a boolean based on image orientation.', () => {
	expect( isPortrait( 1024, 768 ) ).toBeTruthy();
	expect( isPortrait( 768, 1024 ) ).toBeFalsy();
	expect( isPortrait( 500, 500 ) ).toBeFalsy();
} );

test( 'getImageRatio should return an aspect ratio based on the image orientation.', () => {
	expect( getImageRatio( 1024, 768 ) ).toEqual( 1.333 );
	expect( getImageRatio( 768, 1024 ) ).toEqual( 1.333 );
	expect( getImageRatio( 500, 500 ) ).toEqual( 1 );
} );

test( 'getRatioByOrientation should return the respective height or width based on the saved value by ratio.', () => {
	expect( getDimensionsByRatio( 1024, 0.75 ) ).toEqual( 768 );
	expect( getDimensionsByRatio( 768, 0.75, false ) ).toEqual( 1024 );
	expect( getDimensionsByRatio( 500, 1, false ) ).toEqual( 500 );
} );
