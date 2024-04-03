/**
 * Creates a memoized selector that caches the computed values according to the array of "dependants"
 * and the selector parameters, and recomputes the values only when any of them changes.
 *
 * @see The documentation for the `rememo` package from which the `createSelector` function is reexported.
 *
 * @param {Function} selector      Selector function that calculates a value from state and parameters.
 * @param {Function} getDependants Function that returns an array of "dependant" objects.
 * @return {Function} A memoized version of `selector` that caches the calculated return values.
 */
export { default as createSelector } from 'rememo';
