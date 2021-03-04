/**
 * Internal dependencies
 */
import { postTitle, lastBlockInserted } from '../reducer';

describe( 'state native', () => {
	describe( 'postTitle', () => {
		describe( 'isSelected()', () => {
			it( 'should not be selected by default', () => {
				expect( postTitle( undefined, {} ).isSelected ).toBe( false );
			} );

			it( 'should return false if not selecting the post title', () => {
				const action = {
					type: 'TOGGLE_POST_TITLE_SELECTION',
					isSelected: false,
				};

				expect(
					postTitle( { isSelected: true }, action ).isSelected
				).toBe( false );
			} );

			it( 'should return true if selecting the post title', () => {
				const action = {
					type: 'TOGGLE_POST_TITLE_SELECTION',
					isSelected: true,
				};

				expect(
					postTitle( { isSelected: false }, action ).isSelected
				).toBe( true );
			} );
		} );

		describe( 'lastBlockInserted()', () => {
			it( 'should return client id of last block inserted', () => {
				const expectedClientId = 1;
				const action = {
					type: 'ADD_LAST_BLOCK_INSERTED',
					clientId: expectedClientId,
				};

				expect(
					lastBlockInserted( { clientId: expectedClientId }, action )
						.clientId
				).toBe( expectedClientId );
			} );

			it( 'should return empty state if last block has been cleared', () => {
				const action = {
					type: 'CLEAR_LAST_BLOCK_INSERTED',
				};

				expect( lastBlockInserted( {}, action ) ).toStrictEqual( {} );
			} );
		} );
	} );
} );
