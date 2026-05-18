/**
 * Internal dependencies
 */
import type { BrowseState, Mode, State } from './reducer';

export function isOpen( state: State ): boolean {
	return state.isOpen;
}

export function getMode( state: State ): Mode {
	return state.mode;
}

export function getId( state: State ): number | null {
	return state.id;
}

export function getOnUpdate( state: State ) {
	return state.onUpdate;
}

export function getBrowseState( state: State ): BrowseState | null {
	return state.browse;
}

export function getBrowseSelection( state: State ): number | number[] | null {
	return state.browse?.value ?? null;
}

export function shouldReturnToBrowse( state: State ): boolean {
	return state.returnToBrowse;
}
