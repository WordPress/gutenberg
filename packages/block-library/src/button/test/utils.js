/**
 * Internal dependencies
 */
import { getWidthClasses, isPercentageWidth } from '../utils';

describe( 'isPercentageWidth', () => {
	it( 'should return true for percentage values', () => {
		expect( isPercentageWidth( '50%' ) ).toBe( true );
		expect( isPercentageWidth( '100%' ) ).toBe( true );
		expect( isPercentageWidth( '33.5%' ) ).toBe( true );
	} );

	it( 'should return false for non-percentage values', () => {
		expect( isPercentageWidth( '200px' ) ).toBe( false );
		expect( isPercentageWidth( '10em' ) ).toBe( false );
		expect( isPercentageWidth( undefined ) ).toBe( false );
		expect( isPercentageWidth( null ) ).toBe( false );
	} );

	it( 'should return false for preset strings', () => {
		expect( isPercentageWidth( 'var:preset|dimension|custom-width' ) ).toBe(
			false
		);
	} );
} );

describe( 'getWidthClasses', () => {
	it( 'should return empty object when no width is provided', () => {
		expect( getWidthClasses( undefined ) ).toEqual( {} );
		expect( getWidthClasses( '' ) ).toEqual( {} );
		expect( getWidthClasses( null ) ).toEqual( {} );
	} );

	it( 'should return percentage classes for standard percentage widths', () => {
		expect( getWidthClasses( '25%' ) ).toEqual( {
			'has-custom-width': true,
			'wp-block-button__width': true,
			'wp-block-button__width-25': true,
		} );

		expect( getWidthClasses( '50%' ) ).toEqual( {
			'has-custom-width': true,
			'wp-block-button__width': true,
			'wp-block-button__width-50': true,
		} );

		expect( getWidthClasses( '75%' ) ).toEqual( {
			'has-custom-width': true,
			'wp-block-button__width': true,
			'wp-block-button__width-75': true,
		} );

		expect( getWidthClasses( '100%' ) ).toEqual( {
			'has-custom-width': true,
			'wp-block-button__width': true,
			'wp-block-button__width-100': true,
		} );
	} );

	it( 'should return generic percentage classes for non-standard percentage widths', () => {
		expect( getWidthClasses( '33%' ) ).toEqual( {
			'has-custom-width': true,
			'wp-block-button__width': true,
		} );
	} );

	it( 'should return only has-custom-width for non-percentage values', () => {
		expect( getWidthClasses( '200px' ) ).toEqual( {
			'has-custom-width': true,
		} );

		expect( getWidthClasses( '10em' ) ).toEqual( {
			'has-custom-width': true,
		} );
	} );

	it( 'should return only has-custom-width for resolved non-percentage preset values', () => {
		// When a preset resolves to a non-percentage value (e.g., 200px),
		// the resolved value is passed to getWidthClasses, not the preset string.
		expect( getWidthClasses( '300px' ) ).toEqual( {
			'has-custom-width': true,
		} );
	} );
} );
