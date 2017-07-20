/**
 * Check to see if an action is registered for a hook.
 *
 * @param {string} hooksArray Hooks array of hooks to check.
 * @param {string} action     The action to check.
 *
 * @return {bool}      Whether an action has been registered for a hook.
 */
const createHasHook = function( hooksArray ) {
	return function( action ) {
		return hooksArray && hooksArray[ action ] ?
			!! hooksArray[ action ] :
			false;
	};
}

export default createHasHook;
