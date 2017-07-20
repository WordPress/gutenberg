/**
 * Returns a function which, when invoked, will add a hook.
 *
 * @param  {Object}   hooks Stored hooks, keyed by hook name.
 *
 * @return {Function}       Function that adds a new hook.
 */
function createAddHook( hooks ) {
	/**
	 * Adds the hook to the appropriate hooks container.
	 *
	 * @param {string}   hookName Name of hook to add
	 * @param {Function} callback Function to call when the hook is run
	 * @param {?number}  priority Priority of this hook (default=10)
	 */
	return function addHook( hookName, callback, priority ) {
		if ( typeof hookName !== 'string' ) {
			console.error( 'The hook name must be a string.' );
			return;
		}

		if ( typeof callback !== 'function' ) {
			console.error( 'The hook callback must be a function.' );
			return;
		}

		// Assign default priority
		if ( 'undefined' === typeof priority ) {
			priority = 10;
		} else {
			priority = parseInt( priority, 10 );
		}

		// Validate numeric priority
		if ( isNaN( priority ) ) {
			console.error( 'The hook priority must be omitted or a number.' );
			return;
		}

		const handler = { callback, priority };
		let handlers;

		if ( hooks.hasOwnProperty( hookName ) ) {
			// Find the correct insert index of the new hook.
			handlers = hooks[ hookName ];
			let i = 0;
			while ( i < handlers.length ) {
				if ( handlers[ i ].priority > priority ) {
					break;
				}
				i++;
			}
			// Insert (or append) the new hook.
			handlers.splice( i, 0, handler );
		} else {
			// This is the first hook of its type.
			handlers = [ handler ];
		}

		hooks[ hookName ] = handlers;
	};
}

export default createAddHook;
