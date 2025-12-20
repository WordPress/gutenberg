/**
 * Internal dependencies
 */
import type { State } from './reducer';

const EMPTY_ARRAY = [] as [];

export function getEntityActions( state: State, kind: string, name: string ) {
	return state.actions[ kind ]?.[ name ] ?? EMPTY_ARRAY;
}

export function getEntityFields( state: State, kind: string, name: string ) {
	return state.fields[ kind ]?.[ name ] ?? EMPTY_ARRAY;
}

export function isEntityReady( state: State, kind: string, name: string ) {
	return state.isReady[ kind ]?.[ name ];
}
