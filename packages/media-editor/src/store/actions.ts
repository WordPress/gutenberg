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
	 * Set when `deferCrop` was asked for and the user applied a crop. `id`
	 * and `url` are then still the original's, and the host commits the crop.
	 * Absent when the modal saved with no crop, which clears any earlier one.
	 */
	pendingCrop?: MediaEditorPendingCrop;
}

interface OpenMediaEditorModalArgs {
	id: number;
	/**
	 * Don't save crops; hand them back through `onUpdate` as `pendingCrop`.
	 */
	deferCrop?: boolean;
	/**
	 * A crop handed back earlier, to resume editing from.
	 */
	pendingCrop?: MediaEditorPendingCrop;
	onUpdate?: ( updated: MediaEditorModalUpdate ) => void;
	onClose?: () => void;
}

export function openMediaEditorModal( {
	id,
	deferCrop,
	pendingCrop,
	onUpdate,
	onClose,
}: OpenMediaEditorModalArgs ) {
	return {
		type: 'OPEN_MEDIA_EDITOR_MODAL' as const,
		id,
		deferCrop: deferCrop ?? false,
		pendingCrop: pendingCrop ?? null,
		onUpdate: onUpdate ?? null,
		onClose: onClose ?? null,
	};
}

export function closeMediaEditorModal() {
	return { type: 'CLOSE_MEDIA_EDITOR_MODAL' as const };
}
