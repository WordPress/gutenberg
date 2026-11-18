import type {
	ObjectData,
	ObjectID,
	ObjectType,
	SyncManagerUpdateOptions,
} from './types';

/**
 * A queue of items that are applied later, in the order they were added.
 */
export interface DeferredUpdateQueue {
	/**
	 * Add an item to the queue. It is applied on the next tick of the event
	 * loop, or sooner if `flush` is called first.
	 *
	 * @param item The item to apply later.
	 */
	defer: ( item: DeferredUpdate ) => void;

	/**
	 * Apply all queued items now, in the order they were added.
	 */
	flush: () => void;
}

/**
 * Create a queue for local updates that are kept off the typing hot path
 * (#79964).
 *
 * The queue is shared by all documents, because the order of updates to
 * different documents decides the order of their undo levels. The items are
 * held in a list, and not closed over in their timeouts, so that a read of a
 * document (a snapshot, persistence, undo) can flush them first.
 *
 * @param apply Applies one item.
 */
export function createDeferredUpdateQueue(
	apply: ( item: DeferredUpdate ) => void
): DeferredUpdateQueue {
	const queue: DeferredUpdate[] = [];
	let isFlushing = false;

	function flush(): void {
		// Applying an item can ask for a flush itself (closing an undo level
		// flushes first). The items already queued keep their order by
		// letting the outer flush finish them.
		if ( isFlushing ) {
			return;
		}

		isFlushing = true;

		try {
			while ( queue.length > 0 ) {
				const item = queue.shift();

				if ( item ) {
					apply( item );
				}
			}
		} finally {
			isFlushing = false;
		}
	}

	return {
		defer( item ) {
			queue.push( item );
			setTimeout( flush, 0 );
		},
		flush,
	};
}

/**
 * A local update that waits in the queue.
 */
export interface DeferredUpdate {
	changes: Partial< ObjectData >;
	objectId: ObjectID | null;
	objectType: ObjectType;
	options: SyncManagerUpdateOptions;
	origin: string;
}
