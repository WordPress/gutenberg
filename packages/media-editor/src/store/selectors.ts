import type { State } from './reducer';

export function isOpen( state: State ): boolean {
	return state.isOpen;
}

export function getId( state: State ): number | null {
	return state.id;
}

export function getOnUpdate( state: State ) {
	return state.onUpdate;
}

export function getOnUndo( state: State ) {
	return state.onUndo;
}

export function getOnClose( state: State ) {
	return state.onClose;
}
