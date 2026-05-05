export interface TreeRow< Item > {
	item: Item;
	id: string;
	depth: number;
	parentId?: string;
	childCount: number;
}

export function getTreeRows< Item >(
	data: Item[],
	getItemId: ( item: Item ) => string,
	getItemParentId: ( item: Item ) => string | number | null | undefined
) {
	const treeRows = data.map( ( item, index ) => {
		const parentId = getItemParentId( item );
		return {
			item,
			id: getItemId( item ) || index.toString(),
			depth: 0,
			parentId: parentId?.toString(),
			childCount: 0,
		};
	} );

	const rowById = new Map( treeRows.map( ( row ) => [ row.id, row ] ) );
	const { roots, childrenByParentId } = treeRows.reduce< {
		roots: TreeRow< Item >[];
		childrenByParentId: Map< string, TreeRow< Item >[] >;
	} >(
		( accumulator, row ) => {
			const parent =
				row.parentId && row.parentId !== row.id
					? rowById.get( row.parentId )
					: undefined;

			if ( ! parent ) {
				row.parentId = undefined;
				accumulator.roots.push( row );
				return accumulator;
			}

			parent.childCount += 1;
			const children =
				accumulator.childrenByParentId.get( parent.id ) ?? [];
			children.push( row );
			accumulator.childrenByParentId.set( parent.id, children );
			return accumulator;
		},
		{
			roots: [],
			childrenByParentId: new Map(),
		}
	);

	const orderedTreeRows: TreeRow< Item >[] = [];
	const appendRows = ( rows: TreeRow< Item >[], depth: number ) => {
		for ( const row of rows ) {
			if ( orderedTreeRows.includes( row ) ) {
				continue;
			}

			row.depth = depth;
			orderedTreeRows.push( row );
			appendRows( childrenByParentId.get( row.id ) ?? [], depth + 1 );
		}
	};

	appendRows( roots, 0 );

	return orderedTreeRows;
}

export function getVisibleTreeRows< Item >(
	treeRows: TreeRow< Item >[],
	expandedItemIds: Set< string >
) {
	const collapsedDepths: number[] = [];

	return treeRows.filter( ( row ) => {
		while (
			collapsedDepths.length &&
			row.depth <= collapsedDepths[ collapsedDepths.length - 1 ]
		) {
			collapsedDepths.pop();
		}

		const isHidden = collapsedDepths.length > 0;
		if ( row.childCount > 0 && ! expandedItemIds.has( row.id ) ) {
			collapsedDepths.push( row.depth );
		}

		return ! isHidden;
	} );
}
