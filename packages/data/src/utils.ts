/**
 * Internal dependencies
 */
import defaultRegistry from './default-registry';
import type { DataRegistry } from './types';

/**
 * Given a predicate function and an optional registry, returns a Promise that resolves
 * once the predicate has transitioned from `true` to `false`. If the predicate is already
 * `true` when called, the Promise will resolve on the next transition to `false`.
 *
 * Useful for running code after an asynchronous operation that is tracked in a data store
 * (such as saving a post) has completed.
 *
 * ```js
 * import { waitForTransition } from '@wordpress/data';
 *
 * // Wait for isSavingPost() to transition to true, then back to false.
 * await waitForTransition( () =>
 *     wp.data.select( 'core/editor' ).isSavingPost()
 * );
 * console.log( 'Post saved!' );
 * ```
 *
 * @param predicate A function that returns a boolean derived from store state.
 * @param registry  Registry to observe. Defaults to the global registry.
 * @return A Promise that resolves the next time `predicate` returns `false` after returning `true`.
 */
export function waitForTransition(
	predicate: () => boolean,
	registry: DataRegistry = defaultRegistry
): Promise< void > {
	return new Promise< void >( ( resolve ) => {
		// Seed with the current value so an initial `true` state still triggers
		// resolution on the next transition to `false`.
		let hasBeenTrue = predicate();

		const unsubscribe = registry.subscribe( () => {
			const currentValue = predicate();

			if ( ! hasBeenTrue && currentValue ) {
				hasBeenTrue = true;
				return;
			}

			if ( hasBeenTrue && ! currentValue ) {
				unsubscribe();
				resolve();
			}
		} );
	} );
}
