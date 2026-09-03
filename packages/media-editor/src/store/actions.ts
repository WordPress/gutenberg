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
	id: number;
	onUpdate?: ( updated: MediaEditorModalUpdate ) => void;
	onClose?: () => void;
}

export function openMediaEditorModal( {
	id,
	onUpdate,
	onClose,
}: OpenMediaEditorModalArgs ) {
	return {
		type: 'OPEN_MEDIA_EDITOR_MODAL' as const,
		id,
		onUpdate: onUpdate ?? null,
		onClose: onClose ?? null,
	};
}

export function closeMediaEditorModal() {
	return { type: 'CLOSE_MEDIA_EDITOR_MODAL' as const };
}
