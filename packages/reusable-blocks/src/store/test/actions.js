/**
 * Internal dependencies
 */
import { __experimentalSetEditingReusableBlock } from '../actions';

describe( 'Actions', () => {
	describe( '__experimentalSetEditingReusableBlock', () => {
		it( 'should return the SET_EDITING_REUSABLE_BLOCK action', () => {
			const result = __experimentalSetEditingReusableBlock( 3, true );
			expect( result ).toEqual( {
				type: 'SET_EDITING_REUSABLE_BLOCK',
				clientId: 3,
				isEditing: true,
			} );
		} );
	} );
} );
