import type { MediaEditorPendingCrop } from '../components/media-editor/pending-crop';

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
	/**
	 * Set when the modal was opened with `deferCrop` and the user cropped.
	 * Nothing was written to the server for the crop: `id` and `url` are the
	 * attachment it applies to, and the host commits it later. Absent if the
	 * save had no crop.
	 */
	pendingCrop?: MediaEditorPendingCrop;
}

interface OpenMediaEditorModalArgs {
	id: number;
	/** Return crops through `onUpdate` as `pendingCrop` instead of saving them. */
	deferCrop?: boolean;
	/** A pending crop from an earlier session to continue editing. */
	pendingCrop?: MediaEditorPendingCrop;
	onUpdate?: ( updated: MediaEditorModalUpdate ) => void;
	/**
	 * Restore the caller's state after a saved attachment change. May run
	 * before an asynchronous `onUpdate` finishes; the caller should cancel
	 * that update. Without this callback, Undo calls `onUpdate` with the
	 * previous attachment's id and URL.
	 */
	onUndo?: () => void;
	onClose?: () => void;
}

export function openMediaEditorModal( {
	id,
	deferCrop,
	pendingCrop,
	onUpdate,
	onUndo,
	onClose,
}: OpenMediaEditorModalArgs ) {
	return {
		type: 'OPEN_MEDIA_EDITOR_MODAL' as const,
		id,
		deferCrop: deferCrop ?? false,
		pendingCrop: pendingCrop ?? null,
		onUpdate: onUpdate ?? null,
		onUndo: onUndo ?? null,
		onClose: onClose ?? null,
	};
}

export function closeMediaEditorModal() {
	return { type: 'CLOSE_MEDIA_EDITOR_MODAL' as const };
}
