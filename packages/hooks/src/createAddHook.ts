/**
 * Internal dependencies
 */
import validateNamespace from './validateNamespace';
import validateHookName from './validateHookName';
import type { Callback, Hooks, StoreKey } from '.';
import type { Handler, HookInfo } from './types';

/**
 *
 * Adds the hook to the appropriate hooks container.
 */
export type AddHook = (
	/**
	 * Name of hook to add
	 */
	hookName: string,
	/**
	 * The unique namespace identifying the callback in the form.
	 */
	namespace: string,
	/**
	 * Function to call when the hook is run.
	 */
	callback: Callback,
	/**
	 * Priority of this hook
	 */
	priority?: number
) => void;

/**
 * Returns a function which, when invoked, will add a hook.
 *
 * @param hooks    Hooks instance.
 * @param storeKey
 *
 * @return  Function that adds a new hook.
 */
function createAddHook( hooks: Hooks, storeKey: StoreKey ): AddHook {
	return function addHook( hookName, namespace, callback, priority = 10 ) {
		const hooksStore = hooks[ storeKey ];

		if ( ! validateHookName( hookName ) ) {
			return;
		}

		if ( ! validateNamespace( namespace ) ) {
			return;
		}

		if ( 'function' !== typeof callback ) {
			// eslint-disable-next-line no-console
			console.error( 'The hook callback must be a function.' );
			return;
		}

		// Validate numeric priority
		if ( 'number' !== typeof priority ) {
			// eslint-disable-next-line no-console
			console.error(
				'If specified, the hook priority must be a number.'
			);
			return;
		}

		const handler: Handler = { callback, priority, namespace };

		if ( hooksStore[ hookName ] ) {
			// Find the correct insert index of the new hook.
			const handlers = hooksStore[ hookName ].handlers;

			let i: number;
			for ( i = handlers.length; i > 0; i-- ) {
				if ( priority >= handlers[ i - 1 ].priority ) {
					break;
				}
			}

			if ( i === handlers.length ) {
				// If append, operate via direct assignment.
				handlers[ i ] = handler;
			} else {
				// Otherwise, insert before index via splice.
				handlers.splice( i, 0, handler );
			}

			// We may also be currently executing this hook.  If the callback
			// we're adding would come after the current callback, there's no
			// problem; otherwise we need to increase the execution index of
			// any other runs by 1 to account for the added element.
			hooksStore.__current.forEach( ( hookInfo: HookInfo ) => {
				if (
					hookInfo.name === hookName &&
					hookInfo.currentIndex >= i
				) {
					hookInfo.currentIndex++;
				}
			} );
		} else {
			// This is the first hook of its type.
			hooksStore[ hookName ] = {
				handlers: [ handler ],
				runs: 0,
			};
		}

		if ( hookName !== 'hookAdded' ) {
			hooks.doAction(
				'hookAdded',
				hookName,
				namespace,
				callback,
				priority
			);
		}
	};
}

export default createAddHook;
