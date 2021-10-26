/**
 * Internal dependencies
 */
import {
	default as memoizedGetPxFromCssUnit,
	getPxFromCssUnit,
} from '../parse-css-unit-to-px';

describe( 'getPxFromCssUnit', () => {
	// Absolute units
	describe( 'absolute unites should return px values', () => {
		const testData = [
			{ unit: '25px', expected: '25px' },
			{ unit: '25.5', expected: '26px' },
			{ unit: '1cm', expected: '38px' },
			{ unit: '10mm', expected: '38px' },
			{ unit: '1in', expected: '96px' },
			{ unit: '12pt', expected: '16px' },
			{ unit: '1pc', expected: '16px' },
			{ unit: '40Q', expected: '38px' }, // 40 Q should be 1 cm
		];

		testData.forEach( ( data ) => {
			it( 'test unit ' + data.unit + '', () => {
				expect( getPxFromCssUnit( data.unit ) ).toBe( data.expected );
			} );
			it( 'test unit ' + data.unit + ' - memoized', () => {
				expect( memoizedGetPxFromCssUnit( data.unit ) ).toBe(
					data.expected
				);
			} );
			it( 'test unit ' + data.unit + ' - memoized cached', () => {
				expect( memoizedGetPxFromCssUnit( data.unit ) ).toBe(
					data.expected
				);
			} );
		} );
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
			{ unit: '2em', expected: '20px' },
			{ unit: '2rem', expected: '20px' },
			{ unit: '20vw', expected: '20px' },
			{ unit: '20vh', expected: '40px' },
			{ unit: '20vmin', expected: '20px' },
			{ unit: '20vmax', expected: '40px' },
			{ unit: '20lh', expected: '40px' },
			{ unit: '120%', expected: '12px' },
		];

		testData.forEach( ( data ) => {
			it( 'test unit ' + data.unit + '', () => {
				expect( getPxFromCssUnit( data.unit, settings ) ).toBe(
					data.expected
				);
			} );
			it( 'test unit ' + data.unit + ' - memoized', () => {
				expect( memoizedGetPxFromCssUnit( data.unit, settings ) ).toBe(
					data.expected
				);
			} );
			it( 'test unit ' + data.unit + ' - memoized cached', () => {
				expect( memoizedGetPxFromCssUnit( data.unit, settings ) ).toBe(
					data.expected
				);
			} );
		} );
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
			{ unit: 'min(20px, 25px)', expected: '20px' },
			{ unit: 'min(20px, 9px, 12pt, 25px)', expected: '9px' },
			{ unit: 'max(20px, 25px)', expected: '25px' },
			{ unit: 'clamp(10px, 9px, 25px)', expected: '10px' },
			{ unit: 'clamp(10px, 35px, 25px)', expected: '25px' },
			{ unit: 'clamp(10px, 15px, 25px)', expected: '15px' },
			{ unit: 'min(max(20px,25px), 35px)', expected: '25px' },
			{ unit: 'max(min(20px,25px), 35px)', expected: '35px' },
			{ unit: '10px + 25px', expected: '35px' },
			{ unit: 'calc(10px + 25px)', expected: '35px' },
			{ unit: 'calc( 2 * 20px)', expected: '40px' },
			{ unit: 'calc(25px - 10px)', expected: '15px' },
			{ unit: 'min(10px + 25px, 55pt)', expected: '35px' },
			{ unit: 'calc(12vw * 10px)', expected: '450px' },
			{ unit: 'calc(45vw / 10px)', expected: '17px' },
			{ unit: '', expected: null },
			{ unit: undefined, expected: null },
			{ unit: 123, expected: '123px' },
			{ unit: 123.456, expected: '123px' },
			{ unit: 'abc', expected: null },
			{ unit: 'console.log("howdy"); + 10px', expected: null },
			{ unit: 'calc(12vw * 10px', expected: null }, // missing closing bracket
		];

		testData.forEach( ( data ) => {
			it( 'test unit ' + data.unit, () => {
				expect( getPxFromCssUnit( data.unit, settings ) ).toBe(
					data.expected
				);
			} );
			it( 'test unit ' + data.unit + ' - memoized', () => {
				expect( memoizedGetPxFromCssUnit( data.unit, settings ) ).toBe(
					data.expected
				);
			} );
			it( 'test unit ' + data.unit + ' - memoized cached', () => {
				expect( memoizedGetPxFromCssUnit( data.unit, settings ) ).toBe(
					data.expected
				);
			} );
		} );
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
