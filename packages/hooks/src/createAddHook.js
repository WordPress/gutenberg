import sortHooks from './sortHooks';

/**
 * Returns a function which, when invoked, will add a hook.
 *
 * @param  {string}   hooksArray Hooks array to which hooks are to be added
 * @return {Function}            Hook added.
 */
const createAddHook = function( hooksArray ) {
	/**
	 * Adds the hook to the appropriate hooks container
	 *
	 * @param {string}   hook     Name of hook to add
	 * @param {Function} callback Function to call when the hook is run
	 * @param {?number}  priority Priority of this hook (default=10)
	 */
	return function( hook, callback, priority ) {
		var hookObject, hooks;
		if ( typeof hook !== 'string' || typeof callback !== 'function' ) {
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

		hookObject = {
			callback: callback,
			priority: priority
		};

		if ( hooksArray.hasOwnProperty( hook ) ) {
			// Append and re-sort amongst existing
			hooks = hooksArray[ hook ];
			hooks.push( hookObject );
			hooks = sortHooks( hooks );
		} else {
			// First of its type needs no sort
			hooks = [ hookObject ];
		}

		hooksArray[ hook ] = hooks;
	};
}

export default createAddHook;
