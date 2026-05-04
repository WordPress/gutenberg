export interface HierarchyRow< Item > {
	item: Item;
	id: string;
	level: number;
	parentId?: string;
	childCount: number;
}

export function getItemHierarchyLevel< Item >(
	item: Item,
	getItemLevel: ( item: Item ) => number
) {
	const level = getItemLevel( item );
	return Number.isFinite( level ) ? Math.max( 0, level ) : 0;
}

export function getHierarchyRows< Item >(
	data: Item[],
	getItemId: ( item: Item ) => string,
	getItemLevel: ( item: Item ) => number
) {
	const hierarchyRows: HierarchyRow< Item >[] = [];

	data.forEach( ( item, index ) => {
		const id = getItemId( item ) || index.toString();
		const level = getItemHierarchyLevel( item, getItemLevel );
		const parent = hierarchyRows.findLast(
			( hierarchyRow ) => hierarchyRow.level < level
		);
		const hierarchyRow = {
			item,
			id,
			level,
			parentId: parent?.id,
			childCount: 0,
		};

		if ( parent ) {
			parent.childCount += 1;
		}

		hierarchyRows.push( hierarchyRow );
	} );

	return hierarchyRows;
}

export function getVisibleHierarchyRows< Item >(
	hierarchyRows: HierarchyRow< Item >[],
	expandedItemIds: Set< string >
) {
	const isCollapsedParent = ( hierarchyRow: HierarchyRow< Item > ) =>
		hierarchyRow.childCount > 0 && ! expandedItemIds.has( hierarchyRow.id );

	const getClosestVisibleAncestor = (
		visibleHierarchyRows: HierarchyRow< Item >[],
		hierarchyRow: HierarchyRow< Item >
	) =>
		visibleHierarchyRows.findLast(
			( visibleHierarchyRow ) =>
				visibleHierarchyRow.level < hierarchyRow.level
		);

	const isHiddenByCollapsedAncestor = (
		visibleHierarchyRows: HierarchyRow< Item >[],
		hierarchyRow: HierarchyRow< Item >
	) => {
		const closestVisibleAncestor = getClosestVisibleAncestor(
			visibleHierarchyRows,
			hierarchyRow
		);

		return (
			!! closestVisibleAncestor &&
			isCollapsedParent( closestVisibleAncestor )
		);
	};

	return hierarchyRows.reduce< HierarchyRow< Item >[] >(
		( visibleHierarchyRows, hierarchyRow ) => {
			if (
				isHiddenByCollapsedAncestor(
					visibleHierarchyRows,
					hierarchyRow
				)
			) {
				return visibleHierarchyRows;
			}

			visibleHierarchyRows.push( hierarchyRow );

			return visibleHierarchyRows;
		},
		[]
	);
}
