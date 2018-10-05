/**
 * External dependencies
 */
import deepFreeze from 'deep-freeze';

/**
 * Internal dependencies
 */

import { normaliseFormats } from '../normalise-formats';
import { getSparseArrayLength } from './helpers';

describe( 'normaliseFormats', () => {
	const strong = { type: 'strong' };
	const em = { type: 'em' };
	const record = deepFreeze( {
		formats: [ , [ em ], [ { ...em }, { ...strong } ], [ em, strong ], , , ],
		text: 'one two',
	} );

	function isNormalised( result ) {
		expect( getSparseArrayLength( result.formats ) ).toBe( 3 );
		expect( result.formats[ 1 ][ 0 ] ).toBe( result.formats[ 2 ][ 0 ] );
		expect( result.formats[ 1 ][ 0 ] ).toBe( result.formats[ 3 ][ 0 ] );
		expect( result.formats[ 2 ][ 1 ] ).toBe( result.formats[ 3 ][ 1 ] );
	}

	it( 'should normalise formats', () => {
		const result = normaliseFormats( record );

		expect( result ).toEqual( record );
		expect( result ).not.toBe( record );
		isNormalised( result );
	} );

	it( 'should be serializable', () => {
		const result = normaliseFormats( record );
		expect( JSON.stringify( record ) ).toBe( JSON.stringify( result ) );
	} );

	it( 'should normalise serialized formats', () => {
		const deserialized = JSON.parse( JSON.stringify( record ) );
		const result = normaliseFormats( deserialized );

		expect( result ).toEqual( record );
		isNormalised( result );
	} );
} );
