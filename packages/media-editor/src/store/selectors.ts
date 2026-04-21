/**
 * Internal dependencies
 */
import { getCallback } from './callback-registry';
import type { State } from './reducer';

export function isMediaEditorModalOpen( state: State ): boolean {
	return state.isOpen;
}

export function getMediaEditorModalId( state: State ): number | null {
	return state.id;
}

export function getMediaEditorModalInvocationId( state: State ): number | null {
	return state.invocationId;
}

export function getMediaEditorModalOnUpdate( state: State ) {
	return getCallback( state.invocationId );
}
