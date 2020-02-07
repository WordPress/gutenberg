/**
 * Internal dependencies
 */
import {
	toWidthPrecision,
	getEffectiveColumnWidth,
	getTotalColumnsWidth,
	getColumnWidths,
	getRedistributedColumnWidths,
	hasExplicitColumnWidths,
	getMappedColumnWidths,
} from '../utils';

describe( 'toWidthPrecision', () => {
	it( 'should round value to standard precision', () => {
		const value = toWidthPrecision( 50.108 );

		expect( value ).toBe( 50.11 );
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
		const blocks = [
			{ clientId: 'a', attributes: { width: 30 } },
			{ clientId: 'b', attributes: { width: 40 } },
		];

		it( 'should constrain to fit available width', () => {
			const widths = getRedistributedColumnWidths( blocks, 60 );

			expect( widths ).toEqual( {
				a: 25,
				b: 35,
			} );
		} );

		it( 'should expand to fit available width', () => {
			const widths = getRedistributedColumnWidths( blocks, 80 );

			expect( widths ).toEqual( {
				a: 35,
				b: 45,
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

describe( 'hasExplicitColumnWidths', () => {
	it( 'returns false if no blocks have explicit width', () => {
		const blocks = [ { attributes: {} } ];

		const result = hasExplicitColumnWidths( blocks );

		expect( result ).toBe( false );
	} );

	it( 'returns true if a block has explicit width', () => {
		const blocks = [ { attributes: { width: 100 } } ];

		const result = hasExplicitColumnWidths( blocks );

		expect( result ).toBe( true );
	} );

	it( 'returns false if some, not all blocks have explicit width', () => {
		const blocks = [
			{ attributes: { width: 10 } },
			{ attributes: { width: undefined } },
		];

		const result = hasExplicitColumnWidths( blocks );

		expect( result ).toBe( false );
	} );

	it( 'returns true if all blocks have explicit width', () => {
		const blocks = [
			{ attributes: { width: 10 } },
			{ attributes: { width: 90 } },
		];

		const result = hasExplicitColumnWidths( blocks );

		expect( result ).toBe( true );
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
			{ clientId: 'a', attributes: { width: 25 } },
			{ clientId: 'b', attributes: { width: 35 } },
		] );
	} );
} );
