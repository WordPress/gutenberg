'use strict';
/* eslint-disable jest/no-conditional-expect */
/**
 * External dependencies
 */
const path = require( 'path' );
const { homedir } = require( 'os' );

/**
 * Internal dependencies
 */
const { ValidationError } = require( '../validate-config' );
const { parseSourceString } = require( '../parse-source-string' );

jest.mock( 'os', () => ( {
	homedir: jest.fn(),
} ) );

describe( 'parseSourceString', () => {
	const options = {
		cacheDirectoryPath: '/test/cache',
	};

	beforeEach( () => {
		homedir.mockReturnValue( '/home/test' );
	} );

	it( 'should do nothing when given an empty source', () => {
		expect( parseSourceString( null, options ) ).toEqual( null );
	} );

	it( 'should throw when source not parseable', () => {
		expect.assertions( 1 );
		try {
			parseSourceString( 'test://test', options );
		} catch ( error ) {
			expect( error ).toEqual(
				new ValidationError(
					'Invalid or unrecognized source: "test://test".'
				)
			);
		}
	} );

	describe( 'local sources', () => {
		it( 'should parse relative directories', () => {
			expect( parseSourceString( '.', options ) ).toEqual( {
				basename: path.basename( path.resolve( '.' ) ),
				path: path.resolve( '.' ),
				type: 'local',
			} );
		} );

		it( 'should parse home directories', () => {
			expect( parseSourceString( '~/test', options ) ).toEqual( {
				basename: 'test',
				path: '/home/test/test',
				type: 'local',
			} );
		} );

		it( 'should parse absolute directories', () => {
			expect( parseSourceString( '/absolute/test', options ) ).toEqual( {
				basename: 'test',
				path: '/absolute/test',
				type: 'local',
			} );
		} );
	} );

	describe( 'zip sources', () => {
		it( 'should parse WordPress.org sources', () => {
			expect(
				parseSourceString(
					'http://downloads.wordpress.org/plugin/gutenberg.zip',
					options
				)
			).toEqual( {
				basename: 'gutenberg',
				path: '/test/cache/gutenberg',
				type: 'zip',
				url: 'http://downloads.wordpress.org/plugin/gutenberg.zip',
			} );
		} );

		it( 'should parse other sources', () => {
			expect(
				parseSourceString( 'http://test.com/testing.zip', options )
			).toEqual( {
				basename: 'testing',
				path: '/test/cache/testing',
				type: 'zip',
				url: 'http://test.com/testing.zip',
			} );
		} );
	} );

	describe( 'Git SSH sources', () => {
		it( 'should parse ssh protocol', () => {
			expect(
				parseSourceString( 'ssh://test/test.git#trunk', options )
			).toEqual( {
				basename: 'test',
				path: '/test/cache/test',
				clonePath: '/test/cache/test',
				ref: 'trunk',
				type: 'git',
				url: 'ssh://test/test.git',
			} );
		} );

		it( 'should parse git+ssh protocol', () => {
			expect(
				parseSourceString( 'git+ssh://test/test.git#trunk', options )
			).toEqual( {
				basename: 'test',
				path: '/test/cache/test',
				clonePath: '/test/cache/test',
				ref: 'trunk',
				type: 'git',
				url: 'git+ssh://test/test.git',
			} );
		} );

		it( 'should work without ref', () => {
			expect(
				parseSourceString( 'ssh://test/test.git', options )
			).toEqual( {
				basename: 'test',
				path: '/test/cache/test',
				clonePath: '/test/cache/test',
				ref: undefined,
				type: 'git',
				url: 'ssh://test/test.git',
			} );
		} );
	} );

	describe( 'GitHub sources', () => {
		it( 'should parse', () => {
			expect(
				parseSourceString( 'WordPress/gutenberg#trunk', options )
			).toEqual( {
				basename: 'gutenberg',
				path: '/test/cache/gutenberg',
				clonePath: '/test/cache/gutenberg',
				ref: 'trunk',
				type: 'git',
				url: 'https://github.com/WordPress/gutenberg.git',
			} );
		} );
	} );
} );
/* eslint-enable jest/no-conditional-expect */
