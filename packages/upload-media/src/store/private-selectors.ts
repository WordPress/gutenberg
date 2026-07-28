/**
 * Internal dependencies
 */
import {
	type BatchId,
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

/**
 * Returns the number of items currently uploading.
 *
 * @param state Upload state.
 *
 * @return Number of items currently uploading.
 */
export function getActiveUploadCount( state: State ): number {
	return state.queue.filter(
		( item ) => item.currentOperation === OperationType.Upload
	).length;
}

/**
 * Returns items that are waiting for upload (next operation is Upload but not yet started).
 *
 * @param state Upload state.
 *
 * @return Items pending upload.
 */
export function getPendingUploads( state: State ): QueueItem[] {
	return state.queue.filter( ( item ) => {
		const nextOperation = Array.isArray( item.operations?.[ 0 ] )
			? item.operations[ 0 ][ 0 ]
			: item.operations?.[ 0 ];
		return (
			nextOperation === OperationType.Upload &&
			item.currentOperation !== OperationType.Upload
		);
	} );
}

/**
 * Returns the number of items currently performing image processing operations.
 *
 * This counts items whose current operation is ResizeCrop or Rotate,
 * used to enforce the image processing concurrency limit.
 *
 * @param state Upload state.
 *
 * @return Number of items currently processing images.
 */
export function getActiveImageProcessingCount( state: State ): number {
	return state.queue.filter(
		( item ) =>
			item.currentOperation === OperationType.ResizeCrop ||
			item.currentOperation === OperationType.Rotate
	).length;
}

/**
 * Returns the number of items currently performing video processing operations.
 *
 * This counts items whose current operation is TranscodeGif,
 * used to enforce the video processing concurrency limit (1 at a time).
 *
 * @param state Upload state.
 *
 * @return Number of items currently processing video.
 */
export function getActiveVideoProcessingCount( state: State ): number {
	return state.queue.filter(
		( item ) => item.currentOperation === OperationType.TranscodeGif
	).length;
}

/**
 * Returns items waiting for image processing (next operation is ResizeCrop
 * or Rotate but not yet started).
 *
 * @param state Upload state.
 *
 * @return Items pending image processing.
 */
export function getPendingImageProcessing( state: State ): QueueItem[] {
	return state.queue.filter( ( item ) => {
		const nextOperation = Array.isArray( item.operations?.[ 0 ] )
			? item.operations[ 0 ][ 0 ]
			: item.operations?.[ 0 ];
		return (
			( nextOperation === OperationType.ResizeCrop ||
				nextOperation === OperationType.Rotate ) &&
			item.currentOperation !== OperationType.ResizeCrop &&
			item.currentOperation !== OperationType.Rotate
		);
	} );
}

/**
 * Returns items waiting for video processing (next operation is TranscodeGif
 * but not yet started).
 *
 * @param state Upload state.
 *
 * @return Items pending video processing.
 */
export function getPendingVideoProcessing( state: State ): QueueItem[] {
	return state.queue.filter( ( item ) => {
		const nextOperation = Array.isArray( item.operations?.[ 0 ] )
			? item.operations[ 0 ][ 0 ]
			: item.operations?.[ 0 ];
		return (
			nextOperation === OperationType.TranscodeGif &&
			item.currentOperation !== OperationType.TranscodeGif
		);
	} );
}

/**
 * Returns items that failed with an error.
 *
 * @param state Upload state.
 *
 * @return Failed items.
 */
export function getFailedItems( state: State ): QueueItem[] {
	return state.queue.filter( ( item ) => item.error !== undefined );
}

/**
 * Returns true if any child items with the given parentId exist in the queue.
 *
 * @param state    Upload state.
 * @param parentId Parent item ID.
 *
 * @return Whether any child items with the given parentId exist in the queue.
 */
export function hasPendingItemsByParentId(
	state: State,
	parentId: QueueItemId
): boolean {
	return state.queue.some( ( item ) => item.parentId === parentId );
}

/**
 * Returns the progress of a specific item.
 *
 * @param state Upload state.
 * @param id    Item ID.
 *
 * @return Progress value (0-100), or undefined if item not found.
 */
export function getItemProgress(
	state: State,
	id: QueueItemId
): number | undefined {
	const item = state.queue.find( ( i ) => i.id === id );
	return item?.progress;
}
