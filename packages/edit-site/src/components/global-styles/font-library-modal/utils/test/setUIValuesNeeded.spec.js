/**
 * Internal dependencies
 */
import { setUIValuesNeeded } from '../index';

describe( 'setUIValuesNeeded function', () => {
	test( 'Should set name from fontFamily if name is missing', () => {
		const font = { fontFamily: 'Arial' };
		const result = setUIValuesNeeded( font );
		expect( result.name ).toBe( 'Arial' );
	} );

	test( 'Should set name from slug if name and fontFamily are missing', () => {
		const font = { slug: 'arial-slug' };
		const result = setUIValuesNeeded( font );
		expect( result.name ).toBe( 'arial-slug' );
	} );

	test( 'Should not overwrite name if it exists', () => {
		const font = { name: 'ExistingName', fontFamily: 'Arial' };
		const result = setUIValuesNeeded( font );
		expect( result.name ).toBe( 'ExistingName' );
	} );

	test( 'Should merge extra values', () => {
		const font = { name: 'Arial', slug: 'arial' };
		const extraValues = { source: 'custom' };
		const result = setUIValuesNeeded( font, extraValues );
		expect( result ).toEqual( {
			name: 'Arial',
			slug: 'arial',
			source: 'custom',
		} );
	} );

	test( 'Should return the same object if no conditions met', () => {
		const font = { randomProperty: 'randomValue' };
		const result = setUIValuesNeeded( font );
		expect( result ).toEqual( font );
	} );
} );
