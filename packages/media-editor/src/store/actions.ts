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

type OnUpdateCallback = ( updated: MediaEditorModalUpdate ) => void;

interface OpenMediaEditorModalArgs {
	id: number;
	onUpdate?: OnUpdateCallback;
}

export function openMediaEditorModal( {
	id,
	onUpdate,
}: OpenMediaEditorModalArgs ) {
	return {
		type: 'OPEN_MEDIA_EDITOR_MODAL' as const,
		id,
		onUpdate: onUpdate ?? null,
	};
}

export function closeMediaEditorModal() {
	return { type: 'CLOSE_MEDIA_EDITOR_MODAL' as const };
}

/**
 * Browse-mode (upload picker) types. Imported from `@wordpress/media-utils`
 * so the store and the shim share the same shape — the modal lives in
 * `media-editor` now, but media-utils still owns the upload primitives and
 * the canonical `Attachment` type.
 */
import type { Attachment } from '@wordpress/media-utils';

export type MediaBrowserSelectCallback = (
	media: Attachment | Attachment[]
) => void;

export type MediaBrowserUploadCallback = ( args: {
	allowedTypes?: string[];
	filesList: File[];
	onFileChange?: ( attachments: Partial< Attachment >[] ) => void;
	onError?: ( error: Error ) => void;
	multiple?: boolean;
} ) => void;

export interface MediaBrowserConfig {
	allowedTypes?: string[];
	multiple?: boolean;
	value?: number | number[];
	title?: string;
	isDismissible?: boolean;
	modalClass?: string;
	search?: boolean;
	searchLabel?: string;
}

export interface MediaBrowserCallbacks {
	onSelect: MediaBrowserSelectCallback;
	onClose?: () => void;
	onUpload?: MediaBrowserUploadCallback;
}

export type OpenMediaUploadModalArgs = MediaBrowserConfig &
	MediaBrowserCallbacks & {
		session?: symbol;
	};

export function openMediaUploadModal( args: OpenMediaUploadModalArgs ) {
	const { session, onSelect, onClose, onUpload, ...config } = args;
	return {
		type: 'OPEN_MEDIA_UPLOAD_MODAL' as const,
		browse: {
			config,
			callbacks: { onSelect, onClose, onUpload },
			value: config.value ?? null,
			session: session ?? Symbol( 'media-upload-modal-session' ),
		},
	};
}

export function closeMediaUploadModal( {
	session,
}: { session?: symbol } = {} ) {
	return {
		type: 'CLOSE_MEDIA_UPLOAD_MODAL' as const,
		session: session ?? null,
	};
}

export function selectMediaInBrowser( value: number | number[] | null ) {
	return {
		type: 'SELECT_MEDIA_IN_BROWSER' as const,
		value,
	};
}

export function enterEditMode( { id }: { id: number } ) {
	return {
		type: 'ENTER_EDIT_MODE' as const,
		id,
	};
}

export function exitEditMode() {
	return { type: 'EXIT_EDIT_MODE' as const };
}
