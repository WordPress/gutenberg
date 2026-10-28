import { describe, expect, it } from 'vitest';
import { normalizeGridSettings } from '../normalize-grid-settings';

describe( 'normalizeGridSettings', () => {
	it( 'honors any positive row height as-is', () => {
		expect(
			normalizeGridSettings( { model: 'grid', rowHeight: 40 }, 300 )
		).toEqual( { model: 'grid', rowHeight: 40 } );
		expect(
			normalizeGridSettings( { model: 'grid', rowHeight: 333 }, 300 )
		).toEqual( { model: 'grid', rowHeight: 333 } );
	} );

	it( 'keeps the settings identity when nothing changes', () => {
		const settings = { model: 'grid' as const, rowHeight: 40 };
		expect( normalizeGridSettings( settings, 300 ) ).toBe( settings );
	} );

	it( 'fills an absent or invalid row height with the default', () => {
		expect( normalizeGridSettings( { model: 'grid' }, 300 ) ).toEqual( {
			model: 'grid',
			rowHeight: 300,
		} );
		expect(
			normalizeGridSettings( { model: 'grid', rowHeight: 0 }, 300 )
		).toEqual( { model: 'grid', rowHeight: 300 } );
		expect(
			normalizeGridSettings( { model: 'grid', rowHeight: -20 }, 300 )
		).toEqual( { model: 'grid', rowHeight: 300 } );
		expect(
			normalizeGridSettings(
				{ model: 'grid', rowHeight: Number.NaN },
				300
			)
		).toEqual( { model: 'grid', rowHeight: 300 } );
	} );

	it( 'treats a missing model as the grid', () => {
		expect( normalizeGridSettings( { columns: 3 }, 300 ) ).toEqual( {
			columns: 3,
			rowHeight: 300,
		} );
	} );

	it( 'passes masonry settings through', () => {
		const settings = { model: 'masonry' as const, flowTolerance: 16 };
		expect( normalizeGridSettings( settings, 300 ) ).toBe( settings );
	} );
} );
