'use strict';
/**
 * Internal dependencies
 */
const addOrReplacePort = require( '../add-or-replace-port.js' );

describe( 'addOrReplacePort', () => {
	afterEach( () => {
		jest.clearAllMocks();
	} );

	it( 'should add or replace port with various inputs', () => {
		const testMap = [
			// Addition
			{ in: 'test', expect: 'test:101' },
			{ in: 'test/test?test#test', expect: 'test:101/test?test#test' },
			{ in: 'http://test.com', expect: 'http://test.com:101' },
			{
				in: 'http://test.com/test?test#test',
				expect: 'http://test.com:101/test?test#test',
			},
			{ in: 'ssh://test.com', expect: 'ssh://test.com:101' },
			{ in: 'test.com', expect: 'test.com:101' },

			// Replacement
			{ in: 'test:99', expect: 'test:101' },
			{ in: 'test:99/test?test#test', expect: 'test:101/test?test#test' },
			{ in: 'http://test.com:99', expect: 'http://test.com:101' },
			{
				in: 'http://test.com:99/test?test#test',
				expect: 'http://test.com:101/test?test#test',
			},
			{ in: 'ssh://test.com:99', expect: 'ssh://test.com:101' },
			{ in: 'test.com:99', expect: 'test.com:101' },
		];

		for ( const test of testMap ) {
			const result = addOrReplacePort( test.in, '101' );
			expect( result ).toEqual( test.expect );
		}
	} );

	it( 'should support number ports', () => {
		const testMap = [ { in: 'test', expect: 'test:104' } ];

		for ( const test of testMap ) {
			const result = addOrReplacePort( test.in, 104, false );
			expect( result ).toEqual( test.expect );
		}
	} );

	it( 'should not add default HTTP port', () => {
		const testMap = [ { in: 'test', expect: 'test' } ];

		for ( const test of testMap ) {
			const result = addOrReplacePort( test.in, 80, false );
			expect( result ).toEqual( test.expect );
		}
	} );

	it( 'should not add default HTTPS port', () => {
		const testMap = [ { in: 'test', expect: 'test' } ];

		for ( const test of testMap ) {
			const result = addOrReplacePort( test.in, 443, false );
			expect( result ).toEqual( test.expect );
		}
	} );

	it( 'should do nothing if port is present but replacement is not requested', () => {
		const testMap = [
			{ in: 'test', expect: 'test:103' },
			{ in: 'test:99', expect: 'test:99' },
		];

		for ( const test of testMap ) {
			const result = addOrReplacePort( test.in, '103', false );
			expect( result ).toEqual( test.expect );
		}
	} );
} );
