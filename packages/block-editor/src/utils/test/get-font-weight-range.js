import { describe, expect, it } from 'vitest';
import { getFontWeightRange } from '../get-font-weight-range';

describe( 'getFontWeightRange', () => {
	it( 'returns undefined for static faces', () => {
		expect(
			getFontWeightRange( [
				{ fontStyle: 'normal', fontWeight: '400' },
				{ fontStyle: 'normal', fontWeight: 700 },
			] )
		).toBeUndefined();
		expect( getFontWeightRange( undefined ) ).toBeUndefined();
	} );

	it( 'reads the whole numbers of a range', () => {
		expect(
			getFontWeightRange( [
				{ fontStyle: 'normal', fontWeight: '250 750' },
			] )
		).toEqual( { min: 250, max: 750 } );
	} );

	it( 'spans the ranges of several faces and ignores extra whitespace', () => {
		expect(
			getFontWeightRange( [
				{ fontStyle: 'normal', fontWeight: '300 800' },
				{ fontStyle: 'italic', fontWeight: ' 100   700 ' },
				{ fontStyle: 'normal', fontWeight: '900' },
			] )
		).toEqual( { min: 100, max: 800 } );
	} );

	it( 'orders a reversed range', () => {
		expect(
			getFontWeightRange( [
				{ fontStyle: 'normal', fontWeight: '900 100' },
			] )
		).toEqual( { min: 100, max: 900 } );
	} );
	it( 'reads a range named with the keywords the property accepts', () => {
		expect(
			getFontWeightRange( [
				{ fontStyle: 'normal', fontWeight: 'normal 900' },
			] )
		).toEqual( { min: 400, max: 900 } );
		expect(
			getFontWeightRange( [
				{ fontStyle: 'normal', fontWeight: '100 bold' },
			] )
		).toEqual( { min: 100, max: 700 } );
	} );

	it( 'skips a range naming a keyword the property does not accept', () => {
		// `lighter` and `bolder` are relative to the parent, so `@font-face`
		// does not take them and the face declares no range this can read.
		expect(
			getFontWeightRange( [
				{ fontStyle: 'normal', fontWeight: 'lighter bolder' },
			] )
		).toBeUndefined();
	} );
} );
