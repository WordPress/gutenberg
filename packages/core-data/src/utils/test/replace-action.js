/**
 * Internal dependencies
 */
import replaceAction from '../replace-action';

describe( 'replaceAction', () => {
	function createEnhancedReducer( replacer ) {
		const enhanceReducer = replaceAction( replacer );
		return enhanceReducer(
			( state, action ) => 'Called by ' + action.after
		);
	}

	it( 'should replace the action passed to the reducer', () => {
		const reducer = createEnhancedReducer( ( action ) => ( {
			after: action.before,
		} ) );
		const state = reducer( undefined, { before: 'foo' } );

		expect( state ).toBe( 'Called by foo' );
	} );
} );
