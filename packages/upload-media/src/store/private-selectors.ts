/**
 * Internal dependencies
 */
import {
	type BatchId,
	ItemStatus,
	OperationType,
	type QueueItem,
	type QueueItemId,
	type State,
} from './types';

/**
 * Returns all items currently being uploaded.
 *
 * @param state Upload state.
 *
 * @return Queue items.
 */
export function getAllItems( state: State ): QueueItem[] {
	return state.queue;
}

/**
 * Returns a specific item given its unique ID.
 *
 * @param state Upload state.
 * @param id    Item ID.
 *
 * @return Queue item.
 */
export function getItem(
	state: State,
	id: QueueItemId
): QueueItem | undefined {
	return state.queue.find( ( item ) => item.id === id );
}

/**
 * Determines whether a batch has been successfully uploaded, given its unique ID.
 *
 * @param state   Upload state.
 * @param batchId Batch ID.
 *
 * @return Whether a batch has been uploaded.
 */
export function isBatchUploaded( state: State, batchId: BatchId ): boolean {
	const batchItems = state.queue.filter(
		( item ) => batchId === item.batchId
	);
	return batchItems.length === 0;
}

/**
 * Determines whether an upload is currently in progress given a post or attachment ID.
 *
 * @param state              Upload state.
 * @param postOrAttachmentId Post ID or attachment ID.
 *
 * @return Whether upload is currently in progress for the given post or attachment.
 */
export function isUploadingToPost(
	state: State,
	postOrAttachmentId: number
): boolean {
	return state.queue.some(
		( item ) =>
			item.currentOperation === OperationType.Upload &&
			item.additionalData.post === postOrAttachmentId
	);
}

/**
 * Returns the next paused upload for a given post or attachment ID.
 *
 * @param state              Upload state.
 * @param postOrAttachmentId Post ID or attachment ID.
 *
 * @return Paused item.
 */
export function getPausedUploadForPost(
	state: State,
	postOrAttachmentId: number
): QueueItem | undefined {
	return state.queue.find(
		( item ) =>
			item.status === ItemStatus.Paused &&
			item.additionalData.post === postOrAttachmentId
	);
}

/**
 * Determines whether uploading is currently paused.
 *
 * @param state Upload state.
 *
 * @return Whether uploading is currently paused.
 */
export function isPaused( state: State ): boolean {
	return state.queueStatus === 'paused';
}

/**
 * Returns all cached blob URLs for a given item ID.
 *
 * @param state Upload state.
 * @param id    Item ID
 *
 * @return List of blob URLs.
 */
export function getBlobUrls( state: State, id: QueueItemId ): string[] {
	return state.blobUrls[ id ] || [];
}
