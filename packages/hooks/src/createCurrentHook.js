/**
 * See what action is currently being executed.
 *
 * @param  {string} hooksArray Hooks array of hooks to check.
 * @param {string}  action     The name of the action to check for.
 *
 * @return {Function}          A function that gets the currently executing filter,
 */
const createCurrentHook = function( hooksArray ) {

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

export default createCurrentHook;
