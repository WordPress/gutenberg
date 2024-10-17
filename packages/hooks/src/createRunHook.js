/**
 * Returns a function which, when invoked, will execute all callbacks
 * registered to a hook of the specified type, optionally returning the final
 * value of the call chain.
 *
 * @param {import('.').Hooks}    hooks          Hooks instance.
 * @param {import('.').StoreKey} storeKey
 * @param {boolean}              returnFirstArg Whether each hook callback is expected to return its first argument.
 * @param {boolean}              async          Whether the hook callback should be run asynchronously
 *
 * @return {(hookName:string, ...args: unknown[]) => undefined|unknown} Function that runs hook callbacks.
 */
function createRunHook( hooks, storeKey, returnFirstArg, async ) {
	return function runHook( hookName, ...args ) {
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

		async function asyncRunner() {
			try {
				hooksStore.__current.add( hookInfo );
				let result = returnFirstArg ? args[ 0 ] : undefined;
				while ( hookInfo.currentIndex < handlers.length ) {
					const handler = handlers[ hookInfo.currentIndex ];
					result = await handler.callback.apply( null, args );
					if ( returnFirstArg ) {
						args[ 0 ] = result;
					}
					hookInfo.currentIndex++;
				}
				return returnFirstArg ? result : undefined;
			} finally {
				hooksStore.__current.delete( hookInfo );
			}
		}

		function syncRunner() {
			try {
				hooksStore.__current.add( hookInfo );
				let result = returnFirstArg ? args[ 0 ] : undefined;
				while ( hookInfo.currentIndex < handlers.length ) {
					const handler = handlers[ hookInfo.currentIndex ];
					result = handler.callback.apply( null, args );
					if ( returnFirstArg ) {
						args[ 0 ] = result;
					}
					hookInfo.currentIndex++;
				}
				return returnFirstArg ? result : undefined;
			} finally {
				hooksStore.__current.delete( hookInfo );
			}
		}

		return ( async ? asyncRunner : syncRunner )();
	};
}

export default createRunHook;
