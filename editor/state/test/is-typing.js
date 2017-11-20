/**
 * Internal dependencies
 */
import reducer, {
	startTyping,
	stopTyping,
	isTyping,
} from '../is-typing';

describe( 'isTyping', () => {
	describe( 'reducer', () => {
		it( 'should set the typing flag to true', () => {
			const state = reducer( false, {
				type: 'START_TYPING',
			} );

			expect( state ).toBe( true );
		} );

		it( 'should set the typing flag to false', () => {
			const state = reducer( false, {
				type: 'STOP_TYPING',
			} );

			expect( state ).toBe( false );
		} );
	} );

	describe( 'action creators', () => {
		describe( 'startTyping', () => {
			it( 'should return the START_TYPING action', () => {
				expect( startTyping() ).toEqual( {
					type: 'START_TYPING',
				} );
			} );
		} );

		describe( 'stopTyping', () => {
			it( 'should return the STOP_TYPING action', () => {
				expect( stopTyping() ).toEqual( {
					type: 'STOP_TYPING',
				} );
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'isTyping', () => {
			it( 'should return the isTyping flag if the block is selected', () => {
				const state = {
					isTyping: true,
				};

				expect( isTyping( state ) ).toBe( true );
			} );

			it( 'should return false if the block is not selected', () => {
				const state = {
					isTyping: false,
				};

				expect( isTyping( state ) ).toBe( false );
			} );
		} );
	} );
} );
