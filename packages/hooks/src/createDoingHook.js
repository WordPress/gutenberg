/**
 * Checks to see if an action is currently being executed.
 *
 * @param  {string} type   Type of hooks to check.
 * @param {string}  action The name of the action to check for, if omitted will check for any action being performed.
 *
 * @return {bool}          Whether the hook is being executed.
 */
const createDoingHook = function( hooksArray ) {
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

export default createDoingHook;
