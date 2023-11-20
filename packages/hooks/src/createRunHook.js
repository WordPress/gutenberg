/**
 * Returns a function which, when invoked, will execute all callbacks
 * registered to a hook of the specified type, optionally returning the final
 * value of the call chain.
 *
 * @param {import('.').Hooks}    hooks                  Hooks instance.
 * @param {import('.').StoreKey} storeKey
 * @param {boolean}              [returnFirstArg=false] Whether each hook callback is expected to
 *                                                      return its first argument.
 *
 * @return {(hookName:string, ...args: unknown[]) => undefined|unknown} Function that runs hook callbacks.
 */
function createRunHook( hooks, storeKey, returnFirstArg = false ) {
	return function runHooks( hookName, ...args ) {
		const hooksStore = hooks[ storeKey ];

		if ( ! hooksStore[ hookName ] ) {
			hooksStore[ hookName ] = {
				handlers: [],
				runs: 0,
			};
		}

		hooksStore[ hookName ].runs++;

		const handlers = hooksStore[ hookName ].handlers;

		// The following code is stripped from production builds.
		if ( 'production' !== process.env.NODE_ENV ) {
			// Handle any 'all' hooks registered.
			if ( 'hookAdded' !== hookName && hooksStore.all ) {
				handlers.push( ...hooksStore.all.handlers );
			}
		}

		if ( ! handlers || ! handlers.length ) {
			return returnFirstArg ? args[ 0 ] : undefined;
		}

		const hookInfo = {
			name: hookName,
			currentIndex: 0,
		};

		hooksStore.__current.push( hookInfo );

		while ( hookInfo.currentIndex < handlers.length ) {
			const handler = handlers[ hookInfo.currentIndex ];

			const result = handler.callback.apply( null, args );
			if ( returnFirstArg ) {
				args[ 0 ] = result;
			}

			hookInfo.currentIndex++;
		}

		hooksStore.__current.pop();

		if ( returnFirstArg ) {
			return args[ 0 ];
		}

		return undefined;
	};
}

export default createRunHook;
