/**
 * Internal dependencies
 */
import { registerCallback, unregisterCallback } from './callback-registry';

/**
 * Shape passed to `onUpdate` after a successful save. Deliberately normalized
 * and minimal: `url` instead of REST's `source_url`, so consumers can drop
 * it straight into block attributes (matches the legacy `ImageEditor`'s
 * `onSaveImage` shape at
 * `packages/block-editor/src/components/image-editor/use-save-image.js`).
 * Keeping this decoupled from the REST field names also leaves room to reuse
 * the modal outside a WordPress REST context (e.g. native/Electron hosts).
 */
export interface MediaEditorModalUpdate {
	id: number;
	url?: string;
}

interface OpenMediaEditorModalArgs {
	attachmentId: number;
	onUpdate?: ( updated: MediaEditorModalUpdate ) => void;
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
