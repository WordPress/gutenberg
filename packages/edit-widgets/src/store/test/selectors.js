/**
 * Internal dependencies
 */

import { __unstableIsFeatureActive } from '../selectors';

describe( 'selectors', () => {
	describe( '__unstableIsFeatureActive', () => {
		it( 'should return the feature value when present', () => {
			const state = {
				preferences: {
					features: { isNightVisionActivated: true },
				},
			};
			expect(
				__unstableIsFeatureActive( state, 'isNightVisionActivated' )
			).toBe( true );
		} );

		it( 'should return false where feature is not found', () => {
			const state = {
				preferences: {},
			};
			expect(
				__unstableIsFeatureActive( state, 'didILeaveTheOvenOn' )
			).toBe( false );
		} );
	} );
} );
