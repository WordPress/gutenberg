import { describe, expect, it } from 'vitest';
import { resolveColumnCap, resolveColumnCount } from '../column-policy';
import type { ColumnSteps } from '../column-policy';

const STEPS = { 0: 1, 600: 2, 960: 4 };
const AUTO_STEPS: ColumnSteps = { 0: 1, 600: 2, 960: 'auto' };
const GAP = 24;

describe( 'resolveColumnCap', () => {
	it( 'passes a count and an absent policy through', () => {
		expect( resolveColumnCap( 3, 1000 ) ).toBe( 3 );
		expect( resolveColumnCap( undefined, 1000 ) ).toBeUndefined();
	} );

	it( 'picks the widest step the container has reached', () => {
		expect( resolveColumnCap( STEPS, 0 ) ).toBe( 1 );
		expect( resolveColumnCap( STEPS, 599 ) ).toBe( 1 );
		expect( resolveColumnCap( STEPS, 600 ) ).toBe( 2 );
		expect( resolveColumnCap( STEPS, 959 ) ).toBe( 2 );
		expect( resolveColumnCap( STEPS, 960 ) ).toBe( 4 );
		expect( resolveColumnCap( STEPS, 5000 ) ).toBe( 4 );
	} );

	it( 'uses the narrowest step below its own threshold', () => {
		expect( resolveColumnCap( { 600: 2, 960: 4 }, 100 ) ).toBe( 2 );
	} );

	it( 'lifts the cap on an auto step', () => {
		expect( resolveColumnCap( AUTO_STEPS, 800 ) ).toBe( 2 );
		expect( resolveColumnCap( AUTO_STEPS, 960 ) ).toBeUndefined();
	} );

	it( 'treats a map with no numeric keys as unset', () => {
		expect( resolveColumnCap( {}, 1000 ) ).toBeUndefined();
		expect(
			resolveColumnCap(
				{ wide: 4 } as unknown as Record< number, number >,
				1000
			)
		).toBeUndefined();
	} );
} );

describe( 'resolveColumnCount', () => {
	it( 'falls back to the default when the policy sets nothing', () => {
		expect( resolveColumnCount( {}, 1000, GAP, 6 ) ).toBe( 6 );
	} );

	it( 'renders a plain count at every width', () => {
		expect( resolveColumnCount( { columns: 3 }, 300, GAP, 6 ) ).toBe( 3 );
		expect( resolveColumnCount( { columns: 3 }, 3000, GAP, 6 ) ).toBe( 3 );
	} );

	it( 'fits as many columns as the floor allows when no count is set', () => {
		// Three 240px columns and two gaps need 768px; four need 1032px.
		expect(
			resolveColumnCount( { minColumnWidth: 240 }, 1000, GAP, 6 )
		).toBe( 3 );
		expect(
			resolveColumnCount( { minColumnWidth: 240 }, 1032, GAP, 6 )
		).toBe( 4 );
	} );

	it( 'caps the floor count with the policy count', () => {
		expect(
			resolveColumnCount(
				{ columns: 2, minColumnWidth: 240 },
				1000,
				GAP,
				6
			)
		).toBe( 2 );
		expect(
			resolveColumnCount(
				{ columns: 4, minColumnWidth: 240 },
				1000,
				GAP,
				6
			)
		).toBe( 3 );
	} );

	it( 'lowers a step count with the floor', () => {
		// The 960px step asks for four, but four 300px columns need 1272px.
		expect(
			resolveColumnCount(
				{ columns: STEPS, minColumnWidth: 300 },
				1000,
				GAP,
				6
			)
		).toBe( 3 );
		expect(
			resolveColumnCount(
				{ columns: STEPS, minColumnWidth: 300 },
				1280,
				GAP,
				6
			)
		).toBe( 4 );
	} );

	it( 'lets the floor decide on an auto step', () => {
		// Five 240px columns and four gaps need 1296px.
		expect(
			resolveColumnCount(
				{ columns: AUTO_STEPS, minColumnWidth: 240 },
				1300,
				GAP,
				6
			)
		).toBe( 5 );
		expect(
			resolveColumnCount(
				{ columns: AUTO_STEPS, minColumnWidth: 240 },
				800,
				GAP,
				6
			)
		).toBe( 2 );
	} );

	it( 'renders the default on an auto step with no floor', () => {
		expect(
			resolveColumnCount( { columns: { 0: 'auto' } }, 1000, GAP, 6 )
		).toBe( 6 );
	} );

	it( 'never renders fewer than one column', () => {
		expect( resolveColumnCount( { columns: 0 }, 1000, GAP, 6 ) ).toBe( 1 );
		expect( resolveColumnCount( { minColumnWidth: 240 }, 0, GAP, 6 ) ).toBe(
			1
		);
	} );
} );
