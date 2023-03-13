/**
 * Internal dependencies
 */
import { throttle } from '../index';

const identity = ( value ) => value;

describe( 'throttle', () => {
	beforeEach( () => {
		jest.useFakeTimers();
	} );

	afterEach( () => {
		jest.useRealTimers();
	} );

	it( 'should throttle a function', () => {
		let callCount = 0;
		const throttled = throttle( function () {
			callCount++;
		}, 32 );

		throttled();
		throttled();
		throttled();

		const lastCount = callCount;
		expect( callCount ).toBeGreaterThan( 0 );

		jest.advanceTimersByTime( 64 );

		expect( callCount ).toBeGreaterThan( lastCount );
	} );

	it( 'should return the result of the first call on subsequent calls', () => {
		const throttled = throttle( identity, 32 );
		let results = [ throttled( 'a' ), throttled( 'b' ) ];

		expect( results ).toStrictEqual( [ 'a', 'a' ] );

		jest.advanceTimersByTime( 64 );

		results = [ throttled( 'c' ), throttled( 'd' ) ];
		expect( results[ 0 ] ).not.toBe( 'a' );
		expect( results[ 0 ] ).not.toBe( undefined );

		expect( results[ 1 ] ).not.toBe( 'd' );
		expect( results[ 1 ] ).not.toBe( undefined );
	} );

	it( 'should clear timeout when `func` is called', () => {
		let callCount = 0;
		let dateCount = 0;

		const globalDateNow = global.Date.now;
		global.Date.now = function () {
			return ++dateCount === 5 ? Infinity : +new Date();
		};

		const throttled = throttle( () => {
			callCount++;
		}, 32 );

		throttled();
		throttled();

		jest.advanceTimersByTime( 64 );

		expect( callCount ).toBe( 2 );
		global.Date.now = globalDateNow;
	} );

	it( 'should not trigger a trailing call when invoked once', () => {
		let callCount = 0;
		const throttled = throttle( () => {
			callCount++;
		}, 32 );

		throttled();
		expect( callCount ).toBe( 1 );

		jest.advanceTimersByTime( 64 );

		expect( callCount ).toBe( 1 );
	} );

	[ true, false ].forEach( ( leading ) => {
		it(
			'should trigger a call when invoked repeatedly' +
				( ! leading ? ' and `leading` is `false`' : '' ),
			() => {
				let callCount = 0;
				const limit = 320;
				const options = leading ? {} : { leading: false };
				const throttled = throttle(
					() => {
						callCount++;
					},
					32,
					options
				);

				const start = Date.now();
				while ( Date.now() - start < limit ) {
					throttled();
					jest.advanceTimersByTime( 1 );
				}
				const actual = callCount;

				jest.advanceTimersByTime( 1 );

				expect( actual ).toBeGreaterThan( 1 );
			}
		);
	} );

	it( 'should trigger a second throttled call as soon as possible', () => {
		let callCount = 0;

		const throttled = throttle(
			() => {
				callCount++;
			},
			128,
			{ leading: false }
		);

		throttled();

		jest.advanceTimersByTime( 192 );

		expect( callCount ).toBe( 1 );
		throttled();

		jest.advanceTimersByTime( 64 );

		expect( callCount ).toBe( 1 );

		jest.advanceTimersByTime( 130 );

		expect( callCount ).toBe( 2 );
	} );

	it( 'should apply default options', () => {
		let callCount = 0;
		const throttled = throttle(
			() => {
				callCount++;
			},
			32,
			{}
		);

		throttled();
		throttled();
		expect( callCount ).toBe( 1 );

		jest.advanceTimersByTime( 128 );

		expect( callCount ).toBe( 2 );
	} );

	it( 'should support a `leading` option', () => {
		const withLeading = throttle( identity, 32, { leading: true } );
		expect( withLeading( 'a' ) ).toBe( 'a' );

		const withoutLeading = throttle( identity, 32, { leading: false } );
		expect( withoutLeading( 'a' ) ).toBeUndefined();
	} );

	it( 'should support a `trailing` option', () => {
		let withCount = 0;
		let withoutCount = 0;

		const withTrailing = throttle(
			( value ) => {
				withCount++;
				return value;
			},
			64,
			{ trailing: true }
		);

		const withoutTrailing = throttle(
			( value ) => {
				withoutCount++;
				return value;
			},
			64,
			{ trailing: false }
		);

		expect( withTrailing( 'a' ) ).toBe( 'a' );
		expect( withTrailing( 'b' ) ).toBe( 'a' );

		expect( withoutTrailing( 'a' ) ).toBe( 'a' );
		expect( withoutTrailing( 'b' ) ).toBe( 'a' );

		jest.advanceTimersByTime( 256 );

		expect( withCount ).toBe( 2 );
		expect( withoutCount ).toBe( 1 );
	} );

	it( 'should not update `lastCalled`, at the end of the timeout, when `trailing` is `false`', () => {
		let callCount = 0;

		const throttled = throttle(
			function () {
				callCount++;
			},
			64,
			{ trailing: false }
		);

		throttled();
		throttled();

		jest.advanceTimersByTime( 96 );

		throttled();
		throttled();

		jest.advanceTimersByTime( 96 );

		expect( callCount ).toBeGreaterThan( 1 );
	} );

	it( 'should work with a system time of `0`', () => {
		let callCount = 0;
		let dateCount = 0;

		const globalDateNow = global.Date.now;
		global.Date.now = function () {
			return ++dateCount < 4 ? 0 : +new Date();
		};

		const throttled = throttle( ( value ) => {
			callCount++;
			return value;
		}, 32 );

		const results = [
			throttled( 'a' ),
			throttled( 'b' ),
			throttled( 'c' ),
		];
		expect( results ).toStrictEqual( [ 'a', 'a', 'a' ] );
		expect( callCount ).toBe( 1 );

		jest.advanceTimersByTime( 64 );

		expect( callCount ).toBe( 2 );
		global.Date.now = globalDateNow;
	} );
} );
