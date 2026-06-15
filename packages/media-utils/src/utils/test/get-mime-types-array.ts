/**
 * Internal dependencies
 */
import { getMimeTypesArray } from '../get-mime-types-array';

describe( 'getMimeTypesArray', () => {
	it( 'should return null if it is "falsy" e.g: undefined or null', () => {
		expect( getMimeTypesArray( null ) ).toEqual( null );
		expect( getMimeTypesArray( undefined ) ).toEqual( null );
	} );

	it( 'should return an empty array if an empty object is passed', () => {
		expect( getMimeTypesArray( {} ) ).toEqual( [] );
	} );

	it( 'should return the type plus a new mime type with type and subtype with the extension if a type is passed', () => {
		expect( getMimeTypesArray( { ext: 'chicken' } ) ).toEqual( [
			'chicken',
			'chicken/ext',
		] );
	} );

	it( 'should return the mime type passed and a new mime type with type and the extension as subtype', () => {
		expect( getMimeTypesArray( { ext: 'chicken/ribs' } ) ).toEqual( [
			'chicken/ribs',
			'chicken/ext',
		] );
	} );

	it( 'should return the mime type passed and an additional mime type per extension supported', () => {
		expect( getMimeTypesArray( { 'jpg|jpeg|jpe': 'image/jpeg' } ) ).toEqual(
			[ 'image/jpeg', 'image/jpg', 'image/jpeg', 'image/jpe' ]
		);
	} );

	it( 'should handle multiple mime types', () => {
		expect(
			getMimeTypesArray( { 'ext|aaa': 'chicken/ribs', aaa: 'bbb' } )
		).toEqual( [
			'chicken/ribs',
			'chicken/ext',
			'chicken/aaa',
			'bbb',
			'bbb/aaa',
		] );
	} );
} );
