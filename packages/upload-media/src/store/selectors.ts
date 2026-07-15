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
 * Returns the processing progress for a given attachment ID, if known.
 *
 * Long-running operations (currently GIF-to-video conversion) report
 * per-item progress. The reporting item may be a sideload companion of the
 * attachment rather than the attachment's own queue item, so items are also
 * matched by their sideload target (`additionalData.post`).
 *
 * @param state        Upload state.
 * @param attachmentId Attachment ID.
 *
 * @return Progress as a number between 0 and 100, or undefined if no
 *         matching item is reporting progress.
 */
export function getProgressById(
	state: State,
	attachmentId: number
): number | undefined {
	for ( const item of state.queue ) {
		if (
			item.progress !== undefined &&
			( item.attachment?.id === attachmentId ||
				item.sourceAttachmentId === attachmentId ||
				( item.additionalData?.post as number | undefined ) ===
					attachmentId )
		) {
			return item.progress;
		}
	}
	return undefined;
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
