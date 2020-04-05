/**
 * Returns a function which, when invoked, will execute all callbacks
 * registered to a hook of the specified type, optionally returning the final
 * value of the call chain.
 *
 * @param  {Object}   hooks          Stored hooks, keyed by hook name.
 * @param  {?boolean}    returnFirstArg Whether each hook callback is expected to
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
		if ( ! hooks[ hookName ] ) {
			hooks[ hookName ] = {
				handlers: [],
				runs: 0,
			};
		}

		hooks[ hookName ].runs++;

		const handlers = hooks[ hookName ].handlers;

		// The following code is stripped from production builds.
		if ( 'production' !== process.env.NODE_ENV ) {
			// Handle any 'all' hooks registered.
			if ( 'hookAdded' !== hookName && hooks.all ) {
				handlers.push( ...hooks.all.handlers );
			}
		}

		if ( ! handlers || ! handlers.length ) {
			return returnFirstArg ? args[ 0 ] : undefined;
		}

		const hookInfo = {
			name: hookName,
			currentIndex: 0,
		};

		hooks.__current.push( hookInfo );

		while ( hookInfo.currentIndex < handlers.length ) {
			const handler = handlers[ hookInfo.currentIndex ];

			const result = handler.callback.apply( null, args );
			if ( returnFirstArg ) {
				args[ 0 ] = result;
			}

			hookInfo.currentIndex++;
		}

		hooks.__current.pop();

		if ( returnFirstArg ) {
			return args[ 0 ];
		}
	};
}

export default createRunHook;
