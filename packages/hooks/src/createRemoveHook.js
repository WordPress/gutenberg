/**
 * Internal dependencies
 */
import validateNamespace from './validateNamespace.js';
import validateHookName from './validateHookName.js';

/**
 * @callback RemoveHook
 * Removes the specified callback (or all callbacks) from the hook with a given hookName
 * and namespace.
 *
 * @param {string} hookName  The name of the hook to modify.
 * @param {string} namespace The unique namespace identifying the callback in the
 *                           form `vendor/plugin/function`.
 *
 * @return {number | undefined} The number of callbacks removed.
 */

/**
 * Returns a function which, when invoked, will remove a specified hook or all
 * hooks by the given name.
 *
 * @param {import('.').Hooks}    hooks             Hooks instance.
 * @param {import('.').StoreKey} storeKey
 * @param {boolean}              [removeAll=false] Whether to remove all callbacks for a hookName,
 *                                                 without regard to namespace. Used to create
 *                                                 `removeAll*` functions.
 *
 * @return {RemoveHook} Function that removes hooks.
 */
function createRemoveHook( hooks, storeKey, removeAll = false ) {
	return function removeHook( hookName, namespace ) {
		const hooksStore = hooks[ storeKey ];

		if ( ! validateHookName( hookName ) ) {
			return;
		}

		if ( ! removeAll && ! validateNamespace( namespace ) ) {
			return;
		}

		// Bail if no hooks exist by this name.
		if ( ! hooksStore[ hookName ] ) {
			return 0;
		}

		let handlersRemoved = 0;

		if ( removeAll ) {
			handlersRemoved = hooksStore[ hookName ].handlers.length;
			hooksStore[ hookName ] = {
				runs: hooksStore[ hookName ].runs,
				handlers: [],
			};
		} else {
			// Try to find the specified callback to remove.
			const handlers = hooksStore[ hookName ].handlers;
			for ( let i = handlers.length - 1; i >= 0; i-- ) {
				if ( handlers[ i ].namespace === namespace ) {
					handlers.splice( i, 1 );
					handlersRemoved++;
					// This callback may also be part of a hook that is
					// currently executing.  If the callback we're removing
					// comes after the current callback, there's no problem;
					// otherwise we need to decrease the execution index of any
					// other runs by 1 to account for the removed element.
					hooksStore.__current.forEach( ( hookInfo ) => {
						if (
							hookInfo.name === hookName &&
							hookInfo.currentIndex >= i
						) {
							hookInfo.currentIndex--;
						}
					} );
				}
			}
		}

		if ( hookName !== 'hookRemoved' ) {
			hooks.doAction( 'hookRemoved', hookName, namespace );
		}

		return handlersRemoved;
	};
}

export default createRemoveHook;
