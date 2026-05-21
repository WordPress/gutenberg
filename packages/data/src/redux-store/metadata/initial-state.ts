/**
 * External dependencies
 */
import EquivalentKeyMap from 'equivalent-key-map';

/**
 * Internal dependencies
 */
import type { State } from './reducer';

/**
 * Builds the inner `metadata` state for a store, with the given
 * (selector, args[]) pairs marked as already-resolved. Hand the result to
 * `createReduxStore`'s `initialState.metadata` to start the store with a
 * primed resolution cache — `hasFinishedResolution( selector, args )`
 * returns `true` immediately, and the resolver never fires for those args.
 *
 * Use this when the data the resolver would have fetched is already in
 * hand (e.g. emitted by the server alongside the page) and you've also
 * pre-populated the matching root state via `initialState.root`.
 *
 * Constructed inside `@wordpress/data` (rather than at the caller) so the
 * `EquivalentKeyMap` instance is recognised by the metadata reducer's
 * own `new EquivalentKeyMap( state )` copy step. Cross-bundle instances
 * fail an `instanceof` check there and silently drop every entry.
 *
 * @example
 * ```js
 * const store = createReduxStore( 'core', {
 *     reducer,
 *     initialState: {
 *         root: foldedRootState,
 *         metadata: createInitialResolutionState( [
 *             [ 'getCurrentUser', [ [] ] ],
 *             [ 'getEntityRecord', [ [ 'postType', 'post', 123 ] ] ],
 *         ] ),
 *     },
 * } );
 * ```
 *
 * @param entries Iterable of `[ selectorName, args[] ]` tuples.
 * @return The `metadata` inner-state slice ready to hand to createReduxStore.
 */
export function createInitialResolutionState(
	entries: Iterable< [ string, Iterable< unknown[] > ] >
): Record< string, State > {
	const state: Record< string, State > = {};
	for ( const [ selectorName, argsList ] of entries ) {
		const map: State = new EquivalentKeyMap();
		for ( const args of argsList ) {
			map.set( args, { status: 'finished' } );
		}
		state[ selectorName ] = map;
	}
	return state;
}
