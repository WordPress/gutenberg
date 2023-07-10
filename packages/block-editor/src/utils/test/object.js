/**
 * Internal dependencies
 */
import { kebabCase, setImmutably } from '../object';

describe( 'kebabCase', () => {
	it( 'separates lowercase letters, followed by uppercase letters', () => {
		expect( kebabCase( 'fooBar' ) ).toEqual( 'foo-bar' );
	} );

	it( 'separates numbers, followed by uppercase letters', () => {
		expect( kebabCase( '123FOO' ) ).toEqual( '123-foo' );
	} );

	it( 'separates numbers, followed by lowercase characters', () => {
		expect( kebabCase( '123bar' ) ).toEqual( '123-bar' );
	} );

	it( 'separates uppercase letters, followed by numbers', () => {
		expect( kebabCase( 'FOO123' ) ).toEqual( 'foo-123' );
	} );

	it( 'separates lowercase letters, followed by numbers', () => {
		expect( kebabCase( 'foo123' ) ).toEqual( 'foo-123' );
	} );

	it( 'separates uppercase groups from capitalized groups', () => {
		expect( kebabCase( 'FOOBar' ) ).toEqual( 'foo-bar' );
	} );

	it( 'removes any non-dash special characters', () => {
		expect(
			kebabCase( 'foo±§!@#$%^&*()-_=+/?.>,<\\|{}[]`~\'";:bar' )
		).toEqual( 'foo-bar' );
	} );

	it( 'removes any spacing characters', () => {
		expect( kebabCase( ' foo \t \n \r \f \v bar ' ) ).toEqual( 'foo-bar' );
	} );

	it( 'groups multiple dashes into a single one', () => {
		expect( kebabCase( 'foo---bar' ) ).toEqual( 'foo-bar' );
	} );

	it( 'returns an empty string unchanged', () => {
		expect( kebabCase( '' ) ).toEqual( '' );
	} );

	it( 'returns an existing kebab case string unchanged', () => {
		expect( kebabCase( 'foo-123-bar' ) ).toEqual( 'foo-123-bar' );
	} );

	it( 'returns an empty string if any nullish type is passed', () => {
		expect( kebabCase( undefined ) ).toEqual( '' );
		expect( kebabCase( null ) ).toEqual( '' );
	} );

	it( 'converts any unexpected non-nullish type to a string', () => {
		expect( kebabCase( 12345 ) ).toEqual( '12345' );
		expect( kebabCase( [] ) ).toEqual( '' );
		expect( kebabCase( {} ) ).toEqual( 'object-object' );
	} );

	/**
	 * Should cover all test cases of `_wp_to_kebab_case()`.
	 *
	 * @see https://developer.wordpress.org/reference/functions/_wp_to_kebab_case/
	 * @see https://github.com/WordPress/wordpress-develop/blob/76376fdbc3dc0b3261de377dffc350677345e7ba/tests/phpunit/tests/functions/wpToKebabCase.php#L35-L62
	 */
	it.each( [
		[ 'white', 'white' ],
		[ 'white+black', 'white-black' ],
		[ 'white:black', 'white-black' ],
		[ 'white*black', 'white-black' ],
		[ 'white.black', 'white-black' ],
		[ 'white black', 'white-black' ],
		[ 'white	black', 'white-black' ],
		[ 'white-to-black', 'white-to-black' ],
		[ 'white2white', 'white-2-white' ],
		[ 'white2nd', 'white-2nd' ],
		[ 'white2ndcolor', 'white-2-ndcolor' ],
		[ 'white2ndColor', 'white-2nd-color' ],
		[ 'white2nd_color', 'white-2nd-color' ],
		[ 'white23color', 'white-23-color' ],
		[ 'white23', 'white-23' ],
		[ '23color', '23-color' ],
		[ 'white4th', 'white-4th' ],
		[ 'font2xl', 'font-2-xl' ],
		[ 'whiteToWhite', 'white-to-white' ],
		[ 'whiteTOwhite', 'white-t-owhite' ],
		[ 'WHITEtoWHITE', 'whit-eto-white' ],
		[ 42, '42' ],
		[ "i've done", 'ive-done' ],
		[ '#ffffff', 'ffffff' ],
		[ '$ffffff', 'ffffff' ],
	] )( 'converts %s properly to %s', ( input, expected ) => {
		expect( kebabCase( input ) ).toEqual( expected );
	} );
} );

describe( 'setImmutably', () => {
	describe( 'handling falsy values properly', () => {
		it( 'should create a new object if `undefined` is passed', () => {
			const result = setImmutably( undefined, 'test', 1 );

			expect( result ).toEqual( { test: 1 } );
		} );

		it( 'should create a new object if `null` is passed', () => {
			const result = setImmutably( null, 'test', 1 );

			expect( result ).toEqual( { test: 1 } );
		} );

		it( 'should create a new object if `false` is passed', () => {
			const result = setImmutably( false, 'test', 1 );

			expect( result ).toEqual( { test: 1 } );
		} );

		it( 'should create a new object if `0` is passed', () => {
			const result = setImmutably( 0, 'test', 1 );

			expect( result ).toEqual( { test: 1 } );
		} );

		it( 'should create a new object if an empty string is passed', () => {
			const result = setImmutably( '', 'test', 1 );

			expect( result ).toEqual( { test: 1 } );
		} );

		it( 'should create a new object if a NaN is passed', () => {
			const result = setImmutably( NaN, 'test', 1 );

			expect( result ).toEqual( { test: 1 } );
		} );
	} );

	describe( 'manages data assignment properly', () => {
		it( 'assigns value properly when it does not exist', () => {
			const result = setImmutably( {}, 'test', 1 );

			expect( result ).toEqual( { test: 1 } );
		} );

		it( 'overrides existing values', () => {
			const result = setImmutably( { test: 1 }, 'test', 2 );

			expect( result ).toEqual( { test: 2 } );
		} );

		it( 'handles first level arrays properly', () => {
			const result = setImmutably( [ 5 ], 0, 6 );

			expect( result ).toEqual( [ 6 ] );
		} );

		it( 'handles nested arrays properly', () => {
			const result = setImmutably(
				[ [ 'foo', [ 'bar' ] ] ],
				[ 0, 1, 0 ],
				'baz'
			);

			expect( result ).toEqual( [ [ 'foo', [ 'baz' ] ] ] );
		} );

		describe( 'with array notation access', () => {
			it( 'assigns values at deeper levels', () => {
				const result = setImmutably( {}, [ 'foo', 'bar', 'baz' ], 5 );

				expect( result ).toEqual( { foo: { bar: { baz: 5 } } } );
			} );

			it( 'overrides existing values at deeper levels', () => {
				const result = setImmutably(
					{ foo: { bar: { baz: 1 } } },
					[ 'foo', 'bar', 'baz' ],
					5
				);

				expect( result ).toEqual( { foo: { bar: { baz: 5 } } } );
			} );

			it( 'keeps other properties intact', () => {
				const result = setImmutably(
					{ foo: { bar: { baz: 1 } } },
					[ 'foo', 'bar', 'test' ],
					5
				);

				expect( result ).toEqual( {
					foo: { bar: { baz: 1, test: 5 } },
				} );
			} );
		} );

		describe( 'for nested falsey values', () => {
			it( 'overwrites undefined values', () => {
				const result = setImmutably( { test: undefined }, 'test', 1 );

				expect( result ).toEqual( { test: 1 } );
			} );

			it( 'overwrites null values', () => {
				const result = setImmutably( { test: null }, 'test', 1 );

				expect( result ).toEqual( { test: 1 } );
			} );

			it( 'overwrites false values', () => {
				const result = setImmutably( { test: false }, 'test', 1 );

				expect( result ).toEqual( { test: 1 } );
			} );

			it( 'overwrites `0` values', () => {
				const result = setImmutably( { test: 0 }, 'test', 1 );

				expect( result ).toEqual( { test: 1 } );
			} );

			it( 'overwrites empty string values', () => {
				const result = setImmutably( { test: '' }, 'test', 1 );

				expect( result ).toEqual( { test: 1 } );
			} );

			it( 'overwrites NaN values', () => {
				const result = setImmutably( { test: NaN }, 'test', 1 );

				expect( result ).toEqual( { test: 1 } );
			} );
		} );
	} );

	describe( 'does not mutate the original object', () => {
		it( 'clones the object at the first level', () => {
			const input = {};
			const result = setImmutably( input, 'test', 1 );

			expect( result ).not.toBe( input );
		} );

		it( 'clones the object at deeper levels', () => {
			const input = { foo: { bar: { baz: 1 } } };
			const result = setImmutably( input, [ 'foo', 'bar', 'baz' ], 2 );

			expect( result ).not.toBe( input );
			expect( result.foo ).not.toBe( input.foo );
			expect( result.foo.bar ).not.toBe( input.foo.bar );
			expect( result.foo.bar.baz ).not.toBe( input.foo.bar.baz );
		} );

		it( 'clones arrays at the first level', () => {
			const input = [];
			const result = setImmutably( input, 0, 1 );

			expect( result ).not.toBe( input );
		} );

		it( 'clones arrays at deeper levels', () => {
			const input = [ [ [ [ 'foo', [ 'bar' ] ] ] ] ];
			const result = setImmutably( input, [ 0, 0, 0, 1, 0 ], 'baz' );

			expect( result ).not.toBe( input );
			expect( result[ 0 ] ).not.toBe( input[ 0 ] );
			expect( result[ 0 ][ 0 ] ).not.toBe( input[ 0 ][ 0 ] );
			expect( result[ 0 ][ 0 ][ 0 ] ).not.toBe( input[ 0 ][ 0 ][ 0 ] );
			expect( result[ 0 ][ 0 ][ 0 ][ 1 ] ).not.toBe(
				input[ 0 ][ 0 ][ 0 ][ 1 ]
			);
		} );
	} );
} );
