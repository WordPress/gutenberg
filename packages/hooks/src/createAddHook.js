import sortHooks from './sortHooks';

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
		if ( typeof hookName !== 'string' || typeof callback !== 'function' ) {
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
			return;
		}

		const handler = { callback, priority };
		let handlers;

		if ( hooks.hasOwnProperty( hookName ) ) {
			// Append and re-sort amongst the existing callbacks.
			handlers = hooks[ hookName ];
			handlers.push( handler );
			handlers = sortHooks( handlers );
		} else {
			// This is the first hook of its type.
			handlers = [ handler ];
		}

		hooks[ hookName ] = handlers;
	};
}

export default createAddHook;
