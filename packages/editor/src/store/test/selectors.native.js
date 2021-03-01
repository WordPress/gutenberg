/**
 * Internal dependencies
 */
import { isPostTitleSelected, wasBlockJustInserted } from '../selectors';

describe( 'selectors native', () => {
	describe( 'isPostTitleSelected', () => {
		it( 'should return true if the post title is selected', () => {
			const state = {
				postTitle: {
					isSelected: true,
				},
			};

			expect( isPostTitleSelected( state ) ).toBe( true );
		} );

		it( 'should return false if the post title is not selected', () => {
			const state = {
				postTitle: {
					isSelected: false,
				},
			};

			expect( isPostTitleSelected( state ) ).toBe( false );
		} );
	} );

	describe( 'wasBlockJustInserted', () => {
		it( 'should return true if the client id passed to wasBlockJustInserted is found within the state', () => {
			const expectedClientId = 111;
			const state = {
				lastBlockInserted: {
					clientId: expectedClientId,
				},
			};

			expect( wasBlockJustInserted( state, expectedClientId ) ).toBe(
				true
			);
		} );

		it( 'should return false if the client id passed to wasBlockJustInserted is not found within the state', () => {
			const expectedClientId = 111;
			const unexpectedClientId = 110;
			const state = {
				lastBlockInserted: {
					clientId: unexpectedClientId,
				},
			};

			expect( wasBlockJustInserted( state, expectedClientId ) ).toBe(
				false
			);
		} );
	} );
} );
