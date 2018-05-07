/**
 * Internal dependencies
 */
import { parseAllowList } from '../allow-list';

describe( 'parseAllowList', () => {
	it( 'should parse undefined', () => {
		const allowList = parseAllowList( undefined );
		expect( allowList ).toEqual( {
			'*': true,
		} );
	} );

	it( 'should parse true', () => {
		const allowList = parseAllowList( true );
		expect( allowList ).toEqual( {
			'*': true,
		} );
	} );

	it( 'should parse false', () => {
		const allowList = parseAllowList( false );
		expect( allowList ).toEqual( {
			'*': false,
		} );
	} );

	it( 'should parse a string', () => {
		const allowList = parseAllowList( 'core/verse' );
		expect( allowList ).toEqual( {
			'core/verse': true,
			'*': false,
		} );
	} );

	it( 'should parse a negated string', () => {
		const allowList = parseAllowList( '!core/verse' );
		expect( allowList ).toEqual( {
			'core/verse': false,
			'*': false,
		} );
	} );

	it( 'should parse a shorthand array', () => {
		const allowList = parseAllowList( [ 'core/image', '!core/verse', '*' ] );
		expect( allowList ).toEqual( {
			'core/image': true,
			'core/verse': false,
			'*': true,
		} );
	} );

	it( 'should parse a shorthand array with no wildcard', () => {
		const allowList = parseAllowList( [ 'core/image', '!core/verse' ] );
		expect( allowList ).toEqual( {
			'core/image': true,
			'core/verse': false,
			'*': false,
		} );
	} );

	it( 'should coerce objects into valid allow lists', () => {
		const allowList = parseAllowList( { 'core/image': 1, 'core/verse': 0 } );
		expect( allowList ).toEqual( {
			'core/image': true,
			'core/verse': false,
			'*': false,
		} );
	} );
} );
