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
const createRunHook = function( hooks, returnFirstArg ) {
	/**
	 * Runs all callbacks for the specified hook.
	 *
	 * @param  {string} hookName The name of the hook to run.
	 * @param  {...*}   args     Arguments to pass to the hook callbacks.
	 *
	 * @return {*}               Return value of runner, if applicable.
	 */
	return function runHooks( hookName, ...args ) {
		const handlers = hooks[ hookName ];
		let maybeReturnValue = args[ 0 ];

		if ( ! handlers ) {
			return ( returnFirstArg ? maybeReturnValue : undefined );
		}

		hooks.current = hookName;
		handlers.runs = ( handlers.runs || 0 ) + 1;

		handlers.forEach( handler => {
			maybeReturnValue = handler.callback.apply( null, args );
			if ( returnFirstArg ) {
				args[ 0 ] = maybeReturnValue;
			}
		} );

		delete hooks.current;

		if ( returnFirstArg ) {
			return maybeReturnValue;
		}
	};
}

export default createRunHook;
