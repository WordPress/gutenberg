/**
 * Returns a function which, when invoked, will remove a specified hook.
 *
 * @param  {string}   hooksArray Hooks array from which hooks are to be removed.
 * @param  {bool}     removeAll  Whether to remove all hooked callbacks.
 *
 * @return {Function}           Hook remover.
 */
const createRemoveHook = function( hooksArray, removeAll ) {
	/**
	 * Removes the specified hook by resetting its value.
	 *
	 * @param {string}    hook     Name of hook to remove
	 * @param {?Function} callback The specific callback to be removed.  If
	 *                             omitted (and `removeAll` is truthy), clears
	 *                             all callbacks.
	 */
	return function( hook, callback ) {
		var handlers, i;

		// Bail early if no hooks exist by this name
		if ( ! hooksArray || ! hooksArray.hasOwnProperty( hook ) ) {
			return;
		}

		if ( removeAll ) {
			const runs = hooksArray[ hook ].runs;
			hooksArray[ hook ] = [];
			if ( runs ) {
				hooksArray[ hook ].runs = runs;
			}
		} else if ( callback ) {
			// Try to find specified callback to remove
			handlers = hooksArray[ hook ];
			for ( i = handlers.length - 1; i >= 0; i-- ) {
				if ( handlers[ i ].callback === callback ) {
					handlers.splice( i, 1 );
				}
			}
		}
	};
}

export default createRemoveHook;
