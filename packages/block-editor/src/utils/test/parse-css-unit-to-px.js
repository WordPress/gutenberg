/**
 * Internal dependencies
 */
import {
	default as memoizedGetPxFromCssUnit,
	getPxFromCssUnit,
} from '../parse-css-unit-to-px';

jest.useRealTimers();

describe( 'getPxFromCssUnit', () => {
	// Absolute units
	describe( 'absolute unites should return px values', () => {
		const testData = [
			[ '25px', '25px' ],
			[ '25.5', '26px' ],
			[ '1cm', '38px' ],
			[ '10mm', '38px' ],
			[ '1in', '96px' ],
			[ '12pt', '16px' ],
			[ '1pc', '16px' ],
			[ '40Q', '38px' ], // 40 Q should be 1 cm
		];

		test.each( testData )(
			'test getPxFromCssUnit( %s )',
			( unit, expected ) => {
				expect( getPxFromCssUnit( unit ) ).toBe( expected );
			}
		);
		test.each( testData )(
			'test memoizedGetPxFromCssUnit( %s )',
			( unit, expected ) => {
				expect( memoizedGetPxFromCssUnit( unit ) ).toBe( expected );
			}
		);
		test.each( testData )(
			'test cached memoizedGetPxFromCssUnit( %s )',
			( unit, expected ) => {
				expect( memoizedGetPxFromCssUnit( unit ) ).toBe( expected );
			}
		);
	} );

	describe( 'relative unites should return px values', () => {
		const settings = {
			fontSize: 10,
			width: 100,
			height: 200,
			lineHeight: 2,
			type: 'font',
		};

		const testData = [
			[ '2em', '20px' ],
			[ '2rem', '20px' ],
			[ '1.125rem', '11px' ],
			[ '20vw', '20px' ],
			[ '20vh', '40px' ],
			[ '20vmin', '20px' ],
			[ '20vmax', '40px' ],
			[ '20lh', '40px' ],
			[ '120%', '12px' ],
		];

		test.each( testData )(
			'test getPxFromCssUnit( %s )',
			( unit, expected ) => {
				expect( getPxFromCssUnit( unit, settings ) ).toBe( expected );
			}
		);
		test.each( testData )(
			'test memoizedGetPxFromCssUnit( %s )',
			( unit, expected ) => {
				expect( memoizedGetPxFromCssUnit( unit, settings ) ).toBe(
					expected
				);
			}
		);
		test.each( testData )(
			'test cached memoizedGetPxFromCssUnit( %s )',
			( unit, expected ) => {
				expect( memoizedGetPxFromCssUnit( unit, settings ) ).toBe(
					expected
				);
			}
		);
	} );

	// Function units

	describe( 'function unites should return px values', () => {
		const settings = {
			fontSize: 10,
			width: 100,
			height: 200,
			lineHeight: 2,
			type: 'font',
		};

		const testData = [
			[ 'min(20px, 25px)', '20px' ],
			[ 'min(20px, 9px, 12pt, 25px)', '9px' ],
			[ 'max(20px, 25px)', '25px' ],
			[ 'clamp(10px, 9px, 25px)', '10px' ],
			[ 'clamp(10px, 35px, 25px)', '25px' ],
			[ 'clamp(10px, 15px, 25px)', '15px' ],
			[ 'min(max(20px,25px), 35px)', '25px' ],
			[ 'max(min(20px,25px), 35px)', '35px' ],
			[ '10px + 25px', '35px' ],
			[ 'calc(10px + 25px)', '35px' ],
			[ 'calc( 2 * 20px)', '40px' ],
			[ 'calc(25px - 10px)', '15px' ],
			[ 'min(10px + 25px, 55pt)', '35px' ],
			[ 'calc(12vw * 10px)', '450px' ],
			[ 'calc(45vw / 10px)', '17px' ],
			[ '', null ],
			[ undefined, null ],
			[ 123, '123px' ],
			[ 123.456, '123px' ],
			[ 'abc', null ],
			[ 'console.log("howdy"); + 10px', null ],
			[ 'calc(12vw * 10px', null ], // missing closing bracket
		];

		test.each( testData )(
			'test getPxFromCssUnit( %s )',
			( unit, expected ) => {
				expect( getPxFromCssUnit( unit, settings ) ).toBe( expected );
			}
		);
		test.each( testData )(
			'test memoizedGetPxFromCssUnit( %s )',
			( unit, expected ) => {
				expect( memoizedGetPxFromCssUnit( unit, settings ) ).toBe(
					expected
				);
			}
		);
		test.each( testData )(
			'test cached memoizedGetPxFromCssUnit( %s )',
			( unit, expected ) => {
				expect( memoizedGetPxFromCssUnit( unit, settings ) ).toBe(
					expected
				);
			}
		);
	} );
	// Skip this test it might be useful in dev.
	it.skip( 'test performance of memoizedGetPxFromCssUnit function', () => {
		const start = Date.now();
		let i = 0;
		const intervals = 1000;
		while ( i < intervals ) {
			getPxFromCssUnit( 'max(25px, 35px)', { width: 200 } );
			i++;
		}
		const rawDuration = Date.now() - start;

		const startM = Date.now();
		i = 0;
		// the memoized Version should be at 10X better then the non default one.
		while ( i < intervals * 10 ) {
			memoizedGetPxFromCssUnit( 'max(25px, 35px)', { width: 201 } );
			i++;
		}
		expect( rawDuration > Date.now() - startM ).toBe( true );
	} );
} );
