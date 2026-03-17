/**
 * Creates a memoized selector that caches the computed values according to the array of "dependants"
 * and the selector parameters, and recomputes the values only when any of them changes.
 *
 * @see The documentation for the `rememo` package from which the `createSelector` function is reexported.
 */
export { default as createSelector } from 'rememo';
