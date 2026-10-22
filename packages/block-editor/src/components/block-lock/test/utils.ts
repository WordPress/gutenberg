import { describe, expect, it } from 'vitest';
import {
	applyLockSelection,
	getSharedLockValue,
	getTemplateLockValue,
} from '../utils';

describe( 'block-lock utils', () => {
	describe( 'getTemplateLockValue', () => {
		it( 'returns "all" when movement and removal are locked', () => {
			expect( getTemplateLockValue( { move: true, remove: true } ) ).toBe(
				'all'
			);
		} );

		it( 'returns "insert" when only removal is locked', () => {
			expect(
				getTemplateLockValue( { move: false, remove: true } )
			).toBe( 'insert' );
		} );

		it( 'returns false when removal is not locked', () => {
			expect(
				getTemplateLockValue( { move: true, remove: false } )
			).toBe( false );
			expect(
				getTemplateLockValue( { move: false, remove: false } )
			).toBe( false );
		} );
	} );

	describe( 'getSharedLockValue', () => {
		it( 'returns true when every value is true', () => {
			expect( getSharedLockValue( [ true ] ) ).toBe( true );
			expect( getSharedLockValue( [ true, true ] ) ).toBe( true );
		} );

		it( 'returns false when there are no values', () => {
			expect( getSharedLockValue( [] ) ).toBe( false );
		} );

		it( 'returns false when no value is true', () => {
			expect( getSharedLockValue( [ false ] ) ).toBe( false );
			expect( getSharedLockValue( [ false, false ] ) ).toBe( false );
		} );

		it( 'returns null when the values differ', () => {
			expect( getSharedLockValue( [ true, false ] ) ).toBeNull();
			expect( getSharedLockValue( [ false, false, true ] ) ).toBeNull();
		} );
	} );

	describe( 'applyLockSelection', () => {
		it( 'applies the chosen features', () => {
			expect(
				applyLockSelection(
					{ move: true, remove: false },
					{ move: false, remove: true }
				)
			).toEqual( { move: true, remove: false } );
		} );

		it( 'keeps the current value of a mixed feature', () => {
			const selection = { move: null, remove: true };

			expect(
				applyLockSelection( selection, { move: true, remove: false } )
			).toEqual( { move: true, remove: true } );
			expect(
				applyLockSelection( selection, {
					move: false,
					remove: false,
				} )
			).toEqual( { move: false, remove: true } );
		} );

		it( 'treats an unset current value as unlocked', () => {
			expect(
				applyLockSelection( { move: null, remove: null }, {} )
			).toEqual( { move: false, remove: false } );
		} );

		it( 'applies the chosen edit feature', () => {
			expect(
				applyLockSelection(
					{ move: false, remove: false, edit: true },
					{ move: false, remove: false, edit: false }
				)
			).toEqual( { move: false, remove: false, edit: true } );
		} );

		it( 'keeps the current edit value when it is not offered', () => {
			expect(
				applyLockSelection(
					{ move: true, remove: true },
					{ move: false, remove: false, edit: true }
				)
			).toEqual( { move: true, remove: true, edit: true } );
		} );

		it( 'leaves out the edit feature when it is unset', () => {
			expect(
				applyLockSelection(
					{ move: true, remove: true },
					{ move: false, remove: false }
				)
			).toEqual( { move: true, remove: true } );
		} );
	} );
} );
