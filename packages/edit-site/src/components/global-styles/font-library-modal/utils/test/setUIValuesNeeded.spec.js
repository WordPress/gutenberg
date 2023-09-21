/**
 * Internal dependencies
 */
import { setUIValuesNeeded } from '../index';

describe( 'setUIValuesNeeded function', () => {
	it( 'Should set name from fontFamily if name is missing', () => {
		const font = { fontFamily: 'Arial' };
		const result = setUIValuesNeeded( font );
		expect( result.name ).toBe( 'Arial' );
	} );

	it( 'Should set name from slug if name and fontFamily are missing', () => {
		const font = { slug: 'arial-slug' };
		const result = setUIValuesNeeded( font );
		expect( result.name ).toBe( 'arial-slug' );
	} );

	it( 'Should not overwrite name if it exists', () => {
		const font = { name: 'ExistingName', fontFamily: 'Arial' };
		const result = setUIValuesNeeded( font );
		expect( result.name ).toBe( 'ExistingName' );
	} );

	it( 'Should merge extra values', () => {
		const font = { name: 'Arial', slug: 'arial' };
		const extraValues = { source: 'custom' };
		const result = setUIValuesNeeded( font, extraValues );
		expect( result.source ).toBe( 'custom' );
	} );

	it( 'Should create a fake fontFace if none exists', () => {
		const font = { name: 'Arial', fontFamily: 'Arial, sasn-serif' };
		const result = setUIValuesNeeded( font );
		expect( result.fontFace ).toEqual( [
			{
				fontFamily: 'Arial, sasn-serif',
				fontStyle: 'normal',
				fontWeight: '400',
				fake: true,
			},
		] );
	} );
} );
