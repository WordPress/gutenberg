import { arrayMove } from '@dnd-kit/sortable';

/**
 * Moves the item at `from` to `to` while pinned items hold their index:
 * the free items reorder among the remaining slots. Moving a pinned item
 * is a no-op.
 *
 * @param items    Items in display order.
 * @param from     Index of the moved item.
 * @param to       Target index.
 * @param isPinned Whether an item holds its index.
 * @return The reordered items.
 */
export function arrayMoveWithPinned< T >(
	items: T[],
	from: number,
	to: number,
	isPinned: ( item: T ) => boolean
): T[] {
	const pinned = new Set( items.filter( isPinned ) );
	if ( pinned.size === 0 ) {
		return arrayMove( items, from, to );
	}
	const free = arrayMove( items, from, to ).filter(
		( item ) => ! pinned.has( item )
	);
	let nextFree = 0;
	return items.map( ( item ) => {
		if ( pinned.has( item ) ) {
			return item;
		}
		const next = free[ nextFree ];
		nextFree += 1;
		return next;
	} );
}
