/**
 * External dependencies
 */
import deepFreeze from 'deep-freeze';

/**
 * Internal dependencies
 */
import {
	toWidthPrecision,
	getEffectiveColumnWidth,
	getTotalColumnsWidth,
	getColumnWidths,
	getRedistributedColumnWidths,
	hasExplicitPercentColumnWidths,
	getMappedColumnWidths,
} from '../utils';

describe( 'toWidthPrecision', () => {
	it( 'should round value to standard precision', () => {
		const value = toWidthPrecision( 50.108 );

		expect( value ).toBe( 50.11 );
	} );

	it( 'should convert a string value with unit to a number', () => {
		expect( toWidthPrecision( '33.3%' ) ).toBe( 33.3 );
	} );

	it( 'should return undefined for an invalid string', () => {
		expect( toWidthPrecision( 'blahblah' ) ).toBe( undefined );
	} );

	it( 'should return undefined for invalid number', () => {
		expect( toWidthPrecision( null ) ).toBe( undefined );
		expect( toWidthPrecision( undefined ) ).toBe( undefined );
	} );
} );

describe( 'getEffectiveColumnWidth', () => {
	it( 'should return attribute value if set, rounded to precision', () => {
		const block = { attributes: { width: 50.108 } };

		const width = getEffectiveColumnWidth( block, 3 );

		expect( width ).toBe( 50.11 );
	} );

	it( 'should return assumed width if attribute value not set, rounded to precision', () => {
		const block = { attributes: {} };

		const width = getEffectiveColumnWidth( block, 3 );

		expect( width ).toBe( 33.33 );
	} );
} );

describe( 'getTotalColumnsWidth', () => {
	describe( 'explicit width', () => {
		const blocks = [
			{ clientId: 'a', attributes: { width: 30 } },
			{ clientId: 'b', attributes: { width: 40 } },
		];

		it( 'returns the sum total of columns width', () => {
			const width = getTotalColumnsWidth( blocks );

			expect( width ).toBe( 70 );
		} );
	} );

	describe( 'implicit width', () => {
		const blocks = [
			{ clientId: 'a', attributes: {} },
			{ clientId: 'b', attributes: {} },
		];

		it( 'returns the sum total of columns width', () => {
			const widths = getTotalColumnsWidth( blocks );

			expect( widths ).toBe( 100 );
		} );
	} );
} );

describe( 'getColumnWidths', () => {
	describe( 'explicit width', () => {
		const blocks = [
			{ clientId: 'a', attributes: { width: 30.459 } },
			{ clientId: 'b', attributes: { width: 29.543 } },
		];

		it( 'returns the column widths', () => {
			const widths = getColumnWidths( blocks );

			expect( widths ).toEqual( {
				a: 30.46,
				b: 29.54,
			} );
		} );
	} );

	describe( 'implicit width', () => {
		const blocks = [
			{ clientId: 'a', attributes: {} },
			{ clientId: 'b', attributes: {} },
		];

		it( 'returns the column widths', () => {
			const widths = getColumnWidths( blocks );

			expect( widths ).toEqual( {
				a: 50,
				b: 50,
			} );
		} );
	} );
} );

describe( 'getRedistributedColumnWidths', () => {
	describe( 'explicit width', () => {
		let blocks = [
			{ clientId: 'a', attributes: { width: 30 } },
			{ clientId: 'b', attributes: { width: 40 } },
		];

		it( 'should constrain to fit available width', () => {
			const widths = getRedistributedColumnWidths( blocks, 60 );

			expect( widths ).toEqual( {
				a: 25.71,
				b: 34.29,
			} );
		} );

		it( 'should expand to fit available width', () => {
			const widths = getRedistributedColumnWidths( blocks, 80 );

			expect( widths ).toEqual( {
				a: 34.29,
				b: 45.71,
			} );
		} );

		it( 'should decrease proportionally for third column', () => {
			blocks = [
				{ clientId: 'a', attributes: { width: 99 } },
				{ clientId: 'b', attributes: { width: 1 } },
			];
			const widths = getRedistributedColumnWidths( blocks, 66.67 );

			expect( widths ).toEqual( {
				a: 66,
				b: 0.67,
			} );
		} );

		it( 'should decrease proportionally for fourth column', () => {
			blocks = [
				{ clientId: 'a', attributes: { width: 98 } },
				{ clientId: 'b', attributes: { width: 1 } },
				{ clientId: 'c', attributes: { width: 1 } },
			];
			const widths = getRedistributedColumnWidths( blocks, 75 );

			expect( widths ).toEqual( {
				a: 73.5,
				b: 0.75,
				c: 0.75,
			} );
		} );
	} );

	describe( 'implicit width', () => {
		const blocks = [
			{ clientId: 'a', attributes: {} },
			{ clientId: 'b', attributes: {} },
		];

		it( 'should equally distribute to available width', () => {
			const widths = getRedistributedColumnWidths( blocks, 60 );

			expect( widths ).toEqual( {
				a: 30,
				b: 30,
			} );
		} );

		it( 'should constrain to fit available width', () => {
			const widths = getRedistributedColumnWidths( blocks, 66.66, 3 );

			expect( widths ).toEqual( {
				a: 33.33,
				b: 33.33,
			} );
		} );
	} );
} );

describe( 'hasExplicitPercentColumnWidths', () => {
	it( 'returns false if no blocks have explicit width', () => {
		const blocks = [ { attributes: {} } ];

		const result = hasExplicitPercentColumnWidths( blocks );

		expect( result ).toBe( false );
	} );

	it( 'returns true if a block has explicit width defined as a number', () => {
		const blocks = [ { attributes: { width: 100 } } ];

		const result = hasExplicitPercentColumnWidths( blocks );

		expect( result ).toBe( true );
	} );

	it( 'returns true if a block has explicit percent width defined as a string', () => {
		const blocks = [ { attributes: { width: '100%' } } ];

		const result = hasExplicitPercentColumnWidths( blocks );

		expect( result ).toBe( true );
	} );

	it( 'returns false if some, not all blocks have explicit width', () => {
		const blocks = [
			{ attributes: { width: 10 } },
			{ attributes: { width: undefined } },
		];

		const result = hasExplicitPercentColumnWidths( blocks );

		expect( result ).toBe( false );
	} );

	it( 'returns true if all blocks have explicit width', () => {
		const blocks = [
			{ attributes: { width: 10 } },
			{ attributes: { width: 90 } },
		];

		const result = hasExplicitPercentColumnWidths( blocks );

		expect( result ).toBe( true );
	} );

	it( 'returns true if blocks have width defined as percent strings and numbers', () => {
		const blocks = [
			{ attributes: { width: '10%' } },
			{ attributes: { width: 90 } },
		];

		const result = hasExplicitPercentColumnWidths( blocks );

		expect( result ).toBe( true );
	} );

	it( 'returns false if blocks have width defined as mixed unit strings', () => {
		const blocks = [
			{ attributes: { width: '20%' } },
			{ attributes: { width: '90px' } },
		];

		const result = hasExplicitPercentColumnWidths( blocks );

		expect( result ).toBe( false );
	} );
} );

describe( 'getMappedColumnWidths', () => {
	it( 'merges to block attributes using provided widths', () => {
		const blocks = [
			{ clientId: 'a', attributes: { width: 30 } },
			{ clientId: 'b', attributes: { width: 40 } },
		];
		const widths = {
			a: 25,
			b: 35,
		};

		const result = getMappedColumnWidths( blocks, widths );

		expect( result ).toEqual( [
			{ clientId: 'a', attributes: { width: '25%' } },
			{ clientId: 'b', attributes: { width: '35%' } },
		] );
	} );

	it( 'always returns new objects and does not mutate input blocks', () => {
		const blocks = [
			deepFreeze( { clientId: 'a', attributes: { width: 30 } } ),
			deepFreeze( { clientId: 'b', attributes: { width: 40 } } ),
		];
		const widths = {
			a: 25,
			b: 35,
		};

		const result = getMappedColumnWidths( blocks, widths );

		expect( blocks[ 0 ] ).not.toBe( result[ 0 ] );
		expect( blocks[ 1 ] ).not.toBe( result[ 1 ] );
	} );

	it( 'merges to block attributes if original blocks do not have any attributes', () => {
		const blocks = [ { clientId: 'a' }, { clientId: 'b' } ];
		const widths = {
			a: 25,
			b: 35,
		};

		const result = getMappedColumnWidths( blocks, widths );

		expect( result ).toEqual( [
			{ clientId: 'a', attributes: { width: '25%' } },
			{ clientId: 'b', attributes: { width: '35%' } },
		] );
	} );

	it( 'merges to block attributes if original blocks do not have a width attribute', () => {
		const blocks = [
			{ clientId: 'a', attributes: { align: 'left' } },
			{ clientId: 'b', attributes: { align: 'right' } },
		];
		const widths = {
			a: 25,
			b: 35,
		};

		const result = getMappedColumnWidths( blocks, widths );

		expect( result ).toEqual( [
			{ clientId: 'a', attributes: { align: 'left', width: '25%' } },
			{ clientId: 'b', attributes: { align: 'right', width: '35%' } },
		] );
	} );
} );
