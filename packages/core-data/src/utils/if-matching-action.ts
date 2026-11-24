import type { Reducer } from './types';

/**
 * A higher-order reducer creator which invokes the original reducer only if
 * the dispatching action matches the given predicate, **OR** if state is
 * initializing (undefined).
 *
 * @param isMatch Function predicate for allowing reducer call.
 *
 * @return Higher-order reducer.
 */
const ifMatchingAction =
	< A >( isMatch: ( action: A ) => unknown ) =>
	< S >( reducer: Reducer< S, A > ): Reducer< S, A > =>
	( state, action ) => {
		if ( state === undefined || isMatch( action ) ) {
			return reducer( state, action );
		}

		return state;
	};

export default ifMatchingAction;
