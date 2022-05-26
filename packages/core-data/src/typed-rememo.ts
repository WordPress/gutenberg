/**
 * External dependencies
 */
import originalCreateSelector from 'rememo';

/**
 * The same as the original rememo createSelector, only with a more complete
 * TypeScript signature. A fix has been proposed in the following pull request:
 * https://github.com/aduth/rememo/pull/7
 * Once it's merged, this file can be safely removed.
 *
 * And here's the original documentation:
 *
 * Returns a memoized selector function. The getDependants function argument is
 * called before the memoized selector and is expected to return an immutable
 * reference or array of references on which the selector depends for computing
 * its own return value. The memoize cache is preserved only as long as those
 * dependant references remain the same. If getDependants returns a different
 * reference(s), the cache is cleared and the selector value regenerated.
 *
 * @param  selector      Selector function.
 * @param  getDependants Dependant getter returning an array of
 *                       references used in cache bust consideration.
 * @return Memoized selector function.
 */
export default function createSelector< T extends ( ...args: any[] ) => any >(
	selector: T,
	getDependants: ( ...args: any[] ) => any
): T {
	return originalCreateSelector( selector, getDependants ) as T;
}
