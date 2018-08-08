/**
 * External dependencies
 */
import deepFreeze from 'deep-freeze';

/**
 * Internal dependencies
 */
import { guides, tipInstanceIds, areTipsEnabled, dismissedTips } from '../reducer';

describe( 'reducer', () => {
	describe( 'guides', () => {
		it( 'should start out empty', () => {
			expect( guides( undefined, {} ) ).toEqual( [] );
		} );

		it( 'should add a guide when it is triggered', () => {
			const original = deepFreeze( [] );
			const state = guides( original, {
				type: 'TRIGGER_GUIDE',
				tipIds: [ 'test/tip-1', 'test/tip-2' ],
			} );
			expect( state ).toEqual( [
				[ 'test/tip-1', 'test/tip-2' ],
			] );
		} );
	} );

	describe( 'tipInstanceIds', () => {
		it( 'should start out empty', () => {
			expect( tipInstanceIds( undefined, {} ) ).toEqual( {} );
		} );

		it( 'should register an initial tip instance', () => {
			const original = deepFreeze( {} );
			const state = tipInstanceIds( original, {
				type: 'REGISTER_TIP_INSTANCE',
				tipId: 'test/tip-1',
				instanceId: 123,
			} );
			expect( state ).toEqual( {
				'test/tip-1': [ 123 ],
			} );
		} );

		it( 'should register an second tip instance', () => {
			const original = deepFreeze( {
				'test/tip-1': [ 123 ],
			} );
			const state = tipInstanceIds( original, {
				type: 'REGISTER_TIP_INSTANCE',
				tipId: 'test/tip-1',
				instanceId: 456,
			} );
			expect( state ).toEqual( {
				'test/tip-1': [ 123, 456 ],
			} );
		} );

		it( 'should not register duplicate tip instances', () => {
			const original = deepFreeze( {
				'test/tip-1': [ 123 ],
			} );
			const state = tipInstanceIds( original, {
				type: 'REGISTER_TIP_INSTANCE',
				tipId: 'test/tip-1',
				instanceId: 123,
			} );
			expect( state ).toEqual( {
				'test/tip-1': [ 123 ],
			} );
		} );

		it( 'should unregister a tip instance', () => {
			const original = deepFreeze( {
				'test/tip-1': [ 123, 456 ],
			} );
			const state = tipInstanceIds( original, {
				type: 'UNREGISTER_TIP_INSTANCE',
				tipId: 'test/tip-1',
				instanceId: 123,
			} );
			expect( state ).toEqual( {
				'test/tip-1': [ 456 ],
			} );
		} );
	} );

	describe( 'areTipsEnabled', () => {
		it( 'should default to true', () => {
			expect( areTipsEnabled( undefined, {} ) ).toBe( true );
		} );

		it( 'should flip when tips are disabled', () => {
			const state = areTipsEnabled( true, {
				type: 'DISABLE_TIPS',
			} );
			expect( state ).toBe( false );
		} );

		it( 'should flip when tips are enabled', () => {
			const state = areTipsEnabled( false, {
				type: 'ENABLE_TIPS',
			} );
			expect( state ).toBe( true );
		} );
	} );

	describe( 'dismissedTips', () => {
		it( 'should start out empty', () => {
			expect( dismissedTips( undefined, {} ) ).toEqual( {} );
		} );

		it( 'should mark tips as dismissed', () => {
			const original = deepFreeze( {} );
			const state = dismissedTips( original, {
				type: 'DISMISS_TIP',
				id: 'test/tip',
			} );
			expect( state ).toEqual( {
				'test/tip': true,
			} );
		} );

		it( 'should reset if tips are enabled', () => {
			const original = deepFreeze( {
				'test/tip': true,
			} );
			const state = dismissedTips( original, {
				type: 'ENABLE_TIPS',
			} );
			expect( state ).toEqual( {} );
		} );
	} );
} );
