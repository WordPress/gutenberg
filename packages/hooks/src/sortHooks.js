/**
 * Use an insert sort for keeping our hooks organized based on priority.
 *
 * @see http://jsperf.com/javascript-sort
 *
 * @param  {Array} hooks Array of the hooks to sort
 * @return {Array}       The sorted array
 * @private
 */
const sortHooks = function( hooks ) {
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

export default sortHooks;
