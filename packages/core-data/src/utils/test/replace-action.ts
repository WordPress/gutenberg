import { describe, expect, it } from 'vitest';
import replaceAction from '../replace-action';

type Action = { before: string };
type ReplacedAction = { after: string };

describe( 'replaceAction', () => {
	function createEnhancedReducer(
		replacer: ( action: Action ) => ReplacedAction
	) {
		const enhanceReducer = replaceAction( replacer );
		return enhanceReducer(
			( state: string | undefined, action: ReplacedAction ) =>
				'Called by ' + action.after
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
