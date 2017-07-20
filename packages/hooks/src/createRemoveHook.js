/**
 * Returns a function which, when invoked, will remove a specified hook.
 *
 * @param  {string}   hooksArray Hooks array from which hooks are to be removed.
 * @param  {bool}     removeAll  Whether to always remove all hooked callbacks.
 *
 * @return {Function}           Hook remover.
 */
const createRemoveHook = function ( hooksArray, removeAll ) {
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

export default createRemoveHook;