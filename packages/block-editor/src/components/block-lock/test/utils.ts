import { describe, expect, it } from 'vitest';
import { getSharedLockValue, getTemplateLockValue } from '../utils';

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
} );
