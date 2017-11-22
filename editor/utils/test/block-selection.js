import { reset, toggle } from '../block-selection';

const nothing = { selected: [ ], start: null, end: null };

const ordering = [ 'alpha', 'beta', 'gamma', 'delta', 'epsilon', 'rho' ];

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

	describe( 'toggle', () => {
		it( 'Nothing >>> alpha', () => {
			const actual = toggle( nothing, 'alpha', ordering );
			expect( actual ).toEqual( { selected: [ ], start: 'alpha', end: null } );
		} );

		it( 'Include a selection when only a start value', () => {
			const current = {
				selected: [ ],
				start: 'alpha',
				end: null,
			};
			const actual = toggle( current, 'beta', ordering );
			expect( actual ).toEqual( { selected: [ 'alpha' ], start: 'beta', end: null } );
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
			expect( actual ).toEqual( { selected: [ 'alpha' ], start: 'beta', end: null } );
		} );

		it( 'Add to selection when no selected, but a start->end range', () => {
			const current = { selected: [ ], start: 'alpha', end: 'gamma' };
			const actual = toggle( current, 'epsilon', ordering );
			expect( actual ).toEqual( { selected: [ 'alpha', 'beta', 'gamma' ], start: 'epsilon', end: null } );
		} );

		it( 'Add to selection selected AND a start->end range', () => {
			const current = { selected: [ 'alpha' ], start: 'beta', end: 'delta' };
			const actual = toggle( current, 'epsilon', ordering );
			expect( actual ).toEqual( { selected: [ 'alpha', 'beta', 'gamma', 'delta' ], start: 'epsilon', end: null } );
		} );

		it( 'Toggle off selection something that is already within the range', () => {
			const current = { selected: [ 'alpha' ], start: 'beta', end: 'delta' };
			const actual = toggle( current, 'gamma', ordering );
			expect( actual ).toEqual( { selected: [ 'alpha', 'delta' ], start: 'beta', end: null } );
		} );
	} );
} );
