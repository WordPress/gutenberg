/**
 * Internal dependencies
 */
import { getAssociatedGuide, isTipVisible, areTipsEnabled } from '../selectors';

describe( 'selectors', () => {
	describe( 'getAssociatedGuide', () => {
		const state = {
			guides: [
				[ 'test/tip-1', 'test/tip-2', 'test/tip-3' ],
				[ 'test/tip-a', 'test/tip-b', 'test/tip-c' ],
				[ 'test/tip-α', 'test/tip-β', 'test/tip-γ' ],
			],
			tipInstanceIds: {},
			preferences: {
				dismissedTips: {
					'test/tip-1': true,
					'test/tip-a': true,
					'test/tip-b': true,
					'test/tip-α': true,
					'test/tip-β': true,
					'test/tip-γ': true,
				},
			},
		};

		it( 'should return null when there is no associated guide', () => {
			expect( getAssociatedGuide( state, 'test/unknown' ) ).toBeNull();
		} );

		it( 'should return the associated guide', () => {
			expect( getAssociatedGuide( state, 'test/tip-2' ) ).toEqual( {
				tipIds: [ 'test/tip-1', 'test/tip-2', 'test/tip-3' ],
				currentTipId: 'test/tip-2',
				nextTipId: 'test/tip-3',
			} );
		} );

		it( 'should indicate when there is no next tip', () => {
			expect( getAssociatedGuide( state, 'test/tip-b' ) ).toEqual( {
				tipIds: [ 'test/tip-a', 'test/tip-b', 'test/tip-c' ],
				currentTipId: 'test/tip-c',
				nextTipId: null,
			} );
		} );

		it( 'should indicate when there is no current or next tip', () => {
			expect( getAssociatedGuide( state, 'test/tip-β' ) ).toEqual( {
				tipIds: [ 'test/tip-α', 'test/tip-β', 'test/tip-γ' ],
				currentTipId: null,
				nextTipId: null,
			} );
		} );
	} );

	describe( 'isTipVisible', () => {
		it( 'should return true by default', () => {
			const state = {
				guides: [],
				tipInstanceIds: {},
				preferences: {
					areTipsEnabled: true,
					dismissedTips: {},
				},
			};
			expect( isTipVisible( state, 'test/tip' ) ).toBe( true );
		} );

		it( 'should return false if tips are disabled', () => {
			const state = {
				guides: [],
				tipInstanceIds: {},
				preferences: {
					areTipsEnabled: false,
					dismissedTips: {},
				},
			};
			expect( isTipVisible( state, 'test/tip' ) ).toBe( false );
		} );

		it( 'should return false if the tip is dismissed', () => {
			const state = {
				guides: [],
				tipInstanceIds: {},
				preferences: {
					areTipsEnabled: true,
					dismissedTips: {
						'test/tip': true,
					},
				},
			};
			expect( isTipVisible( state, 'test/tip' ) ).toBe( false );
		} );

		it( 'should return false if the tip is in a guide and it is not the current tip', () => {
			const state = {
				guides: [
					[ 'test/tip-1', 'test/tip-2', 'test/tip-3' ],
				],
				tipInstanceIds: {},
				preferences: {
					areTipsEnabled: true,
					dismissedTips: {},
				},
			};
			expect( isTipVisible( state, 'test/tip-2' ) ).toBe( false );
		} );

		it( 'should return true if an instanceId that was registered first is provided', () => {
			const state = {
				guides: [],
				tipInstanceIds: {
					'test/tip': [ 123, 456 ],
				},
				preferences: {
					areTipsEnabled: true,
					dismissedTips: {},
				},
			};
			expect( isTipVisible( state, 'test/tip', 123 ) ).toBe( true );
		} );

		it( 'should return false if an instanceId that was NOT registered is provided', () => {
			const state = {
				guides: [],
				tipInstanceIds: {},
				preferences: {
					areTipsEnabled: true,
					dismissedTips: {},
				},
			};
			expect( isTipVisible( state, 'test/tip', 123 ) ).toBe( false );
		} );

		it( 'should return false if an instanceId that was NOT registered first is provided', () => {
			const state = {
				guides: [],
				tipInstanceIds: {
					'test/tip': [ 123, 456 ],
				},
				preferences: {
					areTipsEnabled: true,
					dismissedTips: {},
				},
			};
			expect( isTipVisible( state, 'test/tip', 456 ) ).toBe( false );
		} );
	} );

	describe( 'areTipsEnabled', () => {
		it( 'should return true if tips are enabled', () => {
			const state = {
				guides: [],
				tipInstanceIds: {},
				preferences: {
					areTipsEnabled: true,
					dismissedTips: {},
				},
			};
			expect( areTipsEnabled( state ) ).toBe( true );
		} );

		it( 'should return false if tips are disabled', () => {
			const state = {
				guides: [],
				tipInstanceIds: {},
				preferences: {
					areTipsEnabled: false,
					dismissedTips: {},
				},
			};
			expect( areTipsEnabled( state ) ).toBe( false );
		} );
	} );
} );
