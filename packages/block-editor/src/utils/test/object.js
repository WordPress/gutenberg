/**
 * Internal dependencies
 */
import {
	setImmutably,
	getAttributesDiff,
	applyAttributesDiff,
} from '../object';

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

describe( 'getAttributesDiff', () => {
	it( 'should return undefined if no differences', () => {
		expect( getAttributesDiff( { a: 1 }, { a: 1 } ) ).toBeUndefined();
	} );

	it( 'should return diff for changed flat properties', () => {
		expect( getAttributesDiff( { a: 1, b: 2 }, { a: 1, b: 3 } ) ).toEqual( {
			b: 3,
		} );
	} );

	it( 'should map deleted properties to undefined', () => {
		expect( getAttributesDiff( { a: 1, b: 2 }, { a: 1 } ) ).toEqual( {
			b: undefined,
		} );
	} );

	it( 'should handle nested objects', () => {
		const original = {
			style: { color: { text: 'red' }, border: { radius: 5 } },
		};
		const updated = {
			style: { color: { text: 'green' }, border: { radius: 5 } },
		};
		expect( getAttributesDiff( original, updated ) ).toEqual( {
			style: { color: { text: 'green' } },
		} );
	} );

	it( 'should return undefined for nested objects if no changes', () => {
		const original = { style: { color: { text: 'red' } } };
		const updated = { style: { color: { text: 'red' } } };
		expect( getAttributesDiff( original, updated ) ).toBeUndefined();
	} );
} );

describe( 'applyAttributesDiff', () => {
	it( 'should return original if no diff', () => {
		expect( applyAttributesDiff( { a: 1 }, undefined ) ).toEqual( {
			a: 1,
		} );
	} );

	it( 'should merge flat properties', () => {
		expect( applyAttributesDiff( { a: 1, b: 2 }, { b: 3, c: 4 } ) ).toEqual(
			{
				a: 1,
				b: 3,
				c: 4,
			}
		);
	} );

	it( 'should delete properties mapped to undefined', () => {
		expect(
			applyAttributesDiff( { a: 1, b: 2 }, { b: undefined } )
		).toEqual( {
			a: 1,
		} );
	} );

	it( 'should merge nested properties', () => {
		const original = {
			style: { color: { text: 'red', background: 'blue' } },
		};
		const diff = { style: { color: { text: 'green' } } };
		expect( applyAttributesDiff( original, diff ) ).toEqual( {
			style: { color: { text: 'green', background: 'blue' } },
		} );
	} );

	it( 'should delete nested properties mapped to undefined', () => {
		const original = {
			style: { color: { text: 'red', background: 'blue' } },
		};
		const diff = { style: { color: { background: undefined } } };
		expect( applyAttributesDiff( original, diff ) ).toEqual( {
			style: { color: { text: 'red' } },
		} );
	} );
} );
