import type {
	CRDTDoc,
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
	 * @param key  Identifies the document the item belongs to.
	 * @param item The item to apply later.
	 */
	defer: ( key: string, item: DeferredUpdate ) => void;

	/**
	 * Apply all queued items now, in the order they were added.
	 */
	flush: () => void;

	/**
	 * Get the items of one document in the order they were added. The returned
	 * items can be updated without changing their positions in the queue.
	 *
	 * @param key Identifies the document.
	 */
	get: ( key: string ) => DeferredUpdate[];
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
	const queue: Array< { key: string; item: DeferredUpdate } > = [];
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
				const entry = queue.shift();

				if ( entry ) {
					apply( entry.item );
				}
			}
		} finally {
			isFlushing = false;
		}
	}

	return {
		defer( key, item ) {
			queue.push( { key, item } );
			setTimeout( flush, 0 );
		},
		flush,
		get( key ) {
			return queue
				.filter( ( entry ) => entry.key === key )
				.map( ( entry ) => entry.item );
		},
	};
}

/**
 * A local update that waits in the queue.
 */
export interface DeferredUpdate {
	/** Applies document-local state captured on the copy to the live document. */
	applyLocalState?: ( ydoc: CRDTDoc ) => void;
	changes: Partial< ObjectData >;
	objectId: ObjectID | null;
	objectType: ObjectType;
	options: SyncManagerUpdateOptions;
	origin: string;
	/** The changes converted to Yjs operations before a remote update. */
	update?: Uint8Array;
}
