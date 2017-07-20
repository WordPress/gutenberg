/**
 * Contains the registered hooks, keyed by hook type. Each hook type is an
 * array of objects with priority and callback of each registered hook.
 */
var HOOKS = {
	actions: [],
	filters: []
};

/**
 * Returns a function which, when invoked, will add a hook.
 *
 * @param  {string}   hooksArray Hooks array to which hooks are to be added
 * @return {Function}            Hook added.
 */
function createAddHook( hooksArray ) {
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

/**
 * Returns a function which, when invoked, will remove a specified hook.
 *
 * @param  {string}   hooksArray Hooks array from which hooks are to be removed.
 * @param  {bool}     removeAll  Whether to always remove all hooked callbacks.
 *
 * @return {Function}           Hook remover.
 */
function createRemoveHook( hooksArray, removeAll ) {
	/**
	 * Removes the specified hook by resetting its value.
	 *
	 * @param {string}    hook     Name of hook to remove
	 * @param {?Function} callback The specific callback to be removed. Optional, if
	 *                             omitted, clears all callbacks.
	 */
	return function( hook, callback ) {
		var handlers, i;

		// Baily early if no hooks exist by this name
		if ( ! hooksArray || ! hooksArray.hasOwnProperty( hook ) ) {
			return;
		}

		if ( callback && ! removeAll ) {
			// Try to find specified callback to remove
			handlers = hooksArray[ hook ];
			for ( i = handlers.length - 1; i >= 0; i-- ) {
				if ( handlers[ i ].callback === callback ) {
					handlers.splice( i, 1 );
				}
			}
		} else {
			// Reset hooks to empty
			delete hooksArray[ hook ];
		}
	};
}

/**
 * Returns a function which, when invoked, will execute all registered
 * hooks of the specified type by calling upon runner with its hook name
 * and arguments.
 *
 * @param  {Function} runner Function to invoke for each hook callback
 * @return {Function}        Hook runner
 */
function createRunHook( runner ) {
	/**
	 * Runs the specified hook.
	 *
	 * @param  {string} hook The hook to run
	 * @param  {...*}   args Arguments to pass to the action/filter
	 * @return {*}           Return value of runner, if applicable
	 * @private
	 */
	return function( /* hook, ...args */ ) {
		var args, hook;

		args = Array.prototype.slice.call( arguments );
		hook = args.shift();

		if ( typeof hook === 'string' ) {
			return runner( hook, args );
		}
	};
}

/**
 * Performs an action if it exists.
 *
 * @param {string} action The action to perform.
 * @param {...*}   args   Optional args to pass to the action.
 * @private
 */
function runDoAction( action, args ) {
	var handlers, i;
	if ( HOOKS.actions ) {
		handlers = HOOKS.actions[ action ];
	}

	if ( ! handlers ) {
		return;
	}

	HOOKS.actions.current = action;

	for ( i = 0; i < handlers.length; i++ ) {
		handlers[ i ].callback.apply( null, args );
		HOOKS.actions[ action ].runs = HOOKS.actions[ action ].runs ? HOOKS.actions[ action ].runs + 1 : 1;
	}

}

/**
 * Performs a filter if it exists.
 *
 * @param  {string} filter The filter to apply.
 * @param  {...*}   args   Optional args to pass to the filter.
 * @return {*}             The filtered value
 * @private
 */
function runApplyFilters( filter, args ) {
	var handlers, i;
	if ( HOOKS.filters ) {
		handlers = HOOKS.filters[ filter ];
	}

	if ( ! handlers ) {
		return args[ 0 ];
	}

	HOOKS.filters.current = filter;
	HOOKS.filters[ filter ].runs = HOOKS.filters[ filter ].runs ? HOOKS.filters[ filter ].runs + 1 : 1;

	for ( i = 0; i < handlers.length; i++ ) {
		args[ 0 ] = handlers[ i ].callback.apply( null, args );
	}
	delete( HOOKS.filters.current );

	return args[ 0 ];
}

/**
 * Use an insert sort for keeping our hooks organized based on priority.
 *
 * @see http://jsperf.com/javascript-sort
 *
 * @param  {Array} hooks Array of the hooks to sort
 * @return {Array}       The sorted array
 * @private
 */
function sortHooks( hooks ) {
	var i, tmpHook, j, prevHook;
	for ( i = 1; i < hooks.length; i++ ) {
		tmpHook = hooks[ i ];
		j = i;
		while ( ( prevHook = hooks[ j - 1 ] ) && prevHook.priority > tmpHook.priority ) {
			hooks[ j ] = hooks[ j - 1 ];
			--j;
		}
		hooks[ j ] = tmpHook;
	}

	return hooks;
}


/**
 * See what action is currently being executed.
 *
 * @param  {string} hooksArray Hooks array of hooks to check.
 * @param {string}  action     The name of the action to check for.
 *
 * @return {Function}          A function that gets the currently executing filter,
 */
function createCurrentHook( hooksArray ) {

	/**
	 * Get the current active hook.
	 *
	 * @param {string}  action The name of the action to check for, if omitted will check for any action being performed.
	 *
	 * @return {string}          Returns the currently executing action, or false if none.
	 */
	return function() {

		// If the action was not passed, check for any current hook.
		if ( 'undefined' === typeof action ) {
			return false;
		}

		// Return the current hook.
		return hooksArray && hooksArray.current ?
			hooksArray.current :
			false;
	};
}



/**
 * Checks to see if an action is currently being executed.
 *
 * @param  {string} type   Type of hooks to check.
 * @param {string}  action The name of the action to check for, if omitted will check for any action being performed.
 *
 * @return {[type]}      [description]
 */
function createDoingHook( hooksArray ) {
	return function( action ) {

		// If the action was not passed, check for any current hook.
		if ( 'undefined' === typeof action ) {
			return 'undefined' !== typeof hooksArray.current;
		}

		// Return the current hook.
		return hooksArray && hooksArray.current ?
			action === hooksArray.current :
			false;
	};
}

/**
 * Retrieve the number of times an action is fired.
 *
 * @param {string} hooksArray Hooks array of hooks to check.
 * @param {string} action     The action to check.
 *
 * @return {[type]}      [description]
 */
function createDidHook( hooksArray ) {
	return function( action ) {
		return hooksArray && hooksArray[ action ] && hooksArray[ action ].runs ?
			hooksArray[ action ].runs :
			0;
	};
}

/**
 * Check to see if an action is registered for a hook.
 *
 * @param {string} hooksArray Hooks array of hooks to check.
 * @param {string} action     The action to check.
 *
 * @return {bool}      Whether an action has been registered for a hook.
 */
function createHasHook( hooksArray ) {
	return function( action ) {
		return hooksArray && hooksArray[ action ] ?
			!! hooksArray[ action ] :
			false;
	};
}

/**
 * Remove all the actions registered to a hook.
 *
 * @param {string} hooksArray Hooks array of hooks to check.
 *
 * @return {Function}         All hook remover.
 */
function createRemoveAllHook( hooksArray ) {
	return createRemoveHook( hooksArray, true );
}

// Remove functions.
export const removeFilter = createRemoveHook( HOOKS.filters );
export const removeAction = createRemoveHook( HOOKS.actions );


// Do action/apply filter functions.
export const doAction =     createRunHook( runDoAction );
export const applyFilters = createRunHook( runApplyFilters );

// Add functions.
export const addAction = createAddHook( HOOKS.actions );
export const addFilter = createAddHook( HOOKS.filters );

// Doing action: true until next action fired.
export const doingAction = createDoingHook( HOOKS.actions );

// Doing filter: true while filter is being applied.
export const doingFilter = createDoingHook( HOOKS.filters );

// Did functions.
export const didAction = createDidHook( HOOKS.actions );
export const didFilter = createDidHook( HOOKS.filters );

// Has functions.
export const hasAction = createHasHook( HOOKS.actions );
export const hasFilter = createHasHook( HOOKS.filters );

// Remove all functions.
export const removeAllActions = createRemoveAllHook( HOOKS.actions );
export const removeAllFilters = createRemoveAllHook( HOOKS.filters );

// Current filter.
export const currentFilter = createCurrentHook( HOOKS.filters );

