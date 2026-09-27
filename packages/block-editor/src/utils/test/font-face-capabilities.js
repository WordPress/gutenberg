import { describe, expect, it } from 'vitest';
import {
	coveragePoints,
	coverageRange,
	isVariableCoverage,
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
		expect( capabilities.stretch ).toEqual( [ { min: 25, max: 151 } ] );
	} );

	it( 'reads a static family as a point for each face', () => {
		// Not 400 to 700: nothing draws 500, and nothing draws a width
		// between condensed and normal.
		const capabilities = resolveFontFaceCapabilities( STATIC_FAMILY );
		expect( capabilities.weight ).toEqual( [
			{ min: 400, max: 400 },
			{ min: 700, max: 700 },
		] );
		expect( capabilities.stretch ).toEqual( [
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
		expect( capabilities.stretch ).toEqual( [] );
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
		expect( coveragePoints( statics.stretch ) ).toEqual( [ 75, 100 ] );
		// A range has no points to list: everything in it can be drawn.
		expect( coveragePoints( variable.stretch ) ).toEqual( [] );
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
	} );
} );
