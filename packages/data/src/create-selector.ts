/**
 * External dependencies
 */
import memoize from 'rememo';

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
 */
export const createSelector: < S extends ( ...args: any[] ) => any >(
	selector: S,
	getDependants?: GetDependants
) => S & EnhancedSelector = memoize;
