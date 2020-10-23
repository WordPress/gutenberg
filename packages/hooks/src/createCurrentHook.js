/**
 * Returns a function which, when invoked, will return the name of the
 * currently running hook, or `null` if no hook of the given type is currently
 * running.
 *
 * @param  {import('.').Hooks}   hooks          Stored hooks, keyed by hook name.
 *
 * @return {() => string | null}     Function that returns the current hook name or null.
 */
function createCurrentHook( hooks ) {
	return function currentHook() {
		return hooks.__current[ hooks.__current.length - 1 ]?.name ?? null;
	};
}

export default createCurrentHook;
