/**
 * Internal dependencies
 */
import useSelect from '../use-select';

/**
 * A shorthand notation for useSelect() that returns all the selectors from a given store.
 *
 * @param {string}   storeKey    Store to return selectors from.
 * @param {Function} _mapSelect  Function called on every state change. The
 *                               returned value is exposed to the component
 *                               implementing this hook. The function receives
 *                               the `registry.select` method on the first
 *                               argument and the `registry` on the second
 *                               argument.
 * @param {Array}    deps        If provided, this memoizes the mapSelect so the
 *                               same `mapSelect` is invoked on every state
 *                               change unless the dependencies change.
 *
 * @see useSelect
 * @return {Function}  A custom react hook.
 */
export default function useStoreSelectors( storeKey, _mapSelect, deps = [] ) {
	return useSelect( ( select ) => _mapSelect( select( storeKey ) ), deps );
}
