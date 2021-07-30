/**
 * Returns a function which, when invoked, will return the name of the
 * currently running hook, or `null` if no hook of the given type is currently
 * running.
 *
 * @param {import('.').Hooks}    hooks    Hooks instance.
 * @param {import('.').StoreKey} storeKey
 *
 * @return {() => string | null} Function that returns the current hook name or null.
 */
function createCurrentHook( hooks, storeKey ) {
	return function currentHook() {
		const hooksStore = hooks[ storeKey ];

		return (
			hooksStore.__current[ hooksStore.__current.length - 1 ]?.name ??
			null
		);
	};
}

export default createCurrentHook;
