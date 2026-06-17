/**
 * Internal dependencies
 */
import {
	getOptimisticPaletteValue,
	getRollbackPaletteValue,
} from '../use-color-palette-editor';

describe( 'getOptimisticPaletteValue', () => {
	it( 'custom: returns the array when non-empty', () => {
		const next = [ { slug: 'a', color: '#000' } ];
		expect( getOptimisticPaletteValue( 'custom', next, [] ) ).toBe( next );
	} );
	it( 'custom: returns undefined when empty (removes the override)', () => {
		expect( getOptimisticPaletteValue( 'custom', [], [] ) ).toBeUndefined();
	} );
	it( 'theme/default: returns undefined when equal to base (auto-reset)', () => {
		const base = [ { slug: 'brand', color: '#000' } ];
		const next = [ { slug: 'brand', color: '#000' } ];
		expect(
			getOptimisticPaletteValue( 'theme', next, base )
		).toBeUndefined();
	} );
	it( 'theme/default: returns the array when it differs from base', () => {
		const base = [ { slug: 'brand', color: '#000' } ];
		const next = [ { slug: 'brand', color: '#fff' } ];
		expect( getOptimisticPaletteValue( 'theme', next, base ) ).toBe( next );
	} );
} );

describe( 'getRollbackPaletteValue', () => {
	it( 'custom: undefined when previous was empty', () => {
		expect( getRollbackPaletteValue( 'custom', [] ) ).toBeUndefined();
		expect(
			getRollbackPaletteValue( 'custom', undefined )
		).toBeUndefined();
	} );
	it( 'custom: returns previous array when non-empty', () => {
		const prev = [ { slug: 'a', color: '#000' } ];
		expect( getRollbackPaletteValue( 'custom', prev ) ).toBe( prev );
	} );
	it( 'theme/default: returns previous value as-is', () => {
		const prev = [ { slug: 'brand', color: '#000' } ];
		expect( getRollbackPaletteValue( 'theme', prev ) ).toBe( prev );
		expect( getRollbackPaletteValue( 'theme', undefined ) ).toBeUndefined();
	} );
} );
