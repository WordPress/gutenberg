/**
 * Internal dependencies
 */
import { debounce } from '../index';

const identity = ( value ) => value;

describe( 'debounce', () => {
	it( 'should debounce a function', () => {
		return new Promise( ( done ) => {
			let callCount = 0;

			const debounced = debounce( function ( value ) {
				++callCount;
				return value;
			}, 32 );

			let results = [
				debounced( 'a' ),
				debounced( 'b' ),
				debounced( 'c' ),
			];
			expect( results ).toStrictEqual( [
				undefined,
				undefined,
				undefined,
			] );
			expect( callCount ).toBe( 0 );

			setTimeout( function () {
				expect( callCount ).toBe( 1 );

				results = [
					debounced( 'd' ),
					debounced( 'e' ),
					debounced( 'f' ),
				];
				expect( results ).toStrictEqual( [ 'c', 'c', 'c' ] );
				expect( callCount ).toBe( 1 );
			}, 128 );

			setTimeout( function () {
				expect( callCount ).toBe( 2 );
				done( null );
			}, 256 );
		} );
	} );

	it( 'should return the last `func` result on subsequent debounced calls', () => {
		return new Promise( ( done ) => {
			const debounced = debounce( identity, 32 );
			debounced( 'a' );

			setTimeout( function () {
				expect( debounced( 'b' ) ).not.toBe( 'b' );
			}, 64 );

			setTimeout( function () {
				expect( debounced( 'c' ) ).not.toBe( 'c' );
				done( null );
			}, 128 );
		} );
	} );

	it( 'should not immediately call `func` when `wait` is `0`', () => {
		return new Promise( ( done ) => {
			let callCount = 0;
			const debounced = debounce( function () {
				++callCount;
			}, 0 );

			debounced();
			debounced();
			expect( callCount ).toBe( 0 );

			setTimeout( function () {
				expect( callCount ).toBe( 1 );
				done( null );
			}, 5 );
		} );
	} );

	it( 'should apply default options', () => {
		return new Promise( ( done ) => {
			let callCount = 0;
			const debounced = debounce(
				function () {
					callCount++;
				},
				32,
				{}
			);

			debounced();
			expect( callCount ).toBe( 0 );

			setTimeout( function () {
				expect( callCount ).toBe( 1 );
				done( null );
			}, 64 );
		} );
	} );

	it( 'should support a `leading` option', () => {
		return new Promise( ( done ) => {
			const callCounts = [ 0, 0 ];

			const withLeading = debounce(
				function () {
					callCounts[ 0 ]++;
				},
				32,
				{ leading: true }
			);

			const withLeadingAndTrailing = debounce(
				function () {
					callCounts[ 1 ]++;
				},
				32,
				{ leading: true }
			);

			withLeading();
			expect( callCounts[ 0 ] ).toBe( 1 );

			withLeadingAndTrailing();
			withLeadingAndTrailing();
			expect( callCounts[ 1 ] ).toBe( 1 );

			setTimeout( function () {
				expect( callCounts ).toStrictEqual( [ 1, 2 ] );

				withLeading();
				expect( callCounts[ 0 ] ).toBe( 2 );

				done( null );
			}, 64 );
		} );
	} );

	it( 'should return the last `func` result for subsequent leading debounced calls', () => {
		return new Promise( ( done ) => {
			const debounced = debounce( identity, 32, {
				leading: true,
				trailing: false,
			} );
			let results = [ debounced( 'a' ), debounced( 'b' ) ];

			expect( results ).toStrictEqual( [ 'a', 'a' ] );

			setTimeout( function () {
				results = [ debounced( 'c' ), debounced( 'd' ) ];
				expect( results ).toStrictEqual( [ 'c', 'c' ] );
				done( null );
			}, 64 );
		} );
	} );

	it( 'should support a `trailing` option', () => {
		return new Promise( ( done ) => {
			let withCount = 0;
			let withoutCount = 0;

			const withTrailing = debounce(
				function () {
					withCount++;
				},
				32,
				{ trailing: true }
			);

			const withoutTrailing = debounce(
				function () {
					withoutCount++;
				},
				32,
				{ trailing: false }
			);

			withTrailing();
			expect( withCount ).toBe( 0 );

			withoutTrailing();
			expect( withCount ).toBe( 0 );

			setTimeout( function () {
				expect( withCount ).toBe( 1 );
				expect( withoutCount ).toBe( 0 );
				done( null );
			}, 64 );
		} );
	} );

	it( 'should support a `maxWait` option', () => {
		return new Promise( ( done ) => {
			let callCount = 0;

			const debounced = debounce(
				function ( value ) {
					++callCount;
					return value;
				},
				32,
				{ maxWait: 64 }
			);

			debounced( 42 );
			debounced( 42 );
			expect( callCount ).toBe( 0 );

			setTimeout( function () {
				expect( callCount ).toBe( 1 );
				debounced( 42 );
				debounced( 42 );
				expect( callCount ).toBe( 1 );
			}, 128 );

			setTimeout( function () {
				expect( callCount ).toBe( 2 );
				done( null );
			}, 256 );
		} );
	} );

	it( 'should support `maxWait` in a tight loop', () => {
		return new Promise( ( done ) => {
			const limit = 320;
			let withCount = 0;
			let withoutCount = 0;

			const withMaxWait = debounce(
				function () {
					withCount++;
				},
				64,
				{ maxWait: 128 }
			);

			const withoutMaxWait = debounce( function () {
				withoutCount++;
			}, 96 );

			const start = Date.now();
			while ( Date.now() - start < limit ) {
				withMaxWait();
				withoutMaxWait();
			}
			const actual = [ Boolean( withoutCount ), Boolean( withCount ) ];
			setTimeout( function () {
				expect( actual ).toStrictEqual( [ false, true ] );
				done( null );
			}, 1 );
		} );
	} );

	it( 'should queue a trailing call for subsequent debounced calls after `maxWait`', () => {
		return new Promise( ( done ) => {
			let callCount = 0;

			const debounced = debounce(
				function () {
					++callCount;
				},
				200,
				{ maxWait: 200 }
			);

			debounced();

			setTimeout( debounced, 190 );
			setTimeout( debounced, 200 );
			setTimeout( debounced, 210 );

			setTimeout( function () {
				expect( callCount ).toBe( 2 );
				done( null );
			}, 500 );
		} );
	} );

	it( 'should cancel when `cancel` is invoked', () => {
		return new Promise( ( done ) => {
			let callCount = 0;

			const debounced = debounce( function () {
				callCount++;
			}, 32 );

			debounced();

			setTimeout( function () {
				debounced.cancel();
				expect( callCount ).toBe( 0 );
			}, 16 );

			setTimeout( function () {
				expect( callCount ).toBe( 0 );
				done( null );
			}, 64 );
		} );
	} );

	it( 'should cancel `maxDelayed` when `delayed` is invoked', () => {
		return new Promise( ( done ) => {
			let callCount = 0;

			const debounced = debounce(
				function () {
					callCount++;
				},
				32,
				{ maxWait: 64 }
			);

			debounced();

			setTimeout( function () {
				debounced();
				expect( callCount ).toBe( 1 );
			}, 128 );

			setTimeout( function () {
				expect( callCount ).toBe( 2 );
				done( null );
			}, 192 );
		} );
	} );

	it( 'should invoke the trailing call with the correct arguments and `this` binding', () => {
		return new Promise( ( done ) => {
			let actual;
			let callCount = 0;
			const object = {};

			const debounced = debounce(
				function ( ...args ) {
					actual = [ this ];
					Array.prototype.push.apply( actual, args );
					return ++callCount !== 2;
				},
				32,
				{ leading: true, maxWait: 64 }
			);

			while ( true ) {
				if ( ! debounced.call( object, 'a' ) ) {
					break;
				}
			}

			setTimeout( function () {
				expect( callCount ).toBe( 2 );
				expect( actual ).toStrictEqual( [ object, 'a' ] );
				done( null );
			}, 64 );
		} );
	} );
} );
