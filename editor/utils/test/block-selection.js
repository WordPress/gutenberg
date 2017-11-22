import { resetSelection } from '../block-selection';

describe( 'block-selection', () => {
	describe( 'reset', () => {
		it( 'resetSelection sets alpha', () => {
			const actual = resetSelection( { selected: [ ], start: null, end: null }, 'alpha' );
			expect( actual ).toEqual( { selected: [ ], start: 'alpha', end: null } );
		} );

		it( 'resetSelection changes beta to alpha', () => {
			const actual = resetSelection( { selected: [ ], start: 'beta', end: null }, 'alpha' );
			expect( actual ).toEqual( { selected: [ ], start: 'alpha', end: null } );
		} );

		it( 'resetSelection changes beta to alpha and clears end', () => {
			const actual = resetSelection( { selected: [ ], start: 'beta', end: 'gamma' }, 'alpha' );
			expect( actual ).toEqual( { selected: [ ], start: 'alpha', end: null } );
		} );

		it( 'resetSelection changes beta to alpha and clears selected, end', () => {
			const actual = resetSelection( { selected: [ 'delta' ], start: 'beta', end: 'gamma' }, 'alpha' );
			expect( actual ).toEqual( { selected: [ ], start: 'alpha', end: null } );
		} );
	} );
} );
