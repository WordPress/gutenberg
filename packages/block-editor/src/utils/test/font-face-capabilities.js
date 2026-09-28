import { describe, expect, it } from 'vitest';
import {
	coveragePoints,
	coverageRange,
	getMatchingFontFaces,
	getFontStyleValues,
	getFontWeightValues,
	isVariableCoverage,
	isValueCovered,
	resolveFontFaceCapabilities,
} from '../font-face-capabilities';

const ROBOTO_FLEX = [
	{ fontStyle: 'normal', fontWeight: '100 1000', fontStretch: '25% 151%' },
	{
		fontStyle: 'oblique 0deg 10deg',
		fontWeight: '100 1000',
		fontStretch: '25% 151%',
	},
];

// Two files, each drawing one weight and one width.
const STATIC_FAMILY = [
	{ fontStyle: 'normal', fontWeight: '400', fontStretch: 'normal' },
	{ fontStyle: 'normal', fontWeight: '700', fontStretch: 'condensed' },
];

describe( 'resolveFontFaceCapabilities', () => {
	it( 'reads a variable family as one interval per axis', () => {
		const capabilities = resolveFontFaceCapabilities( ROBOTO_FLEX );
		expect( capabilities.weight ).toEqual( [ { min: 100, max: 1000 } ] );
		expect( capabilities.width ).toEqual( [ { min: 25, max: 151 } ] );
	} );

	it( 'reads a static family as a point for each face', () => {
		// Not 400 to 700: nothing draws 500, and nothing draws a width
		// between condensed and normal.
		const capabilities = resolveFontFaceCapabilities( STATIC_FAMILY );
		expect( capabilities.weight ).toEqual( [
			{ min: 400, max: 400 },
			{ min: 700, max: 700 },
		] );
		expect( capabilities.width ).toEqual( [
			{ min: 75, max: 75 },
			{ min: 100, max: 100 },
		] );
	} );

	it( 'reads the styles the faces are drawn in', () => {
		expect( resolveFontFaceCapabilities( ROBOTO_FLEX ).style ).toEqual( {
			normal: true,
			italic: false,
			oblique: { min: 0, max: 10 },
		} );
		expect(
			resolveFontFaceCapabilities( [
				{ fontStyle: 'italic' },
				{ fontWeight: '400' },
			] ).style
		).toEqual( {
			// A face that says nothing about its style is upright.
			normal: true,
			italic: true,
			oblique: undefined,
		} );
	} );

	it( 'reads nothing from faces that declare nothing', () => {
		const capabilities = resolveFontFaceCapabilities( undefined );
		expect( capabilities.weight ).toEqual( [] );
		expect( capabilities.width ).toEqual( [] );
	} );

	it( 'uses CSS descriptor defaults for a declared face', () => {
		const capabilities = resolveFontFaceCapabilities( [ {} ] );
		expect( capabilities.weight ).toEqual( [ { min: 400, max: 400 } ] );
		expect( capabilities.width ).toEqual( [ { min: 100, max: 100 } ] );
	} );

	it( 'reads a descriptor with more ends than a range as the default', () => {
		// A range has two ends. Reading this as 100 to 700 would offer weights
		// the face selection then refuses to draw, which is the two readings
		// this module exists to collapse into one.
		const capabilities = resolveFontFaceCapabilities( [
			{ fontWeight: '100 400 700', fontStretch: '50% 100% 150%' },
		] );
		expect( capabilities.weight ).toEqual( [ { min: 400, max: 400 } ] );
		expect( capabilities.width ).toEqual( [ { min: 100, max: 100 } ] );
	} );

	it( 'reads a descriptor it cannot parse as the default', () => {
		const capabilities = resolveFontFaceCapabilities( [
			{ fontWeight: 'heavyish', fontStretch: 'widish' },
		] );
		expect( capabilities.weight ).toEqual( [ { min: 400, max: 400 } ] );
		expect( capabilities.width ).toEqual( [ { min: 100, max: 100 } ] );
	} );
} );

describe( 'control values', () => {
	it( 'does not add a faux bold to a declared face', () => {
		expect( getFontWeightValues( [ { fontWeight: '400' } ] ) ).toEqual( [
			'400',
		] );
	} );

	it( 'keeps the ordinary CSS choices while a family is unknown', () => {
		expect( getFontStyleValues() ).toEqual( [ 'normal', 'italic' ] );
		expect( getFontWeightValues() ).toContain( '700' );
	} );

	it( 'keeps static weights beside a variable interval', () => {
		expect(
			getFontWeightValues( [
				{ fontWeight: '300 800' },
				{ fontWeight: '900' },
			] )
		).toEqual( [ '300', '400', '500', '600', '700', '800', '900' ] );
	} );
} );

describe( 'getMatchingFontFaces', () => {
	it( 'matches width before style and weight', () => {
		const normal = {
			id: 'normal',
			fontStretch: 'normal',
			fontStyle: 'normal',
			fontWeight: '400',
		};
		const condensed = {
			id: 'condensed',
			fontStretch: 'condensed',
			fontStyle: 'normal',
			fontWeight: '400',
		};
		expect(
			getMatchingFontFaces( [ normal, condensed ], {
				fontStretch: 'condensed',
			} )
		).toEqual( [ condensed ] );
	} );

	it( 'matches a requested oblique angle inside a descriptor range', () => {
		const upright = { id: 'upright', fontStyle: 'normal' };
		const oblique = {
			id: 'oblique',
			fontStyle: 'oblique 0deg 10deg',
		};
		expect(
			getMatchingFontFaces( [ upright, oblique ], {
				fontStyle: 'oblique 6deg',
			} )
		).toEqual( [ oblique ] );
	} );

	it( 'uses the CSS style fallback order', () => {
		const italic = { id: 'italic', fontStyle: 'italic' };
		const negativeOblique = {
			id: 'negative-oblique',
			fontStyle: 'oblique -10deg -5deg',
		};
		expect(
			getMatchingFontFaces( [ negativeOblique, italic ], {
				fontStyle: 'normal',
			} )
		).toEqual( [ italic ] );
	} );

	it( 'uses the CSS weight search order when no range contains the value', () => {
		const regular = { id: 'regular', fontWeight: '400' };
		const bold = { id: 'bold', fontWeight: '700' };
		expect(
			getMatchingFontFaces( [ regular, bold ], { fontWeight: '450' } )
		).toEqual( [ regular ] );
		expect(
			getMatchingFontFaces( [ regular, bold ], { fontWeight: '550' } )
		).toEqual( [ bold ] );
	} );
} );

describe( 'reading coverage', () => {
	const variable = resolveFontFaceCapabilities( ROBOTO_FLEX );
	const statics = resolveFontFaceCapabilities( STATIC_FAMILY );

	it( 'tells an interpolating family from one that is not', () => {
		expect( isVariableCoverage( variable.weight ) ).toBe( true );
		expect( isVariableCoverage( statics.weight ) ).toBe( false );
	} );

	it( 'gives the values a static family draws', () => {
		expect( coveragePoints( statics.width ) ).toEqual( [ 75, 100 ] );
		// A range has no points to list: everything in it can be drawn.
		expect( coveragePoints( variable.width ) ).toEqual( [] );
	} );

	it( 'gives a range only where a face interpolates', () => {
		expect( coverageRange( variable.weight ) ).toEqual( {
			min: 100,
			max: 1000,
		} );
		expect( coverageRange( statics.weight ) ).toBeUndefined();
	} );

	it( 'spans the intervals and leaves a static face beside them alone', () => {
		// A 900 file next to a 300–800 axis does not make 850 drawable.
		const mixed = resolveFontFaceCapabilities( [
			{ fontWeight: '300 800' },
			{ fontWeight: '900' },
		] );
		expect( mixed.weight ).toEqual( [
			{ min: 300, max: 800 },
			{ min: 900, max: 900 },
		] );
		expect( coverageRange( mixed.weight ) ).toEqual( {
			min: 300,
			max: 800,
		} );
		expect( coveragePoints( mixed.weight ) ).toEqual( [ 900 ] );
	} );

	it( 'does not bridge a gap between variable intervals', () => {
		const split = resolveFontFaceCapabilities( [
			{ fontWeight: '100 400' },
			{ fontWeight: '700 900' },
		] );
		expect( coverageRange( split.weight ) ).toBeUndefined();
		expect( isValueCovered( split.weight, 350 ) ).toBe( true );
		expect( isValueCovered( split.weight, 550 ) ).toBe( false );
		expect( isValueCovered( split.weight, 750 ) ).toBe( true );
	} );
} );
