import defaultRegistry from '../default-registry';
import type { DataRegistry, StoreNameOrDescriptor } from '../types';

type WaitForTransitionOptions = {
	/**
	 * Registry to observe. Defaults to the global registry.
	 */
	registry?: DataRegistry;
	/**
	 * Store to observe. When set, the predicate only runs when this store changes.
	 */
	store?: StoreNameOrDescriptor;
	/**
	 * Signal that cancels the wait. The Promise rejects with `signal.reason`.
	 */
	signal?: AbortSignal;
};

/**
 * Returns a Promise that resolves once the predicate has transitioned from `true` to `false`. If the predicate is already `true` when called, the Promise resolves on the next transition to `false`.
 *
 * Useful for running code after an asynchronous operation tracked in a data store, such as saving a post, has completed.
 *
 * The predicate is checked after each store change, so a `true` then `false` sequence that happens within a single `registry.batch()` is not seen. If the operation has already finished when this is called, the Promise waits for the next one; pass a `signal` to stop waiting.
 *
 * ```js
 * import { waitForTransition } from '@wordpress/data';
 * import { store as editorStore } from '@wordpress/editor';
 *
 * await waitForTransition(
 *     ( select ) => select( editorStore ).isSavingPost(),
 *     { store: editorStore }
 * );
 * console.log( 'Post saved!' );
 * ```
 *
 * @param predicate Receives the registry's `select` and returns a boolean derived from store state.
 * @param options   Optional `registry`, `store` and `signal`.
 * @return A Promise that resolves the next time `predicate` returns `false` after returning `true`.
 */
export function waitForTransition(
	predicate: ( select: DataRegistry[ 'select' ] ) => boolean,
	options: WaitForTransitionOptions = {}
): Promise< void > {
	const { registry = defaultRegistry, store, signal } = options;
	return new Promise< void >( ( resolve, reject ) => {
		if ( signal?.aborted ) {
			reject( signal.reason );
			return;
		}

		let unsubscribe = () => {};
		const onAbort = () => {
			unsubscribe();
			reject( signal?.reason );
		};
		const settle = ( callback: () => void ) => {
			unsubscribe();
			signal?.removeEventListener( 'abort', onAbort );
			callback();
		};

		// Seed with the current value so an initial `true` state still triggers
		// resolution on the next transition to `false`.
		let hasBeenTrue = predicate( registry.select );

		unsubscribe = registry.subscribe( () => {
			let currentValue;
			try {
				currentValue = predicate( registry.select );
			} catch ( error ) {
				settle( () => reject( error ) );
				return;
			}

			if ( ! hasBeenTrue && currentValue ) {
				hasBeenTrue = true;
				return;
			}

			if ( hasBeenTrue && ! currentValue ) {
				settle( resolve );
			}
		}, store );

		signal?.addEventListener( 'abort', onAbort, { once: true } );
	} );
}
