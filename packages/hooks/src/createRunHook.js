/**
 * Returns a function which, when invoked, will execute all registered
 * hooks of the specified type by calling upon runner with its hook name
 * and arguments.
 *
 * @param  {Function} runner Function to invoke for each hook callback
 * @return {Function}        Hook runner
 */
const createRunHook = function( runner ) {
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

export default createRunHook;
