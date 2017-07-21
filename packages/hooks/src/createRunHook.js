/**
 * Returns a function which, when invoked, will execute all callbacks
 * registered to a hook of the specified type, optionally returning the final
 * value of the call chain.
 *
 * @param  {Object}   hooks          Stored hooks, keyed by hook name.
 * @param  {?bool}    returnFirstArg Whether each hook callback is expected to
 *                                   return its first argument.
 *
 * @return {Function}                Function that runs hook callbacks.
 */
function createRunHook( hooks, returnFirstArg ) {
	/**
	 * Runs all callbacks for the specified hook.
	 *
	 * @param  {string} hookName The name of the hook to run.
	 * @param  {...*}   args     Arguments to pass to the hook callbacks.
	 *
	 * @return {*}               Return value of runner, if applicable.
	 */
	return function runHooks( hookName, ...args ) {
		if ( ! hooks.hasOwnProperty( hookName ) ) {
			hooks[ hookName ] = {
				runs: 0,
				handlers: [],
			};
		}

		const handlers = hooks[ hookName ].handlers;

		if ( ! handlers.length ) {
			return returnFirstArg
				? args[ 0 ]
				: undefined;
		}

		hooks.__current = hooks.__current || [];
		hooks.__current.push( hookName );
		hooks[ hookName ].runs++;

		let maybeReturnValue = args[ 0 ];

		handlers.forEach( handler => {
			if ( handler.callback !== hooks.currentCallback ) {

				// Prevent hook recursion.
				hooks.currentCallback = handler.callback;
				maybeReturnValue = handler.callback.apply( null, args );
				hooks.currentCallback = false;

				if ( returnFirstArg ) {
					args[ 0 ] = maybeReturnValue;
				}
			}
		} );

		hooks.__current.pop();

		if ( returnFirstArg ) {
			return maybeReturnValue;
		} else {
			return false;
		}
	};
}

export default createRunHook;
