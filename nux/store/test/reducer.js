/**
 * Internal dependencies
 */
import { guides, areTipsDisabled, dismissedTips } from '../reducer';

describe( 'reducer', () => {
	describe( 'guides', () => {
		it( 'should start out empty', () => {
			expect( guides( undefined, {} ) ).toEqual( [] );
		} );

		it( 'should add a guide when it is triggered', () => {
			const state = guides( [], {
				type: 'TRIGGER_GUIDE',
				tipIDs: [ 'test/tip-1', 'test/tip-2' ],
			} );
			expect( state ).toEqual( [
				[ 'test/tip-1', 'test/tip-2' ],
			] );
		} );
	} );

	describe( 'areTipsDisabled', () => {
		it( 'should default to false', () => {
			expect( areTipsDisabled( undefined, {} ) ).toBe( false );
		} );

		it( 'should flip when tips are disabled', () => {
			const state = areTipsDisabled( false, {
				type: 'DISABLE_TIPS',
			} );
			expect( state ).toBe( true );
		} );
	} );

	describe( 'dismissedTips', () => {
		it( 'should start out empty', () => {
			expect( dismissedTips( undefined, {} ) ).toEqual( {} );
		} );

		it( 'should mark tips as dismissed', () => {
			const state = dismissedTips( {}, {
				type: 'DISMISS_TIP',
				id: 'test/tip',
			} );
			expect( state ).toEqual( {
				'test/tip': true,
			} );
		} );
	} );
} );
