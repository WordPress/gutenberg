import { describe, expect, it } from 'vitest';
import {
	applyLockSelection,
	getLockAttributes,
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

		it( 'keeps the saved value of a mixed feature', () => {
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

		it( 'leaves out a mixed feature that is not saved', () => {
			expect(
				applyLockSelection( { move: null, remove: true }, {} )
			).toEqual( { remove: true } );
			expect(
				applyLockSelection( { move: null, remove: true } )
			).toEqual( { remove: true } );
		} );

		it( 'returns undefined when no feature is set', () => {
			expect(
				applyLockSelection( { move: null, remove: null } )
			).toBeUndefined();
		} );

		it( 'applies the chosen edit feature', () => {
			expect(
				applyLockSelection(
					{ move: false, remove: false, edit: true },
					{ move: false, remove: false, edit: false }
				)
			).toEqual( { move: false, remove: false, edit: true } );
		} );

		it( 'keeps the saved edit value when it is not offered', () => {
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

	describe( 'getLockAttributes', () => {
		const lockAll = { move: true, remove: true };

		it( 'gives no template lock to a block that does not support it', () => {
			expect(
				getLockAttributes(
					{ supportsTemplateLock: false },
					lockAll,
					true
				)
			).toEqual( { lock: lockAll } );
		} );

		it( 'applies the template lock when chosen', () => {
			expect(
				getLockAttributes(
					{ supportsTemplateLock: true },
					lockAll,
					true
				)
			).toEqual( { lock: lockAll, templateLock: 'all' } );
		} );

		it( 'removes the template lock when chosen', () => {
			expect(
				getLockAttributes(
					{ supportsTemplateLock: true, templateLock: 'all' },
					lockAll,
					false
				)
			).toEqual( { lock: lockAll, templateLock: undefined } );
		} );

		it( 'updates an untouched template lock to match a changed lock', () => {
			expect(
				getLockAttributes(
					{ supportsTemplateLock: true, templateLock: 'all' },
					{ move: false, remove: true },
					null
				)
			).toEqual( {
				lock: { move: false, remove: true },
				templateLock: 'insert',
			} );
		} );

		it( 'keeps an untouched template lock when the lock is unchanged', () => {
			expect(
				getLockAttributes(
					{
						lock: lockAll,
						supportsTemplateLock: true,
						templateLock: 'insert',
					},
					lockAll,
					null
				)
			).toEqual( { lock: lockAll } );
		} );

		it( 'keeps an untouched contentOnly template lock', () => {
			expect(
				getLockAttributes(
					{ supportsTemplateLock: true, templateLock: 'contentOnly' },
					lockAll,
					null
				)
			).toEqual( { lock: lockAll } );
		} );

		it( 'does not add a template lock when untouched and unset', () => {
			expect(
				getLockAttributes(
					{ supportsTemplateLock: true },
					lockAll,
					null
				)
			).toEqual( { lock: lockAll } );
		} );
	} );
} );
