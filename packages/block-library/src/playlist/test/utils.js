/**
 * Internal dependencies
 */
import { getProgressBackgroundColor, WAVEFORM_BUTTON_WIDTH } from '../utils';

describe( 'WAVEFORM_BUTTON_WIDTH', () => {
	it( 'should be defined as a number', () => {
		expect( typeof WAVEFORM_BUTTON_WIDTH ).toBe( 'number' );
		expect( WAVEFORM_BUTTON_WIDTH ).toBe( 100 );
	} );
} );

describe( 'getProgressBackgroundColor', () => {
	it( 'should lighten light colors', () => {
		// Light gray (brightness ~200) should get lighter
		const result = getProgressBackgroundColor( 'rgb(200, 200, 200)', 0.3 );
		// Should move towards 255: 200 + (255-200)*0.3 = 216.5 → 217
		expect( result ).toBe( 'rgb(217, 217, 217)' );
	} );

	it( 'should darken dark colors', () => {
		// Dark gray (brightness ~50) should get darker
		const result = getProgressBackgroundColor( 'rgb(50, 50, 50)', 0.3 );
		// Should move towards 0: 50 * 0.7 = 35
		expect( result ).toBe( 'rgb(35, 35, 35)' );
	} );

	it( 'should darken near-white colors for contrast', () => {
		// Near white (brightness > 240) should darken instead of lighten
		const result = getProgressBackgroundColor( 'rgb(250, 250, 250)', 0.3 );
		// Should move towards 0: 250 * 0.7 = 175
		expect( result ).toBe( 'rgb(175, 175, 175)' );
	} );

	it( 'should lighten near-black colors for contrast', () => {
		// Near black (brightness < 30) should lighten instead of darken
		const result = getProgressBackgroundColor( 'rgb(10, 10, 10)', 0.3 );
		// Should move towards 255: 10 + (255-10)*0.3 = 83.5 → 84
		expect( result ).toBe( 'rgb(84, 84, 84)' );
	} );

	it( 'should return original color for invalid input', () => {
		const result = getProgressBackgroundColor( 'invalid', 0.3 );
		expect( result ).toBe( 'invalid' );
	} );

	it( 'should use default amount of 0.25', () => {
		const result = getProgressBackgroundColor( 'rgb(200, 200, 200)' );
		// Should move towards 255: 200 + (255-200)*0.25 = 200 + 13.75 = 213.75 → 214
		expect( result ).toBe( 'rgb(214, 214, 214)' );
	} );

	it( 'should handle rgba input', () => {
		const result = getProgressBackgroundColor(
			'rgba(200, 200, 200, 0.5)',
			0.3
		);
		expect( result ).toBe( 'rgb(217, 217, 217)' );
	} );

	it( 'should handle hex color input', () => {
		// #131313 = rgb(19, 19, 19), brightness ~19, near black (< 30) so should lighten
		const result = getProgressBackgroundColor( '#131313', 0.3 );
		// Should move towards 255: 19 + (255-19)*0.3 = 19 + 70.8 = 89.8 → 90
		expect( result ).toBe( 'rgb(90, 90, 90)' );
	} );

	it( 'should handle short hex color input', () => {
		// #fff = rgb(255, 255, 255), near white so should darken
		const result = getProgressBackgroundColor( '#fff', 0.3 );
		// Should move towards 0: 255 * 0.7 = 178.5 → 179
		expect( result ).toBe( 'rgb(179, 179, 179)' );
	} );

	it( 'should handle hex color with alpha', () => {
		// #c8c8c8ff = rgb(200, 200, 200), light so should lighten
		const result = getProgressBackgroundColor( '#c8c8c8ff', 0.3 );
		expect( result ).toBe( 'rgb(217, 217, 217)' );
	} );
} );
