/**
 * Internal dependencies
 */
import type { QueueItem, Settings, State } from './types';

/**
 * Returns all items currently being uploaded.
 *
 * @param state Upload state.
 *
 * @return Queue items.
 */
export function getItems( state: State ): QueueItem[] {
	return state.queue;
}

/**
 * Determines whether any upload is currently in progress.
 *
 * @param state Upload state.
 *
 * @return Whether any upload is currently in progress.
 */
export function isUploading( state: State ): boolean {
	return state.queue.length >= 1;
}

/**
 * Determines whether an upload is currently in progress given an attachment URL.
 *
 * @param state Upload state.
 * @param url   Attachment URL.
 *
 * @return Whether upload is currently in progress for the given attachment.
 */
export function isUploadingByUrl( state: State, url: string ): boolean {
	return state.queue.some(
		( item ) => item.attachment?.url === url || item.sourceUrl === url
	);
}

/**
 * Determines whether an upload is currently in progress given an attachment ID.
 *
 * @param state        Upload state.
 * @param attachmentId Attachment ID.
 *
 * @return Whether upload is currently in progress for the given attachment.
 */
export function isUploadingById( state: State, attachmentId: number ): boolean {
	return state.queue.some(
		( item ) =>
			item.attachment?.id === attachmentId ||
			item.sourceAttachmentId === attachmentId
	);
}

/**
 * Returns the media upload settings.
 *
 * @param state Upload state.
 *
 * @return Settings
 */
export function getSettings( state: State ): Settings {
	return state.settings;
}
