export interface HierarchicalRow< Item > {
	item: Item;
	id: string;
	level: number;
}

/**
 * Orders loaded items by parent while preserving their order among siblings.
 * An item whose parent is missing or is itself shows as a top-level row. In
 * a loop, the first item met becomes a top-level row and the rest nest under
 * it. So no loaded item ever disappears.
 *
 * @param items           Loaded items.
 * @param getItemId       Returns an item's unique identifier.
 * @param getItemParentId Returns an item's parent identifier.
 */
export default function getHierarchicalRows< Item >(
	items: Item[],
	getItemId: ( item: Item ) => string,
	getItemParentId: ( item: Item ) => string | number | null | undefined
): HierarchicalRow< Item >[] {
	const ids = new Set( items.map( getItemId ) );
	const childrenByParentId = new Map< string, Item[] >();
	const roots: Item[] = [];
	for ( const item of items ) {
		const parentId = getItemParentId( item )?.toString();
		if (
			parentId &&
			parentId !== getItemId( item ) &&
			ids.has( parentId )
		) {
			childrenByParentId.set( parentId, [
				...( childrenByParentId.get( parentId ) ?? [] ),
				item,
			] );
		} else {
			roots.push( item );
		}
	}

	const rows: HierarchicalRow< Item >[] = [];
	const visited = new Set< string >();
	const append = ( item: Item, level: number ) => {
		const id = getItemId( item );
		if ( visited.has( id ) ) {
			return;
		}
		visited.add( id );
		rows.push( { item, id, level } );
		childrenByParentId
			.get( id )
			?.forEach( ( child ) => append( child, level + 1 ) );
	};
	roots.forEach( ( item ) => append( item, 0 ) );
	// Items in a cycle are not reached from any root.
	items.forEach( ( item ) => append( item, 0 ) );
	return rows;
}
