import { describe, expect, it } from 'vitest';
import { getSafeButtonUrl, getWidthClasses, isPercentageWidth } from '../utils';

describe( 'getSafeButtonUrl', () => {
	it( 'should return null for an empty or non-string url', () => {
		expect( getSafeButtonUrl( undefined ) ).toBeNull();
		expect( getSafeButtonUrl( null ) ).toBeNull();
		expect( getSafeButtonUrl( '' ) ).toBeNull();
		expect( getSafeButtonUrl( 123 ) ).toBeNull();
	} );

	it( 'should return the url unchanged for an allowed protocol', () => {
		expect( getSafeButtonUrl( 'https://wordpress.org' ) ).toBe(
			'https://wordpress.org'
		);
		expect( getSafeButtonUrl( 'http://wordpress.org' ) ).toBe(
			'http://wordpress.org'
		);
		expect( getSafeButtonUrl( 'mailto:test@example.com' ) ).toBe(
			'mailto:test@example.com'
		);
		expect( getSafeButtonUrl( 'tel:012345678' ) ).toBe( 'tel:012345678' );
	} );

	it( 'should return a relative url unchanged', () => {
		expect( getSafeButtonUrl( '/handbook' ) ).toBe( '/handbook' );
		expect( getSafeButtonUrl( '#section' ) ).toBe( '#section' );
	} );

	it( 'should return a relative url unchanged even with a colon later in the path, query, or fragment', () => {
		expect( getSafeButtonUrl( '/2024/03/10:special-post' ) ).toBe(
			'/2024/03/10:special-post'
		);
		expect( getSafeButtonUrl( '?redirect=https://example.com' ) ).toBe(
			'?redirect=https://example.com'
		);
		expect( getSafeButtonUrl( '#section:1' ) ).toBe( '#section:1' );
	} );

	it( 'should return the url unchanged for other core-allowed protocols', () => {
		expect( getSafeButtonUrl( 'ftp://example.com/file' ) ).toBe(
			'ftp://example.com/file'
		);
		expect( getSafeButtonUrl( 'webcal://example.com/cal.ics' ) ).toBe(
			'webcal://example.com/cal.ics'
		);
		expect( getSafeButtonUrl( 'xmpp:user@example.com' ) ).toBe(
			'xmpp:user@example.com'
		);
	} );

	it( 'should reject a javascript: url', () => {
		expect( getSafeButtonUrl( 'javascript:alert(1)' ) ).toBeNull();
	} );

	it( 'should reject a javascript: url disguised with a leading or embedded control character', () => {
		// Browsers strip these before resolving the scheme, so it still executes.
		expect( getSafeButtonUrl( '\tjavascript:alert(1)' ) ).toBeNull();
		expect( getSafeButtonUrl( ' javascript:alert(1)' ) ).toBeNull();
		expect( getSafeButtonUrl( 'java\tscript:alert(1)' ) ).toBeNull();
	} );
} );

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
