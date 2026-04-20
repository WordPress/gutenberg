/**
 * Internal dependencies
 */
import { getCallback } from './callback-registry';
import type { State } from './reducer';

export function isMediaEditorModalOpen( state: State ): boolean {
	return state.isOpen;
}

export function getMediaEditorModalAttachmentId( state: State ): number | null {
	return state.attachmentId;
}

export function getMediaEditorModalInvocationId( state: State ): number | null {
	return state.invocationId;
}

export function getMediaEditorModalOnUpdate( state: State ) {
	return getCallback( state.invocationId );
}
