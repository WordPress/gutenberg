import { reset, toggle, includeRange, resetRange } from '../block-selection';

const nothing = { selected: [ ], start: null, end: null };

const ordering = [ 'alpha', 'beta', 'gamma', 'delta', 'epsilon', 'rho', 'gnu' ];

describe( 'block-selection', () => {
	describe( 'reset', () => {
		it( 'Nothing >>> alpha', () => {
			const actual = reset( nothing, 'alpha' );
			expect( actual ).toEqual( { selected: [ ], start: 'alpha', end: null } );
		} );

		it( '(Beta -> ..) >>> alpha', () => {
			const actual = reset( { selected: [ ], start: 'beta', end: null }, 'alpha' );
			expect( actual ).toEqual( { selected: [ ], start: 'alpha', end: null } );
		} );

		it( '(Beta -> Gamma) >>> alpha', () => {
			const actual = reset( { selected: [ ], start: 'beta', end: 'gamma' }, 'alpha' );
			expect( actual ).toEqual( { selected: [ ], start: 'alpha', end: null } );
		} );

		it( '([ delta ], Beta -> Gamma) >>> alpha', () => {
			const actual = reset( { selected: [ 'delta' ], start: 'beta', end: 'gamma' }, 'alpha' );
			expect( actual ).toEqual( { selected: [ ], start: 'alpha', end: null } );
		} );
	} );

	describe( 'resetRange', () => {
		it( 'Nothing >>> (alpha -> gamma)', () => {
			const actual = resetRange( nothing, 'alpha', 'gamma' );
			expect( actual ).toEqual( { selected: [ ], start: 'alpha', end: 'gamma' } );
		} );

		it( '(Beta -> ..) >>> (alpha -> gamma)', () => {
			const actual = resetRange( { selected: [ ], start: 'beta', end: null }, 'alpha', 'gamma' );
			expect( actual ).toEqual( { selected: [ ], start: 'alpha', end: 'gamma' } );
		} );

		it( '(Beta -> Gamma) >>> alpha', () => {
			const actual = resetRange( { selected: [ ], start: 'beta', end: 'gamma' }, 'alpha', 'gamma' );
			expect( actual ).toEqual( { selected: [ ], start: 'alpha', end: 'gamma' } );
		} );

		it( '([ delta ], Beta -> Gamma) >>> alpha', () => {
			const actual = resetRange( { selected: [ 'delta' ], start: 'beta', end: 'gamma' }, 'alpha', 'gamma' );
			expect( actual ).toEqual( { selected: [ ], start: 'alpha', end: 'gamma' } );
		} );
	} );

	describe( 'toggle', () => {
		it( 'Nothing >>> alpha', () => {
			const actual = toggle( nothing, 'alpha', ordering );
			expect( actual ).toEqual( { selected: [ ], start: 'alpha', end: 'alpha' } );
		} );

		it( 'Include a selection when only a start value', () => {
			const current = {
				selected: [ ],
				start: 'alpha',
				end: null,
			};
			const actual = toggle( current, 'beta', ordering );
			expect( actual ).toEqual( { selected: [ 'alpha' ], start: 'beta', end: 'beta' } );
		} );

		it( 'Exclude a selection when only a start value (cannot do)', () => {
			const current = {
				selected: [ ],
				start: 'alpha',
				end: null,
			};
			const actual = toggle( current, 'alpha', ordering );
			expect( actual ).toEqual( { selected: [ ], start: 'alpha', end: null } );
		} );

		it( 'Add to selection when no start value, but a selected array', () => {
			const current = { selected: [ 'alpha' ], start: null, end: null };
			const actual = toggle( current, 'beta', ordering );
			expect( actual ).toEqual( { selected: [ 'alpha' ], start: 'beta', end: 'beta' } );
		} );

		it( 'Add to selection when no selected, but a start->end range', () => {
			const current = { selected: [ ], start: 'alpha', end: 'gamma' };
			const actual = toggle( current, 'epsilon', ordering );
			expect( actual ).toEqual( { selected: [ 'alpha', 'beta', 'gamma' ], start: 'epsilon', end: 'epsilon' } );
		} );

		it( 'Add to selection selected AND a start->end range', () => {
			const current = { selected: [ 'alpha' ], start: 'beta', end: 'delta' };
			const actual = toggle( current, 'epsilon', ordering );
			expect( actual ).toEqual( { selected: [ 'alpha', 'beta', 'gamma', 'delta' ], start: 'epsilon', end: 'epsilon' } );
		} );

		it( 'Toggle off selection something that is already within the range', () => {
			const current = { selected: [ 'alpha' ], start: 'beta', end: 'delta' };
			const actual = toggle( current, 'gamma', ordering );
			expect( actual ).toEqual( { selected: [ 'alpha', 'delta' ], start: 'beta', end: 'beta' } );
		} );

		it( 'Toggle off selection something that is in selected', () => {
			const current = { selected: [ 'alpha' ], start: 'beta', end: 'delta' };
			const actual = toggle( current, 'alpha', ordering );
			expect( actual ).toEqual( { selected: [ 'gamma', 'delta' ], start: 'beta', end: 'beta' } );
		} );

		it( 'Toggle off selection something that is the start', () => {
			const current = { selected: [ 'alpha' ], start: 'beta', end: 'delta' };
			const actual = toggle( current, 'beta', ordering );
			expect( actual ).toEqual( { selected: [ 'alpha', 'gamma' ], start: 'delta', end: 'delta' } );
		} );
	} );

	describe( 'includeRange', () => {
		it( 'Nothing >>> (alpha, alpha)', () => {
			const actual = includeRange( nothing, 'alpha', 'alpha', ordering );
			expect( actual ).toEqual( { selected: [ ], start: 'alpha', end: 'alpha' } );
		} );

		it( 'Add a ranged selection that does not overlap with the current selection', () => {
			const current = { selected: [ ], start: 'alpha', end: 'gamma' };
			const actual = includeRange( current, 'delta', 'rho', ordering );
			expect( actual ).toEqual( { selected: [ 'alpha', 'beta', 'gamma' ], start: 'delta', end: 'rho' } );
		} );

		it( 'Add a ranged selection that overlaps with some of the selected', () => {
			const current = { selected: [ 'epsilon' ], start: 'alpha', end: 'gamma' };
			const actual = includeRange( current, 'delta', 'rho', ordering );
			expect( actual ).toEqual( { selected: [ 'alpha', 'beta', 'gamma' ], start: 'delta', end: 'rho' } );
		} );

		it( 'Add a ranged selection that overlaps with all of the range', () => {
			const current = { selected: [ 'epsilon' ], start: 'alpha', end: 'gamma' };
			const actual = includeRange( current, 'alpha', 'gamma', ordering );
			expect( actual ).toEqual( { selected: [ 'epsilon' ], start: 'alpha', end: 'gamma' } );
		} );

		it( 'Add a ranged selection that overlaps with some of the range', () => {
			const current = { selected: [ 'epsilon' ], start: 'alpha', end: 'gamma' };
			const actual = includeRange( current, 'beta', 'delta', ordering );
			expect( actual ).toEqual( { selected: [ 'alpha', 'epsilon' ], start: 'beta', end: 'delta' } );
		} );

		it( 'Add a ranged selection that overlaps with all of the range (plus more)', () => {
			const current = { selected: [ ], start: 'alpha', end: 'gamma' };
			const actual = includeRange( current, 'alpha', 'delta', ordering );
			expect( actual ).toEqual( { selected: [ ], start: 'alpha', end: 'delta' } );
		} );
	} );
} );
