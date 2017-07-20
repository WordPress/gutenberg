/**
 * Returns a function which, when invoked, will execute all registered
 * hooks of the specified type by calling upon runner with its hook name
 * and arguments.
 *
 * @param  {Function} hooks          Object that contains the hooks to run.
 * @param  {bool}     returnFirstArg Whether each hook callback is expected to
 *                                   return its first argument.
 * @return {Function}        Hook runner
 */
const createRunHook = function( hooks, returnFirstArg ) {
	/**
	 * Runs the specified hook.
	 *
	 * @param  {string} hookName The hook to run
	 * @param  {...*}   args     Arguments to pass to the hook callbacks
	 * @return {*}               Return value of runner, if applicable
	 * @private
	 */
	return function runner( hookName, ...args ) {
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
