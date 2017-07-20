import createRemoveHook from './createRemoveHook';

/**
 * Remove all the actions registered to a hook.
 *
 * @param {string} hooksArray Hooks array of hooks to check.
 *
 * @return {Function}         All hook remover.
 */
const createRemoveAllHook = function( hooksArray ) {
	return createRemoveHook( hooksArray, true );
}

export default createRemoveAllHook;
