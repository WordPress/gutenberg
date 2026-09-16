import {
	type BatchId,
	type ConcurrencyPoolDefinition,
	type OperationDefinition,
	type OperationName,
	type QueueItem,
	type QueueItemId,
	type State,
} from './types';
import { getOperationName, resolveConcurrencyLimit } from './utils/operations';

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
 * Returns how many top-level items have been cancelled because they failed.
 *
 * Failed items are removed from the queue just like successful ones, so an
 * empty queue on its own says nothing about whether anything was uploaded.
 * This tally only ever grows: to learn how many items failed within a single
 * batch, read it when the batch starts and subtract that from its later value.
 *
 * @param state Upload state.
 *
 * @return Number of failed uploads since the editor loaded.
 */
export function getFailureCount( state: State ): number {
	return state.failureCount;
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
 * Returns all registered operations, in registration order.
 *
 * @param state Upload state.
 *
 * @return Operation definitions.
 */
export function getOperations( state: State ): OperationDefinition[] {
	return Object.values( state.operations );
}

/**
 * Returns a registered operation by name.
 *
 * @param state Upload state.
 * @param name  Operation name.
 *
 * @return Operation definition, or undefined if not registered.
 */
export function getOperation(
	state: State,
	name: OperationName
): OperationDefinition | undefined {
	return state.operations[ name ];
}

/**
 * Returns a registered concurrency pool by name.
 *
 * @param state Upload state.
 * @param name  Pool name.
 *
 * @return Pool definition, or undefined if not registered.
 */
export function getConcurrencyPool(
	state: State,
	name: string
): ConcurrencyPoolDefinition | undefined {
	return state.pools[ name ];
}

/**
 * Returns all registered concurrency pools.
 *
 * @param state Upload state.
 *
 * @return Pool definitions.
 */
export function getConcurrencyPools(
	state: State
): ConcurrencyPoolDefinition[] {
	return Object.values( state.pools );
}

/**
 * Returns the concurrency limit of a pool.
 *
 * An operation can only join a pool that is registered, so the lookup
 * finds one for every pool an item is counted against; a name that is not
 * registered is unlimited.
 *
 * @param state Upload state.
 * @param pool  Pool name.
 *
 * @return Maximum number of items that may run operations of this pool at once.
 */
export function getConcurrencyPoolLimit( state: State, pool: string ): number {
	const definition = state.pools[ pool ];
	if ( ! definition ) {
		return Infinity;
	}
	return resolveConcurrencyLimit( definition, state.settings );
}

/**
 * Returns the number of items currently running an operation of a pool.
 *
 * @param state Upload state.
 * @param pool  Pool name.
 *
 * @return Number of active items in the pool.
 */
export function getActiveCountByPool( state: State, pool: string ): number {
	return state.queue.filter( ( item ) => item.currentPool === pool ).length;
}

/**
 * Returns items whose next operation belongs to a pool but has not started,
 * typically because the pool was at capacity when they were last processed.
 *
 * @param state Upload state.
 * @param pool  Pool name.
 *
 * @return Items waiting on the pool.
 */
export function getPendingItemsByPool(
	state: State,
	pool: string
): QueueItem[] {
	return state.queue.filter( ( item ) => {
		const nextOperation = item.operations?.[ 0 ];
		if ( nextOperation === undefined ) {
			return false;
		}
		const nextName = getOperationName( nextOperation );
		return (
			state.operations[ nextName ]?.concurrency === pool &&
			item.currentOperation !== nextName
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
