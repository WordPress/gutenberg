/** @typedef {import('../types').AnyFunction} AnyFunction */

/**
 * Higher-order reducer creator which substitutes the action object before
 * passing to the original reducer.
 *
 * @param {AnyFunction} replacer Function mapping original action to replacement.
 *
 * @return {AnyFunction} Higher-order reducer.
 */
const replaceAction = ( replacer ) => ( reducer ) => ( state, action ) => {
	return reducer( state, replacer( action ) );
};

export default replaceAction;
