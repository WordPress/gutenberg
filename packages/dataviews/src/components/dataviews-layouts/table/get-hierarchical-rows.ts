export interface HierarchicalRow< Item > {
	item: Item;
	id: string;
	level: number;
}

type Row< Item > = HierarchicalRow< Item > & {
	parentId?: string;
};

/**
 * Orders loaded items by parent while preserving their order among siblings.
 * Missing parents, self-parenting items, and cycles are rendered as roots so
 * malformed or partially loaded data never disappears.
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
	const rows: Row< Item >[] = items.map( ( item, index ) => {
		const parentId = getItemParentId( item );
		return {
			item,
			id: getItemId( item ) || index.toString(),
			level: 0,
			parentId:
				parentId === null || parentId === undefined
					? undefined
					: parentId.toString(),
		};
	} );
	const rowById = new Map( rows.map( ( row ) => [ row.id, row ] ) );
	const childrenByParentId = new Map< string, Row< Item >[] >();
	const roots: Row< Item >[] = [];

	for ( const row of rows ) {
		if (
			! row.parentId ||
			row.parentId === row.id ||
			! rowById.has( row.parentId )
		) {
			roots.push( row );
			continue;
		}
		const children = childrenByParentId.get( row.parentId ) ?? [];
		children.push( row );
		childrenByParentId.set( row.parentId, children );
	}

	const result: HierarchicalRow< Item >[] = [];
	const visited = new Set< Row< Item > >();
	const appendTree = ( root: Row< Item > ) => {
		const stack = [ { row: root, level: 0 } ];
		while ( stack.length ) {
			const current = stack.pop()!;
			if ( visited.has( current.row ) ) {
				continue;
			}
			visited.add( current.row );
			result.push( {
				item: current.row.item,
				id: current.row.id,
				level: current.level,
			} );

			const children = childrenByParentId.get( current.row.id ) ?? [];
			for ( let index = children.length - 1; index >= 0; index-- ) {
				stack.push( {
					row: children[ index ],
					level: current.level + 1,
				} );
			}
		}
	};

	roots.forEach( appendTree );
	rows.forEach( ( row ) => {
		if ( ! visited.has( row ) ) {
			appendTree( row );
		}
	} );

	return result;
}
