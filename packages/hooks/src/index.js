
//export function addQueryArgs( url, args ) {


/**
 * Contains the registered hooks, keyed by hook type. Each hook type is an
 * array of objects with priority and callback of each registered hook.
 */
var HOOKS = {};

/**
 * Returns a function which, when invoked, will add a hook.
 *
 * @param  {string}   type Type for which hooks are to be added
 * @return {Function}      Hook added
 */
function createAddHookByType( type ) {
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

		// Check if adding first of type
		if ( ! HOOKS[ type ] ) {
			HOOKS[ type ] = {};
		}

		hookObject = {
			callback: callback,
			priority: priority
		};

		if ( HOOKS[ type ].hasOwnProperty( hook ) ) {
			// Append and re-sort amongst existing
			hooks = HOOKS[ type ][ hook ];
			hooks.push( hookObject );
			hooks = sortHooks( hooks );
		} else {
			// First of its type needs no sort
			hooks = [ hookObject ];
		}

		HOOKS[ type ][ hook ] = hooks;
	};
}

/**
 * Returns a function which, when invoked, will remove a specified hook.
 *
 * @param  {string}   type      Type for which hooks are to be removed.
 * @param  {bool}     removeAll Whether to always remove all hooked callbacks.
 *
 * @return {Function}           Hook remover.
 */
function createRemoveHookByType( type, removeAll ) {
	/**
	 * Removes the specified hook by resetting its value.
	 *
	 * @param {string}    hook     Name of hook to remove
	 * @param {?Function} callback The specific callback to be removed. If
	 *                             omitted, clears all callbacks.
	 */
	return function( hook, callback ) {
		var handlers, i;

		// Baily early if no hooks exist by this name
		if ( ! HOOKS[ type ] || ! HOOKS[ type ].hasOwnProperty( hook ) ) {
			return;
		}

		if ( callback && ! removeAll ) {
			// Try to find specified callback to remove
			handlers = HOOKS[ type ][ hook ];
			for ( i = handlers.length - 1; i >= 0; i-- ) {
				if ( handlers[ i ].callback === callback ) {
					handlers.splice( i, 1 );
				}
			}
		} else {
			// Reset hooks to empty
			delete HOOKS[ type ][ hook ];
		}
	};
}

/**
 * Returns a function which, when invoked, will execute all registered
 * hooks of the specified type by calling upon runner with its hook name
 * and arguments.
 *
 * @param  {string}   type   Type for which hooks are to be run, one of 'action' or 'filter'.
 * @param  {Function} runner Function to invoke for each hook callback
 * @return {Function}        Hook runner
 */
function createRunHookByType( type, runner ) {
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
 * @param  {string} type   Type of hooks to check, one of 'action' or 'filter'.
 * @param {string}  action The name of the action to check for.
 *
 * @return {[type]}      [description]
 */
function createCurrentHookByType( type ) {
	return function( action ) {

		// If the action was not passed, check for any current hook.
		if ( 'undefined' === typeof action ) {
			return false;
		}

		// Return the current hook.
		return HOOKS[ type ] && HOOKS[ type ].current ?
			HOOKS[ type ].current :
			false;
	};
}



/**
 * Checks to see if an action is currently being executed.
 *
 * @param  {string} type   Type of hooks to check, one of 'action' or 'filter'.
 * @param {string}  action The name of the action to check for, if omitted will check for any action being performed.
 *
 * @return {[type]}      [description]
 */
function createDoingHookByType( type ) {
	return function( action ) {

		// If the action was not passed, check for any current hook.
		if ( 'undefined' === typeof action ) {
			return 'undefined' !== typeof HOOKS[ type ].current;
		}

		// Return the current hook.
		return HOOKS[ type ] && HOOKS[ type ].current ?
			action === HOOKS[ type ].current :
			false;
	};
}

/**
 * Retrieve the number of times an action is fired.
 *
 * @param  {string} type   Type for which hooks to check, one of 'action' or 'filter'.
 * @param {string}  action The action to check.
 *
 * @return {[type]}      [description]
 */
function createDidHookByType( type ) {
	return function( action ) {
		return HOOKS[ type ] && HOOKS[ type ][ action ] && HOOKS[ type ][ action ].runs ?
			HOOKS[ type ][ action ].runs :
			0;
	};
}

/**
 * Check to see if an action is registered for a hook.
 *
 * @param  {string} type   Type for which hooks to check, one of 'action' or 'filter'.
 * @param {string}  action  The action to check.
 *
 * @return {bool}      Whether an action has been registered for a hook.
 */
function createHasHookByType( type ) {
	return function( action ) {
		return HOOKS[ type ] && HOOKS[ type ][ action ] ?
			!! HOOKS[ type ][ action ] :
			false;
	};
}

/**
 * Remove all the actions registered to a hook.
 */
function createRemoveAllByType( type ) {
	return createRemoveHookByType( type, true );
}

// Remove functions.
export removeFilter = createRemoveHookByType( 'filters' );
export removeAction = createRemoveHookByType( 'actions' );


// Do action/apply filter functions.
export doAction =     createRunHookByType( 'actions', runDoAction );
export applyFilters = createRunHookByType( 'filters', runApplyFilters );

// Add functions.
export addAction = createAddHookByType( 'actions' );
export addFilter = createAddHookByType( 'filters' );

// Doing functions.
export doingAction = createDoingHookByType( 'actions' ), /* True for actions until;next action fired. */
export doingFilter = createDoingHookByType( 'filters' ), /* True for filters while;filter is being applied. */

// Did functions.
export didAction = createDidHookByType( 'actions' );
export didFilter = createDidHookByType( 'filters' );

// Has functions.
export hasAction = createHasHookByType( 'actions' );
export hasFilter = createHasHookByType( 'filters' );

// Remove all functions.
export removeAllActions = createRemoveAllByType( 'actions' );
export removeAllFilters = createRemoveAllByType( 'filters' );

// Current filter.
export currentFilter = createCurrentHookByType( 'filters' );
