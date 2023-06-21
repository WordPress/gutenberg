declare module 'rememo' {
	/**
	 * Returns a memoized selector function. The getDependants function argument is
	 * called before the memoized selector and is expected to return an immutable
	 * reference or array of references on which the selector depends for computing
	 * its own return value. The memoize cache is preserved only as long as those
	 * dependant references remain the same. If getDependants returns a different
	 * reference(s), the cache is cleared and the selector value regenerated.
	 *
	 * @template {(...args: *[]) => *} S
	 *
	 * @param {S} selector Selector function.
	 * @param {GetDependants=} getDependants Dependant getter returning an array of
	 * references used in cache bust consideration.
	 */
	export default function _default<S extends (...args: any[]) => any>(
		selector: S,
		getDependants?: GetDependants | undefined
	): S & EnhancedSelector;
	export type GetDependants = (...args: any[]) => any[];
	export type Clear = () => void;
	export type EnhancedSelector = {
		getDependants: GetDependants;
		clear: Clear;
	};
	export type Cache = {
		/**
		 * Function to clear cache.
		 */
		clear: Clear;
		/**
		 * Whether dependants are valid in
		 * considering cache uniqueness. A cache is unique if dependents are all arrays
		 * or objects.
		 */
		isUniqueByDependants?: boolean | undefined;
		/**
		 * Cache map.
		 */
		map: Map<any, any>;
		/**
		 * Dependants from previous invocation.
		 */
		lastDependants?: any[] | undefined;
	};
}
