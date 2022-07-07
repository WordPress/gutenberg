/** @typedef {import('../types').AnyFunction} AnyFunction */

/**
 * A higher-order reducer creator which invokes the original reducer only if
 * the dispatching action matches the given predicate, **OR** if state is
 * initializing (undefined).
 *
 * @param {AnyFunction} isMatch Function predicate for allowing reducer call.
 *
 * @return {AnyFunction} Higher-order reducer.
 */
const ifMatchingAction = ( isMatch ) => ( reducer ) => ( state, action ) => {
	if ( state === undefined || isMatch( action ) ) {
		return reducer( state, action );
	}

	return state;
};

export default ifMatchingAction;
