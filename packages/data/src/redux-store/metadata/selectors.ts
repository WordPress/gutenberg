/**
 * WordPress dependencies
 */
import deprecated from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import { createSelector } from '../../create-selector';
import { selectorArgsToStateKey } from './utils';
import type { State, StateValue } from './reducer';

/**
 * Returns the raw resolution state value for a given selector name,
 * and arguments set. May be undefined if the selector has never been resolved
 * or not resolved for the given set of arguments, otherwise true or false for
 * resolution started and completed respectively.
 *
 * @param state        Data state.
 * @param selectorName Selector name.
 * @param args         Arguments passed to selector.
 *
 * @return isResolving value.
 */
export function getResolutionState(
	state: Record< string, State >,
	selectorName: string,
	args?: unknown[] | null
): StateValue | undefined {
	const map = state[ selectorName ];
	if ( ! map ) {
		return;
	}

	return map.get( selectorArgsToStateKey( args ) );
}

/**
 * Returns an `isResolving`-like value for a given selector name and arguments set.
 * Its value is either `undefined` if the selector has never been resolved or has been
 * invalidated, or a `true`/`false` boolean value if the resolution is in progress or
 * has finished, respectively.
 *
 * This is a legacy selector that was implemented when the "raw" internal data had
 * this `undefined | boolean` format. Nowadays the internal value is an object that
 * can be retrieved with `getResolutionState`.
 *
 * @deprecated
 *
 * @param state        Data state.
 * @param selectorName Selector name.
 * @param args         Arguments passed to selector.
 *
 * @return isResolving value.
 */
export function getIsResolving(
	state: Record< string, State >,
	selectorName: string,
	args?: unknown[] | null
): boolean | undefined {
	deprecated( 'wp.data.select( store ).getIsResolving', {
		since: '6.6',
		version: '6.8',
		alternative: 'wp.data.select( store ).getResolutionState',
	} );

	const resolutionState = getResolutionState( state, selectorName, args );
	return resolutionState && resolutionState.status === 'resolving';
}

/**
 * Returns true if resolution has already been triggered for a given
 * selector name, and arguments set.
 *
 * @param state        Data state.
 * @param selectorName Selector name.
 * @param args         Arguments passed to selector.
 *
 * @return Whether resolution has been triggered.
 */
export function hasStartedResolution(
	state: Record< string, State >,
	selectorName: string,
	args?: unknown[] | null
): boolean {
	return getResolutionState( state, selectorName, args ) !== undefined;
}

/**
 * Returns true if resolution has completed for a given selector
 * name, and arguments set.
 *
 * @param state        Data state.
 * @param selectorName Selector name.
 * @param args         Arguments passed to selector.
 *
 * @return Whether resolution has completed.
 */
export function hasFinishedResolution(
	state: Record< string, State >,
	selectorName: string,
	args?: unknown[] | null
): boolean {
	const status = getResolutionState( state, selectorName, args )?.status;
	return status === 'finished' || status === 'error';
}

/**
 * Returns true if resolution has failed for a given selector
 * name, and arguments set.
 *
 * @param state        Data state.
 * @param selectorName Selector name.
 * @param args         Arguments passed to selector.
 *
 * @return Has resolution failed
 */
export function hasResolutionFailed(
	state: Record< string, State >,
	selectorName: string,
	args?: unknown[] | null
): boolean {
	return getResolutionState( state, selectorName, args )?.status === 'error';
}

/**
 * Returns the resolution error for a given selector name, and arguments set.
 * Note it may be of an Error type, but may also be null, undefined, or anything else
 * that can be `throw`-n.
 *
 * @param state        Data state.
 * @param selectorName Selector name.
 * @param args         Arguments passed to selector.
 *
 * @return Last resolution error
 */
export function getResolutionError(
	state: Record< string, State >,
	selectorName: string,
	args?: unknown[] | null
): Error | unknown {
	const resolutionState = getResolutionState( state, selectorName, args );
	return resolutionState?.status === 'error' ? resolutionState.error : null;
}

/**
 * Returns true if resolution has been triggered but has not yet completed for
 * a given selector name, and arguments set.
 *
 * @param state        Data state.
 * @param selectorName Selector name.
 * @param args         Arguments passed to selector.
 *
 * @return Whether resolution is in progress.
 */
export function isResolving(
	state: Record< string, State >,
	selectorName: string,
	args?: unknown[] | null
): boolean {
	return (
		getResolutionState( state, selectorName, args )?.status === 'resolving'
	);
}

/**
 * Returns the list of the cached resolvers.
 *
 * @param state Data state.
 *
 * @return Resolvers mapped by args and selectorName.
 */
export function getCachedResolvers(
	state: Record< string, State >
): Record< string, State > {
	return state;
}

/**
 * Whether the store has any currently resolving selectors.
 *
 * @param state Data state.
 *
 * @return True if one or more selectors are resolving, false otherwise.
 */
export function hasResolvingSelectors(
	state: Record< string, State >
): boolean {
	return Object.values( state ).some( ( selectorState ) =>
		/**
		 * This uses the internal `_map` property of `EquivalentKeyMap` for
		 * optimization purposes, since the `EquivalentKeyMap` implementation
		 * does not support a `.values()` implementation.
		 *
		 * @see https://github.com/aduth/equivalent-key-map
		 */
		Array.from( ( selectorState as any )._map.values() ).some(
			( resolution: any ) => resolution[ 1 ]?.status === 'resolving'
		)
	);
}

/**
 * Retrieves the total number of selectors, grouped per status.
 *
 * @param state Data state.
 *
 * @return Object, containing selector totals by status.
 */
export const countSelectorsByStatus = createSelector(
	( state: Record< string, State > ): Record< string, number > => {
		const selectorsByStatus: Record< string, number > = {};

		Object.values( state ).forEach( ( selectorState ) =>
			/**
			 * This uses the internal `_map` property of `EquivalentKeyMap` for
			 * optimization purposes, since the `EquivalentKeyMap` implementation
			 * does not support a `.values()` implementation.
			 *
			 * @see https://github.com/aduth/equivalent-key-map
			 */
			Array.from( ( selectorState as any )._map.values() ).forEach(
				( resolution: any ) => {
					const currentStatus = resolution[ 1 ]?.status ?? 'error';
					if ( ! selectorsByStatus[ currentStatus ] ) {
						selectorsByStatus[ currentStatus ] = 0;
					}
					selectorsByStatus[ currentStatus ]++;
				}
			)
		);

		return selectorsByStatus;
	},
	( state: Record< string, State > ) => [ state ]
);
