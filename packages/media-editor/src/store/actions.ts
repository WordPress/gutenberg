/**
 * Internal dependencies
 */
import { registerCallback, unregisterCallback } from './callback-registry';
import type { Media } from '../components/media-editor-provider';

interface OpenMediaEditorModalArgs {
	attachmentId: number;
	onUpdate?: ( updated: Partial< Media > & { id: number } ) => void;
}

export function openMediaEditorModal( {
	attachmentId,
	onUpdate,
}: OpenMediaEditorModalArgs ) {
	return ( { select, dispatch }: { select: any; dispatch: any } ) => {
		const previousInvocationId = select.getMediaEditorModalInvocationId();
		unregisterCallback( previousInvocationId );

		const invocationId = onUpdate ? registerCallback( onUpdate ) : -1;

		dispatch( {
			type: 'OPEN_MEDIA_EDITOR_MODAL',
			attachmentId,
			invocationId,
		} );
	};
}

export function closeMediaEditorModal() {
	return ( { select, dispatch }: { select: any; dispatch: any } ) => {
		const invocationId = select.getMediaEditorModalInvocationId();
		unregisterCallback( invocationId );

		dispatch( { type: 'CLOSE_MEDIA_EDITOR_MODAL' } );
	};
}
