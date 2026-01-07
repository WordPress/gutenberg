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
			{ in: 'http://example.org', expect: 'http://example.org:101' },
			{
				in: 'http://example.org/test?test#test',
				expect: 'http://example.org:101/test?test#test',
			},
			{ in: 'ssh://example.org', expect: 'ssh://example.org:101' },
			{ in: 'example.org', expect: 'example.org:101' },

			// Replacement
			{ in: 'test:99', expect: 'test:101' },
			{ in: 'test:99/test?test#test', expect: 'test:101/test?test#test' },
			{ in: 'http://example.org:99', expect: 'http://example.org:101' },
			{
				in: 'http://example.org:99/test?test#test',
				expect: 'http://example.org:101/test?test#test',
			},
			{ in: 'ssh://example.org:99', expect: 'ssh://example.org:101' },
			{ in: 'example.org:99', expect: 'example.org:101' },
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
