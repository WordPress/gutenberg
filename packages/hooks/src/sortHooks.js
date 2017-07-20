/**
 * Use an insert sort to keep hook handlers organized based on priority.
 *
 * @see http://jsperf.com/javascript-sort
 *
 * @param  {Array} handlers Array of the handlers to sort
 * @return {Array}          The sorted array
 * @private
 */
const sortHooks = function( handlers ) {
	var i, tmpHook, j, prevHook;
	for ( i = 1; i < handlers.length; i++ ) {
		tmpHook = handlers[ i ];
		j = i;
		while (
			( prevHook = handlers[ j - 1 ] ) &&
			prevHook.priority > tmpHook.priority
		) {
			handlers[ j ] = handlers[ j - 1 ];
			--j;
		}
		handlers[ j ] = tmpHook;
	}

	return handlers;
}

export default sortHooks;
