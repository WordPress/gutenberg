/**
 * Internal dependencies
 */
import {
	togglePostTitleSelection,
	addLastBlockInserted,
	clearLastBlockInserted,
} from '../actions';

describe( 'actions native', () => {
	describe( 'togglePostTitleSelection', () => {
		it( 'should return the TOGGLE_POST_TITLE_SELECTION action', () => {
			const result = togglePostTitleSelection( true );
			expect( result ).toEqual( {
				type: 'TOGGLE_POST_TITLE_SELECTION',
				isSelected: true,
			} );
		} );
	} );

	describe( 'addLastBlockInserted', () => {
		it( 'should return the ADD_LAST_BLOCK_INSERTED action', () => {
			const clientId = 1;
			const result = addLastBlockInserted( clientId );
			expect( result ).toEqual( {
				type: 'ADD_LAST_BLOCK_INSERTED',
				clientId,
			} );
		} );
	} );

	describe( 'clearLastBlockInserted', () => {
		it( 'should return the CLEAR_LAST_BLOCK_INSERTED action', () => {
			const result = clearLastBlockInserted();
			expect( result ).toEqual( {
				type: 'CLEAR_LAST_BLOCK_INSERTED',
			} );
		} );
	} );
} );
