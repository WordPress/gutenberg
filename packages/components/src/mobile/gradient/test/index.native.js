/**
 * Internal dependencies
 */
import {
	getGradientAngle,
	getGradientBaseColors,
	getColorLocations,
	getGradientColorGroup,
} from '../index.native';

describe( 'getGradientAngle', () => {
	it( 'returns default angle (180) when not specified in gradient value', () => {
		const gradientValue = 'linear-gradient(#e66465, #9198e5)';
		expect( getGradientAngle( gradientValue ) ).toBe( 180 );
	} );
	it( 'returns correct angle if specified in words in gradient value', () => {
		const angleBase = 45;
		const sidesOrCorners = {
			'to top': 0,
			'to top right': angleBase,
			'to right top': angleBase,
			'to right': 2 * angleBase,
			'to bottom right': 3 * angleBase,
			'to right bottom': 3 * angleBase,
			'to bottom': 4 * angleBase,
			'to bottom left': 5 * angleBase,
			'to left bottom': 5 * angleBase,
			'to left': 6 * angleBase,
			'to top left': 7 * angleBase,
			'to left top': 7 * angleBase,
		};
		const gradientColors = Object.keys( sidesOrCorners ).map(
			( sideOrCorner ) => {
				return {
					gradientValue: `linear-gradient(${ sideOrCorner }, #e66465, #9198e5)`,
					sideOrCorner,
				};
			}
		);

		gradientColors.forEach( ( gradientColor ) => {
			const { gradientValue, sideOrCorner } = gradientColor;
			expect( getGradientAngle( gradientValue ) ).toBe(
				sidesOrCorners[ sideOrCorner ]
			);
		} );
	} );
	it( 'returns an angle specified in gradient value', () => {
		const gradientValue = 'linear-gradient(155deg,#e66465, #9198e5)';
		expect( getGradientAngle( gradientValue ) ).toBe( 155 );
	} );
} );

describe( 'getGradientBaseColors', () => {
	it( 'returns array of colors (hex) from gradient value', () => {
		const colorGroup = getGradientColorGroup(
			'linear-gradient(#e66465, #9198e5)'
		);

		expect( getGradientBaseColors( colorGroup ) ).toStrictEqual( [
			'#e66465',
			'#9198e5',
		] );
	} );
	it( 'returns an array of colors (rgb/rgba) from gradient value', () => {
		const colorGroup = getGradientColorGroup(
			`linear-gradient(336deg, rgb(0,0,255), rgba(0,0,255,.8) 70.71%)`
		);
		expect( getGradientBaseColors( colorGroup ) ).toStrictEqual( [
			'rgb(0,0,255)',
			'rgba(0,0,255,.8)',
		] );
	} );

	it( 'return an array of colors (literal) from gradient value', () => {
		const colorGroup = getGradientColorGroup(
			'linear-gradient(45deg, blue, red)'
		);
		expect( getGradientBaseColors( colorGroup ) ).toStrictEqual( [
			'blue',
			'red',
		] );
	} );

	it( 'return an array of colors (mixed) from gradient value', () => {
		const colorGroup = getGradientColorGroup(
			'linear-gradient(45deg, blue, #e66465, rgb(0,0,255), rgba(0,0,255,.8))'
		);
		expect( getGradientBaseColors( colorGroup ) ).toStrictEqual( [
			'blue',
			'#e66465',
			'rgb(0,0,255)',
			'rgba(0,0,255,.8)',
		] );
	} );
} );

describe( 'getColorLocations', () => {
	it( 'returns an array of color locations specified in gradient value', () => {
		const colorGroup = getGradientColorGroup(
			'linear-gradient(45deg, red 0%, blue 10%)'
		);
		expect( getColorLocations( colorGroup ) ).toStrictEqual( [ 0, 0.1 ] );
	} );

	it( 'returns an array of color locations adjusted proportionally when not specified in gradient value', () => {
		const colorGroup = getGradientColorGroup(
			'linear-gradient(45deg, red, blue, green)'
		);
		expect( getColorLocations( colorGroup ) ).toStrictEqual( [
			0, 0.5, 1,
		] );
	} );
} );
