/**
 * WordPress dependencies
 */
import { createSelector } from '@wordpress/data';

/**
 * Internal dependencies
 */
import type { State } from './reducer';

export const getEntityActions = createSelector(
	( state: State, kind: string, name: string ) => {
		return [
			...( state.actions[ kind ]?.[ name ] ?? [] ),
			...( state.actions[ kind ]?.[ '*' ] ?? [] ),
		];
	},
	( state: State, kind: string, name: string ) => [
		state.actions[ kind ]?.[ name ],
		state.actions[ kind ]?.[ '*' ],
	]
);

export function isEntityReady( state: State, kind: string, name: string ) {
	return state.isReady[ kind ]?.[ name ];
}
