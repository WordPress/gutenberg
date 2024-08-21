/**
 * Internal dependencies
 */
import {
	type BatchId,
	type ImageSizeCrop,
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
 * Returns all items currently being uploaded.
 *
 * @param state    Upload state.
 * @param parentId Parent item ID.
 *
 * @return Queue items.
 */
export function getChildItems(
	state: State,
	parentId: QueueItemId
): QueueItem[] {
	return state.queue.filter( ( item ) => item.parentId === parentId );
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
 * Returns a specific item given its associated attachment ID.
 *
 * @param state        Upload state.
 * @param attachmentId Item ID.
 *
 * @return Queue item.
 */
export function getItemByAttachmentId(
	state: State,
	attachmentId: number
): QueueItem | undefined {
	return state.queue.find(
		( item ) =>
			item.attachment?.id === attachmentId ||
			item.sourceAttachmentId === attachmentId
	);
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
	return batchItems.length <= 1;
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
 * Determines whether an upload is currently in progress given a parent ID.
 *
 * @param state    Upload state.
 * @param parentId Parent ID.
 *
 * @return Whether upload is currently in progress for the given parent ID.
 */
export function isUploadingByParentId(
	state: State,
	parentId: QueueItemId
): boolean {
	return state.queue.some( ( item ) => item.parentId === parentId );
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
 * Returns an image size given its name.
 *
 * @param state Upload state.
 * @param name  Image size name.
 *
 * @return Image size data.
 */
export function getImageSize( state: State, name: string ): ImageSizeCrop {
	return state.settings.imageSizes[ name ];
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
