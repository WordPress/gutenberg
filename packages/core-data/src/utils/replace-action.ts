import type { Reducer } from './types';

/**
 * Higher-order reducer creator which substitutes the action object before
 * passing to the original reducer.
 *
 * @param replacer Function mapping original action to replacement.
 *
 * @return Higher-order reducer.
 */
const replaceAction =
	< A, R >( replacer: ( action: A ) => R ) =>
	< S >( reducer: Reducer< S, R > ): Reducer< S, A > =>
	( state, action ) => {
		return reducer( state, replacer( action ) );
	};

export default replaceAction;
