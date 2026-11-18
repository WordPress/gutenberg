import * as Y from 'yjs';
import type { CRDTDoc, ObjectData, SyncManagerUpdateOptions } from './types';

/**
 * A queue of items that are applied later, in the order they were added.
 */
export interface DeferredUpdateQueue< Item > {
	/**
	 * Add an item to the queue. It is applied on the next tick of the event
	 * loop, or sooner if `flush` is called first.
	 *
	 * @param key  Identifies the document the item belongs to.
	 * @param item The item to apply later.
	 */
	defer: ( key: string, item: Item ) => void;

	/**
	 * Apply all queued items now, in the order they were added.
	 */
	flush: () => void;

	/**
	 * Remove the items of one document from the queue without applying
	 * them, and return them in the order they were added.
	 *
	 * @param key Identifies the document.
	 */
	take: ( key: string ) => Item[];
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
export function createDeferredUpdateQueue< Item >(
	apply: ( item: Item ) => void
): DeferredUpdateQueue< Item > {
	let entries: Array< { key: string; item: Item } > = [];
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
			while ( entries.length > 0 ) {
				const entry = entries.shift();

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
			entries.push( { key, item } );
			setTimeout( flush, 0 );
		},

		flush,

		take( key ) {
			const taken = entries.filter( ( entry ) => entry.key === key );

			if ( taken.length > 0 ) {
				entries = entries.filter( ( entry ) => entry.key !== key );
			}

			return taken.map( ( entry ) => entry.item );
		},
	};
}

/**
 * A local update that waits in the queue.
 */
export interface DeferredUpdate {
	changes: Partial< ObjectData >;
	origin: string;
	options: SyncManagerUpdateOptions;
}

/**
 * The operations of one deferred update, as a Yjs update.
 */
export interface RebasedUpdate {
	update: Uint8Array;
	origin: string;
	options: SyncManagerUpdateOptions;
}

/**
 * Turn deferred updates into Yjs operations, with the document as it is now
 * as their base.
 *
 * A deferred update holds values that the editor computed from the current
 * document. If a remote change is applied first, the same values no longer
 * describe what the user did: applied to the newer document, they overwrite
 * the remote change. So call this function before the remote change is
 * applied, and apply the returned updates to the document after it. Yjs then
 * merges both.
 *
 * The function applies the updates to a copy of the document, not to the
 * document itself. This matters when it is called from a `beforeTransaction`
 * handler: a write to the document there would become part of the remote
 * transaction.
 *
 * @param ydoc         The document. It is not changed.
 * @param applyChanges Applies the changes of one update to a document.
 * @param updates      The deferred updates, in the order they were made.
 * @return One Yjs update for each deferred update, in the same order.
 */
export function rebaseDeferredUpdates(
	ydoc: CRDTDoc,
	applyChanges: ( ydoc: CRDTDoc, changes: Partial< ObjectData > ) => void,
	updates: DeferredUpdate[]
): RebasedUpdate[] {
	// The copy is not destroyed: `applyChanges` can keep working with the
	// document it was given after this function returns.
	const copy = new Y.Doc();
	Y.applyUpdateV2( copy, Y.encodeStateAsUpdateV2( ydoc ) );

	return updates.map( ( { changes, origin, options } ) => {
		const stateVector = Y.encodeStateVector( copy );

		copy.transact( () => {
			applyChanges( copy, changes );
		} );

		return {
			update: Y.encodeStateAsUpdateV2( copy, stateVector ),
			origin,
			options,
		};
	} );
}
