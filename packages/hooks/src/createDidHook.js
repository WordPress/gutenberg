/**
 * Retrieve the number of times an action is fired.
 *
 * @param {string} hooksArray Hooks array of hooks to check.
 * @param {string} action     The action to check.
 *
 * @return {number}           The number of times the hook has run.
 */
const createDidHook = function( hooksArray ) {
	return function( action ) {
		return hooksArray[ action ] && hooksArray[ action ].runs
			? hooksArray[ action ].runs
			: 0;
	};
}

export default createDidHook;
