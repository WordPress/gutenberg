/**
 * Internal dependencies
 */
import type { State } from './reducer';

export function getEntityActions( state: State, kind: string, name: string ) {
	return state.actions[ kind ]?.[ name ] ?? [];
}
