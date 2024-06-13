/**
 * WordPress dependencies
 */
import type { Action } from '@wordpress/dataviews';

/**
 * Internal dependencies
 */
import type { State } from './reducer';

const EMPTY_ARRAY: Action< any >[] = [];

export function getEntityActions( state: State, kind: string, name: string ) {
	return state.actions[ kind ]?.[ name ] ?? EMPTY_ARRAY;
}
