import memoize from 'rememo';
import { toRaw, untrack } from './utils/track-state';

/**
 * Returns the array of immutable references on which a memoized selector
 * depends for computing its result. The memoize cache is preserved only as
 * long as those dependant references remain the same.
 */
export type GetDependants = ( ...args: any[] ) => any[];

/**
 * The memoization methods a selector returned by `createSelector` is
 * enhanced with.
 */
export interface EnhancedSelector {
	getDependants: GetDependants;

	/**
	 * Clears the memoization cache.
	 */
	clear: () => void;
}

/*
 * The signature mirrors `rememo`'s, but is declared here so that consumers'
 * emitted declarations reference `@wordpress/data` rather than `rememo`,
 * which they do not declare as a dependency.
 */

/**
 * Creates a memoized selector that caches the computed values according to the array of "dependants"
 * and the selector parameters, and recomputes the values only when any of them changes.
 *
 * See The documentation for the `rememo` package from which the `createSelector` function is reexported.
 *
 * @param selector      Selector function.
 * @param getDependants Returns the state values the selector depends on.
 * @return Memoized selector.
 */
export const createSelector = < S extends ( ...args: any[] ) => any >(
	selector: S,
	getDependants?: GetDependants
): S & EnhancedSelector =>
	// The dependants declare what the selector depends on, so they are
	// read through the tracking proxy and the body gets the plain state.
	// Dependants are compared by reference, so the proxies are stripped.
	memoize(
		( ( state: any, ...args: any[] ) =>
			selector( toRaw( state ), ...args ) ) as S,
		( ...args: any[] ) =>
			( getDependants ? getDependants( ...args ) : [ args[ 0 ] ] ).map(
				untrack
			)
	);
